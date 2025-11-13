# ReportIt-Web Functional Testing Suite

## Overview

This testing suite provides comprehensive functional tests for the ReportIt-Web application using Selenium WebDriver. The tests cover authentication, report CRUD operations, and system-generated reports as outlined in Activity 6.

## Test Structure

```
backend/tests/
├── FUNCTIONAL_TEST_PLAN.md          # Comprehensive test plan document
├── functional_test_scenarios.csv     # Test cases in CSV format
├── base_test.py                      # Base test configuration and utilities
├── test_authentication.py            # Authentication test cases
├── test_reports_crud.py              # Report CRUD test cases
├── run_tests.py                      # Test runner script
├── README.md                         # This file
└── test_screenshots/                 # Auto-generated screenshots
```

## Prerequisites

### 1. Install Dependencies

The following packages have been installed:
- `selenium` - Web automation framework
- `webdriver-manager` - Automatic driver management

### 2. Start Application Servers

Before running tests, ensure both servers are running:

**Backend (Django):**
```powershell
cd backend
python manage.py runserver
```

**Frontend (Next.js):**
```powershell
cd webuidraftjs_wdb
npm run dev
```

### 3. Create Test Data

Ensure the following test users exist in the database:

```python
# Admin User
Email: admin@reportit.test
Password: Admin123!
Role: admin

# Regular User
Email: user@reportit.test
Password: User123!
Role: user
```

