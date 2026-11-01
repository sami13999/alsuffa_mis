const pool = require('../../config/db');

class ExaminationsService {
  async getExams(academicYearId = null) {
    let query = `
      SELECT ex.*, ay.session_name,
             COUNT(DISTINCT es.id) AS schedule_count
      FROM exams ex
      JOIN academic_years ay ON ex.academic_year_id = ay.id
      LEFT JOIN exam_schedules es ON ex.id = es.exam_id
    `;
    const params = [];
    if (academicYearId) {
      query += ' WHERE ex.academic_year_id = ?';
      params.push(academicYearId);
    }
    query += ' GROUP BY ex.id ORDER BY ex.start_date DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async createExam(data) {
    const { academic_year_id, name, start_date, end_date, is_published = 0 } = data;
    const [result] = await pool.query(
      'INSERT INTO exams (academic_year_id, name, start_date, end_date, is_published) VALUES (?, ?, ?, ?, ?)',
      [academic_year_id, name, start_date, end_date, is_published ? 1 : 0]
    );
    return { id: result.insertId, academic_year_id, name, start_date, end_date, is_published };
  }

  async togglePublishExam(id, isPublished) {
    await pool.query('UPDATE exams SET is_published = ? WHERE id = ?', [isPublished ? 1 : 0, id]);
    return { id, is_published: isPublished };
  }

