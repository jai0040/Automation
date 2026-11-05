const path = require('path');

/**
 * Test data repository for CampusDean automation suite.
 * Contains static datasets, validation messages, and test inputs.
 */
module.exports = {
  // Static UI text expectations
  uiText: {
    heading: 'Login',
    subtitle: 'Enter your details below.',
    usernameLabel: 'User Name',
    passwordLabel: 'Password',
    loginButtonText: 'Log In',
    rememberMeText: 'Remember Me',
    forgotPasswordText: 'Forgot Password?',
    expectedDashboardPath: '/Dashboard/Index',
  },

  // Client-side and server-side validation error messages matching actual page behavior
  validationMessages: {
    emptyUsername: /enter user name/i,
    emptyPassword: /enter password/i,
    usernameTooShort: /between/i,
    passwordTooShort: /between/i,
    invalidUserAlert: /invalid/i,
  },

  // Test credentials and boundary inputs
  invalidCredentials: {
    nonExistentUser: {
      username: 'invalid_qa_user_99999',
      password: 'InvalidPassword#123',
    },
    shortUsername: {
      username: 'ab',
      password: 'ValidPassword123',
    },
    shortPassword: {
      username: 'valid_user_name',
      password: '123',
    },
    specialChars: {
      username: "<script>alert('xss')</script>",
      password: "admin' OR '1'='1",
    },
  },

  // Supported languages in the login page dropdown
  languages: [
    { id: '1', label: 'En', class: 'en-us' },
    { id: '2', label: 'हिंदी', class: 'hi-IN' },
    { id: '3', label: 'ગુજ', class: 'gu-IN' },
    { id: '4', label: 'मराठी', class: 'mr-IN' },
  ],

  // Student Master -> Add Student Comprehensive Dataset
  student: {
    namePrefix: 'Auto',
    defaults: {
      // Personal Tab
      isNewAdmission: false,
      gender: 'Male',
      dob: '25/09/2003',
      middle: 'QA',
      birthDistrict: 'Ahmedabad',
      birthTaluka: 'Daskroi',
      placeOfBirth: 'Ahmedabad',
      birthState: 'Gujarat',
      religion: 'Hindu',
      caste: 'General',
      casteCategory: 'General',
      nationality: 'Indian',
      motherTongue: 'Gujarati',
      bloodGroup: 'B+',
      bank: {
        bankName: 'State Bank of India',
        branchName: 'Vastrapur',
        ifscCode: 'SBIN0001234',
        accountNumber: '123456789012',
        accountType: 'Saving',
        accountHolderName: 'Rahul Sharma',
      },
      govtIds: {
        udiseCode: '123456789012345678', // Exactly 18 characters
        aadharNo: '123456789012',         // Exactly 12 characters
        pen: 'PEN12345678',              // Exactly 11 characters
        abhaNumber: '14141414141414',     // Exactly 14 characters
        apaarId: '121212121212',          // Exactly 12 characters
      },

      // Contact Tab
      currentAddress: {
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        address: '101 Campus Residency, Near University',
        pincode: '380015',
        phone: '07926880000',
        mobile: '9876543210',
        sms: true,
        area: 'University Area',
      },
      sameAsCurrent: true,
      permanentAddress: {
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        address: '101 Campus Residency, Near University',
        pincode: '380015',
        phone: '07926880000',
        mobile: '9876543210',
        sms: true,
        area: 'University Area',
      },

      // Parent / Guardian Details Tab
      father: {
        name: 'Suresh Sharma',
        dob: '15/05/1975',
        qualification: 'Post Graduate',
        occupation: 'Business',
        organisation: 'Sharma Enterprises',
        designation: 'Director',
        institute: 'Gujarat University',
        aadhar: '987612345678', // Exactly 12 characters
        country: 'India',
        mobile: '9876500001',
        sms: true,
        office: {
          country: 'India',
          state: 'Gujarat',
          city: 'Ahmedabad',
          address: '401 Corporate Park, SG Highway',
          pincode: '380054',
          phone: '07926881111',
          mobile: '9876500002',
          email: 'suresh.office@sharmaent.com',
          website: 'https://sharmaent.com',
        },
      },
      mother: {
        name: 'Sunita Sharma',
        dob: '20/08/1978',
        qualification: 'Graduate',
        occupation: 'Professor',
        organisation: 'City College',
        designation: 'Associate Professor',
        institute: 'Delhi University',
        aadhar: '876543210987', // Exactly 12 characters
        country: 'India',
        mobile: '9876500003',
        sms: true,
        photoPath: path.resolve(__dirname, '..', 'fixtures', 'valid-photo.jpg'),
        office: {
          country: 'India',
          state: 'Gujarat',
          city: 'Ahmedabad',
          address: 'City College Campus, Navrangpura',
          pincode: '380009',
          phone: '07926882222',
          mobile: '9876500004',
          email: 'sunita@citycollege.edu',
          website: 'https://citycollege.edu',
        },
      },
      guardian1: {
        name: 'Ramesh Sharma',
        dob: '10/12/1972',
        relationship: 'Uncle',
        occupation: 'Lawyer',
        aadhar: '765432109876',
        country: 'India',
        email: 'ramesh@sharma-legal.com',
        organisation: 'Sharma & Co',
        officeAddress: 'High Court Road',
        qualification: 'LLB',
        phone: '07926883333',
        mobile: '9876500005',
        sms: false,
        secondaryLanguage: 'English',
        guardian1Name: 'Ramesh Sharma',
        photoPath: path.resolve(__dirname, '..', 'fixtures', 'valid-photo.jpg'),
      },
      guardian2: {
        name: 'Geeta Sharma',
        dob: '05/03/1976',
        relationship: 'Aunt',
        occupation: 'Doctor',
        aadhar: '654321098765',
        country: 'India',
        email: 'geeta@sharmaclinic.com',
        organisation: 'City Hospital',
        officeAddress: 'Ellis Bridge',
        qualification: 'MBBS',
        phone: '07926884444',
        mobile: '9876500006',
        sms: false,
        secondaryLanguage: 'Hindi',
        guardian2Name: 'Geeta Sharma',
        photoPath: path.resolve(__dirname, '..', 'fixtures', 'valid-photo.jpg'),
      },
      otherDetails: {
        familyMembers: '4',
        annualIncome: '850000',
        isJointFamily: true,
        isSiblingStudying: false,
        aadharNumber: '123456789012',
        exArmy: 'No',
        lcDate: '15/06/2026',
      },

      // Administrative Tab
      administrative: {
        rollNo: '1',
        group: 'General',
        activityHouse: 'Red House',
        feesCategory: 'General',
        feeConcessionProfile: 'None',
        admissionStandard: 'Sem - 1',
        studentCode: 'STU2026001',
        examSeatNo: 'EX-99881',
        isAllowMobileApp: 'Yes', // 'Yes' or 'No'
        commuteStay: 'School Bus',
        previousSchool: {
          lastSchoolName: 'Model High School',
          schoolBoard: 'CBSE',
          percentage: '88.50',
        },
      },
    },

    // Repetitive phone numbers strictly forbidden per business rule:
    // "in Mobile No.* user can not enter same repeat number such as 1111111111"
    repetitiveMobiles: [
      { value: '1111111111', why: 'repeated 1s' },
      { value: '2222222222', why: 'repeated 2s' },
      { value: '0000000000', why: 'all zeros' },
      { value: '9999999999', why: 'repeated 9s' },
    ],

    invalidMobiles: [
      { value: '98765', why: 'too short' },
      { value: '98765432101', why: 'too long' },
      { value: 'abcdefghij', why: 'letters' },
      { value: '0000000000', why: 'all zeros' },
      { value: '5123456789', why: 'starts with 5' },
      { value: '1111111111', why: 'repeated digit 1111111111' },
      { value: '2222222222', why: 'repeated digit 2222222222' },
    ],

    // Government ID length constraints
    govtIdLimits: {
      udise: 18,
      aadhar: 12,
      pen: 11,
      abha: 14,
      apaar: 12,
    },

    // Photo upload file assets
    photoFixtures: {
      valid: path.resolve(__dirname, '..', 'fixtures', 'valid-photo.jpg'),
      oversized: path.resolve(__dirname, '..', 'fixtures', 'oversized-photo.jpg'),
      invalidDoc: path.resolve(__dirname, '..', 'fixtures', 'invalid-doc.docx'),
    },

    messages: {
      dobRequired: /enter date of birth/i,
      smsRequired: /select at ?least one/i,
      duplicate: /already|exist|duplicate/i,
      invalidMobile: /invalid|repeat|same/i,
      photoError: /200\s*kb|jpg|jpeg|png/i,
    },
  },
};
