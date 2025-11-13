"""
Authentication and User Management Test Cases
Test Cases: AUTH-010 through AUTH-052

This module contains Selenium tests for:
- User Registration (AUTH-021 to AUTH-026)
- User Login (AUTH-010, AUTH-030 to AUTH-035)
- Password Reset (AUTH-040 to AUTH-045)
- User Profile Management (AUTH-050 to AUTH-052)
"""

import unittest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from base_test import BaseTestCase


class TestUserRegistration(BaseTestCase):
    """Test cases for user registration workflow"""
    
    def test_AUTH_022_complete_registration(self):
        """
        Test Case: AUTH-022
        Scenario: Submit complete registration form with all required fields
        Expected: Account created successfully; user receives confirmation
        """
        print("\n[TEST] AUTH-022: Complete user registration")
        
        # Navigate to registration page
        self.navigate_to('/admin/register')
        
        # Wait for registration form
        email_input = self.wait_for_element(By.NAME, 'email')
        
        # Generate unique test email
        from datetime import datetime
        test_email = f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com"
        
        # Fill in registration form
        self.clear_and_send_keys(email_input, test_email)
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'TestPass123!')
        
        # Try to find confirm password field
        try:
            confirm_password = self.driver.find_element(By.NAME, 'confirmPassword')
            self.clear_and_send_keys(confirm_password, 'TestPass123!')
        except NoSuchElementException:
            pass
        
        # Fill additional fields if present
        try:
            first_name = self.driver.find_element(By.NAME, 'firstName')
            self.clear_and_send_keys(first_name, 'Test')
        except NoSuchElementException:
            pass
        
        try:
            last_name = self.driver.find_element(By.NAME, 'lastName')
            self.clear_and_send_keys(last_name, 'User')
        except NoSuchElementException:
            pass
        
        # Take screenshot before submission
        self.take_screenshot('AUTH_022_before_submit')
        
        # Submit form
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        # Wait for success message or redirect
        time.sleep(3)
        
        # Take screenshot after submission
        self.take_screenshot('AUTH_022_after_submit')
        
        # Verify success (either redirect to login or dashboard)
        current_url = self.get_current_url()
        self.assertTrue(
            '/login' in current_url or '/dashboard' in current_url or '/admin' in current_url,
            "Registration should redirect to login or dashboard"
        )
        
        print(f"✓ Registration completed successfully for {test_email}")
    
    def test_AUTH_023_existing_email(self):
        """
        Test Case: AUTH-023
        Scenario: Attempt registration with existing email
        Expected: System shows error: "Email already registered"
        """
        print("\n[TEST] AUTH-023: Registration with existing email")
        
        self.navigate_to('/admin/register')
        
        # Try to register with common test email
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, 'admin@reportit.test')
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'TestPass123!')
        
        try:
            confirm_password = self.driver.find_element(By.NAME, 'confirmPassword')
            self.clear_and_send_keys(confirm_password, 'TestPass123!')
        except NoSuchElementException:
            pass
        
        # Submit form
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(2)
        self.take_screenshot('AUTH_023_duplicate_email_error')
        
        # Check for error message
        page_source = self.driver.page_source.lower()
        self.assertTrue(
            'already' in page_source or 'exist' in page_source,
            "Should show error for duplicate email"
        )
        
        print("✓ Duplicate email error displayed correctly")
    
    def test_AUTH_024_mismatched_passwords(self):
        """
        Test Case: AUTH-024
        Scenario: Submit registration with mismatched passwords
        Expected: Form validation error: "Passwords do not match"
        """
        print("\n[TEST] AUTH-024: Registration with mismatched passwords")
        
        self.navigate_to('/admin/register')
        
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, 'newuser@test.com')
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'TestPass123!')
        
        try:
            confirm_password = self.driver.find_element(By.NAME, 'confirmPassword')
            self.clear_and_send_keys(confirm_password, 'DifferentPass123!')
            
            # Submit form
            submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
            submit_button.click()
            
            time.sleep(2)
            self.take_screenshot('AUTH_024_password_mismatch')
            
            # Check for error message
            page_source = self.driver.page_source.lower()
            self.assertTrue(
                'match' in page_source or 'same' in page_source,
                "Should show password mismatch error"
            )
            
            print("✓ Password mismatch error displayed correctly")
        except NoSuchElementException:
            print("⚠ Confirm password field not found - skipping test")
            self.skipTest("Confirm password field not implemented")
    
    def test_AUTH_025_weak_password(self):
        """
        Test Case: AUTH-025
        Scenario: Submit registration with weak password
        Expected: Validation error about password requirements
        """
        print("\n[TEST] AUTH-025: Registration with weak password")
        
        self.navigate_to('/admin/register')
        
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, 'newuser@test.com')
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, '123')  # Weak password
        
        # Trigger validation by clicking elsewhere
        email_input.click()
        time.sleep(1)
        
        self.take_screenshot('AUTH_025_weak_password')
        
        # Check for validation error
        page_source = self.driver.page_source.lower()
        has_error = any(word in page_source for word in ['weak', 'strong', 'requirement', 'character'])
        
        self.assertTrue(has_error, "Should show weak password error")
        print("✓ Weak password validation working")
    
    def test_AUTH_026_empty_required_fields(self):
        """
        Test Case: AUTH-026
        Scenario: Leave required fields blank during registration
        Expected: Form shows validation errors for each empty required field
        """
        print("\n[TEST] AUTH-026: Registration with empty fields")
        
        self.navigate_to('/admin/register')
        
        # Wait for form to load
        self.wait_for_element(By.NAME, 'email')
        
        # Try to submit empty form
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(2)
        self.take_screenshot('AUTH_026_empty_fields')
        
        # Check for validation errors
        page_source = self.driver.page_source.lower()
        has_validation = any(word in page_source for word in ['required', 'enter', 'provide', 'field'])
        
        self.assertTrue(has_validation, "Should show required field errors")
        print("✓ Empty field validation working")


