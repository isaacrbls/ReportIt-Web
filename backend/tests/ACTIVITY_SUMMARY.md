# Activity 6: Functional Testing - Summary

## ✅ What Has Been Created

### 1. Test Documentation
- **FUNCTIONAL_TEST_PLAN.md** - Comprehensive test plan with 95 test cases
- **functional_test_scenarios.csv** - Test cases in CSV format (matches sample format)
- **README.md** - Complete documentation with setup and troubleshooting
- **QUICK_START.md** - Quick reference guide for students

### 2. Test Framework
- **base_test.py** - Base test configuration with utility methods
  - Selenium WebDriver setup
  - Common test utilities
  - Screenshot capture
  - Test data helpers
  - Assertion helpers

### 3. Test Suites

#### Authentication Tests (test_authentication.py)
✓ **15+ test cases covering:**
- User registration workflow (AUTH-021 to AUTH-026)
- Login functionality (AUTH-010, AUTH-030 to AUTH-035)
- Password reset (AUTH-040 to AUTH-045)
- User profile management (AUTH-050 to AUTH-052)

**Key Tests:**
- `test_AUTH_010_valid_login` - Valid credentials
- `test_AUTH_022_complete_registration` - Full registration
- `test_AUTH_023_existing_email` - Duplicate email validation
- `test_AUTH_031_invalid_email` - Login error handling
- `test_AUTH_033_empty_email` - Field validation

#### Report CRUD Tests (test_reports_crud.py)
✓ **20+ test cases covering:**
- Create reports (REP-001 to REP-008)
- View/Read reports (REP-020 to REP-027)
- Update reports (REP-040 to REP-046)
- Delete reports (REP-060 to REP-063)

**Key Tests:**
- `test_REP_001_create_complete_report` - Full report creation
- `test_REP_003_upload_image` - Image attachment
- `test_REP_004_missing_title` - Validation testing
- `test_REP_020_view_reports_list` - List display
- `test_REP_022_filter_by_barangay` - Filtering
- `test_REP_043_verify_report` - Admin verification
- `test_REP_060_delete_report` - Deletion

### 4. Test Runner
- **run_tests.py** - Automated test execution script
  - Run all tests or specific suites
  - Headless mode support
  - Verbose output option
  - Prerequisites checking
  - Results summary

### 5. Directory Structure
```
backend/tests/
├── __init__.py                       # Package initialization
├── FUNCTIONAL_TEST_PLAN.md           # Complete test plan (Q1-Q4)
├── functional_test_scenarios.csv     # CSV format for spreadsheets
├── README.md                         # Comprehensive documentation
├── QUICK_START.md                    # Quick reference guide
├── base_test.py                      # Base test framework
├── test_authentication.py            # Auth test suite (15+ cases)
├── test_reports_crud.py              # CRUD test suite (20+ cases)
├── run_tests.py                      # Test runner script
├── test_data/                        # Test data directory
│   └── README.md                     # Data setup instructions
└── test_screenshots/                 # Auto-generated screenshots
    └── .gitkeep                      # Git placeholder
```

---

## 📋 Test Coverage

### Quadrant 1: Landing & Public Pages (LP-001 to LP-005)
- 5 test scenarios defined
- Public access testing
- Navigation verification
- Responsive design checks

### Quadrant 2: Authentication (AUTH-010 to AUTH-052)
- **27 test scenarios defined**
- **15+ automated tests implemented**
- Registration with validation
- Login with error handling
- Password reset workflow
- Profile management

### Quadrant 3: Report CRUD (REP-001 to REP-063)
- **43 test scenarios defined**
- **20+ automated tests implemented**
- Create with ML categorization
- Read with filtering
- Update with status changes
- Delete with permissions

### Quadrant 4: Admin Functions (ADM-*, ANL-*, ML-*, CAT-*)
- **20 test scenarios defined**
- User management (5 cases)
- Analytics dashboard (8 cases)
- ML model metrics (6 cases)
- Category management (4 cases)

**Total: 95 Test Scenarios Documented**
**Automated: 35+ Test Cases Implemented**

---

## 🚀 How to Use

### Prerequisites Check
```powershell
# 1. Backend running
cd backend
python manage.py runserver

# 2. Frontend running
cd webuidraftjs_wdb
npm run dev

# 3. Test users exist (see QUICK_START.md)
```

### Run Tests
```powershell
# Navigate to tests directory
cd backend\tests

# Run all tests
python run_tests.py

# Run specific suite
python run_tests.py --auth
python run_tests.py --reports

# Run in headless mode (faster)
python run_tests.py --headless

# Detailed output
python run_tests.py --verbose
```

### Review Results
- Console output shows pass/fail status
- Screenshots saved in `test_screenshots/` folder
- Summary report at end of execution

---

## 📊 Test Case Format (Matches Sample)

Each test case includes:

