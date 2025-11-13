# Quick Start Guide - Functional Testing

## Step 1: Setup (One-time)

### Install Dependencies (Already Done ✓)
```powershell
# Selenium and WebDriver Manager are already installed
```

### Start Both Servers

**Terminal 1 - Backend:**
```powershell
cd "c:\Users\Administrator\Desktop\ReportIt - Web\ReportIt-Web\backend"
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\Administrator\Desktop\ReportIt - Web\ReportIt-Web\webuidraftjs_wdb"
npm run dev
```

### Create Test Users

Option 1 - Django Shell:
```powershell
cd backend
python manage.py shell
```

Then run:
```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Create admin user
admin = User.objects.create_user(
    email='admin@reportit.test',
    password='Admin123!',
    first_name='Admin',
    last_name='User'
)
admin.is_admin = True
admin.is_staff = True
admin.is_superuser = True
admin.save()

# Create regular user
user = User.objects.create_user(
    email='user@reportit.test',
    password='User123!',
    first_name='Test',
    last_name='User'
)
user.save()

exit()
```

Option 2 - Registration Page:
- Visit http://localhost:3000/admin/register
- Register the users manually

---

## Step 2: Run Tests

### Navigate to Tests Directory
```powershell
cd "c:\Users\Administrator\Desktop\ReportIt - Web\ReportIt-Web\backend\tests"
```

### Run All Tests
```powershell
python run_tests.py
```

### Run Specific Test Suite

**Authentication Tests Only:**
```powershell
python run_tests.py --auth
```

**Report CRUD Tests Only:**
```powershell
python run_tests.py --reports
```

### Run in Headless Mode (No Browser Window)
```powershell
python run_tests.py --headless
```

### Run with Verbose Output
```powershell
python run_tests.py --verbose
```

### Combined Options
```powershell
python run_tests.py --auth --headless --verbose
```

---

## Step 3: Review Results

### Console Output
- Test execution shows in real-time
- ✓ = Passed
- ✗ = Failed
- Summary at the end

### Screenshots
Failed tests automatically save screenshots:
```
backend/tests/test_screenshots/
```

### Test Report Example
```
======================================================================
TEST EXECUTION SUMMARY
======================================================================
Total Tests Run:     15
Passed:              13
Failed:              1
Errors:              0
Skipped:             1
Duration:            42.35 seconds
======================================================================
```

---

## Test Cases Reference

### Authentication (AUTH-*)
- **AUTH-010**: Valid login
- **AUTH-022**: Complete registration
- **AUTH-023**: Duplicate email error
- **AUTH-024**: Password mismatch
- **AUTH-031**: Invalid email
- **AUTH-032**: Invalid password
- **AUTH-033**: Empty email
- **AUTH-034**: Empty password

### Reports (REP-*)
- **REP-001**: Create complete report
- **REP-004**: Missing title validation
- **REP-005**: Missing description validation
- **REP-020**: View reports list
- **REP-021**: View report details
- **REP-022**: Filter by barangay
- **REP-023**: Filter by status
- **REP-043**: Verify report
- **REP-044**: Resolve report
- **REP-060**: Delete report

---

## Troubleshooting

### "ChromeDriver not found"
**Solution:** First run will auto-download. Ensure internet connection.

### "Connection refused"
**Solution:** 
1. Check backend running: http://localhost:8000
2. Check frontend running: http://localhost:3000

### "Login failed" / "User not found"
**Solution:** Create test users (see Step 1)

### Tests taking too long
**Solution:** Use `--headless` flag for faster execution

### Element not found errors
**Solution:** 
1. Verify servers are running
2. Check if page loads manually in browser
3. UI might have changed - update test selectors

---

## Quick Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `python run_tests.py` | Run all tests |
| `python run_tests.py --auth` | Authentication tests only |
| `python run_tests.py --reports` | Report tests only |
| `python run_tests.py --headless` | No browser window |
| `python run_tests.py --verbose` | Detailed output |
| `python test_authentication.py` | Direct run auth tests |
| `python test_reports_crud.py` | Direct run report tests |

---

## Documentation Files

| File | Description |
|------|-------------|
| `FUNCTIONAL_TEST_PLAN.md` | Complete test plan with all scenarios |
| `functional_test_scenarios.csv` | Test cases in CSV format |
| `README.md` | Comprehensive documentation |
| `QUICK_START.md` | This guide |

---

## Test Coverage Summary

### Q1: Landing & Public Pages (5 test cases)
- Public access, navigation, responsive design

### Q2: Authentication (27 test cases)
- Registration (6 cases)
- Login (6 cases)
- Password reset (6 cases)
- User profile (3 cases)

### Q3: Report CRUD (43 test cases)
- Create (8 cases)
- Read (8 cases)
- Update (7 cases)
- Delete (4 cases)

### Q4: Admin Functions (20 test cases)
- User management (5 cases)
- Report management (5 cases)
- Analytics (8 cases)
- ML model (6 cases)
- Categories (4 cases)

**Total: 95 Test Cases**

---

## Expected Test Duration

| Test Suite | Approximate Duration |
|------------|---------------------|
| Authentication | 1-2 minutes |
| Report CRUD | 2-3 minutes |
| Full Suite | 3-5 minutes |
| Headless Mode | 50% faster |

---

## Next Steps for Students

1. ✓ **Understand Test Structure**
   - Review `FUNCTIONAL_TEST_PLAN.md`
   - Check CSV file in Excel/Sheets

2. ✓ **Run Basic Tests**
   - Start with `--auth` flag
   - Observe browser automation
   - Review console output

3. ✓ **Analyze Results**
   - Check screenshots folder
   - Note passed/failed tests
   - Document any bugs found

4. ✓ **Extend Tests**
   - Add custom test cases
   - Test additional features
   - Improve existing tests

5. ✓ **Report Findings**
   - Create test report document
   - Include screenshots
   - List bugs/issues found
   - Suggest improvements

---

## Support & Resources

- **Selenium Docs**: https://selenium-python.readthedocs.io/
- **unittest Docs**: https://docs.python.org/3/library/unittest.html
- **Project README**: `backend/tests/README.md`
- **Test Plan**: `backend/tests/FUNCTIONAL_TEST_PLAN.md`

---

**Good Luck with Your Testing!** 🚀

Remember: Testing is about finding issues early. Every bug you catch is a problem prevented!
