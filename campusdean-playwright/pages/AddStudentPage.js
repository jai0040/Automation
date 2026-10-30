const { expect } = require('@playwright/test');
const env = require('../config/env');
const { student: studentData } = require('../utils/testData');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stamp = () => String(Date.now()).slice(-8);

/**
 * Page Object: Student Master → Add Student (Create form: Personal / Contact / Parent-Guardian / Administrative).
 * Locators were inferred from a screen recording (floating-label inputs, custom dropdowns) – see VERIFY notes.
 */
class AddStudentPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.saveButton = this.button('Save');
    this.saveAndAddButton = this.button('Save & Add');
    this.cancelButton = this.button('Cancel');
    this.seatingCapacity = page.getByText(/Seating Capacity/i).first();
    this.dobAgeText = page.getByText(/as of today/i).first();
    this.dobRequiredMessage = page.getByText(studentData.messages.dobRequired);
    this.smsRequiredMessage = page.getByText(studentData.messages.smsRequired).first();
    this.smsCheckbox = page.getByLabel(/SMS to be send/i).first();
    this.sameAsCurrentCheckbox = page.getByLabel(/Same As Current Address/i);
    this.newAdmissionCheckbox = page.getByLabel(/Is New Admission/i);
    this.addedInSessionTag = page.getByText(/This Student is added in/i);
  }

  button(name) {
    return this.page.getByRole('button', { name, exact: true }).or(this.page.getByText(name, { exact: true })).first();
  }

  tab(name) {
    return this.page.getByText(name, { exact: true }).first();
  }

  /** Input found by its floating label; nth picks e.g. Current (0) vs Permanent (1) address. */
  field(label, { nth = 0, exact = false } = {}) {
    const byLabel = this.page.getByLabel(label, { exact }).nth(nth);
    const byXpath = this.page.locator(
      `xpath=(//*[self::label or self::span][starts-with(normalize-space(.),"${label}")]` +
        `/following::input[not(@type="hidden")][1])[${nth + 1}]`
    );
    return byLabel.or(byXpath).first();
  }

  /** Custom dropdown: click the text it currently shows ("Select Gender"), then the option. */
  async pickDropdown(currentText, option) {
    await this.page.getByText(currentText, { exact: true }).first().click();
    await this.page
      .getByRole('option', { name: option, exact: true })
      .or(this.page.locator('li, .k-item, .dropdown-item').filter({ hasText: new RegExp(`^\\s*${esc(option)}\\s*$`) }))
      .first()
      .click();
  }

  /** Builds a unique student; defaults come from utils/testData + .env (course/division). */
  static newStudent(overrides = {}) {
    const d = {
      gr: '',
      course: env.studentCourse,
      division: env.studentDivision,
      first: studentData.namePrefix,
      middle: studentData.defaults.middle,
      last: `T${stamp()}`,
      gender: studentData.defaults.gender,
      dob: studentData.defaults.dob,
      mobile: studentData.defaults.mobile,
      sms: true,
      ...overrides,
    };
    d.fullName = [d.first, d.middle, d.last].filter(Boolean).join(' ');
    return d;
  }

  async expectLoaded() {
    await expect(this.tab('Parent/Guardian Details')).toBeVisible();
  }

  async chooseCourseAndDivision(course, division) {
    await this.pickDropdown('Select Standard', course); // Course/Program shows "Select Standard"
    await expect(this.page.getByText('Loading...', { exact: true })).toBeHidden({ timeout: 15000 }).catch(() => {});
    // In the recording Division auto-selected "A"; pick only if the placeholder is still shown.
    if (await this.page.getByText('Select Division', { exact: true }).isVisible().catch(() => false)) {
      await this.pickDropdown('Select Division', division);
    }
    await expect(this.seatingCapacity).toBeVisible();
  }

  async readCapacity() {
    const txt = await this.seatingCapacity.innerText();
    const m = txt.match(/(\d+)\s*\(filled\)\s*\/\s*(\d+)/i);
    if (!m) throw new Error(`Unexpected seating-capacity text: "${txt}"`);
    return { filled: Number(m[1]), total: Number(m[2]) };
  }

  async fillPersonal(d) {
    if (d.gr) {
      const gr = this.field('GR No.');
      await gr.click();
      await gr.pressSequentially(d.gr, { delay: 20 });
    }
    await this.chooseCourseAndDivision(d.course, d.division);
    if (d.first) await this.field('First Name').fill(d.first);
    if (d.middle) await this.field('Middle Name').fill(d.middle);
    if (d.last) await this.field('Last Name').fill(d.last);
    if (d.gender) await this.pickDropdown('Select Gender', d.gender);
    if (d.dob) await this.setDob(d.dob);
  }

  async setDob(dob) {
    const input = this.field('Date Of Birth');
    await input.fill(dob);
    await input.press('Tab');
  }

  async fillContact(d) {
    await this.tab('Contact').click();
    if (d.mobile) {
      const m = this.field('Mobile No.'); // pre-filled with "+91-"
      await m.click();
      await m.press('End');
      await m.pressSequentially(d.mobile, { delay: 20 });
    }
    if (d.sms) {
      if (await this.smsCheckbox.count()) await this.smsCheckbox.check({ force: true });
      else await this.page.getByText(/SMS to be send on this number/i).first().click();
    }
  }

  /** Fills Personal + Contact; clicks Save unless { save:false }. Returns the data used. */
  async createStudent(overrides = {}, { save = true } = {}) {
    const d = AddStudentPage.newStudent(overrides);
    await this.fillPersonal(d);
    await this.fillContact(d);
    if (save) await this.saveButton.click();
    return d;
  }

  async expectStillOnForm() {
    await this.page.waitForLoadState('networkidle');
    await this.expectLoaded();
    await expect(this.page.getByText('Add Student', { exact: true }).first()).toBeHidden();
  }

  /** Same age arithmetic the screen shows: years / months / days. */
  static ageBetween([dy, dm, dd], [ry, rm, rd]) {
    let y = ry - dy, m = rm - dm, d = rd - dd;
    if (d < 0) { m -= 1; d += new Date(ry, rm, 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    return { y, m, d };
  }
}

module.exports = AddStudentPage;
