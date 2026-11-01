const pool = require('../../config/db');

class TimetablesService {
  async getTimetables(filters = {}) {
    const { academicYearId, classId, sectionId, teacherId, dayOfWeek } = filters;

    let query = `
      SELECT tt.*,
             c.name AS class_name,
             sec.name AS section_name,
             sub.name AS subject_name, sub.code AS subject_code,
             stf.first_name AS teacher_first_name, stf.last_name AS teacher_last_name, stf.employee_code,
             ay.session_name
      FROM timetables tt
      JOIN classes c ON tt.class_id = c.id
      JOIN sections sec ON tt.section_id = sec.id
      JOIN subjects sub ON tt.subject_id = sub.id
      JOIN staff stf ON tt.teacher_id = stf.id
      JOIN academic_years ay ON tt.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];

    if (academicYearId) {
      query += ' AND tt.academic_year_id = ?';
      params.push(academicYearId);
    }
    if (classId) {
      query += ' AND tt.class_id = ?';
      params.push(classId);
    }
    if (sectionId) {
      query += ' AND tt.section_id = ?';
      params.push(sectionId);
    }
    if (teacherId) {
      query += ' AND tt.teacher_id = ?';
      params.push(teacherId);
    }
    if (dayOfWeek) {
      query += ' AND tt.day_of_week = ?';
      params.push(dayOfWeek);
    }

    query += `
      ORDER BY FIELD(tt.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
               tt.start_time ASC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async createTimetableSlot(data) {
    const {
      academic_year_id,
      class_id,
      section_id,
      subject_id,
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room_number
    } = data;

    // 1. Validate Time-Slot Order
    if (start_time >= end_time) {
      throw new Error(`Start time (${start_time}) must be earlier than end time (${end_time}).`);
    }

    // 2. Collision Detection A: Teacher Clash
    // Check if the assigned teacher is already scheduled elsewhere during this overlapping time interval
    const [teacherClash] = await pool.query(
      `SELECT tt.*, c.name AS class_name, sec.name AS section_name, sub.name AS subject_name,
              stf.first_name, stf.last_name
       FROM timetables tt
       JOIN classes c ON tt.class_id = c.id
       JOIN sections sec ON tt.section_id = sec.id
       JOIN subjects sub ON tt.subject_id = sub.id
       JOIN staff stf ON tt.teacher_id = stf.id
       WHERE tt.academic_year_id = ?
         AND tt.teacher_id = ?
         AND tt.day_of_week = ?
         AND (
           (tt.start_time < ? AND tt.end_time > ?) OR
           (tt.start_time >= ? AND tt.start_time < ?)
         )`,
      [academic_year_id, teacher_id, day_of_week, end_time, start_time, start_time, end_time]
    );

    if (teacherClash.length > 0) {
      const clash = teacherClash[0];
      throw new Error(
        `Teacher Conflict: ${clash.first_name} ${clash.last_name} is already assigned to ${clash.class_name} (${clash.section_name}) for ${clash.subject_name} on ${day_of_week} from ${clash.start_time} to ${clash.end_time}.`
      );
    }

    // 3. Collision Detection B: Section/Class Clash
    // Check if the target section is already attending another lecture during this time
    const [sectionClash] = await pool.query(
      `SELECT tt.*, sub.name AS subject_name
       FROM timetables tt
       JOIN subjects sub ON tt.subject_id = sub.id
       WHERE tt.academic_year_id = ?
         AND tt.section_id = ?
         AND tt.day_of_week = ?
         AND (
           (tt.start_time < ? AND tt.end_time > ?) OR
           (tt.start_time >= ? AND tt.start_time < ?)
         )`,
      [academic_year_id, section_id, day_of_week, end_time, start_time, start_time, end_time]
    );

    if (sectionClash.length > 0) {
      const clash = sectionClash[0];
      throw new Error(
        `Section Conflict: This class section is already scheduled for ${clash.subject_name} on ${day_of_week} from ${clash.start_time} to ${clash.end_time}.`
      );
    }

    // 4. Insert new timetable slot
    const [result] = await pool.query(
      `INSERT INTO timetables
       (academic_year_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [academic_year_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number || 'Room 101']
    );

    return {
      id: result.insertId,
      ...data
    };
  }

  async deleteTimetableSlot(id) {
    const [result] = await pool.query('DELETE FROM timetables WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Timetable slot not found');
    }
    return { id, deleted: true };
  }

  // Teacher Schedule (For Teacher Dashboard)
  async getTeacherSchedule(staffId) {
    const [rows] = await pool.query(
      `SELECT tt.*,
              c.name AS class_name,
              sec.name AS section_name,
              sub.name AS subject_name, sub.code AS subject_code
       FROM timetables tt
       JOIN classes c ON tt.class_id = c.id
       JOIN sections sec ON tt.section_id = sec.id
       JOIN subjects sub ON tt.subject_id = sub.id
       JOIN academic_years ay ON tt.academic_year_id = ay.id
       WHERE tt.teacher_id = ? AND ay.is_current = 1
       ORDER BY FIELD(tt.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                tt.start_time ASC`,
      [staffId]
    );
    return rows;
  }

  // Student Schedule (For Student Portal)
  async getStudentSchedule(classId, sectionId) {
    const [rows] = await pool.query(
      `SELECT tt.*,
              c.name AS class_name,
              sec.name AS section_name,
              sub.name AS subject_name, sub.code AS subject_code,
              stf.first_name AS teacher_first_name, stf.last_name AS teacher_last_name
       FROM timetables tt
       JOIN classes c ON tt.class_id = c.id
       JOIN sections sec ON tt.section_id = sec.id
       JOIN subjects sub ON tt.subject_id = sub.id
       JOIN staff stf ON tt.teacher_id = stf.id
       JOIN academic_years ay ON tt.academic_year_id = ay.id
       WHERE tt.class_id = ? AND tt.section_id = ? AND ay.is_current = 1
       ORDER BY FIELD(tt.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                tt.start_time ASC`,
      [classId, sectionId]
    );
    return rows;
  }
}

module.exports = new TimetablesService();

