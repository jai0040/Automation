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
    this.menuStudent = page.getByText('Student', { exact: true }).first();            // VERIFY
    this.menuStudentMaster = page.getByText('Student Master', { exact: true }).first(); // VERIFY
    this.addStudentButton = page.getByText('Add Student', { exact: true }).first();    // only on grid screen
    this.studentReportsButton = page.getByText('Student Reports', { exact: true });
    this.exportToExcel = page.getByText('Export to Excel');
    this.printSetting = page.getByText('Print Setting');
    this.filterPlaceholder = page.getByText('Select Class', { exact: true });          // VERIFY
    this.searchButton = page.locator('button:has([class*="search"]), a:has([class*="search"])').first(); // VERIFY
  }

  row(text) {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  /** Dashboard → Student → Student Master, exactly like the recorded flow. */
  async open() {
    await this.page.goto('/Dashboard/Index', { waitUntil: 'domcontentloaded' });
    if (!(await this.menuStudentMaster.isVisible())) await this.menuStudent.click(); // expand menu
    await this.menuStudentMaster.click();
    await expect(this.addStudentButton).toBeVisible();
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
