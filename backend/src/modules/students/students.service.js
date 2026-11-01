const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

class StudentsService {
  async admitStudent(data) {
    const {
      admission_no,
      first_name,
      last_name,
      gender,
      date_of_birth,
      father_name,
      guardian_phone,
      address,
      admission_date,
      academic_year_id,
      class_id,
      section_id,
      roll_number,
      custom_password
    } = data;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check duplicate admission_no
      const [existingStudent] = await connection.query(
        'SELECT id FROM students WHERE admission_no = ?',
        [admission_no]
      );
      if (existingStudent.length > 0) {
        throw new Error(`Student with admission number "${admission_no}" already exists.`);
      }

      // Check roll number uniqueness in same session, class, and section
      const [existingRoll] = await connection.query(
        'SELECT id FROM student_enrollments WHERE academic_year_id = ? AND class_id = ? AND section_id = ? AND roll_number = ?',
        [academic_year_id, class_id, section_id, roll_number]
      );
      if (existingRoll.length > 0) {
        throw new Error(`Roll number ${roll_number} is already assigned in this section.`);
      }

      // Create linked user login
      const username = admission_no.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${username}@student.alsuffa.edu.pk`;
      const password = custom_password || 'password123';
      const passwordHash = await bcrypt.hash(password, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
        [username, email, passwordHash, 'student']
      );
      const userId = userResult.insertId;

      // Create student record
      const [studentResult] = await connection.query(
        `INSERT INTO students
         (user_id, admission_no, first_name, last_name, gender, date_of_birth, father_name, guardian_phone, address, admission_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, admission_no, first_name, last_name, gender, date_of_birth, father_name, guardian_phone, address || '', admission_date || new Date()]
      );
      const studentId = studentResult.insertId;

      // Create enrollment record
      await connection.query(
        `INSERT INTO student_enrollments
         (student_id, academic_year_id, class_id, section_id, roll_number, enrollment_date, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [studentId, academic_year_id, class_id, section_id, roll_number, admission_date || new Date()]
      );

      await connection.commit();

      return {
        student_id: studentId,
        admission_no,
        username,
        default_password: password
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getStudents(filters = {}) {
    const { classId, sectionId, academicYearId, search, status } = filters;

    let query = `
      SELECT st.*,
             u.username, u.email,
             se.id AS enrollment_id, se.academic_year_id, se.class_id, se.section_id, se.roll_number, se.status AS enrollment_status,
             c.name AS class_name,
             sec.name AS section_name,
             ay.session_name
      FROM students st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
      WHERE 1=1
    `;

    const params = [];

    if (classId) {
      query += ' AND se.class_id = ?';
      params.push(classId);
    }
    if (sectionId) {
      query += ' AND se.section_id = ?';
      params.push(sectionId);
    }
    if (academicYearId) {
      query += ' AND se.academic_year_id = ?';
      params.push(academicYearId);
    }
    if (status) {
      query += ' AND se.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (st.first_name LIKE ? OR st.last_name LIKE ? OR st.admission_no LIKE ? OR st.father_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY c.numeric_value ASC, sec.name ASC, se.roll_number ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getStudentById(id) {
    const [rows] = await pool.query(`
      SELECT st.*,
             u.username, u.email,
             se.id AS enrollment_id, se.academic_year_id, se.class_id, se.section_id, se.roll_number, se.status AS enrollment_status,
             c.name AS class_name,
             sec.name AS section_name,
             ay.session_name
      FROM students st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
      WHERE st.id = ?
    `, [id]);

    if (rows.length === 0) {
      throw new Error('Student not found');
    }

    const student = rows[0];

    // Fetch fee vouchers
    const [vouchers] = await pool.query(
      'SELECT * FROM fee_vouchers WHERE student_id = ? ORDER BY issue_date DESC',
      [id]
    );

    // Fetch exam marks
    const [marks] = await pool.query(`
      SELECT em.*, es.exam_date, es.total_marks, es.passing_marks,
             sub.name AS subject_name, sub.code AS subject_code,
             ex.name AS exam_name
      FROM exam_marks em
      JOIN exam_schedules es ON em.exam_schedule_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN exams ex ON es.exam_id = ex.id
      WHERE em.student_id = ?
      ORDER BY es.exam_date DESC
    `, [id]);

    return {
      ...student,
      vouchers,
      marks
    };
  }
}

module.exports = new StudentsService();

