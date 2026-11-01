const pool = require('../../config/db');

class FeesService {
  // Fee Heads
  async getFeeHeads() {
    const [rows] = await pool.query('SELECT * FROM fee_heads ORDER BY name ASC');
    return rows;
  }

  async createFeeHead(data) {
    const { name, description } = data;
    const [result] = await pool.query(
      'INSERT INTO fee_heads (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    return { id: result.insertId, name, description };
  }

  // Fee Structures
  async getFeeStructures(academicYearId = null, classId = null) {
    let query = `
      SELECT fs.*,
             fh.name AS fee_head_name, fh.description AS fee_head_description,
             c.name AS class_name,
             ay.session_name
      FROM fee_structures fs
      JOIN fee_heads fh ON fs.fee_head_id = fh.id
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];
    if (academicYearId) {
      query += ' AND fs.academic_year_id = ?';
      params.push(academicYearId);
    }
    if (classId) {
      query += ' AND fs.class_id = ?';
      params.push(classId);
    }
    query += ' ORDER BY c.numeric_value ASC, fh.name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async saveFeeStructure(data) {
    const { academic_year_id, class_id, fee_head_id, amount } = data;
    await pool.query(
      `INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [academic_year_id, class_id, fee_head_id, parseFloat(amount)]
    );
    return { academic_year_id, class_id, fee_head_id, amount };
  }

