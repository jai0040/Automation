/**
 * CampusDean – Student Management → Student Master → Add Student
 * Test IDs match the Excel sheet "CampusDean_StudentMaster_AddStudent_TestCases.xlsx".
 *
 * Preconditions: logged-in Admin (see tests/auth.setup.js); STUDENT_COURSE / STUDENT_DIVISION
 * from .env exist and have free seats.
 */
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const env = require('../config/env');
const LoginPage = require('../pages/LoginPage');
const StudentMasterPage = require('../pages/StudentMasterPage');
const AddStudentPage = require('../pages/AddStudentPage');
const { student: studentData } = require('../utils/testData');

const stamp = () => String(Date.now()).slice(-8);

// One file = one worker, tests in order (students share Admission ID / Roll No. / seat counts).
test.describe.configure({ mode: 'default' });

/** Students created during a test; removed again in afterEach (best effort). */
let created = [];
const track = (d) => { created.push(d); return d; };

test.afterEach(async ({ page }) => {
  const grid = new StudentMasterPage(page);
  while (created.length) {
    const d = created.pop();
    try { await grid.deleteStudent(d); }
    catch (e) { console.warn(`[cleanup] could not delete "${d.fullName}" – remove manually. ${e.message}`); }
  }
});

/* ============================================================ GRID */
test.describe('Student Master – grid', () => {
  let grid, form;
  test.beforeEach(async ({ page }) => {
    grid = new StudentMasterPage(page);
    form = new AddStudentPage(page);
    await grid.open();
  });

  test('TC_001 – Student Master opens with filter, toolbar and grid headers @smoke', async ({ page }) => {
    await expect(grid.addStudentButton).toBeVisible();
    await expect(grid.studentReportsButton).toBeVisible();
    await expect(grid.exportToExcel).toBeVisible();
    await expect(grid.printSetting).toBeVisible();
    for (const h of [/roll no/i, /student name/i, /standard/i, /division/i, /city/i, /mobile no/i, /gr no/i, /actions/i]) {
      await expect(page.getByText(h).first()).toBeVisible();
    }
  });

  test('TC_008 – Export to Excel downloads a non-empty .xlsx', async ({ page }) => {
    await grid.addStudentButton.click();
    track(await form.createStudent());
    await grid.expectOnGrid();

    const [download] = await Promise.all([page.waitForEvent('download'), grid.exportToExcel.click()]);
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
    expect(fs.statSync(await download.path()).size).toBeGreaterThan(0);
  });
});