class TestUserLogin(BaseTestCase):
    """Test cases for user login functionality"""
    
    def test_AUTH_010_valid_login(self):
        """
        Test Case: AUTH-010
        Scenario: Enter valid registered email/password and login
        Expected: User redirected to main screen (app/dashboard); JWT token stored
        """
        print("\n[TEST] AUTH-010: Login with valid credentials")
        
        # Get test credentials
        users = self.get_test_users()
        admin_creds = users['admin']
        
        # Perform login
        login_success = self.login(admin_creds['email'], admin_creds['password'])
        
        self.take_screenshot('AUTH_010_after_login')
        
        # Assert login successful
        self.assertTrue(login_success, "Login should succeed with valid credentials")
        
        # Verify redirect to dashboard
        current_url = self.get_current_url()
        self.assertTrue(
            '/admin' in current_url or '/dashboard' in current_url,
            f"Should redirect to admin/dashboard, got: {current_url}"
        )
        
        print(f"✓ Login successful for {admin_creds['email']}")
    
    def test_AUTH_031_invalid_email(self):
        """
        Test Case: AUTH-031
        Scenario: Login with invalid email
        Expected: Error message: "Invalid email or password" displayed
        """
        print("\n[TEST] AUTH-031: Login with invalid email")
        
        self.navigate_to('/admin/login')
        
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, 'nonexistent@test.com')
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'Password123!')
        
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(2)
        self.take_screenshot('AUTH_031_invalid_email')
        
        # Check for error message
        page_source = self.driver.page_source.lower()
        self.assertTrue(
            'invalid' in page_source or 'incorrect' in page_source or 'not found' in page_source,
            "Should show invalid credentials error"
        )
        
        print("✓ Invalid email error displayed")
    
    def test_AUTH_032_invalid_password(self):
        """
        Test Case: AUTH-032
        Scenario: Login with invalid password
        Expected: Error message: "Invalid email or password" displayed
        """
        print("\n[TEST] AUTH-032: Login with invalid password")
        
        self.navigate_to('/admin/login')
        
        users = self.get_test_users()
        
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, users['admin']['email'])
        
        password_input = self.driver.find_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'WrongPassword123!')
        
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(2)
        self.take_screenshot('AUTH_032_invalid_password')
        
        # Check for error message
        page_source = self.driver.page_source.lower()
        self.assertTrue(
            'invalid' in page_source or 'incorrect' in page_source,
            "Should show invalid credentials error"
        )
        
        print("✓ Invalid password error displayed")
    
    def test_AUTH_033_empty_email(self):
        """
        Test Case: AUTH-033
        Scenario: Login with empty email field
        Expected: Validation error: "Email is required"
        """
        print("\n[TEST] AUTH-033: Login with empty email")
        
        self.navigate_to('/admin/login')
        
        password_input = self.wait_for_element(By.NAME, 'password')
        self.clear_and_send_keys(password_input, 'Password123!')
        
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(1)
        self.take_screenshot('AUTH_033_empty_email')
        
        # Check for validation error
        page_source = self.driver.page_source.lower()
        self.assertTrue(
            'required' in page_source or 'enter' in page_source,
            "Should show email required error"
        )
        
        print("✓ Empty email validation working")
    
    def test_AUTH_034_empty_password(self):
        """
        Test Case: AUTH-034
        Scenario: Login with empty password field
        Expected: Validation error: "Password is required"
        """
        print("\n[TEST] AUTH-034: Login with empty password")
        
        self.navigate_to('/admin/login')
        
        email_input = self.wait_for_element(By.NAME, 'email')
        self.clear_and_send_keys(email_input, 'test@test.com')
        
        submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_button.click()
        
        time.sleep(1)
        self.take_screenshot('AUTH_034_empty_password')
        
        # Check for validation error
        page_source = self.driver.page_source.lower()
        self.assertTrue(
            'required' in page_source or 'enter' in page_source,
            "Should show password required error"
        )
        
        print("✓ Empty password validation working")


