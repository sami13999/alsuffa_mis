const pool = require('../../config/db');

class AcademicsService {
  // Academic Years / Sessions
  async getAcademicYears() {
    const [rows] = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
    return rows;
  }

  async getActiveAcademicYear() {
    const [rows] = await pool.query('SELECT * FROM academic_years WHERE is_current = 1 LIMIT 1');
    return rows[0] || null;
  }

  async createAcademicYear(data) {
    const { session_name, start_date, end_date, is_current } = data;
    if (is_current) {
      await pool.query('UPDATE academic_years SET is_current = 0');
    }
    const [result] = await pool.query(
      'INSERT INTO academic_years (session_name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)',
      [session_name, start_date, end_date, is_current ? 1 : 0]
    );
    return { id: result.insertId, session_name, start_date, end_date, is_current };
  }

  // Classes
  async getClasses() {
    const [rows] = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT s.id) AS section_count,
             COUNT(DISTINCT cs.subject_id) AS subject_count
      FROM classes c
      LEFT JOIN sections s ON c.id = s.class_id
      LEFT JOIN class_subjects cs ON c.id = cs.class_id
      GROUP BY c.id
      ORDER BY c.numeric_value ASC
    `);
    return rows;
  }

  async createClass(data) {
    const { name, numeric_value } = data;
    const [result] = await pool.query(
      'INSERT INTO classes (name, numeric_value) VALUES (?, ?)',
      [name, parseInt(numeric_value, 10)]
    );
    return { id: result.insertId, name, numeric_value };
  }

  // Sections
  async getSections(classId = null) {
    let query = `
      SELECT s.*, c.name AS class_name
      FROM sections s
      JOIN classes c ON s.class_id = c.id
    `;
    const params = [];
    if (classId) {
      query += ' WHERE s.class_id = ?';
      params.push(classId);
    }
    query += ' ORDER BY c.numeric_value ASC, s.name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  async createSection(data) {
    const { class_id, name } = data;
    const [result] = await pool.query(
      'INSERT INTO sections (class_id, name) VALUES (?, ?)',
      [class_id, name]
    );
    return { id: result.insertId, class_id, name };
  }

  // Subjects
  async getSubjects() {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY name ASC');
    return rows;
  }

  async createSubject(data) {
    const { code, name, type } = data;
    const [result] = await pool.query(
      'INSERT INTO subjects (code, name, type) VALUES (?, ?, ?)',
      [code, name, type || 'theory']
    );
    return { id: result.insertId, code, name, type };
  }

  // Class Subject Mappings
  async getClassSubjects(classId) {
    const [rows] = await pool.query(`
      SELECT cs.*, sub.code, sub.name AS subject_name, sub.type
      FROM class_subjects cs
      JOIN subjects sub ON cs.subject_id = sub.id
      WHERE cs.class_id = ?
      ORDER BY sub.name ASC
    `, [classId]);
    return rows;
  }

  async assignSubjectsToClass(classId, subjectIds) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM class_subjects WHERE class_id = ?', [classId]);
      for (const subId of subjectIds) {
        await connection.query(
          'INSERT INTO class_subjects (class_id, subject_id, is_optional) VALUES (?, ?, 0)',
          [classId, subId]
        );
      }
      await connection.commit();
      return { success: true, count: subjectIds.length };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Hierarchy for complete UI state
  async getAcademicHierarchy() {
    const classes = await this.getClasses();
    const sections = await this.getSections();
    const subjects = await this.getSubjects();
    const [classSubjects] = await pool.query('SELECT * FROM class_subjects');

    const result = classes.map(c => {
      return {
        ...c,
        sections: sections.filter(s => s.class_id === c.id),
        subjectIds: classSubjects.filter(cs => cs.class_id === c.id).map(cs => cs.subject_id)
      };
    });

    return { classes: result, allSubjects: subjects };
  }
}

module.exports = new AcademicsService();

