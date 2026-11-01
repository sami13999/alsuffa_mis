const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

class AuthService {
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), username.trim()]
    );

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new Error('This account has been deactivated. Please contact administration.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    // Role-specific profile lookup
    let profile = null;
    let enrollment = null;

    if (user.role === 'teacher' || user.role === 'accountant' || user.role === 'admin') {
      const [staff] = await pool.query(
        'SELECT * FROM staff WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (staff.length > 0) {
        profile = staff[0];
      }
    }

    if (user.role === 'student') {
      const [student] = await pool.query(
        'SELECT * FROM students WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (student.length > 0) {
        profile = student[0];
        const [enrollments] = await pool.query(
          `SELECT se.*, c.name AS class_name, s.name AS section_name, ay.session_name
           FROM student_enrollments se
           JOIN classes c ON se.class_id = c.id
           JOIN sections s ON se.section_id = s.id
           JOIN academic_years ay ON se.academic_year_id = ay.id
           WHERE se.student_id = ? AND se.status = 'active'
           LIMIT 1`,
          [profile.id]
        );
        if (enrollments.length > 0) {
          enrollment = enrollments[0];
        }
      }
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_al_suffa_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile,
        enrollment
      }
    };
  }

  async getMe(userId) {
    const [users] = await pool.query(
      'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];
    let profile = null;
    let enrollment = null;

    if (user.role === 'teacher' || user.role === 'accountant' || user.role === 'admin') {
      const [staff] = await pool.query(
        'SELECT * FROM staff WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (staff.length > 0) profile = staff[0];
    }

    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT * FROM students WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (students.length > 0) {
        profile = students[0];
        const [enrollments] = await pool.query(
          `SELECT se.*, c.name AS class_name, s.name AS section_name, ay.session_name
           FROM student_enrollments se
           JOIN classes c ON se.class_id = c.id
           JOIN sections s ON se.section_id = s.id
           JOIN academic_years ay ON se.academic_year_id = ay.id
           WHERE se.student_id = ? AND se.status = 'active'
           LIMIT 1`,
          [profile.id]
        );
        if (enrollments.length > 0) enrollment = enrollments[0];
      }
    }

    return {
      ...user,
      profile,
      enrollment
    };
  }
}

module.exports = new AuthService();