  async getExamSchedules(filters = {}) {
    const { examId, classId, subjectId } = filters;
    let query = `
      SELECT es.*,
             ex.name AS exam_name, ex.is_published,
             c.name AS class_name,
             sub.name AS subject_name, sub.code AS subject_code
      FROM exam_schedules es
      JOIN exams ex ON es.exam_id = ex.id
      JOIN classes c ON es.class_id = c.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE 1=1
    `;
    const params = [];

    if (examId) {
      query += ' AND es.exam_id = ?';
      params.push(examId);
    }
    if (classId) {
      query += ' AND es.class_id = ?';
      params.push(classId);
    }
    if (subjectId) {
      query += ' AND es.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY es.exam_date ASC, es.start_time ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async createExamSchedule(data) {
    const { exam_id, class_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks } = data;
    const [result] = await pool.query(
      `INSERT INTO exam_schedules
       (exam_id, class_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [exam_id, class_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks]
    );
    return { id: result.insertId, ...data };
  }

  /**
   * Loads all enrolled students for a scheduled exam along with existing marks
   */
  async getMarksEntrySheet(scheduleId) {
    // 1. Get schedule details
    const [scheduleRows] = await pool.query(`
      SELECT es.*, ex.name AS exam_name, ex.academic_year_id, c.name AS class_name, sub.name AS subject_name
      FROM exam_schedules es
      JOIN exams ex ON es.exam_id = ex.id
      JOIN classes c ON es.class_id = c.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE es.id = ?
    `, [scheduleId]);

    if (scheduleRows.length === 0) {
      throw new Error('Exam schedule not found');
    }

    const schedule = scheduleRows[0];

    // 2. Fetch all students enrolled in this class and academic session
    const [students] = await pool.query(`
      SELECT st.id AS student_id, st.admission_no, st.first_name, st.last_name, st.father_name,
             se.roll_number, sec.name AS section_name,
             em.id AS mark_id, em.marks_obtained, em.teacher_remarks
      FROM student_enrollments se
      JOIN students st ON se.student_id = st.id
      JOIN sections sec ON se.section_id = sec.id
      LEFT JOIN exam_marks em ON em.exam_schedule_id = ? AND em.student_id = st.id
      WHERE se.class_id = ? AND se.academic_year_id = ? AND se.status = 'active'
      ORDER BY sec.name ASC, se.roll_number ASC
    `, [scheduleId, schedule.class_id, schedule.academic_year_id]);

    return {
      schedule,
      students
    };
  }

  /**
   * Mass saves/updates student marks with bounds and pass/fail validation
   */
  async saveMassMarks(scheduleId, marksData) {
    // Validate schedule
    const [scheduleRows] = await pool.query('SELECT * FROM exam_schedules WHERE id = ?', [scheduleId]);
    if (scheduleRows.length === 0) throw new Error('Exam schedule not found');

    const schedule = scheduleRows[0];
    const totalMarks = parseFloat(schedule.total_marks);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let savedCount = 0;
      for (const entry of marksData) {
        const studentId = parseInt(entry.student_id, 10);
        const marksObtained = parseFloat(entry.marks_obtained);
        const remarks = entry.teacher_remarks || '';

        if (isNaN(marksObtained) || marksObtained < 0 || marksObtained > totalMarks) {
          throw new Error(`Marks for student ID ${studentId} must be between 0 and total marks (${totalMarks}).`);
        }

        await connection.query(
          `INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained, teacher_remarks)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), teacher_remarks = VALUES(teacher_remarks)`,
          [scheduleId, studentId, marksObtained, remarks]
        );
        savedCount++;
      }

      await connection.commit();
      return { success: true, count: savedCount };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Complete student report card for an exam term
   */
  async getStudentReportCard(studentId, examId = null) {
    let query = `
      SELECT em.marks_obtained, em.teacher_remarks,
             es.exam_date, es.total_marks, es.passing_marks,
             sub.name AS subject_name, sub.code AS subject_code,
             ex.id AS exam_id, ex.name AS exam_name, ex.is_published,
             st.first_name, st.last_name, st.admission_no,
             c.name AS class_name, sec.name AS section_name, se.roll_number
      FROM exam_marks em
      JOIN exam_schedules es ON em.exam_schedule_id = es.id
      JOIN exams ex ON es.exam_id = ex.id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN students st ON em.student_id = st.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE em.student_id = ?
    `;
    const params = [studentId];

    if (examId) {
      query += ' AND ex.id = ?';
      params.push(examId);
    }

    query += ' ORDER BY ex.start_date DESC, sub.name ASC';

    const [rows] = await pool.query(query, params);

    // Group by exam
    const examsMap = {};
    for (const r of rows) {
      if (!examsMap[r.exam_id]) {
        examsMap[r.exam_id] = {
          exam_id: r.exam_id,
          exam_name: r.exam_name,
          is_published: r.is_published,
          student: {
            first_name: r.first_name,
            last_name: r.last_name,
            admission_no: r.admission_no,
            class_name: r.class_name,
            section_name: r.section_name,
            roll_number: r.roll_number
          },
          subjects: [],
          total_max_marks: 0,
          total_obtained_marks: 0
        };
      }

      const total = parseFloat(r.total_marks);
      const obtained = parseFloat(r.marks_obtained);
      const passing = parseFloat(r.passing_marks);
      const isPassed = obtained >= passing;

      examsMap[r.exam_id].total_max_marks += total;
      examsMap[r.exam_id].total_obtained_marks += obtained;

      examsMap[r.exam_id].subjects.push({
        subject_name: r.subject_name,
        subject_code: r.subject_code,
        total_marks: total,
        passing_marks: passing,
        marks_obtained: obtained,
        is_passed: isPassed,
        teacher_remarks: r.teacher_remarks
      });
    }

    // Compute percentages & grades
    const reportCards = Object.values(examsMap).map(card => {
      const percentage = card.total_max_marks > 0
        ? ((card.total_obtained_marks / card.total_max_marks) * 100).toFixed(2)
        : 0;

      let grade = 'F';
      if (percentage >= 80) grade = 'A+';
      else if (percentage >= 70) grade = 'A';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';

      const hasFailedSubject = card.subjects.some(s => !s.is_passed);

      return {
        ...card,
        percentage: parseFloat(percentage),
        overall_grade: grade,
        overall_status: hasFailedSubject ? 'FAIL' : 'PASS'
      };
    });

    return reportCards;
  }
}

module.exports = new ExaminationsService();

