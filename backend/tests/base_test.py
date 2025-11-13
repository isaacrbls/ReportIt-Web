"""
Base Test Configuration for Selenium Tests
ReportIt-Web Functional Testing Suite
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import unittest
import time
import os
from datetime import datetime


class BaseTestCase(unittest.TestCase):
    """Base test case class with common setup and utility methods"""
    
    # Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
    IMPLICIT_WAIT = 10
    EXPLICIT_WAIT = 20
    SCREENSHOT_DIR = 'test_screenshots'
    
    @classmethod
    def setUpClass(cls):
        """Set up test class - runs once before all tests"""
        # Create screenshots directory
        if not os.path.exists(cls.SCREENSHOT_DIR):
            os.makedirs(cls.SCREENSHOT_DIR)
    
    def setUp(self):
        """Set up test case - runs before each test"""
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_argument('--disable-notifications')
        chrome_options.add_argument('--disable-popup-blocking')
        
        # Uncomment for headless mode (useful for CI/CD)
        # chrome_options.add_argument('--headless')
        # chrome_options.add_argument('--disable-gpu')
        
        # Initialize WebDriver
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # Set implicit wait
        self.driver.implicitly_wait(self.IMPLICIT_WAIT)
        
        # Initialize explicit wait
        self.wait = WebDriverWait(self.driver, self.EXPLICIT_WAIT)
        
        # Test metadata
        self.test_start_time = datetime.now()
        
    def tearDown(self):
        """Clean up after test - runs after each test"""
        # Take screenshot if test failed
        if hasattr(self._outcome, 'errors'):
            # Check if test failed
            for test, error in self._outcome.errors:
                if error:
                    self.take_screenshot(f"FAILED_{self._testMethodName}")
        
        # Calculate test duration
        test_duration = datetime.now() - self.test_start_time
        print(f"\nTest Duration: {test_duration.total_seconds():.2f} seconds")
        
        # Close browser
        if self.driver:
            self.driver.quit()
    
    # Utility Methods
    
    def navigate_to(self, path=''):
        """Navigate to a specific path in the application"""
        url = f"{self.FRONTEND_URL}{path}"
        self.driver.get(url)
        time.sleep(1)  # Allow page to start loading
    
    def wait_for_element(self, by, value, timeout=None):
        """Wait for element to be present and return it"""
        timeout = timeout or self.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located((by, value)))
    
    def wait_for_clickable(self, by, value, timeout=None):
        """Wait for element to be clickable and return it"""
        timeout = timeout or self.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.element_to_be_clickable((by, value)))
    
    def wait_for_visible(self, by, value, timeout=None):
        """Wait for element to be visible and return it"""
        timeout = timeout or self.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.visibility_of_element_located((by, value)))
    
    def find_element_safe(self, by, value):
        """Safely find element without throwing exception"""
        try:
            return self.driver.find_element(by, value)
        except NoSuchElementException:
            return None
    
    def is_element_present(self, by, value):
        """Check if element is present on the page"""
        return self.find_element_safe(by, value) is not None
    
    def take_screenshot(self, name):
        """Take a screenshot and save it"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{name}_{timestamp}.png"
        filepath = os.path.join(self.SCREENSHOT_DIR, filename)
        self.driver.save_screenshot(filepath)
        print(f"\nScreenshot saved: {filepath}")
        return filepath
    
    def scroll_to_element(self, element):
        """Scroll to make element visible"""
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)
    
    def clear_and_send_keys(self, element, text):
        """Clear input field and enter text"""
        element.clear()
        element.send_keys(text)
    
    def get_current_url(self):
        """Get current page URL"""
        return self.driver.current_url
    
    def wait_for_url_contains(self, text, timeout=None):
        """Wait for URL to contain specific text"""
        timeout = timeout or self.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.url_contains(text))
    
    def wait_for_url_change(self, current_url, timeout=None):
        """Wait for URL to change from current URL"""
        timeout = timeout or self.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.url_changes(current_url))
    
    # Authentication Helper Methods
    
    def login(self, email, password):
        """
        Perform login action
        Returns True if successful, False otherwise
        """
        try:
            # Navigate to login page
            self.navigate_to('/admin/login')
            
            # Wait for login form
            email_input = self.wait_for_element(By.NAME, 'email')
            password_input = self.wait_for_element(By.NAME, 'password')
            
            # Enter credentials
            self.clear_and_send_keys(email_input, email)
            self.clear_and_send_keys(password_input, password)
            
            # Click login button
            login_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[type="submit"]')
            login_button.click()
            
            # Wait for redirect
            time.sleep(2)
            
            # Check if login successful (URL changed)
            return '/admin' in self.get_current_url() or '/dashboard' in self.get_current_url()
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"Login failed: {e}")
            self.take_screenshot('login_failed')
            return False
    
    def logout(self):
        """Perform logout action"""
        try:
            # Find and click logout button
            logout_button = self.wait_for_clickable(By.CSS_SELECTOR, 'button[aria-label="Logout"]')
            logout_button.click()
            
            # Confirm logout if modal appears
            time.sleep(1)
            confirm_button = self.find_element_safe(By.XPATH, '//button[contains(text(), "Confirm")]')
            if confirm_button:
                confirm_button.click()
            
            time.sleep(2)
            return True
        except Exception as e:
            print(f"Logout failed: {e}")
            return False
    
    # Test Data
    
    @staticmethod
    def get_test_users():
        """Get test user credentials"""
        return {
            'admin': {
                'email': 'admin@reportit.test',
                'password': 'Admin123!',
                'role': 'admin'
            },
            'user': {
                'email': 'user@reportit.test',
                'password': 'User123!',
                'role': 'user'
            }
        }
    
    @staticmethod
    def get_test_report_data():
        """Get test report data"""
        return {
            'title': f'Test Report {datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'description': 'This is a test report created by automated testing suite.',
            'incident_type': 'Suspicious Activity',
            'barangay': 'Barangay 1',
            'location': 'Test Street, Test City'
        }
    
    # Assertion Helpers
    
    def assert_element_present(self, by, value, message=None):
        """Assert that element is present"""
        element = self.find_element_safe(by, value)
        self.assertIsNotNone(element, message or f"Element not found: {value}")
        return element
    
    def assert_element_not_present(self, by, value, message=None):
        """Assert that element is not present"""
        element = self.find_element_safe(by, value)
        self.assertIsNone(element, message or f"Element should not be present: {value}")
    
    def assert_url_contains(self, text, message=None):
        """Assert that current URL contains text"""
        current_url = self.get_current_url()
        self.assertIn(text, current_url, message or f"URL does not contain '{text}': {current_url}")
    
    def assert_text_present(self, text, message=None):
        """Assert that text is present on the page"""
        page_source = self.driver.page_source
        self.assertIn(text, page_source, message or f"Text not found on page: {text}")


class TestRunner:
    """Custom test runner for generating reports"""
    
    @staticmethod
    def run_tests(test_suite=None):
        """Run test suite and generate report"""
        import unittest
        from io import StringIO
        
        if test_suite is None:
            # Discover all tests
            loader = unittest.TestLoader()
            test_suite = loader.discover('.', pattern='test_*.py')
        
        # Run tests with verbose output
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(test_suite)
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Tests Run: {result.testsRun}")
        print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
        print(f"Failed: {len(result.failures)}")
        print(f"Errors: {len(result.errors)}")
        print("="*70)
        
        return result


if __name__ == '__main__':
    # Example usage
    print("Base Test Configuration Loaded")
    print(f"Frontend URL: {BaseTestCase.FRONTEND_URL}")
    print(f"Backend URL: {BaseTestCase.BACKEND_URL}")
