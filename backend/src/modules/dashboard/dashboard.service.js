const pool = require('../../config/db');

class DashboardService {
  async getAdminStats() {
    // 1. Total Active Students
    const [stRows] = await pool.query('SELECT COUNT(*) AS total_students FROM students WHERE is_active = 1');
    const totalStudents = stRows[0].total_students;

    // 2. Total Staff
    const [staffRows] = await pool.query('SELECT COUNT(*) AS total_staff FROM staff');
    const totalStaff = staffRows[0].total_staff;

    // 3. Active Session
    const [sessionRows] = await pool.query('SELECT session_name FROM academic_years WHERE is_current = 1 LIMIT 1');
    const activeSession = sessionRows[0]?.session_name || 'N/A';

    // 4. Financial Summary
    const [feeRows] = await pool.query(`
      SELECT COALESCE(SUM(total_amount - discount_amount), 0) AS total_billed,
             COALESCE(SUM(paid_amount), 0) AS total_collected
      FROM fee_vouchers
    `);
    const totalBilled = parseFloat(feeRows[0].total_billed);
    const totalCollected = parseFloat(feeRows[0].paid_amount || feeRows[0].total_collected);
    const pendingArrears = totalBilled - totalCollected;

    // 5. Classes and Sections
    const [cRows] = await pool.query('SELECT COUNT(*) AS total_classes FROM classes');
    const [secRows] = await pool.query('SELECT COUNT(*) AS total_sections FROM sections');

    // 6. Recent Admissions
    const [recentStudents] = await pool.query(`
      SELECT st.id, st.admission_no, st.first_name, st.last_name, st.admission_date,
             c.name AS class_name, sec.name AS section_name, se.roll_number
      FROM students st
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      ORDER BY st.admission_date DESC, st.id DESC
      LIMIT 5
    `);

    return {
      total_students: totalStudents,
      total_staff: totalStaff,
      active_session: activeSession,
      total_classes: cRows[0].total_classes,
      total_sections: secRows[0].total_sections,
      financials: {
        total_billed: totalBilled,
        total_collected: totalCollected,
        pending_arrears: pendingArrears,
        recovery_ratio: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0
      },
      recent_admissions: recentStudents
    };
  }

  async getAccountsStats() {
    // Current month-year string: YYYY-MM
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Monthly Billed & Collected
    const [monthFeeRows] = await pool.query(`
      SELECT COALESCE(SUM(total_amount - discount_amount), 0) AS monthly_billed,
             COALESCE(SUM(paid_amount), 0) AS monthly_collected
      FROM fee_vouchers
      WHERE month_year = ?
    `, [currentMonthYear]);

    // All-time Outstanding Dues
    const [allTimeFeeRows] = await pool.query(`
      SELECT COALESCE(SUM(total_amount - discount_amount - paid_amount), 0) AS total_arrears
      FROM fee_vouchers
      WHERE status != 'paid'
    `);

    // Pending Payroll
    const [payrollRows] = await pool.query(`
      SELECT COALESCE(SUM(net_salary), 0) AS pending_payroll
      FROM payroll
      WHERE payment_status = 'pending'
    `);

    // Recent Payments
    const [recentPayments] = await pool.query(`
      SELECT fp.*, fv.voucher_no, st.first_name, st.last_name, st.admission_no,
             c.name AS class_name
      FROM fee_payments fp
      JOIN fee_vouchers fv ON fp.voucher_id = fv.id
      JOIN students st ON fv.student_id = st.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      ORDER BY fp.created_at DESC
      LIMIT 5
    `);

    return {
      current_month: currentMonthYear,
      monthly_billed: parseFloat(monthFeeRows[0].monthly_billed),
      monthly_collected: parseFloat(monthFeeRows[0].monthly_collected),
      outstanding_dues: parseFloat(allTimeFeeRows[0].total_arrears),
      pending_payroll: parseFloat(payrollRows[0].pending_payroll),
      recent_payments: recentPayments
    };
  }

  async getTeacherStats(staffId) {
    if (!staffId) return null;

    // Assigned Classes and Subjects from Timetables
    const [timetableRows] = await pool.query(`
      SELECT DISTINCT c.id AS class_id, c.name AS class_name,
                      sub.id AS subject_id, sub.name AS subject_name
      FROM timetables tt
      JOIN classes c ON tt.class_id = c.id
      JOIN subjects sub ON tt.subject_id = sub.id
      WHERE tt.teacher_id = ?
    `, [staffId]);

    // Total lectures scheduled per week
    const [lectureCount] = await pool.query(
      'SELECT COUNT(*) AS total_lectures FROM timetables WHERE teacher_id = ?',
      [staffId]
    );

    // Total exam papers to mark
    const [examSchedules] = await pool.query(`
      SELECT COUNT(DISTINCT es.id) AS papers_count
      FROM exam_schedules es
      JOIN timetables tt ON es.class_id = tt.class_id AND es.subject_id = tt.subject_id
      WHERE tt.teacher_id = ?
    `, [staffId]);

    return {
      total_weekly_lectures: lectureCount[0].total_lectures,
      assigned_classes: timetableRows,
      exam_papers_count: examSchedules[0].papers_count
    };
  }

  async getStudentStats(studentId) {
    if (!studentId) return null;

    // Outstanding fee balance
    const [dueRows] = await pool.query(`
      SELECT COALESCE(SUM(total_amount - discount_amount - paid_amount), 0) AS total_due,
             COUNT(*) AS total_vouchers,
             SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_vouchers
      FROM fee_vouchers
      WHERE student_id = ?
    `, [studentId]);

    // Latest Exam Result
    const [latestMarks] = await pool.query(`
      SELECT em.marks_obtained, es.total_marks, sub.name AS subject_name, ex.name AS exam_name
      FROM exam_marks em
      JOIN exam_schedules es ON em.exam_schedule_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN exams ex ON es.exam_id = ex.id
      WHERE em.student_id = ? AND ex.is_published = 1
      ORDER BY es.exam_date DESC
      LIMIT 5
    `, [studentId]);

    return {
      financials: {
        total_due: parseFloat(dueRows[0].total_due || 0),
        total_vouchers: dueRows[0].total_vouchers || 0,
        paid_vouchers: dueRows[0].paid_vouchers || 0
      },
      recent_marks: latestMarks
    };
  }
}

module.exports = new DashboardService();

