const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

class StaffService {
  async registerStaff(data) {
    const {
      employee_code,
      first_name,
      last_name,
      gender,
      phone,
      designation,
      qualification,
      joining_date,
      basic_salary,
      role = 'teacher',
      custom_password
    } = data;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [existingStaff] = await connection.query(
        'SELECT id FROM staff WHERE employee_code = ?',
        [employee_code]
      );
      if (existingStaff.length > 0) {
        throw new Error(`Staff with code "${employee_code}" already exists.`);
      }

      const username = employee_code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${username}@alsuffa.edu.pk`;
      const password = custom_password || 'password123';
      const passwordHash = await bcrypt.hash(password, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
        [username, email, passwordHash, role]
      );
      const userId = userResult.insertId;

      const [staffResult] = await connection.query(
        `INSERT INTO staff
         (user_id, employee_code, first_name, last_name, gender, phone, designation, qualification, joining_date, basic_salary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, employee_code, first_name, last_name, gender, phone, designation, qualification || '', joining_date || new Date(), parseFloat(basic_salary || 0)]
      );

      await connection.commit();

      return {
        staff_id: staffResult.insertId,
        employee_code,
        username,
        role,
        default_password: password
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getStaffList(filters = {}) {
    const { role, search } = filters;
    let query = `
      SELECT s.*, u.username, u.email, u.role, u.is_active
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.employee_code LIKE ? OR s.designation LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY s.first_name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getStaffById(id) {
    const [rows] = await pool.query(`
      SELECT s.*, u.username, u.email, u.role, u.is_active
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      throw new Error('Staff member not found');
    }

    const [payrollHistory] = await pool.query(
      'SELECT * FROM payroll WHERE staff_id = ? ORDER BY month_year DESC',
      [id]
    );

    return {
      ...rows[0],
      payroll: payrollHistory
    };
  }

  // Payroll Management
  async generateMonthlyPayroll(monthYear) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [staffList] = await connection.query('SELECT id, basic_salary FROM staff');
      let createdCount = 0;

      for (const st of staffList) {
        const [existing] = await connection.query(
          'SELECT id FROM payroll WHERE staff_id = ? AND month_year = ?',
          [st.id, monthYear]
        );

        if (existing.length === 0) {
          const basic = parseFloat(st.basic_salary) || 0;
          const allowances = 0.00;
          const deductions = 0.00;
          const net = basic + allowances - deductions;

          await connection.query(
            `INSERT INTO payroll (staff_id, month_year, basic_salary, allowances, deductions, net_salary, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [st.id, monthYear, basic, allowances, deductions, net]
          );
          createdCount++;
        }
      }

      await connection.commit();
      return { monthYear, generated: createdCount };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getPayrollRecords(filters = {}) {
    const { monthYear, status } = filters;
    let query = `
      SELECT p.*, s.employee_code, s.first_name, s.last_name, s.designation, u.role
      FROM payroll p
      JOIN staff s ON p.staff_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (monthYear) {
      query += ' AND p.month_year = ?';
      params.push(monthYear);
    }
    if (status) {
      query += ' AND p.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.month_year DESC, s.first_name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async disbursePayroll(payrollId, data = {}) {
    const paymentDate = data.payment_date || new Date().toISOString().split('T')[0];
    const allowances = data.allowances !== undefined ? parseFloat(data.allowances) : null;
    const deductions = data.deductions !== undefined ? parseFloat(data.deductions) : null;

    if (allowances !== null || deductions !== null) {
      const [current] = await pool.query('SELECT basic_salary, allowances, deductions FROM payroll WHERE id = ?', [payrollId]);
      if (current.length === 0) throw new Error('Payroll record not found');
      
      const newAllow = allowances !== null ? allowances : parseFloat(current[0].allowances);
      const newDeduct = deductions !== null ? deductions : parseFloat(current[0].deductions);
      const basic = parseFloat(current[0].basic_salary);
      const net = basic + newAllow - newDeduct;

      await pool.query(
        `UPDATE payroll
         SET allowances = ?, deductions = ?, net_salary = ?, payment_status = 'paid', payment_date = ?
         WHERE id = ?`,
        [newAllow, newDeduct, net, paymentDate, payrollId]
      );
    } else {
      await pool.query(
        `UPDATE payroll SET payment_status = 'paid', payment_date = ? WHERE id = ?`,
        [paymentDate, payrollId]
      );
    }

    const [updated] = await pool.query('SELECT * FROM payroll WHERE id = ?', [payrollId]);
    return updated[0];
  }
}

module.exports = new StaffService();

