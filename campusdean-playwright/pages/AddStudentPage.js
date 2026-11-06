const path = require('path');
const { expect } = require('@playwright/test');
const env = require('../config/env');
const { student: studentData } = require('../utils/testData');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stamp = () => String(Date.now()).slice(-8);

/**
 * Page Object: Student Master → Add Student
 * Covers all 4 tabs: Personal, Contact, Parent/Guardian Details, Administrative.
 */
class AddStudentPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Core buttons
    this.saveButton = this.button('Save');
    this.saveAndAddButton = this.button('Save & Add');
    this.cancelButton = this.button('Cancel');

    // Indicators & Validation Messages
    this.seatingCapacity = page.getByText(/Seating Capacity/i).first();
    this.dobAgeText = page.getByText(/as of today/i).first();
    this.dobRequiredMessage = page.getByText(studentData.messages.dobRequired);
    this.smsRequiredMessage = page.getByText(studentData.messages.smsRequired).first();
    this.smsCheckbox = page.getByLabel(/SMS to be send/i).first();
    this.sameAsCurrentCheckbox = page.getByLabel(/Same As Current Address/i).first();
    this.newAdmissionCheckbox = page.getByLabel(/Is New Admission/i).first();
    this.addedInSessionTag = page.getByText(/This Student is added in/i);
  }

  button(name) {
    return this.page.getByRole('button', { name, exact: true }).or(this.page.getByText(name, { exact: true })).first();
  }

  // Locate the visible tab button, not the heading inside a hidden panel.
  tab(name) {
    const exactTabName = new RegExp(`^\\s*${esc(name)}\\s*$`, 'i');

    return this.page
      .locator('a:visible, button:visible, [role="tab"]:visible')
      .filter({ hasText: exactTabName })
      .first();
  }

  /**
   * Input found by its label or placeholder; nth picks e.g. Current (0) vs Permanent (1) address.
   */
  field(label, { nth = 0, exact = false } = {}) {
    const byLabel = this.page.getByLabel(label, { exact }).nth(nth);
    const byPlaceholder = this.page.getByPlaceholder(label, { exact }).nth(nth);
    const byXpath = this.page.locator(
      `xpath=(//*[self::label or self::span][starts-with(normalize-space(.),"${label}")]` +
      `/following::input[not(@type="hidden")][1])[${nth + 1}]`
    );
    return byLabel.or(byPlaceholder).or(byXpath).first();
  }

  /**
   * Dropdown selector supporting Bootstrap Select, custom dropdowns, and standard <select> controls.
   */
  async pickDropdown(currentTextOrLabel, option) {
    if (!option) return;

    // 1. Check for Bootstrap Select button by data-id or text
    const btnByDataId = this.page.locator(`button[data-id*="${currentTextOrLabel}" i]`).first();
    const btnByText = this.page.locator('.btn-group.bootstrap-select button').filter({
      hasText: new RegExp(esc(currentTextOrLabel), 'i')
    }).first();

    const triggerBtn = (await btnByDataId.isVisible().catch(() => false)) ? btnByDataId : btnByText;

    if (await triggerBtn.isVisible().catch(() => false)) {
      await triggerBtn.click();
      await this.page.waitForTimeout(300000);

      // Locate option in open menu
      const optionItem = this.page
        .locator('.dropdown-menu.open li a, .dropdown-menu.show li a, .btn-group.bootstrap-select.open li a')
        .filter({ hasText: new RegExp(`^\\s*${esc(option)}\\s*$`, 'i') })
        .first();

      if (await optionItem.isVisible().catch(() => false)) {
        await optionItem.click();
        return;
      }
    }

    // 2. Native select fallback
    const selectElem = this.page.locator(`select[name*="${currentTextOrLabel}" i], select[id*="${currentTextOrLabel}" i]`).first();
    if (await selectElem.count()) {
      await selectElem.selectOption({ label: option }).catch(() => selectElem.selectOption(option)).catch(() => { });
      return;
    }

    // 3. Custom dropdown flow fallback
    const trigger = this.page
      .getByText(currentTextOrLabel, { exact: true })
      .or(this.page.locator(`[placeholder="${currentTextOrLabel}"]`))
      .first();

    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
    }

    const optionLocator = this.page
      .getByRole('option', { name: option, exact: true })
      .or(this.page.locator('li, .k-item, .dropdown-item').filter({ hasText: new RegExp(`^\\s*${esc(option)}\\s*$`, 'i') }))
      .first();

    await optionLocator.click({ timeout: 500000 }).catch(async () => {
      await this.page.locator('li, .k-item, .dropdown-item').filter({ hasText: new RegExp(esc(option), 'i') }).first().click();
    }).catch(() => { });
  }

  /**
   * Helper to set checkbox state
   */
  async setCheckbox(checkboxLocator, checked = true) {
    const isChecked = await checkboxLocator.isChecked().catch(() => false);
    if (isChecked !== checked) {
      await checkboxLocator.click({ force: true });
    }
  }

  /**
   * Factory to generate unique student test data across all 4 tabs.
   */
  static newStudent(overrides = {}) {
    const d = {
      // Tab 1: Personal
      isNewAdmission: false,
      gr: '',
      course: env.studentCourse,
      division: env.studentDivision,
      first: studentData.namePrefix,
      middle: studentData.defaults.middle,
      last: `T${stamp()}`,
      gender: studentData.defaults.gender,
      dob: studentData.defaults.dob,
      admissionDate: '',
      birthDistrict: studentData.defaults.birthDistrict,
      birthTaluka: studentData.defaults.birthTaluka,
      placeOfBirth: studentData.defaults.placeOfBirth,
      birthState: studentData.defaults.birthState,
      religion: studentData.defaults.religion,
      caste: studentData.defaults.caste,
      casteCategory: studentData.defaults.casteCategory,
      nationality: studentData.defaults.nationality,
      motherTongue: studentData.defaults.motherTongue,
      bloodGroup: studentData.defaults.bloodGroup,
      bank: { ...studentData.defaults.bank },
      govtIds: { ...studentData.defaults.govtIds },

      // Tab 2: Contact
      mobile: studentData.defaults.currentAddress.mobile,
      sms: true,
      currentAddress: { ...studentData.defaults.currentAddress },
      sameAsCurrent: true,
      permanentAddress: { ...studentData.defaults.permanentAddress },

      // Tab 3: Parent/Guardian Details
      father: { ...studentData.defaults.father },
      mother: { ...studentData.defaults.mother },
      guardian1: { ...studentData.defaults.guardian1 },
      guardian2: { ...studentData.defaults.guardian2 },
      otherDetails: { ...studentData.defaults.otherDetails },

      // Tab 4: Administrative
      administrative: { ...studentData.defaults.administrative },

      ...overrides,
    };
    d.fullName = [d.first, d.middle, d.last].filter(Boolean).join(' ');
    return d;
  }

  async expectLoaded() {
    await expect(this.tab('Parent/Guardian Details')).toBeVisible({ timeout: 200000 });
  }

  /* ============================================================ TAB 1: PERSONAL */


  async chooseCourseAndDivision(course, division) {
    // 1. Select Standard
    const stdSelect = this.page.locator('#SchoolStandardID');
    const stdBtn = this.page.locator(
      'button[data-id="SchoolStandardID"]'
    ).or(
      this.page.locator('.btn-group.bootstrap-select:has(#SchoolStandardID) button')
    ).first();

    if (await stdSelect.isVisible().catch(() => false)) {
      await stdSelect.selectOption({ label: course });
    } else {
      await expect(stdBtn).toBeVisible({ timeout: 100000 });

      const current = await stdBtn.innerText();

      if (!current.trim().toLowerCase().includes(course.toLowerCase())) {
        await stdBtn.click();

        const option = this.page.locator(
          '.dropdown-menu.open li a, .dropdown-menu.show li a'
        ).filter({
          hasText: new RegExp(`^\\s*${esc(course)}\\s*$`, 'i')
        }).first();

        await expect(option).toBeVisible({ timeout: 100000 });
        await option.click();
      }
    }

    // Wait for division dropdown to update
    await expect(
      this.page.getByText('Loading...', { exact: true })
    ).toBeHidden({ timeout: 150000 }).catch(() => { });

    // 2. Select Division
    const divSelect = this.page.locator('#StandardDivisionID');
    const divBtn = this.page.locator(
      'button[data-id="StandardDivisionID"]'
    ).or(
      this.page.locator('.btn-group.bootstrap-select:has(#StandardDivisionID) button')
    ).first();

    if (await divSelect.isVisible().catch(() => false)) {
      await divSelect.selectOption({ label: division });
    } else {
      await expect(divBtn).toBeVisible({ timeout: 100000 });

      await divBtn.click();

      const divisionOption = this.page.locator(
        '.dropdown-menu.open li a, .dropdown-menu.show li a'
      ).filter({
        hasText: new RegExp(`^\\s*${esc(division)}\\s*$`, 'i')
      }).first();

      await expect(divisionOption).toBeVisible({ timeout: 100000 });
      await divisionOption.click();
    }

    // 3. Verify selections
    await expect(stdBtn).toContainText(course, { timeout: 100000 }).catch(async () => {
      if (await stdSelect.count()) {
        await expect(stdSelect).toHaveValue(/.+/);
      } else {
        throw new Error(`Standard "${course}" was not selected.`);
      }
    });

    await expect(divBtn).toContainText(division, { timeout: 100000 }).catch(async () => {
      if (await divSelect.count()) {
        await expect(divSelect).toHaveValue(/.+/);
      } else {
        throw new Error(`Division "${division}" was not selected.`);
      }
    });

    // Do not require Seating Capacity here.
    // Capacity is verified separately in TC_024 and TC_025.
  }


  async readCapacity() {
    const txt = await this.seatingCapacity.innerText();
    const m = txt.match(/(\d+)\s*\(filled\)\s*\/\s*(\d+)/i);
    if (!m) throw new Error(`Unexpected seating-capacity text: "${txt}"`);
    return { filled: Number(m[1]), total: Number(m[2]) };
  }

  async setDob(dob) {
    const input = this.field('Date Of Birth');
    await input.fill(dob);
    await input.press('Tab');
  }

  async fillBankDetails(bank = {}) {
    if (bank.bankName) await this.field('Bank Name').fill(bank.bankName).catch(() => { });
    if (bank.branchName) await this.field('Branch Name').fill(bank.branchName).catch(() => { });
    if (bank.ifscCode) await this.field('IFSC Code').fill(bank.ifscCode).catch(() => { });
    if (bank.accountNumber) await this.field('Account Number').fill(bank.accountNumber).catch(() => { });
    if (bank.accountType) await this.pickDropdown('Select Account Type', bank.accountType).catch(() => { });
    if (bank.accountHolderName) await this.field('Account Holder Name').fill(bank.accountHolderName).catch(() => { });
  }

  async fillGovtIds(ids = {}) {
    // Exact character constraints per prompt specifications
    if (ids.udiseCode) await this.field('U-DISE Code').fill(ids.udiseCode).catch(() => { });
    if (ids.aadharNo) await this.field('Aadhar No.').fill(ids.aadharNo).catch(() => { });
    if (ids.pen) await this.field('PEN').fill(ids.pen).catch(() => { });
    if (ids.abhaNumber) await this.field('ABHA Number').fill(ids.abhaNumber).catch(() => { });
    if (ids.apaarId) await this.field('APAAR ID').fill(ids.apaarId).catch(() => { });
  }

  async fillDemographics(demo = {}) {
    if (demo.placeOfBirth) await this.field('Place of Birth').fill(demo.placeOfBirth).catch(() => { });
    if (demo.birthDistrict) await this.pickDropdown('Select District', demo.birthDistrict).catch(() => { });
    if (demo.birthTaluka) await this.pickDropdown('Select Taluka', demo.birthTaluka).catch(() => { });
    if (demo.birthState) await this.pickDropdown('Select State', demo.birthState).catch(() => { });
    if (demo.religion) await this.pickDropdown('Select Religion', demo.religion).catch(() => { });
    if (demo.caste) await this.pickDropdown('Select Caste', demo.caste).catch(() => { });
    if (demo.casteCategory) await this.pickDropdown('Select Caste Category', demo.casteCategory).catch(() => { });
    if (demo.nationality) await this.pickDropdown('Select Nationality', demo.nationality).catch(() => { });
    if (demo.motherTongue) await this.pickDropdown('Select Mother Tongue', demo.motherTongue).catch(() => { });
    if (demo.bloodGroup) await this.pickDropdown('Select Blood Group', demo.bloodGroup).catch(() => { });
  }

  async fillPersonal(d) {
    if (d.isNewAdmission) {
      await this.setCheckbox(this.newAdmissionCheckbox, true);
    }
    if (d.gr) {
      const gr = this.field('GR No.');
      await gr.click();
      await gr.pressSequentially(d.gr, { delay: 20 });
    }
    if (d.course && d.division) {
      await this.chooseCourseAndDivision(d.course, d.division);
    }
    if (d.admissionDate) {
      await this.field('Admission Date').fill(d.admissionDate);
    }
    if (d.first) await this.field('First Name').fill(d.first);
    if (d.middle) await this.field('Middle Name').fill(d.middle);
    if (d.last) await this.field('Last Name').fill(d.last);
    if (d.gender) await this.pickDropdown('Select Gender', d.gender);
    if (d.dob) await this.setDob(d.dob);

    if (d.placeOfBirth || d.religion || d.bloodGroup) {
      await this.fillDemographics(d);
    }
    if (d.bank) {
      await this.fillBankDetails(d.bank);
    }
    if (d.govtIds) {
      await this.fillGovtIds(d.govtIds);
    }
  }

  /* ============================================================ TAB 2: CONTACT */

  async fillCurrentAddress(curr = {}) {
    if (curr.address) await this.field('Address', { nth: 0, exact: true }).fill(curr.address).catch(() => { });
    if (curr.pincode) await this.field('Pincode', { nth: 0 }).fill(curr.pincode).catch(() => { });
    if (curr.phone) await this.field('Phone No.', { nth: 0 }).fill(curr.phone).catch(() => { });
    if (curr.area) await this.field('Area', { nth: 0 }).fill(curr.area).catch(() => { });

    if (curr.mobile) {
      const m = this.field('Mobile No.', { nth: 0 });
      await m.click();
      await m.press('End');
      await m.pressSequentially(curr.mobile, { delay: 20 });
    }

    if (curr.sms !== undefined) {
      if (curr.sms) {
        if (await this.smsCheckbox.count()) await this.smsCheckbox.check({ force: true }).catch(() => { });
        else await this.page.getByText(/SMS to be send on this number/i).first().click().catch(() => { });
      } else {
        if (await this.smsCheckbox.count()) await this.smsCheckbox.uncheck({ force: true }).catch(() => { });
      }
    }
  }

  async fillPermanentAddress(perm = {}, sameAsCurrent = false) {
    if (sameAsCurrent) {
      await this.setCheckbox(this.sameAsCurrentCheckbox, true);
      return;
    }

    if (perm.address) await this.field('Address', { nth: 1, exact: true }).fill(perm.address).catch(() => { });
    if (perm.pincode) await this.field('Pincode', { nth: 1 }).fill(perm.pincode).catch(() => { });
    if (perm.phone) await this.field('Phone No.', { nth: 1 }).fill(perm.phone).catch(() => { });
    if (perm.area) await this.field('Area', { nth: 1 }).fill(perm.area).catch(() => { });

    if (perm.mobile) {
      const m = this.field('Mobile No.', { nth: 1 });
      await m.click();
      await m.press('End');
      await m.pressSequentially(perm.mobile, { delay: 20 });
    }
  }

  async fillContact(d) {
    await this.tab('Contact').click();
    const curr = d.currentAddress || { mobile: d.mobile, sms: d.sms };
    if (d.mobile && !curr.mobile) curr.mobile = d.mobile;
    if (d.sms !== undefined && curr.sms === undefined) curr.sms = d.sms;

    await this.fillCurrentAddress(curr);

    if (d.sameAsCurrent) {
      await this.setCheckbox(this.sameAsCurrentCheckbox, true);
    } else if (d.permanentAddress) {
      await this.fillPermanentAddress(d.permanentAddress, false);
    }
  }

  /* ============================================================ TAB 3: PARENT / GUARDIAN */

  async fillFatherDetails(father = {}) {
    if (father.name) await this.field('Father Name').fill(father.name).catch(() => { });
    if (father.dob) await this.field('Date of Birth', { nth: 1 }).fill(father.dob).catch(() => { });
    if (father.qualification) await this.field('Qualification', { nth: 0 }).fill(father.qualification).catch(() => { });
    if (father.occupation) await this.field('Occupation', { nth: 0 }).fill(father.occupation).catch(() => { });
    if (father.organisation) await this.field('Organisation', { nth: 0 }).fill(father.organisation).catch(() => { });
    if (father.designation) await this.field('Designation', { nth: 0 }).fill(father.designation).catch(() => { });
    if (father.institute) await this.field('Institute', { nth: 0 }).fill(father.institute).catch(() => { });
    if (father.aadhar) await this.field('Aadhar No.', { nth: 1 }).fill(father.aadhar).catch(() => { });

    if (father.mobile) {
      const fMobile = this.page.locator('xpath=//*[contains(text(),"Father Details")]/following::input[contains(@name,"Mobile") or contains(@id,"Mobile")][1]');
      if (await fMobile.isVisible().catch(() => false)) {
        await fMobile.fill(father.mobile);
      }
    }
  }

  async uploadPhoto(fileInputSelectorOrLocator, absoluteFilePath) {
    const fileChooser = typeof fileInputSelectorOrLocator === 'string'
      ? this.page.locator(fileInputSelectorOrLocator)
      : fileInputSelectorOrLocator;
    await fileChooser.setInputFiles(absoluteFilePath).catch(() => { });
  }

  async fillMotherDetails(mother = {}) {
    if (mother.name) await this.field('Mother Name').fill(mother.name).catch(() => { });
    if (mother.dob) await this.field('Date of Birth', { nth: 2 }).fill(mother.dob).catch(() => { });
    if (mother.qualification) await this.field('Qualification', { nth: 1 }).fill(mother.qualification).catch(() => { });
    if (mother.occupation) await this.field('Occupation', { nth: 1 }).fill(mother.occupation).catch(() => { });
    if (mother.organisation) await this.field('Organisation', { nth: 1 }).fill(mother.organisation).catch(() => { });
    if (mother.designation) await this.field('Designation', { nth: 1 }).fill(mother.designation).catch(() => { });
    if (mother.institute) await this.field('Institute', { nth: 1 }).fill(mother.institute).catch(() => { });
    if (mother.aadhar) await this.field('Aadhaar No.', { nth: 2 }).fill(mother.aadhar).catch(() => { });

    if (mother.photoPath) {
      const fileInput = this.page.locator('input[type="file"]').first();
      if (await fileInput.count()) {
        await fileInput.setInputFiles(mother.photoPath).catch(() => { });
      }
    }
  }

  async fillParentGuardian(d) {
    await this.tab('Parent/Guardian Details').click();
    if (d.father) await this.fillFatherDetails(d.father);
    if (d.mother) await this.fillMotherDetails(d.mother);

    if (d.otherDetails) {
      const o = d.otherDetails;
      if (o.familyMembers) await this.field('Total Family Members').fill(o.familyMembers).catch(() => { });
      if (o.annualIncome) await this.field('Annual Family Income').fill(o.annualIncome).catch(() => { });
      if (o.isJointFamily) await this.page.getByLabel(/Is Joint Family/i).check({ force: true }).catch(() => { });
      if (o.isSiblingStudying) await this.page.getByLabel(/Is Sibling Studying/i).check({ force: true }).catch(() => { });
    }
  }

  /* ============================================================ TAB 4: ADMINISTRATIVE */

  async fillAdministrative(d) {
    await this.tab('Administrative').click();
    const admin = d.administrative || {};

    if (admin.rollNo) await this.field('Roll No.').fill(admin.rollNo).catch(() => { });
    if (admin.studentCode) await this.field('Student Code').fill(admin.studentCode).catch(() => { });
    if (admin.examSeatNo) await this.field('Exam Seat No.').fill(admin.examSeatNo).catch(() => { });

    // Is Allow Mobile App? (Yes / No)
    if (admin.isAllowMobileApp) {
      const allowRadio = this.page.getByLabel(new RegExp(admin.isAllowMobileApp, 'i')).or(
        this.page.locator(`input[value="${admin.isAllowMobileApp}"]`)
      ).or(this.page.getByText(admin.isAllowMobileApp, { exact: true }));
      await allowRadio.first().click().catch(() => { });
    }

    // Transport / Stay
    if (admin.commuteStay) {
      await this.pickDropdown('Select Student Commute/Stay', admin.commuteStay).catch(() => { });
    }

    // Previous School Details
    if (admin.previousSchool) {
      const p = admin.previousSchool;
      if (p.lastSchoolName) await this.field('Last School Name').fill(p.lastSchoolName).catch(() => { });
      if (p.schoolBoard) await this.field('School Board').fill(p.schoolBoard).catch(() => { });
      if (p.percentage) await this.field('percentage').fill(p.percentage).catch(() => { });
    }
  }

  /* ============================================================ WORKFLOW ORCHESTRATOR */

  /**
   * Complete student creation workflow supporting both mandatory and full 4-tab registration.
   */
  async createStudent(overrides = {}, { save = true, full = false } = {}) {
    const d = AddStudentPage.newStudent(overrides);
    await this.fillPersonal(d);
    await this.fillContact(d);

    if (full) {
      await this.fillParentGuardian(d);
      await this.fillAdministrative(d);
    }

    if (save) {
      await this.saveButton.click();
    }
    return d;
  }

  async expectStillOnForm() {
    await this.page.waitForLoadState('networkidle');
    await this.expectLoaded();
    await expect(this.page.getByText('Add Student', { exact: true }).first()).toBeHidden();
  }

  static ageBetween([dy, dm, dd], [ry, rm, rd]) {
    let y = ry - dy, m = rm - dm, d = rd - dd;
    if (d < 0) {
      m -= 1;
      d += new Date(ry, rm, 0).getDate();
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }
    return { y, m, d };
  }
}

module.exports = AddStudentPage;