| Component | Description |
|-----------|-------------|
| **Test Case ID** | Unique identifier (e.g., AUTH-010, REP-001) |
| **Test Scenario** | Clear description of what is being tested |
| **Expected Outcome** | What should happen when test passes |
| **Preconditions** | Requirements before test can run |

Example from CSV:
```csv
Test Case ID,Test Scenario,Expected Outcome,Preconditions
AUTH-010,"Enter valid registered email/password and login","User redirected to main screen (app/dashboard); JWT token stored","User account exists in database; user not currently logged in"
```

---

## 🔧 Technologies Used

- **Selenium WebDriver** - Browser automation
- **Python unittest** - Test framework
- **webdriver-manager** - Automatic driver management
- **Chrome Browser** - Default test browser

---

## 📝 Key Features

### 1. Comprehensive Test Plan
- Organized by functional areas (Q1-Q4)
- Clear test scenarios
- Expected outcomes documented
- Preconditions specified

### 2. Automated Test Suite
- Reusable base test class
- Helper methods for common actions
- Automatic screenshot on failure
- Login/logout utilities
- Wait conditions for stability

### 3. Easy Execution
- Single command to run all tests
- Filter by test suite
- Headless mode for CI/CD
- Verbose output for debugging

### 4. Clear Documentation
- Multiple documentation formats
- Quick start guide
- Troubleshooting section
- Example usage

### 5. Best Practices
- Page object pattern foundations
- DRY (Don't Repeat Yourself) code
- Proper wait conditions
- Error handling
- Screenshot capture

---

## 🎯 What Students Need to Do

### 1. Review Test Plan ✅
- Read `FUNCTIONAL_TEST_PLAN.md`
- Open `functional_test_scenarios.csv` in Excel/Sheets
- Understand test structure

### 2. Setup Environment ✅
- Ensure both servers running
- Create test users (see QUICK_START.md)
- Install Selenium (already done)

### 3. Run Tests ✅
```powershell
cd backend\tests
python run_tests.py --auth
```

### 4. Analyze Results ✅
- Review console output
- Check screenshots folder
- Document passed/failed tests
- Note any bugs found

### 5. Document Findings ✅
- Create test report
- Include screenshots
- List issues discovered
- Suggest improvements

### 6. Extend Tests (Optional) ✅
- Add custom test cases
- Test additional features
- Improve existing tests

---

## 📚 Documentation Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| **QUICK_START.md** | Quick reference | First time setup |
| **README.md** | Complete guide | Detailed information |
| **FUNCTIONAL_TEST_PLAN.md** | Test scenarios | Understanding requirements |
| **functional_test_scenarios.csv** | Spreadsheet format | Import to Excel/Sheets |

---

## 💡 Tips for Students

1. **Start Small**: Run `--auth` tests first to understand the flow
2. **Watch the Browser**: Don't use headless mode initially to see what happens
3. **Read Screenshots**: Failed tests automatically capture screenshots
4. **Check Logs**: Console output shows detailed error messages
5. **Iterate**: Fix issues and re-run tests
6. **Document**: Take notes of bugs and unexpected behavior

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ChromeDriver not found | Auto-downloads on first run |
| Connection refused | Start backend and frontend servers |
| Login failed | Create test users (see QUICK_START.md) |
| Element not found | Page may still be loading, check wait times |
| Tests too slow | Use `--headless` flag |

---

## ✨ What Makes This Complete

✅ **Follows Activity Requirements:**
- Functional requirements identified
- Test cases documented with ID, Description, Outcome, Preconditions
- Covers authentication, registration, CRUD operations
- Includes system-generated reports testing

✅ **Professional Quality:**
- Industry-standard Selenium framework
- Reusable base test class
- Comprehensive documentation
- Error handling and debugging tools

✅ **Student-Friendly:**
- Clear instructions
- Multiple documentation formats
- Easy to run and understand
- Troubleshooting guides

✅ **Extensible:**
- Easy to add new tests
- Modular structure
- Well-commented code
- Best practices followed

---

## 📈 Next Steps

1. **Run the tests** to verify everything works
2. **Review results** and screenshots
3. **Document findings** in your activity report
4. **Add custom tests** for additional features
5. **Present results** with evidence (screenshots, logs)

---

## 🎓 Learning Outcomes

By completing this activity, students will:
- Understand functional testing concepts
- Learn Selenium automation framework
- Practice test case documentation
- Gain experience with automated testing
- Learn debugging techniques
- Understand software quality assurance

---

**Congratulations!** 🎉

You now have a complete, professional-grade functional testing suite for ReportIt-Web. All test scenarios are documented following the sample format, and automated tests are ready to run.

**Total Deliverables:**
- ✅ Test plan document (95 test cases)
- ✅ CSV format test scenarios
- ✅ 35+ automated Selenium tests
- ✅ Complete documentation
- ✅ Test runner script
- ✅ Quick start guide

**Ready to test!** Run `python run_tests.py` and see the magic happen! 🚀
