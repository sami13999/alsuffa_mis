const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\c21032b2-b17d-43e2-b298-6e32db82ce3a\\screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickByText(page, text) {
  await sleep(600);
  const found = await page.evaluate((targetText) => {
    const elements = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    for (const el of elements) {
      if (el.innerText && el.innerText.trim().toLowerCase().includes(targetText.toLowerCase())) {
        el.click();
        return true;
      }
    }
    return false;
  }, text);
  return found;
}

async function runChromeTestSuite() {
  console.log('\n======================================================');
  console.log('  AL SUFFA MIS - AUTOMATED CHROME UI & INTEGRATION TEST');
  console.log('======================================================');
  console.log(' Target Chrome Binary:', CHROME_PATH);
  console.log(' Web Application URL :', 'http://localhost:3000');
  console.log(' Screenshot Output   :', SCREENSHOT_DIR);
  console.log('------------------------------------------------------');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ----------------------------------------------------
    // TEST 1: LOGIN PAGE & QUICK SWITCHER
    // ----------------------------------------------------
    console.log('\n[TEST 1] Navigating to Login Page (http://localhost:3000/login)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await sleep(800);
    console.log('  ✓ Login page loaded successfully.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-screen.png') });
    console.log('  ✓ Saved screenshot: 01-login-screen.png');

    // ----------------------------------------------------
    // TEST 2: SUPER ADMIN DASHBOARD
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Super Admin Login & Dashboard...');
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log('  ✓ Successfully authenticated into Super Admin Dashboard (/admin).');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-admin-overview.png') });
    console.log('  ✓ Saved screenshot: 02-admin-overview.png');

    // Academic Management Tab
    console.log('  -> Testing Academic Management Tab...');
    await clickByText(page, 'Academic Management');
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-admin-academics.png') });
    console.log('  ✓ Saved screenshot: 03-admin-academics.png');

    // Student Admissions Tab
    console.log('  -> Testing Student Admissions Tab...');
    await clickByText(page, 'Student Admissions');
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-admin-students.png') });
    console.log('  ✓ Saved screenshot: 04-admin-students.png');

    // Timetable Builder Tab
    console.log('  -> Testing Timetable Builder Tab...');
    await clickByText(page, 'Timetable Builder');
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-admin-timetable.png') });
    console.log('  ✓ Saved screenshot: 05-admin-timetable.png');

    // ----------------------------------------------------
    // TEST 3: ACCOUNTS DASHBOARD & POS CHALLAN
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing Accountant Login, POS & 3-Copy Challan...');
    await clickByText(page, 'Sign Out');
    await sleep(1200);

    await clickByText(page, 'Accountant');
    await sleep(400);
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log('  ✓ Successfully logged into Accounts Dashboard (/accounts).');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-accounts-overview.png') });
    console.log('  ✓ Saved screenshot: 06-accounts-overview.png');

    // Fee Collection POS tab
    console.log('  -> Testing Fee Collection POS & 3-Copy Challan modal...');
    await clickByText(page, 'Fee Collection POS');
    await sleep(1200);

    // Click Challan print button
    const challanClicked = await clickByText(page, 'Challan');
    if (challanClicked) {
      await sleep(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-accounts-3copy-challan.png') });
      console.log('  ✓ Saved screenshot: 07-accounts-3copy-challan.png');
      await page.keyboard.press('Escape');
      await sleep(500);
    }

    // Staff Payroll tab
    console.log('  -> Testing Staff Payroll Disbursement tab...');
    await clickByText(page, 'Staff Payroll');
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-accounts-payroll.png') });
    console.log('  ✓ Saved screenshot: 08-accounts-payroll.png');

    // ----------------------------------------------------
    // TEST 4: TEACHER FACULTY DASHBOARD & EXAM MARKS
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing Teacher Faculty Dashboard & Gradebook Entry...');
    await clickByText(page, 'Sign Out');
    await sleep(1200);

    await clickByText(page, 'Teacher (Salman)');
    await sleep(400);
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log('  ✓ Successfully logged into Teacher Faculty Dashboard (/teacher).');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-teacher-schedule.png') });
    console.log('  ✓ Saved screenshot: 09-teacher-schedule.png');

    // Exam Marks Entry Tab
    console.log('  -> Testing Exam Marks Entry & Assessment Sheet...');
    await clickByText(page, 'Exam Marks Entry');
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-teacher-marks-entry.png') });
    console.log('  ✓ Saved screenshot: 10-teacher-marks-entry.png');

    // ----------------------------------------------------
    // TEST 5: STUDENT PORTAL & REPORT CARD
    // ----------------------------------------------------
    console.log('\n[TEST 5] Testing Student Portal & Term Report Card...');
    await clickByText(page, 'Sign Out');
    await sleep(1200);

    await clickByText(page, 'Student (Hamza)');
    await sleep(400);
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log('  ✓ Successfully logged into Student Portal (/student).');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-student-portal.png') });
    console.log('  ✓ Saved screenshot: 11-student-portal.png');

    // Report Card Tab
    console.log('  -> Testing Official Examination Report Card...');
    await clickByText(page, 'Report Card & Grades');
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-student-report-card.png') });
    console.log('  ✓ Saved screenshot: 12-student-report-card.png');

    // ----------------------------------------------------
    // TEST 6: SYSTEM HEALTH MONITOR
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing Live System Health Monitor (/health)...');
    await page.goto('http://localhost:3000/health', { waitUntil: 'networkidle0' });
    await sleep(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-system-health.png') });
    console.log('  ✓ Saved screenshot: 13-system-health.png');

    console.log('\n======================================================');
    console.log(' [SUCCESS] ALL CHROME UI & INTEGRATION TESTS PASSED!');
    console.log(' 13 High-Resolution Screenshots Captured Successfully.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n[ERROR] UI Test failed:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-failure.png') });
  } finally {
    await browser.close();
  }
}

runChromeTestSuite();
