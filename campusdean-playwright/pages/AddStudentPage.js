const path = require('path');
const { expect } = require('@playwright/test');
const env = require('../config/env');
const { student: studentData } = require('../utils/testData');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stamp = () => String(Date.now()).slice(-8);

/**
 * Direct ID lookup dictionary matching the live CampusDean DOM.
 */
const FIELD_IDS = {
  'Admission ID': '#AdmissionID',
  'GR No.': '#GRNo',
  'First Name': '#FirstName',
  'Middle Name': '#MiddleName',
  'Last Name': '#LastName',
  'Date of Birth': '#strBirthDate',
  'Date Of Birth': '#strBirthDate',
  'Admission Date': '#strAdmissionDate',
  'Place of Birth': '#BirthPlace',
  'Bank Name': '#BankName',
  'Branch Name': '#BankBranchName',
  'IFSC Code': '#IFSCcode',
  'Account Number': '#BankAccountNumber',
  'Account Holder Name': '#BankAccountHolderName',
  'U-DISE Code': '#UDISECode',
  'Aadhar No.': '#AadharNo',
  'PEN': '#PEN',
  'ABHA Number': '#ABHANumber',
  'APAAR ID': '#APAARID',
  'Father Name': '#FatherName',
  'Mother Name': '#MotherName',
  'Total Family Members': '#TotalFamilyMembers',
  'Annual Family Income': '#AnnualFamilyIncome',
  'Roll No.': '#RollNo',
  'Student Code': '#StudentCode',
  'Exam Seat No.': '#ExamSeatNo',
  'Last School Name': '#LastSchoolName',
  'School Board': '#SchoolBoard',
  'percentage': '#Percentage',
};

/**
 * Page Object: Student Master → Add Student
 */
class AddStudentPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Core buttons
    this.saveButton = page.locator('#btnSaveStudent');
    this.saveAndAddButton = page.locator('#btnSaveandaddStudent');
    this.cancelButton = page.locator('a.cancl, a[onclick*="CreateCancel"], .das-btn-cancle').first();

    // Indicators & Validation Messages
    this.seatingCapacity = page.getByText(/Seating Capacity/i).first();
    this.dobAgeText = page.getByText(/as of today/i).first();
    this.dobRequiredMessage = page.getByText(studentData.messages.dobRequired);
    this.smsRequiredMessage = page.getByText(studentData.messages.smsRequired).first();

    // Key interactive checkboxes
    this.smsCheckbox = page.locator('#CurAddressIsSmsSend');
    this.sameAsCurrentCheckbox = page.locator('#chkCopyContact_CurrentToPermanentAddress');
    this.newAdmissionCheckbox = page.locator('#IsNewAdmission');
    this.addedInSessionTag = page.getByText(/This Student is added in/i);
  }

  button(name) {
    return this.page
      .locator(`button[value="${name}"], input[value="${name}"]`)
      .or(this.page.getByRole('button', { name, exact: true }))
      .or(this.page.locator('button, a.btn, input.btn').filter({ hasText: new RegExp(`^\\s*${esc(name)}\\s*$`, 'i') }))
      .first();
  }

  /**
   * Tab switcher targeting the tab anchor links directly by href or text.
   */
  tab(name) {
    const hrefMap = {
      Personal: '#personal',
      Contact: '#contact',
      'Parent/Guardian Details': '#pgdetails',
      Administrative: '#Administrative',
    };

    if (hrefMap[name]) {
      return this.page
        .locator(`ul.tab-nav a[href="${hrefMap[name]}"], a[href="${hrefMap[name]}"]`)
        .or(this.page.getByRole('link', { name: new RegExp(`^\\s*${esc(name)}\\s*$`, 'i') }))
        .first();
    }
    return this.page
      .locator('ul.tab-nav a, a[data-toggle="tab"]')
      .filter({ hasText: new RegExp(esc(name), 'i') })
      .or(this.page.getByRole('link', { name: new RegExp(`^\\s*${esc(name)}\\s*$`, 'i') }))
      .first();
  }

  /**
   * Field resolver by exact ID mapping with fallback to locator.
   */
  field(label, { nth = 0, exact = false } = {}) {
    // Current vs Permanent address fields
    if (label === 'Address') {
      return this.page.locator(nth === 0 ? '#CurAddressFullAddress' : '#PermAddressFullAddress');
    }
    if (label === 'Pincode') {
      return this.page.locator(nth === 0 ? '#CurAddressPincode' : '#PermAddressPincode');
    }
    if (label === 'Phone No.' || label === 'Phone') {
      return this.page.locator(nth === 0 ? '#CurAddressPhone' : '#PermAddressPhone');
    }
    if (label === 'Mobile No.') {
      return this.page.locator(nth === 0 ? '#CurAddressMobileNo' : '#PermAddressMobileNo');
    }
    if (label === 'Area') {
      return this.page.locator(nth === 0 ? '#CurAddressArea' : '#PermAddressArea');
    }

    // Direct mapped ID
    if (FIELD_IDS[label]) {
      return this.page.locator(FIELD_IDS[label]).first();
    }

    // Fallbacks
    return this.page
      .getByLabel(label, { exact })
      .nth(nth)
      .or(this.page.locator(`input[id*="${label.replace(/\s+/g, '')}" i]`))
      .first();
  }

  /**
   * Bootstrap-Select dropdown picker targeting the parent container and option link.
   */
  async pickDropdown(selectIdOrLabel, option) {
    if (!option) return;

    // Locate the bootstrap-select container
    const container = this.page
      .locator(`.btn-group.bootstrap-select:has(#${selectIdOrLabel})`)
      .or(this.page.locator(`.btn-group.bootstrap-select:has(button[data-id*="${selectIdOrLabel}" i])`))
      .or(this.page.locator('.btn-group.bootstrap-select').filter({ hasText: new RegExp(esc(selectIdOrLabel), 'i') }))
      .first();

    if (await container.isVisible().catch(() => false)) {
      const toggleBtn = container.locator('button.dropdown-toggle').first();
      await toggleBtn.click();
      await this.page.waitForTimeout(300);

      const optionItem = container
        .locator('.dropdown-menu li a')
        .filter({ hasText: new RegExp(`^\\s*${esc(option)}\\s*$`, 'i') })
        .first();

      if (await optionItem.isVisible().catch(() => false)) {
        await optionItem.click();
        await this.page.waitForTimeout(200);
        return;
      }
    }

    // Native select fallback
    const selectElem = this.page.locator(`select#${selectIdOrLabel}, select[name*="${selectIdOrLabel}" i]`).first();
    if (await selectElem.count()) {
      await selectElem.selectOption({ label: option }).catch(() => selectElem.selectOption(option)).catch(() => {});
    }
  }

  async setCheckbox(checkboxLocator, checked = true) {
    const isChecked = await checkboxLocator.isChecked().catch(() => false);
    if (isChecked !== checked) {
      await checkboxLocator.click({ force: true });
    }
  }

  static newStudent(overrides = {}) {
    const d = {
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
      mobile: studentData.defaults.currentAddress.mobile,
      sms: true,
      currentAddress: { ...studentData.defaults.currentAddress },
      sameAsCurrent: true,
      permanentAddress: { ...studentData.defaults.permanentAddress },
      father: { ...studentData.defaults.father },
      mother: { ...studentData.defaults.mother },
      guardian1: { ...studentData.defaults.guardian1 },
      guardian2: { ...studentData.defaults.guardian2 },
      otherDetails: { ...studentData.defaults.otherDetails },
      administrative: { ...studentData.defaults.administrative },
      bank: { ...studentData.defaults.bank },
      govtIds: { ...studentData.defaults.govtIds },
      ...overrides,
    };
    d.fullName = [d.first, d.middle, d.last].filter(Boolean).join(' ');
    return d;
  }

  async expectLoaded() {
    await expect(this.tab('Personal')).toBeVisible({ timeout: 15000 });
    await expect(this.tab('Parent/Guardian Details')).toBeVisible({ timeout: 15000 });
    await expect(this.saveButton).toBeVisible({ timeout: 15000 });
  }

  /* ============================================================ TAB 1: PERSONAL */

  async chooseCourseAndDivision(course, division) {
    // 1. Select Standard (SchoolStandardID)
    const stdGroup = this.page.locator('.btn-group.bootstrap-select:has(#SchoolStandardID), .btn-group:has(button[data-id="SchoolStandardID"])').first();
    const stdBtn = stdGroup.locator('button').first();

    if (await stdBtn.isVisible().catch(() => false)) {
      const cur = await stdBtn.innerText();
      if (!cur.trim().toLowerCase().includes(course.toLowerCase())) {
        await stdBtn.click();
        const option = stdGroup.locator('.dropdown-menu li a').filter({
          hasText: new RegExp(`^\\s*${esc(course)}\\s*$`, 'i'),
        }).first();
        await expect(option).toBeVisible({ timeout: 10000 });
        await option.click();
      }
    }

    // Wait for division options to update via AJAX
    await expect(this.page.getByText('Loading...', { exact: true })).toBeHidden({ timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(500);

    // 2. Select Division (StandardDivisionID)
    const divGroup = this.page.locator('.btn-group.bootstrap-select:has(#StandardDivisionID), .btn-group:has(button[data-id="StandardDivisionID"])').first();
    const divBtn = divGroup.locator('button').first();

    if (await divBtn.isVisible().catch(() => false)) {
      const cur = await divBtn.innerText();
      if (!cur.trim().toLowerCase().includes(division.toLowerCase())) {
        await divBtn.click();
        const divisionOption = divGroup.locator('.dropdown-menu li a').filter({
          hasText: new RegExp(`^\\s*${esc(division)}\\s*$`, 'i'),
        }).first();
        await expect(divisionOption).toBeVisible({ timeout: 10000 });
        await divisionOption.click();
      }
    }

    await this.page.waitForTimeout(500);
  }

  async readCapacity() {
    await expect(this.seatingCapacity).toBeVisible({ timeout: 10000 });
    const txt = await this.seatingCapacity.innerText();
    const m = txt.match(/(\d+)\s*\(filled\)\s*\/\s*(\d+)/i);
    if (!m) throw new Error(`Unexpected seating-capacity text: "${txt}"`);
    return { filled: Number(m[1]), total: Number(m[2]) };
  }

  async setDob(dob) {
    const input = this.field('Date of Birth');
    await input.fill(dob);
    await input.press('Tab');
  }

  async fillBankDetails(bank = {}) {
    if (bank.bankName) await this.field('Bank Name').fill(bank.bankName).catch(() => {});
    if (bank.branchName) await this.field('Branch Name').fill(bank.branchName).catch(() => {});
    if (bank.ifscCode) await this.field('IFSC Code').fill(bank.ifscCode).catch(() => {});
    if (bank.accountNumber) await this.field('Account Number').fill(bank.accountNumber).catch(() => {});
    if (bank.accountType) await this.pickDropdown('AccountType', bank.accountType).catch(() => {});
    if (bank.accountHolderName) await this.field('Account Holder Name').fill(bank.accountHolderName).catch(() => {});
  }

  async fillGovtIds(ids = {}) {
    if (ids.udiseCode) await this.field('U-DISE Code').fill(ids.udiseCode).catch(() => {});
    if (ids.aadharNo) await this.field('Aadhar No.').fill(ids.aadharNo).catch(() => {});
    if (ids.pen) await this.field('PEN').fill(ids.pen).catch(() => {});
    if (ids.abhaNumber) await this.field('ABHA Number').fill(ids.abhaNumber).catch(() => {});
    if (ids.apaarId) await this.field('APAAR ID').fill(ids.apaarId).catch(() => {});
  }

  async fillDemographics(demo = {}) {
    if (demo.placeOfBirth) await this.field('Place of Birth').fill(demo.placeOfBirth).catch(() => {});
    if (demo.religion) await this.pickDropdown('ReligionID', demo.religion).catch(() => {});
    if (demo.casteCategory) await this.pickDropdown('CastCategoryID', demo.casteCategory).catch(() => {});
    if (demo.nationality) await this.pickDropdown('NationalityID', demo.nationality).catch(() => {});
    if (demo.motherTongue) await this.pickDropdown('MotherTongueID', demo.motherTongue).catch(() => {});
    if (demo.bloodGroup) await this.pickDropdown('BloodGroupID', demo.bloodGroup).catch(() => {});
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
    if (d.gender) await this.pickDropdown('GenderID', d.gender);
    if (d.dob) await this.setDob(d.dob);

    if (d.fillDemographics) {
      await this.fillDemographics(d);
    }
    if (d.fillBank && d.bank) {
      await this.fillBankDetails(d.bank);
    }
    if (d.fillGovtIds && d.govtIds) {
      await this.fillGovtIds(d.govtIds);
    }
  }

  /* ============================================================ TAB 2: CONTACT */

  async fillCurrentAddress(curr = {}) {
    if (curr.address) await this.field('Address', { nth: 0 }).fill(curr.address).catch(() => {});
    if (curr.pincode) await this.field('Pincode', { nth: 0 }).fill(curr.pincode).catch(() => {});
    if (curr.phone) await this.field('Phone No.', { nth: 0 }).fill(curr.phone).catch(() => {});
    if (curr.area) await this.field('Area', { nth: 0 }).fill(curr.area).catch(() => {});

    if (curr.mobile !== undefined) {
      const m = this.field('Mobile No.', { nth: 0 });
      await m.fill(curr.mobile);
    }

    if (curr.sms !== undefined) {
      await this.setCheckbox(this.smsCheckbox, Boolean(curr.sms));
    }
  }

  async fillPermanentAddress(perm = {}, sameAsCurrent = false) {
    if (sameAsCurrent) {
      await this.setCheckbox(this.sameAsCurrentCheckbox, true);
      return;
    }

    if (perm.address) await this.field('Address', { nth: 1 }).fill(perm.address).catch(() => {});
    if (perm.pincode) await this.field('Pincode', { nth: 1 }).fill(perm.pincode).catch(() => {});
    if (perm.phone) await this.field('Phone No.', { nth: 1 }).fill(perm.phone).catch(() => {});
    if (perm.area) await this.field('Area', { nth: 1 }).fill(perm.area).catch(() => {});

    if (perm.mobile !== undefined) {
      const m = this.field('Mobile No.', { nth: 1 });
      await m.fill(perm.mobile);
    }
  }

  async fillContact(d) {
    await this.tab('Contact').click();
    await this.page.waitForTimeout(300);

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
    if (father.name) await this.field('Father Name').fill(father.name).catch(() => {});
    if (father.dob) await this.page.locator('#strFatherBirthDate').fill(father.dob).catch(() => {});
    if (father.organisation) await this.page.locator('#FatherOrganisation').fill(father.organisation).catch(() => {});
    if (father.designation) await this.page.locator('#FatherDesignation').fill(father.designation).catch(() => {});
    if (father.institute) await this.page.locator('#FatherInstitute').fill(father.institute).catch(() => {});
    if (father.aadhar) await this.page.locator('#FatherAadharNo').fill(father.aadhar).catch(() => {});
    if (father.mobile) await this.page.locator('#FatherMobileNo').fill(father.mobile).catch(() => {});
    if (father.sms !== undefined) await this.setCheckbox(this.page.locator('#FatherIsSmsSend'), Boolean(father.sms));
  }

  async fillMotherDetails(mother = {}) {
    if (mother.name) await this.field('Mother Name').fill(mother.name).catch(() => {});
    if (mother.dob) await this.page.locator('#strMotherBirthDate').fill(mother.dob).catch(() => {});
    if (mother.organisation) await this.page.locator('#MotherOrganisation').fill(mother.organisation).catch(() => {});
    if (mother.designation) await this.page.locator('#MotherDesignation').fill(mother.designation).catch(() => {});
    if (mother.institute) await this.page.locator('#MotherInstitute').fill(mother.institute).catch(() => {});
    if (mother.aadhar) await this.page.locator('#MotherAadharNo').fill(mother.aadhar).catch(() => {});
    if (mother.mobile) await this.page.locator('#MotherMobileNo').fill(mother.mobile).catch(() => {});
    if (mother.sms !== undefined) await this.setCheckbox(this.page.locator('#MotherIsSmsSend'), Boolean(mother.sms));

    if (mother.photoPath) {
      const fileInput = this.page.locator('#MotherPhotoFile');
      if (await fileInput.count()) {
        await fileInput.setInputFiles(mother.photoPath).catch(() => {});
      }
    }
  }

  async fillParentGuardian(d) {
    await this.tab('Parent/Guardian Details').click();
    await this.page.waitForTimeout(300);

    if (d.father) await this.fillFatherDetails(d.father);
    if (d.mother) await this.fillMotherDetails(d.mother);

    if (d.otherDetails) {
      const o = d.otherDetails;
      if (o.familyMembers) await this.field('Total Family Members').fill(o.familyMembers).catch(() => {});
      if (o.annualIncome) await this.field('Annual Family Income').fill(o.annualIncome).catch(() => {});
      if (o.isJointFamily) await this.setCheckbox(this.page.locator('#IsJointFamily'), true);
      if (o.isSiblingStudying) await this.setCheckbox(this.page.locator('#IsSibblingStudying'), true);
    }
  }

  /* ============================================================ TAB 4: ADMINISTRATIVE */

  async fillAdministrative(d) {
    await this.tab('Administrative').click();
    await this.page.waitForTimeout(300);

    const admin = d.administrative || {};
    if (admin.rollNo) await this.field('Roll No.').fill(admin.rollNo).catch(() => {});
    if (admin.studentCode) await this.field('Student Code').fill(admin.studentCode).catch(() => {});
    if (admin.examSeatNo) await this.field('Exam Seat No.').fill(admin.examSeatNo).catch(() => {});

    if (admin.isAllowMobileApp !== undefined) {
      await this.setCheckbox(this.page.locator('#IsAllowMobileApp'), admin.isAllowMobileApp === 'Yes');
    }

    if (admin.commuteStay) {
      await this.pickDropdown('StudentCommuteStayID', admin.commuteStay).catch(() => {});
    }

    if (admin.previousSchool) {
      const p = admin.previousSchool;
      if (p.lastSchoolName) await this.field('Last School Name').fill(p.lastSchoolName).catch(() => {});
      if (p.schoolBoard) await this.field('School Board').fill(p.schoolBoard).catch(() => {});
      if (p.percentage) await this.field('percentage').fill(p.percentage).catch(() => {});
    }
  }

  /* ============================================================ WORKFLOW ORCHESTRATOR */

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
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.expectLoaded();
    await expect(this.saveButton).toBeVisible();
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