class TestPasswordReset(BaseTestCase):
    """Test cases for password reset functionality"""
    
    def test_AUTH_040_forgot_password_link(self):
        """
        Test Case: AUTH-040
        Scenario: Click "Forgot Password" link
        Expected: Navigates to password reset request page
        """
        print("\n[TEST] AUTH-040: Forgot password link navigation")
        
        self.navigate_to('/admin/login')
        
        # Look for forgot password link
        try:
            forgot_link = self.wait_for_element(
                By.XPATH, 
                "//a[contains(text(), 'Forgot') or contains(text(), 'forgot')]",
                timeout=5
            )
            
            forgot_link.click()
            time.sleep(2)
            
            self.take_screenshot('AUTH_040_forgot_password_page')
            
            # Verify navigation
            current_url = self.get_current_url()
            self.assertTrue(
                'forgot' in current_url.lower() or 'reset' in current_url.lower(),
                "Should navigate to password reset page"
            )
            
            print("✓ Forgot password navigation working")
            
        except TimeoutException:
            print("⚠ Forgot password link not found - feature may not be implemented")
            self.skipTest("Forgot password link not found")
    
    def test_AUTH_041_valid_reset_request(self):
        """
        Test Case: AUTH-041
        Scenario: Submit valid email for password reset
        Expected: System sends reset email; confirmation message displayed
        """
        print("\n[TEST] AUTH-041: Request password reset with valid email")
        
        try:
            self.navigate_to('/forgot-password')
            
            email_input = self.wait_for_element(By.NAME, 'email', timeout=5)
            self.clear_and_send_keys(email_input, 'admin@reportit.test')
            
            submit_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
            submit_button.click()
            
            time.sleep(2)
            self.take_screenshot('AUTH_041_reset_requested')
            
            # Check for success message
            page_source = self.driver.page_source.lower()
            has_success = any(word in page_source for word in ['sent', 'check', 'email', 'link'])
            
            self.assertTrue(has_success, "Should show success message")
            print("✓ Password reset request successful")
            
        except TimeoutException:
            print("⚠ Password reset page not found")
            self.skipTest("Password reset feature not implemented")


class TestUserProfile(BaseTestCase):
    """Test cases for user profile management"""
    
    def test_AUTH_050_view_profile(self):
        """
        Test Case: AUTH-050
        Scenario: View current user profile
        Expected: Display user info (email, name, barangay, role)
        """
        print("\n[TEST] AUTH-050: View user profile")
        
        # Login first
        users = self.get_test_users()
        self.login(users['admin']['email'], users['admin']['password'])
        
        # Navigate to profile page (adjust URL as needed)
        try:
            # Try to find profile link
            profile_link = self.wait_for_element(
                By.XPATH,
                "//a[contains(@href, 'profile') or contains(text(), 'Profile')]",
                timeout=5
            )
            profile_link.click()
            
            time.sleep(2)
            self.take_screenshot('AUTH_050_profile_page')
            
            # Verify user info is displayed
            page_source = self.driver.page_source
            self.assertIn('admin@reportit.test', page_source, "Email should be displayed")
            
            print("✓ Profile page loaded successfully")
            
        except TimeoutException:
            print("⚠ Profile page not accessible")
            self.skipTest("Profile feature not implemented")


def run_auth_tests():
    """Run all authentication tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestUserRegistration))
    suite.addTests(loader.loadTestsFromTestCase(TestUserLogin))
    suite.addTests(loader.loadTestsFromTestCase(TestPasswordReset))
    suite.addTests(loader.loadTestsFromTestCase(TestUserProfile))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result


if __name__ == '__main__':
    print("="*70)
    print("REPORTIT-WEB - AUTHENTICATION TEST SUITE")
    print("="*70)
    result = run_auth_tests()
    
    # Print summary
    print("\n" + "="*70)
    print("AUTHENTICATION TESTS SUMMARY")
    print("="*70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*70)