/* ====================================================== ADD STUDENT */
test.describe('Add Student – form', () => {
  let grid, form;
  test.beforeEach(async ({ page }) => {
    grid = new StudentMasterPage(page);
    form = new AddStudentPage(page);
    await grid.open();
    await grid.addStudentButton.click();
    await form.expectLoaded();
  });

  test('TC_011 – Create form loads with correct defaults @smoke', async ({ page }) => {
    for (const t of ['Personal', 'Contact', 'Parent/Guardian Details', 'Administrative']) {
      await expect(form.tab(t)).toBeVisible();
    }
    await expect(form.field('Admission ID')).toHaveValue(/\d+/);
    const today = await page.evaluate(() => new Date().toLocaleDateString('en-GB')); // dd/mm/yyyy
    await expect(form.field('Admission Date')).toHaveValue(today);
    await expect(form.addedInSessionTag).toBeVisible();
    await expect(form.newAdmissionCheckbox).not.toBeChecked();
  });

  test('TC_013 – Cancel returns to the grid and creates nothing', async () => {
    await form.field('First Name').fill('ShouldNotBeSaved');
    await form.cancelButton.click();
    await grid.expectOnGrid();
    await expect(grid.row('ShouldNotBeSaved')).toHaveCount(0);
  });

  test('TC_014 – Create student with mandatory fields only (recorded flow) @smoke', async () => {
    const d = track(await form.createStudent({ gr: `9${stamp().slice(-6)}` }));
    const row = await grid.expectStudentListed(d);
    await expect(row).toContainText(env.studentCourse);
    await expect(row).toContainText(env.studentDivision);
    await expect(row).toContainText(`+91-${d.mobile}`);
    await expect(row).toContainText(d.gr);
  });

  test('TC_017 – Save with everything blank is blocked', async () => {
    await form.saveButton.click();
    await form.expectStillOnForm();
    await expect(form.dobRequiredMessage).toBeVisible();
  });

  test('TC_018 – DOB blank shows "Enter Date of Birth"', async () => {
    track(await form.createStudent({ dob: '' }));
    await form.expectStillOnForm();
    await form.tab('Personal').click();
    await expect(form.dobRequiredMessage).toBeVisible();
  });

  for (const [id, label, override] of [
    ['TC_019', 'First Name', { first: '' }],
    ['TC_020', 'Gender', { gender: '' }],
    ['TC_022', 'Mobile No.', { mobile: '', sms: false }],
  ]) {
    test(`${id} – missing ${label} blocks Save`, async () => {
      track(await form.createStudent(override));
      await form.expectStillOnForm();
    });
  }

  test('TC_024 – Seating capacity label is shown for the selected division', async () => {
    await form.chooseCourseAndDivision(env.studentCourse, env.studentDivision);
    const { filled, total } = await form.readCapacity();
    expect(total).toBeGreaterThan(0);
    expect(filled).toBeLessThanOrEqual(total);
  });

  test('TC_034 – XSS payload in Last Name is not executed', async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', async (dlg) => { dialogSeen = true; await dlg.dismiss(); });

    track(await form.createStudent({ last: `<img src=x onerror=window.__xss=1>${stamp()}` }));
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialogSeen).toBe(false);
  });

  test('TC_037 – Age text is calculated correctly (today and at admission date)', async ({ page }) => {
    const dob = studentData.defaults.dob;
    await form.chooseCourseAndDivision(env.studentCourse, env.studentDivision);
    await form.setDob(dob);

    const text = await form.dobAgeText.innerText();
    const m = text.match(/as of today\s*-\s*(\d+)\s*years?,\s*(\d+)\s*months?,\s*and\s*(\d+)\s*days?\s*old/i);
    expect(m, `age text not found in: ${text}`).not.toBeNull();

    const [dd, mm, yyyy] = dob.split('/').map(Number);
    const now = await page.evaluate(() => { const n = new Date(); return [n.getFullYear(), n.getMonth(), n.getDate()]; });
    const exp = AddStudentPage.ageBetween([yyyy, mm - 1, dd], now);
    expect([Number(m[1]), Number(m[2]), Number(m[3])]).toEqual([exp.y, exp.m, exp.d]);
  });

  test('TC_039 – Future DOB is rejected', async ({ page }) => {
    const tomorrow = await page.evaluate(() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toLocaleDateString('en-GB'); });
    track(await form.createStudent({ dob: tomorrow }));
    await form.expectStillOnForm();
  });

  // Rule assumed: Indian mobile = 10 digits starting 6-9. Confirm with BA.
  for (const { value, why } of studentData.invalidMobiles) {
    test(`TC_059 – invalid mobile: ${why}`, async () => {
      const d = AddStudentPage.newStudent({ mobile: value });
      await form.fillPersonal(d);
      await form.fillContact(d);

      // The field may sanitise input (strip letters / cut at 10 digits) – judge what it really holds.
      const shown = (await form.field('Mobile No.').inputValue()).replace(/\D/g, '').replace(/^91/, '');
      test.skip(/^[6-9]\d{9}$/.test(shown), `Field normalised "${value}" to a valid number (${shown})`);

      track(d);
      await form.saveButton.click();
      await form.expectStillOnForm();
    });
  }

  test('TC_060 – SMS rule: mobile without SMS tick shows message; ticking clears it', async () => {
    const d = AddStudentPage.newStudent();
    await form.fillPersonal(d);
    await form.fillContact({ ...d, sms: false });
    await form.saveButton.click();

    await expect(form.smsRequiredMessage).toBeVisible();
    await form.smsCheckbox.check({ force: true });
    await expect(form.smsRequiredMessage).toBeHidden();

    track(d);
    await form.saveButton.click();
    await grid.expectStudentListed(d);
  });

  test('TC_063 – "Same As Current Address" copies the current address', async () => {
    await form.fillPersonal(AddStudentPage.newStudent());
    await form.tab('Contact').click();

    await form.field('Pincode', { nth: 0 }).fill('380001');
    await form.field('Address', { nth: 0, exact: true }).fill('12 Test Road');
    await form.sameAsCurrentCheckbox.check({ force: true });

    await expect(form.field('Pincode', { nth: 1 })).toHaveValue('380001');
    await expect(form.field('Address', { nth: 1, exact: true })).toHaveValue('12 Test Road');
  });

  test('TC_074 – Double-clicking Save creates exactly one student', async () => {
    const d = track(await form.createStudent({}, { save: false }));
    await form.saveButton.dblclick();
    await grid.expectOnGrid();
    await grid.filterBy(d.course, d.division);
    await expect(grid.row(d.fullName)).toHaveCount(1);
  });
});