You can create these users through:
1. Django admin panel (http://localhost:8000/admin)
2. Registration page
3. Django shell: `python manage.py shell`

## Test Cases Coverage

### Q1: Landing & Public Pages (LP-001 to LP-005)
- Public page access
- Navigation testing
- Responsive design

### Q2: Authentication & User Management (AUTH-010 to AUTH-052)
- **Registration (AUTH-021 to AUTH-026):**
  - Complete registration flow
  - Duplicate email validation
  - Password mismatch validation
  - Weak password validation
  - Empty field validation

- **Login (AUTH-010, AUTH-030 to AUTH-035):**
  - Valid credentials
  - Invalid email/password
  - Empty field validation
  - Remember me functionality

- **Password Reset (AUTH-040 to AUTH-045):**
  - Forgot password flow
  - Valid/invalid reset requests
  - Token validation

- **User Profile (AUTH-050 to AUTH-052):**
  - View profile
  - Update profile
  - Change password

### Q3: Report CRUD Operations (REP-001 to REP-063)
- **Create (REP-001 to REP-008):**
  - Complete report creation
  - ML categorization
  - Image upload
  - Field validation

- **Read (REP-020 to REP-027):**
  - View reports list
  - View details
  - Filter by barangay/status/type
  - Search functionality
  - Map visualization

- **Update (REP-040 to REP-046):**
  - Edit report fields
  - Status changes (Verify/Resolve)
  - Permission checks

- **Delete (REP-060 to REP-063):**
  - Delete with confirmation
  - Permission checks
  - Soft delete/archive

### Q4: Admin Functions (ADM-*, ANL-*, ML-*, CAT-*)
- User management
- Analytics dashboard
- ML model metrics
- Category management

## Running Tests

### Run All Tests
```powershell
cd backend\tests
python run_tests.py
```

### Run Specific Test Suite

**Authentication Tests Only:**
```powershell
python test_authentication.py
```

**Report CRUD Tests Only:**
```powershell
python test_reports_crud.py
```

### Run Individual Test Case
```powershell
python -m unittest test_authentication.TestUserLogin.test_AUTH_010_valid_login
```

## Test Configuration

### Environment Variables

Create a `.env` file in the `backend/tests` directory:

```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
SELENIUM_IMPLICIT_WAIT=10
SELENIUM_EXPLICIT_WAIT=20
```

### Browser Configuration

By default, tests run in Chrome. To use headless mode (no GUI), edit `base_test.py`:

```python
# Uncomment these lines in BaseTestCase.setUp()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
```

## Test Results

### Screenshots

Failed tests automatically capture screenshots saved in:
```
backend/tests/test_screenshots/
```

Screenshot naming format:
```
FAILED_<test_name>_<timestamp>.png
<test_case_id>_<action>_<timestamp>.png
```

### Test Reports

Console output shows:
- Test execution progress
- Pass/Fail status
- Error messages
- Test duration
- Summary statistics

Example output:
```
======================================================================
REPORTIT-WEB - AUTHENTICATION TEST SUITE
======================================================================

test_AUTH_010_valid_login ... ok (2.34s)
test_AUTH_031_invalid_email ... ok (1.87s)
test_AUTH_022_complete_registration ... ok (3.21s)

----------------------------------------------------------------------
Ran 15 tests in 38.45s

OK (passed=13, skipped=2)

======================================================================
AUTHENTICATION TESTS SUMMARY
======================================================================
Tests Run: 15
Passed: 13
Failed: 0
Errors: 0
Skipped: 2
======================================================================
```

## Troubleshooting

### Common Issues

**1. "ChromeDriver not found"**
```
Solution: webdriver-manager will auto-download. Ensure internet connection.
```

**2. "Element not found" errors**
```
Solution: 
- Check if servers are running
- Verify correct URLs in base_test.py
- Increase wait timeouts
- Check if UI elements have changed
```

**3. "Connection refused"**
```
Solution:
- Ensure backend server is running on port 8000
- Ensure frontend server is running on port 3000
- Check firewall settings
```

**4. Test users don't exist**
```
Solution: Create test users using Django shell:
python manage.py shell

from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_user(
    email='admin@reportit.test',
    password='Admin123!',
    is_admin=True
)
```

### Debug Mode

To run tests with more verbose output:

```powershell
python -m unittest test_authentication -v
```

To keep browser open after test (for debugging):

Comment out `self.driver.quit()` in `base_test.py` tearDown method.

## Best Practices for Students

1. **Run Tests Sequentially**: Start with authentication tests before CRUD tests
2. **Check Prerequisites**: Ensure servers are running and test data exists
3. **Review Screenshots**: Check captured screenshots when tests fail
4. **Document Failures**: Note actual vs expected behavior
5. **Test Data Cleanup**: Some tests create data; clean up as needed
6. **Browser Compatibility**: Test on multiple browsers if possible

## Extending Tests

To add new test cases:

1. **Create new test method** in appropriate test class:
```python
def test_NEW_CASE_description(self):
    """
    Test Case: NEW-001
    Scenario: ...
    Expected: ...
    """
    print("\n[TEST] NEW-001: Description")
    # Test implementation
```

2. **Use base class utilities**:
- `self.wait_for_element()` - Wait for element
- `self.take_screenshot()` - Capture screenshot
- `self.login()` - Login helper
- `self.assert_element_present()` - Assertion helper

3. **Follow naming convention**:
- File: `test_<feature>.py`
- Class: `Test<Feature>`
- Method: `test_<CASE_ID>_<description>`

## Test Data Files

### Test Report Data
Sample report data is generated using `get_test_report_data()` in `base_test.py`.

### Test Images
Place test images in:
```
backend/tests/test_data/test_image.jpg
```

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Selenium Tests
  run: |
    python backend/tests/run_tests.py --headless
```

## Documentation References

- **Test Plan**: `FUNCTIONAL_TEST_PLAN.md` - Complete test scenarios
- **CSV Format**: `functional_test_scenarios.csv` - Import into spreadsheet
- **Selenium Docs**: https://selenium-python.readthedocs.io/
- **unittest Docs**: https://docs.python.org/3/library/unittest.html

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test screenshots for visual debugging
3. Check console output for error messages
4. Verify server logs (Django + Next.js)

---

**Version**: 1.0  
**Last Updated**: November 13, 2025  
**Compatible With**: Python 3.8+, Selenium 4.x, Chrome Latest
