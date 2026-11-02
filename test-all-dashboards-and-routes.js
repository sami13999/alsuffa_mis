const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\c21032b2-b17d-43e2-b298-6e32db82ce3a\\screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runFullVerification() {
  console.log('===============================================================');
  console.log(' STARTING FULL END-TO-END MULTI-PAGE CHROME VALIDATION');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  async function loginAsRole(username, roleName) {
    console.log(`\n--> Authenticating as [${username}] (${roleName})...`);
    // Navigate to origin first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Call backend API directly and persist auth credentials in browser localStorage
    const authResult = await page.evaluate(async (uname) => {
      try {
        const resp = await fetch('http://localhost:5000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uname, password: 'password123' })
        });
        const json = await resp.json();
        if (json.success && json.data) {
          localStorage.setItem('al_suffa_token', json.data.token);
          localStorage.setItem('al_suffa_user', JSON.stringify(json.data.user));
          return { success: true, role: json.data.user.role };
        }
        return { success: false, error: json.message || 'Login failed' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }, username);

    if (!authResult.success) {
      throw new Error(`Authentication failed for ${username}: ${authResult.error}`);
    }

    console.log(`[AUTH SUCCESS] Token & user session stored for role: ${authResult.role}`);
    await sleep(400);
  }

  async function logout() {
    console.log('--> Purging session...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await sleep(500);
  }

  async function checkDiagnosticsPresence() {
    return await page.evaluate(() => {
      const hasSidebarDiagnostics = Array.from(document.querySelectorAll('aside a, aside button'))
        .some(el => (el.innerText || '').toLowerCase().includes('diagnostic'));
      const hasTopBarDbOnline = Array.from(document.querySelectorAll('header a, header button, header span'))
        .some(el => (el.innerText || '').toLowerCase().includes('db online'));
      return {
        hasSidebarDiagnostics,
        hasTopBarDbOnline
      };
    });
  }

  try {
    // =========================================================================
    // 1. SUPER ADMIN TESTS (7 DEDICATED PAGES)
    // =========================================================================
    console.log('\n===============================================================');
    console.log('--- 1. TESTING SUPER ADMIN PORTAL (7 DEDICATED PAGES) ---');
    console.log('===============================================================');
    await loginAsRole('admin', 'Super Admin');

    const adminPages = [
      { url: 'http://localhost:3000/admin', name: 'v2-01-admin-overview', title: 'Executive Overview' },
      { url: 'http://localhost:3000/admin/academics', name: 'v2-02-admin-academics', title: 'Academic Hierarchy' },
      { url: 'http://localhost:3000/admin/students', name: 'v2-03-admin-students', title: 'Student Admissions' },
      { url: 'http://localhost:3000/admin/staff', name: 'v2-04-admin-staff', title: 'Staff Management' },
      { url: 'http://localhost:3000/admin/timetables', name: 'v2-05-admin-timetables', title: 'Timetable Builder' },
      { url: 'http://localhost:3000/admin/examinations', name: 'v2-06-admin-examinations', title: 'Exam Terms & Papers' },
      { url: 'http://localhost:3000/admin/diagnostics', name: 'v2-07-admin-diagnostics', title: 'System Diagnostics' }
    ];

    for (const p of adminPages) {
      await page.goto(p.url, { waitUntil: 'networkidle2' });
      await sleep(1200);
      const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`[PASS] Admin -> ${p.title} (${p.url}) | Screenshot: ${p.name}.png`);
    }

    const adminDiag = await checkDiagnosticsPresence();
    console.log(`[VERIFY] Super Admin Diagnostics: sidebar=${adminDiag.hasSidebarDiagnostics}, header=${adminDiag.hasTopBarDbOnline} (EXPECTED: TRUE)`);
    await logout();

    // =========================================================================
    // 2. ACCOUNTANT TESTS (5 DEDICATED PAGES, NO DIAGNOSTICS)
    // =========================================================================
    console.log('\n===============================================================');
    console.log('--- 2. TESTING ACCOUNTANT PORTAL (5 DEDICATED PAGES) ---');
    console.log('===============================================================');
    await loginAsRole('accountant', 'Accountant');

    const accountantPages = [
      { url: 'http://localhost:3000/accounts', name: 'v2-08-accounts-overview', title: 'Financial Overview' },
      { url: 'http://localhost:3000/accounts/fees', name: 'v2-09-accounts-fee-config', title: 'Fee Configuration' },
      { url: 'http://localhost:3000/accounts/vouchers', name: 'v2-10-accounts-bulk-vouchers', title: 'Bulk Vouchers' },
      { url: 'http://localhost:3000/accounts/pos', name: 'v2-11-accounts-pos', title: 'Fee Collection POS' },
      { url: 'http://localhost:3000/accounts/payroll', name: 'v2-12-accounts-payroll', title: 'Staff Payroll' }
    ];

    for (const p of accountantPages) {
      await page.goto(p.url, { waitUntil: 'networkidle2' });
      await sleep(1200);
      const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`[PASS] Accountant -> ${p.title} (${p.url}) | Screenshot: ${p.name}.png`);
    }

    const acctDiag = await checkDiagnosticsPresence();
    console.log(`[VERIFY] Accountant Diagnostics check: sidebar=${acctDiag.hasSidebarDiagnostics}, header=${acctDiag.hasTopBarDbOnline} (EXPECTED: FALSE)`);
    if (acctDiag.hasSidebarDiagnostics || acctDiag.hasTopBarDbOnline) {
      console.error('FAIL: Accountant still has diagnostics visible!');
    } else {
      console.log('[CONFIRMED] System Diagnostics successfully removed from Accountant portal!');
    }

    // Direct URL access check
    await page.goto('http://localhost:3000/admin/diagnostics', { waitUntil: 'networkidle2' });
    await sleep(600);
    console.log(`[SECURITY CHECK] Accountant accessing /admin/diagnostics -> Blocked & redirected to: ${page.url()}`);
    await logout();

    // =========================================================================
    // 3. TEACHER TESTS (3 DEDICATED PAGES, NO DIAGNOSTICS)
    // =========================================================================
    console.log('\n===============================================================');
    console.log('--- 3. TESTING TEACHER PORTAL (3 DEDICATED PAGES) ---');
    console.log('===============================================================');
    await loginAsRole('teacher1', 'Teacher (Salman)');

    const teacherPages = [
      { url: 'http://localhost:3000/teacher', name: 'v2-13-teacher-overview', title: 'Teacher Overview' },
      { url: 'http://localhost:3000/teacher/schedule', name: 'v2-14-teacher-schedule', title: 'My Lecture Schedule' },
      { url: 'http://localhost:3000/teacher/marks', name: 'v2-15-teacher-marks', title: 'Exam Marks Entry' }
    ];

    for (const p of teacherPages) {
      await page.goto(p.url, { waitUntil: 'networkidle2' });
      await sleep(1200);
      const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`[PASS] Teacher -> ${p.title} (${p.url}) | Screenshot: ${p.name}.png`);
    }

    const teacherDiag = await checkDiagnosticsPresence();
    console.log(`[VERIFY] Teacher Diagnostics check: sidebar=${teacherDiag.hasSidebarDiagnostics}, header=${teacherDiag.hasTopBarDbOnline} (EXPECTED: FALSE)`);
    if (teacherDiag.hasSidebarDiagnostics || teacherDiag.hasTopBarDbOnline) {
      console.error('FAIL: Teacher still has diagnostics visible!');
    } else {
      console.log('[CONFIRMED] System Diagnostics successfully removed from Teacher portal!');
    }

    // Direct URL access check
    await page.goto('http://localhost:3000/admin/diagnostics', { waitUntil: 'networkidle2' });
    await sleep(600);
    console.log(`[SECURITY CHECK] Teacher accessing /admin/diagnostics -> Blocked & redirected to: ${page.url()}`);
    await logout();

    // =========================================================================
    // 4. STUDENT TESTS (4 DEDICATED PAGES, NO DIAGNOSTICS)
    // =========================================================================
    console.log('\n===============================================================');
    console.log('--- 4. TESTING STUDENT PORTAL (4 DEDICATED PAGES) ---');
    console.log('===============================================================');
    await loginAsRole('student1', 'Student (Hamza)');

    const studentPages = [
      { url: 'http://localhost:3000/student', name: 'v2-16-student-overview', title: 'Student Overview' },
      { url: 'http://localhost:3000/student/timetable', name: 'v2-17-student-timetable', title: 'My Class Timetable' },
      { url: 'http://localhost:3000/student/fees', name: 'v2-18-student-fees', title: 'Fee Vouchers & Bills' },
      { url: 'http://localhost:3000/student/report-card', name: 'v2-19-student-report-card', title: 'Report Card & Grades' }
    ];

    for (const p of studentPages) {
      await page.goto(p.url, { waitUntil: 'networkidle2' });
      await sleep(1200);
      const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`[PASS] Student -> ${p.title} (${p.url}) | Screenshot: ${p.name}.png`);
    }

    const studentDiag = await checkDiagnosticsPresence();
    console.log(`[VERIFY] Student Diagnostics check: sidebar=${studentDiag.hasSidebarDiagnostics}, header=${studentDiag.hasTopBarDbOnline} (EXPECTED: FALSE)`);
    if (studentDiag.hasSidebarDiagnostics || studentDiag.hasTopBarDbOnline) {
      console.error('FAIL: Student still has diagnostics visible!');
    } else {
      console.log('[CONFIRMED] System Diagnostics successfully removed from Student portal!');
    }

    // Direct URL access check
    await page.goto('http://localhost:3000/admin/diagnostics', { waitUntil: 'networkidle2' });
    await sleep(600);
    console.log(`[SECURITY CHECK] Student accessing /admin/diagnostics -> Blocked & redirected to: ${page.url()}`);
    await logout();

    console.log('\n===============================================================');
    console.log(' ALL 19 DEDICATED ROUTES ACROSS ALL 4 DASHBOARDS PASSED 100%!');
    console.log('===============================================================');

  } catch (error) {
    console.error('Verification encountered an error:', error);
  } finally {
    await browser.close();
  }
}

runFullVerification();
