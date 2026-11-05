const { expect } = require('@playwright/test');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Page Object: Student → Student Master (grid screen).
 * NOTE: the app is an SPA – URL stays /Dashboard/Index – so we assert on visible UI.
 * Locators marked VERIFY were inferred from a screen recording; confirm with `npx playwright codegen`.
 */
class StudentMasterPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // Target the sidebar link explicitly to avoid hidden <h3> or dashboard widgets
    const sidebar = page.locator('aside.main-sidebar, aside, [role="complementary"]');
    this.menuStudent = sidebar
      .locator('a')
      .filter({ hasText: /Student/ })
      .filter({ hasNotText: /Import|Batch|Inquiry|Attendance|Master|Update|Homework|LC|Transfer|Leave|Alumni|Diary|Document|Fees|Details|Hostel|Issue|Class/ })
      .first();

    this.menuStudentMaster = sidebar
      .locator('a.Cl_StudentMasterIndex, a[url="/StudentMaster/Index"]')
      .or(sidebar.locator('a').filter({ hasText: /^Student Master$/i }))
      .first();

    this.addStudentButton = page
      .getByRole('button', { name: /Add Student/i })
      .or(page.getByRole('link', { name: /Add Student/i }))
      .or(page.getByText(/Add Student/))
      .first();

    this.studentReportsButton = page
      .getByRole('button', { name: /Student Reports/i })
      .or(page.getByRole('link', { name: /Student Reports/i }))
      .or(page.getByText(/Student Reports/))
      .first();

    this.exportToExcel = page.getByText('Export to Excel').first();
    this.printSetting = page.getByText('Print Setting').first();
    this.filterPlaceholder = page.getByText('Select Class', { exact: true }).first();
    this.searchButton = page.locator('button:has([class*="search"]), a:has([class*="search"])').first();
  }

  row(text) {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  /** Dashboard → Student → Student Master, exactly like the recorded flow. */
  async open() {
    await this.page.goto('/Dashboard/Index', { waitUntil: 'domcontentloaded' });
    if (await this.addStudentButton.isVisible().catch(() => false)) {
      return;
    }
    if (!(await this.menuStudentMaster.isVisible().catch(() => false))) {
      await expect(this.menuStudent).toBeVisible({ timeout: 10000 });
      await this.menuStudent.click();
      await expect(this.menuStudentMaster).toBeVisible({ timeout: 10000 });
    }
    await this.menuStudentMaster.click();
    await expect(this.addStudentButton).toBeVisible({ timeout: 30000 });
  }

  /** Mandatory "Course/Program/ Division" filter. Skipped if a filter chip is already applied. */
  async filterBy(course, division) {
    if (await this.filterPlaceholder.isVisible().catch(() => false)) {
      await this.filterPlaceholder.click();
      await this.page.getByText(new RegExp(`${esc(course)}\\s*>\\s*${esc(division)}`)).first().click();
      await this.searchButton.click();
    }
  }

  async expectOnGrid(timeout = 30000) {
    await expect(this.addStudentButton).toBeVisible({ timeout });
  }

  /** After a save the app returns to the grid (filter auto-applied in the recording). */
  async expectStudentListed(student) {
    await this.expectOnGrid();
    const row = this.row(student.fullName);
    if (!(await row.first().isVisible().catch(() => false))) {
      await this.filterBy(student.course, student.division);
    }
    await expect(row).toHaveCount(1);
    return row;
  }

  async deleteStudent(student) {
    await this.open();
    await this.filterBy(student.course, student.division);
    const row = this.row(student.fullName);
    if (!(await row.count())) return;
    await row.locator('[title*="Delete" i], [class*="trash"], [class*="delete"]').first().click();
    await this.page.getByRole('button', { name: /yes|ok|confirm|delete/i }).first().click();
    await expect(row).toHaveCount(0);
  }
}

module.exports = StudentMasterPage;