/* ====================================================== DATA RULES */
test.describe('Add Student – data rules', () => {
  let grid, form;
  test.beforeEach(async ({ page }) => {
    grid = new StudentMasterPage(page);
    form = new AddStudentPage(page);
    await grid.open();
    await grid.addStudentButton.click();
    await form.expectLoaded();
  });

  test('TC_025 – Seating-capacity "filled" count increases by 1 after saving', async () => {
    await form.chooseCourseAndDivision(env.studentCourse, env.studentDivision);
    const before = await form.readCapacity();
    await form.cancelButton.click();
    await grid.expectOnGrid();

    await grid.addStudentButton.click();
    track(await form.createStudent());
    await grid.expectOnGrid();

    await grid.addStudentButton.click();
    await form.chooseCourseAndDivision(env.studentCourse, env.studentDivision);
    const after = await form.readCapacity();
    expect(after.filled).toBe(before.filled + 1);
  });

  test('TC_028 – Duplicate GR No. is rejected', async () => {
    const gr = `8${stamp().slice(-6)}`;
    track(await form.createStudent({ gr }));
    await grid.expectOnGrid();

    await grid.addStudentButton.click();
    track(await form.createStudent({ gr, first: 'Dup', last: `T${stamp()}` }));
    await expect(form.page.getByText(studentData.messages.duplicate).first()).toBeVisible();
    await form.expectStillOnForm();
  });

  test('TC_068 – Saved data persists in Edit mode', async ({ page }) => {
    const d = track(await form.createStudent());
    const row = await grid.expectStudentListed(d);

    await row.locator('[title*="Edit" i], [class*="pencil"], [class*="edit"]').first().click();
    await form.expectLoaded();
    await expect(form.field('First Name')).toHaveValue(d.first);
    await expect(form.field('Middle Name')).toHaveValue(d.middle);
    await expect(form.field('Last Name')).toHaveValue(d.last);
    await expect(form.field('Date Of Birth')).toHaveValue(d.dob);
    await form.tab('Contact').click();
    await expect(form.field('Mobile No.')).toHaveValue(new RegExp(d.mobile));
  });
});

/* ====================================================== PERMISSIONS */
test.describe('Permissions', () => {
  test('TC_081 – View-only user cannot see "Add Student"', async ({ browser }) => {
    test.skip(!env.viewOnlyUsername, 'Set VIEWONLY_USERNAME / VIEWONLY_PASSWORD in .env to run this test');

    const ctx = await browser.newContext({ storageState: undefined, baseURL: env.baseUrl });
    const page = await ctx.newPage();
    try {
      const login = new LoginPage(page);
      await login.gotoLoginPage();
      await login.login(env.viewOnlyUsername, env.viewOnlyPassword);
      await page.waitForURL(/Dashboard/i, { timeout: 30000 });

      const grid = new StudentMasterPage(page);
      await grid.menuStudent.click();
      await grid.menuStudentMaster.click();
      await expect(page.getByText(/student master/i).first()).toBeVisible();
      await expect(grid.addStudentButton).toBeHidden();
    } finally {
      await ctx.close();
    }
  });
});
