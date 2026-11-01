const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/responseFormatter');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No authentication token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_al_suffa_2026';
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch user from database to ensure account is active and role hasn't changed
    const [userRows] = await pool.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
      return errorResponse(res, 'Invalid token or account is deactivated.', 401);
    }

    const user = userRows[0];
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // If teacher or staff, link staff record
    if (user.role === 'teacher' || user.role === 'accountant' || user.role === 'admin') {
      const [staffRows] = await pool.query(
        'SELECT id, employee_code, first_name, last_name, designation FROM staff WHERE user_id = ?',
        [user.id]
      );
      if (staffRows.length > 0) {
        req.user.staffId = staffRows[0].id;
        req.user.staff = staffRows[0];
      }
    }

    // If student, link student and current enrollment record
    if (user.role === 'student') {
      const [studentRows] = await pool.query(
        'SELECT id, admission_no, first_name, last_name FROM students WHERE user_id = ?',
        [user.id]
      );
      if (studentRows.length > 0) {
        req.user.studentId = studentRows[0].id;
        req.user.student = studentRows[0];

        // Fetch current enrollment
        const [enrollmentRows] = await pool.query(
          `SELECT se.id, se.academic_year_id, se.class_id, se.section_id, se.roll_number,
                  c.name AS class_name, s.name AS section_name, ay.session_name
           FROM student_enrollments se
           JOIN classes c ON se.class_id = c.id
           JOIN sections s ON se.section_id = s.id
           JOIN academic_years ay ON se.academic_year_id = ay.id
           WHERE se.student_id = ? AND se.status = 'active'
           LIMIT 1`,
          [studentRows[0].id]
        );
        if (enrollmentRows.length > 0) {
          req.user.enrollment = enrollmentRows[0];
        }
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Authentication token verification failed.', 401, error.message);
  }
};

module.exports = authMiddleware;