  // Bulk Voucher Generation
  async bulkGenerateVouchers(data, generatedByUserId) {
    const { academic_year_id, class_id, month_year, issue_date, due_date } = data;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch fee structure heads for this class
      const [structures] = await connection.query(
        'SELECT fee_head_id, amount FROM fee_structures WHERE academic_year_id = ? AND class_id = ?',
        [academic_year_id, class_id]
      );

      if (structures.length === 0) {
        throw new Error('No fee structure configured for the selected class and academic session. Please configure fee heads first.');
      }

      const totalCalculatedAmount = structures.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // 2. Fetch all active enrolled students in this class
      const [enrollments] = await connection.query(
        `SELECT student_id FROM student_enrollments
         WHERE academic_year_id = ? AND class_id = ? AND status = 'active'`,
        [academic_year_id, class_id]
      );

      if (enrollments.length === 0) {
        throw new Error('No active students found in the selected class.');
      }

      let generatedCount = 0;
      let skippedCount = 0;

      for (const enr of enrollments) {
        // Check if voucher already exists for this student and month
        const [existing] = await connection.query(
          'SELECT id FROM fee_vouchers WHERE student_id = ? AND academic_year_id = ? AND month_year = ?',
          [enr.student_id, academic_year_id, month_year]
        );

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        // Generate voucher number: VCH-YYYYMM-STID-RAND
        const randCode = Math.floor(1000 + Math.random() * 9000);
        const voucherNo = `VCH-${month_year.replace('-', '')}-${enr.student_id}-${randCode}`;

        const [voucherRes] = await connection.query(
          `INSERT INTO fee_vouchers
           (voucher_no, student_id, academic_year_id, generated_by_user_id, month_year, issue_date, due_date, total_amount, discount_amount, paid_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 'unpaid')`,
          [voucherNo, enr.student_id, academic_year_id, generatedByUserId || null, month_year, issue_date, due_date, totalCalculatedAmount]
        );

        const voucherId = voucherRes.insertId;

        // Insert itemized fee breakdown
        for (const item of structures) {
          await connection.query(
            'INSERT INTO fee_voucher_items (voucher_id, fee_head_id, amount) VALUES (?, ?, ?)',
            [voucherId, item.fee_head_id, item.amount]
          );
        }

        generatedCount++;
      }

      await connection.commit();
      return {
        month_year,
        generated_count: generatedCount,
        skipped_count: skippedCount,
        amount_per_voucher: totalCalculatedAmount
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Voucher Query & POS Search
  async searchVouchers(filters = {}) {
    const { search, status, monthYear, classId, studentId } = filters;

    let query = `
      SELECT fv.*,
             st.admission_no, st.first_name, st.last_name, st.father_name, st.guardian_phone,
             c.name AS class_name,
             sec.name AS section_name,
             se.roll_number,
             ay.session_name,
             (fv.total_amount - fv.discount_amount - fv.paid_amount) AS remaining_balance
      FROM fee_vouchers fv
      JOIN students st ON fv.student_id = st.id
      JOIN academic_years ay ON fv.academic_year_id = ay.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.academic_year_id = fv.academic_year_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      query += ' AND fv.student_id = ?';
      params.push(studentId);
    }
    if (status) {
      query += ' AND fv.status = ?';
      params.push(status);
    }
    if (monthYear) {
      query += ' AND fv.month_year = ?';
      params.push(monthYear);
    }
    if (classId) {
      query += ' AND se.class_id = ?';
      params.push(classId);
    }
    if (search) {
      query += ' AND (fv.voucher_no LIKE ? OR st.admission_no LIKE ? OR st.first_name LIKE ? OR st.last_name LIKE ? OR st.father_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY fv.issue_date DESC, fv.id DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Collect Payment POS
  async collectPayment(data, receivedByUserId) {
    const { voucher_id, amount_paid, payment_method = 'cash', transaction_reference, payment_date } = data;
    const amount = parseFloat(amount_paid);

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check voucher
      const [vouchers] = await connection.query(
        'SELECT * FROM fee_vouchers WHERE id = ? FOR UPDATE',
        [voucher_id]
      );

      if (vouchers.length === 0) {
        throw new Error('Fee voucher not found');
      }

      const voucher = vouchers[0];
      const netPayable = parseFloat(voucher.total_amount) - parseFloat(voucher.discount_amount);
      const currentPaid = parseFloat(voucher.paid_amount);
      const remaining = netPayable - currentPaid;

      if (amount > remaining + 0.01) {
        throw new Error(`Payment amount (PKR ${amount}) exceeds outstanding voucher balance (PKR ${remaining}).`);
      }

      const newPaid = currentPaid + amount;
      const newStatus = newPaid >= (netPayable - 0.01) ? 'paid' : 'partially_paid';

      // Generate Receipt Number: REC-YYYYMM-XXXXX
      const nowStr = new Date().toISOString().slice(0, 7).replace('-', '');
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const receiptNo = `REC-${nowStr}-${randNum}`;

      // Insert payment
      const [payResult] = await connection.query(
        `INSERT INTO fee_payments
         (voucher_id, receipt_no, amount_paid, payment_method, transaction_reference, payment_date, received_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [voucher_id, receiptNo, amount, payment_method, transaction_reference || null, payment_date || new Date().toISOString().split('T')[0], receivedByUserId || null]
      );

      // Update voucher
      await connection.query(
        'UPDATE fee_vouchers SET paid_amount = ?, status = ? WHERE id = ?',
        [newPaid, newStatus, voucher_id]
      );

      await connection.commit();

      return {
        payment_id: payResult.insertId,
        receipt_no: receiptNo,
        amount_paid: amount,
        new_paid_total: newPaid,
        remaining_balance: Math.max(0, netPayable - newPaid),
        voucher_status: newStatus
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // 3-Copy Challan Data
  async getVoucherChallan(voucherId) {
    const [vouchers] = await pool.query(`
      SELECT fv.*,
             st.admission_no, st.first_name, st.last_name, st.father_name, st.guardian_phone, st.address,
             c.name AS class_name,
             sec.name AS section_name,
             se.roll_number,
             ay.session_name
      FROM fee_vouchers fv
      JOIN students st ON fv.student_id = st.id
      JOIN academic_years ay ON fv.academic_year_id = ay.id
      LEFT JOIN student_enrollments se ON st.id = se.student_id AND se.academic_year_id = fv.academic_year_id AND se.status = 'active'
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE fv.id = ?
    `, [voucherId]);

    if (vouchers.length === 0) {
      throw new Error('Voucher not found');
    }

    const voucher = vouchers[0];

    // Fetch items
    const [items] = await pool.query(`
      SELECT fvi.*, fh.name AS fee_head_name
      FROM fee_voucher_items fvi
      JOIN fee_heads fh ON fvi.fee_head_id = fh.id
      WHERE fvi.voucher_id = ?
    `, [voucherId]);

    // Fetch payments
    const [payments] = await pool.query(
      'SELECT * FROM fee_payments WHERE voucher_id = ? ORDER BY payment_date ASC',
      [voucherId]
    );

    return {
      voucher,
      items,
      payments,
      bank_details: {
        bank_name: 'Meezan Bank Limited',
        account_title: 'Al Suffa Education System (MIS)',
        account_number: '0102-0103984712',
        branch_code: '0102 - F-8 Markaz Islamabad'
      }
    };
  }

  // Financial Statistics
  async getFinancialStats(monthYear = null) {
    let billedQuery = 'SELECT COALESCE(SUM(total_amount - discount_amount), 0) AS total_billed, COALESCE(SUM(paid_amount), 0) AS total_collected FROM fee_vouchers';
    let payrollQuery = 'SELECT COALESCE(SUM(net_salary), 0) AS pending_payroll FROM payroll WHERE payment_status = "pending"';

    const params = [];
    if (monthYear) {
      billedQuery += ' WHERE month_year = ?';
      payrollQuery += ' AND month_year = ?';
      params.push(monthYear);
    }

    const [billedRows] = await pool.query(billedQuery, params);
    const [payrollRows] = await pool.query(payrollQuery, params);

    const totalBilled = parseFloat(billedRows[0].total_billed);
    const totalCollected = parseFloat(billedRows[0].total_collected);
    const outstandingDues = totalBilled - totalCollected;
    const pendingPayroll = parseFloat(payrollRows[0].pending_payroll);

    return {
      month_year: monthYear || 'All-Time',
      total_billed: totalBilled,
      total_collected: totalCollected,
      outstanding_dues: outstandingDues,
      pending_payroll: pendingPayroll,
      collection_rate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0
    };
  }
}

module.exports = new FeesService();

