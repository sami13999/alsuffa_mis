/**
 * Database Seeder for Al Suffa Education System (MIS)
 * Seeds default academic years, classes, sections, subjects, class mappings,
 * users, staff, students, enrollments, timetables, fee heads, fee structures,
 * fee vouchers, and exam terms.
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('./db');

async function seedDatabase() {
  console.log('\n======================================================');
  console.log('  AL SUFFA MIS - DATABASE SEEDING ROUTINE');
  console.log('======================================================');

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('-> Disabling foreign key checks for clean seeding...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Truncate all tables
    const tablesToClean = [
      'fee_payments',
      'fee_voucher_items',
      'fee_vouchers',
      'fee_structures',
      'fee_heads',
      'exam_marks',
      'exam_schedules',
      'exams',
      'timetables',
      'student_enrollments',
      'students',
      'payroll',
      'staff',
      'class_subjects',
      'subjects',
      'sections',
      'classes',
      'academic_years',
      'users'
    ];

    for (const table of tablesToClean) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    console.log(' [OK] Tables truncated.');

    // 2. Seed Academic Year
    console.log('-> Seeding Academic Sessions...');
    const [yearResult] = await connection.query(
      `INSERT INTO academic_years (session_name, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?)`,
      ['2026-2027', '2026-08-01', '2027-06-30', 1]
    );
    const academicYearId = yearResult.insertId;

    // 3. Seed Classes & Sections
    console.log('-> Seeding Classes & Sections...');
    const [c9Result] = await connection.query(
      'INSERT INTO classes (name, numeric_value) VALUES (?, ?)',
      ['Grade 9', 9]
    );
    const class9Id = c9Result.insertId;

    const [c10Result] = await connection.query(
      'INSERT INTO classes (name, numeric_value) VALUES (?, ?)',
      ['Grade 10', 10]
    );
    const class10Id = c10Result.insertId;

    // Sections
    const [secA9] = await connection.query('INSERT INTO sections (class_id, name) VALUES (?, ?)', [class9Id, 'Section A']);
    const [secB9] = await connection.query('INSERT INTO sections (class_id, name) VALUES (?, ?)', [class9Id, 'Section B']);
    const [secA10] = await connection.query('INSERT INTO sections (class_id, name) VALUES (?, ?)', [class10Id, 'Section A']);
    const [secB10] = await connection.query('INSERT INTO sections (class_id, name) VALUES (?, ?)', [class10Id, 'Section B']);

    const secA9Id = secA9.insertId;
    const secB9Id = secB9.insertId;

    // 4. Seed Subjects
    console.log('-> Seeding Subjects...');
    const subjects = [
      ['MATH-101', 'Mathematics', 'theory'],
      ['ENG-101', 'English Language', 'theory'],
      ['PHY-101', 'Physics', 'both'],
      ['CHEM-101', 'Chemistry', 'both'],
      ['CS-101', 'Computer Science', 'both'],
      ['ISL-101', 'Islamic Studies', 'theory']
    ];

    const subjectIds = {};
    for (const [code, name, type] of subjects) {
      const [sRes] = await connection.query(
        'INSERT INTO subjects (code, name, type) VALUES (?, ?, ?)',
        [code, name, type]
      );
      subjectIds[code] = sRes.insertId;
    }

    // Map subjects to Grade 9 & Grade 10
    for (const code of Object.keys(subjectIds)) {
      await connection.query('INSERT INTO class_subjects (class_id, subject_id, is_optional) VALUES (?, ?, ?)', [class9Id, subjectIds[code], 0]);
      await connection.query('INSERT INTO class_subjects (class_id, subject_id, is_optional) VALUES (?, ?, ?)', [class10Id, subjectIds[code], 0]);
    }

    // 5. Seed Users & Staff / Students
    console.log('-> Seeding Role-Based Users & Credential Hashes...');
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1 Admin User
    const [adminUser] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@alsuffa.edu.pk', defaultPasswordHash, 'admin', 1]
    );

    // 1 Accountant User
    const [accountantUser] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['accountant', 'accountant@alsuffa.edu.pk', defaultPasswordHash, 'accountant', 1]
    );

    // Staff record for Accountant
    await connection.query(
      `INSERT INTO staff (user_id, employee_code, first_name, last_name, gender, phone, designation, qualification, joining_date, basic_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [accountantUser.insertId, 'EMP-ACC-001', 'Tariq', 'Mahmood', 'male', '+92 300 1234567', 'Chief Accountant', 'M.Com, ACCA', '2023-01-15', 75000.00]
    );

    // 2 Teachers
    const [teacher1User] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['teacher1', 'teacher1@alsuffa.edu.pk', defaultPasswordHash, 'teacher', 1]
    );

    const [teacher1Staff] = await connection.query(
      `INSERT INTO staff (user_id, employee_code, first_name, last_name, gender, phone, designation, qualification, joining_date, basic_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher1User.insertId, 'EMP-TCH-001', 'Muhammad', 'Salman', 'male', '+92 312 9876543', 'Senior Mathematics Lecturer', 'M.Sc. Applied Mathematics', '2022-08-10', 65000.00]
    );
    const teacher1StaffId = teacher1Staff.insertId;

    const [teacher2User] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['teacher2', 'teacher2@alsuffa.edu.pk', defaultPasswordHash, 'teacher', 1]
    );

    const [teacher2Staff] = await connection.query(
      `INSERT INTO staff (user_id, employee_code, first_name, last_name, gender, phone, designation, qualification, joining_date, basic_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher2User.insertId, 'EMP-TCH-002', 'Ayesha', 'Siddiqua', 'female', '+92 333 5556677', 'Physics & Science Lead', 'M.Phil. Physics', '2023-03-01', 60000.00]
    );
    const teacher2StaffId = teacher2Staff.insertId;

    // 2 Students
    const [student1User] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['student1', 'student1@alsuffa.edu.pk', defaultPasswordHash, 'student', 1]
    );

    const [student1Record] = await connection.query(
      `INSERT INTO students (user_id, admission_no, first_name, last_name, gender, date_of_birth, father_name, guardian_phone, address, admission_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student1User.insertId, 'AS-2026-001', 'Hamza', 'Farooq', 'male', '2010-04-12', 'Farooq Ahmad', '+92 321 1122334', 'House 42, Sector G-10, Islamabad', '2026-08-05', 1]
    );
    const student1Id = student1Record.insertId;

    const [student2User] = await connection.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['student2', 'student2@alsuffa.edu.pk', defaultPasswordHash, 'student', 1]
    );

    const [student2Record] = await connection.query(
      `INSERT INTO students (user_id, admission_no, first_name, last_name, gender, date_of_birth, father_name, guardian_phone, address, admission_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student2User.insertId, 'AS-2026-002', 'Fatima', 'Zahra', 'female', '2010-09-22', 'Zahid Hussain', '+92 345 9988776', 'Street 15, F-8/2, Islamabad', '2026-08-06', 1]
    );
    const student2Id = student2Record.insertId;

    // Enroll students in Grade 9, Section A
    console.log('-> Enrolling Students...');
    await connection.query(
      `INSERT INTO student_enrollments (student_id, academic_year_id, class_id, section_id, roll_number, enrollment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student1Id, academicYearId, class9Id, secA9Id, 1, '2026-08-05', 'active']
    );

    await connection.query(
      `INSERT INTO student_enrollments (student_id, academic_year_id, class_id, section_id, roll_number, enrollment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student2Id, academicYearId, class9Id, secA9Id, 2, '2026-08-06', 'active']
    );

    // 6. Timetables (Grade 9 Section A)
    console.log('-> Seeding Timetable Schedules...');
    const scheduleItems = [
      [academicYearId, class9Id, secA9Id, subjectIds['MATH-101'], teacher1StaffId, 'Monday', '08:30:00', '09:20:00', 'Room 101'],
      [academicYearId, class9Id, secA9Id, subjectIds['PHY-101'], teacher2StaffId, 'Monday', '09:25:00', '10:15:00', 'Lab 1'],
      [academicYearId, class9Id, secA9Id, subjectIds['MATH-101'], teacher1StaffId, 'Tuesday', '08:30:00', '09:20:00', 'Room 101'],
      [academicYearId, class9Id, secA9Id, subjectIds['PHY-101'], teacher2StaffId, 'Tuesday', '09:25:00', '10:15:00', 'Lab 1'],
      [academicYearId, class9Id, secA9Id, subjectIds['CS-101'], teacher1StaffId, 'Wednesday', '10:30:00', '11:20:00', 'CS Lab']
    ];

    for (const item of scheduleItems) {
      await connection.query(
        `INSERT INTO timetables (academic_year_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item
      );
    }

    // 7. Fee Configuration
    console.log('-> Seeding Fee Heads & Structures...');
    const [fhTuition] = await connection.query('INSERT INTO fee_heads (name, description) VALUES (?, ?)', ['Monthly Tuition Fee', 'Regular academic monthly tuition']);
    const [fhLab] = await connection.query('INSERT INTO fee_heads (name, description) VALUES (?, ?)', ['Computer & Science Lab Fee', 'Maintenance of scientific equipment & PCs']);
    const [fhExam] = await connection.query('INSERT INTO fee_heads (name, description) VALUES (?, ?)', ['Term Examination Fee', 'Stationery & examination administrative costs']);

    const tuitionHeadId = fhTuition.insertId;
    const labHeadId = fhLab.insertId;
    const examHeadId = fhExam.insertId;

    // Fee Structures for Grade 9 & Grade 10
    await connection.query('INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount) VALUES (?, ?, ?, ?)', [academicYearId, class9Id, tuitionHeadId, 6500.00]);
    await connection.query('INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount) VALUES (?, ?, ?, ?)', [academicYearId, class9Id, labHeadId, 1200.00]);
    await connection.query('INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount) VALUES (?, ?, ?, ?)', [academicYearId, class9Id, examHeadId, 1500.00]);

    await connection.query('INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount) VALUES (?, ?, ?, ?)', [academicYearId, class10Id, tuitionHeadId, 7500.00]);
    await connection.query('INSERT INTO fee_structures (academic_year_id, class_id, fee_head_id, amount) VALUES (?, ?, ?, ?)', [academicYearId, class10Id, labHeadId, 1500.00]);

    // 8. Fee Vouchers & Payments
    console.log('-> Seeding Fee Vouchers & Receipts...');
    // Voucher for Student 1 (Hamza Farooq) - Paid
    const [v1] = await connection.query(
      `INSERT INTO fee_vouchers (voucher_no, student_id, academic_year_id, generated_by_user_id, month_year, issue_date, due_date, total_amount, discount_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['VCH-202611-0001', student1Id, academicYearId, accountantUser.insertId, '2026-11', '2026-11-01', '2026-11-15', 7700.00, 0.00, 7700.00, 'paid']
    );
    const v1Id = v1.insertId;

    await connection.query('INSERT INTO fee_voucher_items (voucher_id, fee_head_id, amount) VALUES (?, ?, ?)', [v1Id, tuitionHeadId, 6500.00]);
    await connection.query('INSERT INTO fee_voucher_items (voucher_id, fee_head_id, amount) VALUES (?, ?, ?)', [v1Id, labHeadId, 1200.00]);

    // Payment receipt for V1
    await connection.query(
      `INSERT INTO fee_payments (voucher_id, receipt_no, amount_paid, payment_method, transaction_reference, payment_date, received_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [v1Id, 'REC-202611-0001', 7700.00, 'cash', 'CASH-COUNTER-01', '2026-11-03', accountantUser.insertId]
    );

    // Voucher for Student 2 (Fatima Zahra) - Unpaid
    const [v2] = await connection.query(
      `INSERT INTO fee_vouchers (voucher_no, student_id, academic_year_id, generated_by_user_id, month_year, issue_date, due_date, total_amount, discount_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['VCH-202611-0002', student2Id, academicYearId, accountantUser.insertId, '2026-11', '2026-11-01', '2026-11-15', 7700.00, 0.00, 0.00, 'unpaid']
    );
    const v2Id = v2.insertId;

    await connection.query('INSERT INTO fee_voucher_items (voucher_id, fee_head_id, amount) VALUES (?, ?, ?)', [v2Id, tuitionHeadId, 6500.00]);
    await connection.query('INSERT INTO fee_voucher_items (voucher_id, fee_head_id, amount) VALUES (?, ?, ?)', [v2Id, labHeadId, 1200.00]);

    // 9. Examinations, Schedules, and Marks
    console.log('-> Seeding Examinations & Gradebook Records...');
    const [examTerm] = await connection.query(
      `INSERT INTO exams (academic_year_id, name, start_date, end_date, is_published)
       VALUES (?, ?, ?, ?, ?)`,
      [academicYearId, 'Mid-Term Examinations 2026', '2026-10-15', '2026-10-25', 1]
    );
    const examId = examTerm.insertId;

    // Exam Schedules for Grade 9 Math & Physics
    const [esMath] = await connection.query(
      `INSERT INTO exam_schedules (exam_id, class_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [examId, class9Id, subjectIds['MATH-101'], '2026-10-16', '09:00:00', '12:00:00', 100.00, 40.00]
    );
    const esMathId = esMath.insertId;

    const [esPhy] = await connection.query(
      `INSERT INTO exam_schedules (exam_id, class_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [examId, class9Id, subjectIds['PHY-101'], '2026-10-18', '09:00:00', '12:00:00', 100.00, 40.00]
    );
    const esPhyId = esPhy.insertId;

    // Marks for Student 1 & 2
    await connection.query(
      `INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained, teacher_remarks)
       VALUES (?, ?, ?, ?)`,
      [esMathId, student1Id, 88.50, 'Excellent analytical problem solving skills.']
    );

    await connection.query(
      `INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained, teacher_remarks)
       VALUES (?, ?, ?, ?)`,
      [esMathId, student2Id, 92.00, 'Top score in class, outstanding geometry proofs.']
    );

    await connection.query(
      `INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained, teacher_remarks)
       VALUES (?, ?, ?, ?)`,
      [esPhyId, student1Id, 79.00, 'Strong theoretical grasp; focus on practical lab notes.']
    );

    await connection.query(
      `INSERT INTO exam_marks (exam_schedule_id, student_id, marks_obtained, teacher_remarks)
       VALUES (?, ?, ?, ?)`,
      [esPhyId, student2Id, 85.50, 'Consistent work and neat diagrams.']
    );

    // 10. Sample Payroll Records
    console.log('-> Seeding Staff Payroll Records...');
    await connection.query(
      `INSERT INTO payroll (staff_id, month_year, basic_salary, allowances, deductions, net_salary, payment_status, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher1StaffId, '2026-10', 65000.00, 5000.00, 2000.00, 68000.00, 'paid', '2026-10-31']
    );

    await connection.query(
      `INSERT INTO payroll (staff_id, month_year, basic_salary, allowances, deductions, net_salary, payment_status, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher2StaffId, '2026-10', 60000.00, 4000.00, 1500.00, 62500.00, 'pending', null]
    );

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    console.log('------------------------------------------------------');
    console.log(' [SUCCESS] Database Seeding Completed Successfully!');
    console.log(' Credentials for all accounts: password123');
    console.log('   - Admin:      admin      / password123');
    console.log('   - Accountant: accountant / password123');
    console.log('   - Teacher 1:  teacher1   / password123');
    console.log('   - Teacher 2:  teacher2   / password123');
    console.log('   - Student 1:  student1   / password123');
    console.log('   - Student 2:  student2   / password123');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('\n [ERROR] Seeding Failed:', err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

seedDatabase();

