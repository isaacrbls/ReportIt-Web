"""
Test Runner Script for ReportIt-Web Functional Tests

This script provides a convenient way to run all tests or specific test suites.

Usage:
    python run_tests.py                    # Run all tests
    python run_tests.py --auth             # Run authentication tests only
    python run_tests.py --reports          # Run report CRUD tests only
    python run_tests.py --headless         # Run in headless mode
    python run_tests.py --verbose          # Verbose output
"""

import sys
import os
import unittest
import argparse
from datetime import datetime

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def print_header(title):
    """Print formatted header"""
    print("\n" + "="*70)
    print(title.center(70))
    print("="*70 + "\n")


def print_summary(result, start_time):
    """Print test execution summary"""
    duration = datetime.now() - start_time
    
    print("\n" + "="*70)
    print("TEST EXECUTION SUMMARY")
    print("="*70)
    print(f"Total Tests Run:     {result.testsRun}")
    print(f"Passed:              {result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped)}")
    print(f"Failed:              {len(result.failures)}")
    print(f"Errors:              {len(result.errors)}")
    print(f"Skipped:             {len(result.skipped)}")
    print(f"Duration:            {duration.total_seconds():.2f} seconds")
    print("="*70)
    
    # Print failed tests details
    if result.failures:
        print("\nFAILED TESTS:")
        for test, traceback in result.failures:
            print(f"  - {test}")
    
    # Print error details
    if result.errors:
        print("\nERROR TESTS:")
        for test, traceback in result.errors:
            print(f"  - {test}")
    
    # Print skipped tests
    if result.skipped:
        print("\nSKIPPED TESTS:")
        for test, reason in result.skipped:
            print(f"  - {test}: {reason}")
    
    print("\n" + "="*70)
    
    # Return exit code
    return 0 if result.wasSuccessful() else 1


def run_tests(args):
    """Run test suites based on arguments"""
    
    start_time = datetime.now()
    
    # Configure verbosity
    verbosity = 2 if args.verbose else 1
    
    # Set headless mode environment variable
    if args.headless:
        os.environ['SELENIUM_HEADLESS'] = '1'
        print("Running in HEADLESS mode (no browser GUI)\n")
    
    # Create test loader
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Determine which tests to run
    if args.auth:
        print_header("AUTHENTICATION TESTS")
        try:
            from test_authentication import (
                TestUserRegistration,
                TestUserLogin,
                TestPasswordReset,
                TestUserProfile
            )
            suite.addTests(loader.loadTestsFromTestCase(TestUserRegistration))
            suite.addTests(loader.loadTestsFromTestCase(TestUserLogin))
            suite.addTests(loader.loadTestsFromTestCase(TestPasswordReset))
            suite.addTests(loader.loadTestsFromTestCase(TestUserProfile))
        except ImportError as e:
            print(f"Error importing authentication tests: {e}")
            return 1
    
    elif args.reports:
        print_header("REPORT CRUD TESTS")
        try:
            from test_reports_crud import (
                TestCreateReport,
                TestViewReports,
                TestUpdateReport,
                TestDeleteReport
            )
            suite.addTests(loader.loadTestsFromTestCase(TestCreateReport))
            suite.addTests(loader.loadTestsFromTestCase(TestViewReports))
            suite.addTests(loader.loadTestsFromTestCase(TestUpdateReport))
            suite.addTests(loader.loadTestsFromTestCase(TestDeleteReport))
        except ImportError as e:
            print(f"Error importing report tests: {e}")
            return 1
    
    else:
        # Run all tests
        print_header("REPORTIT-WEB COMPLETE TEST SUITE")
        
        # Discover all test files
        test_dir = os.path.dirname(os.path.abspath(__file__))
        suite = loader.discover(test_dir, pattern='test_*.py')
    
    # Check if any tests were loaded
    if suite.countTestCases() == 0:
        print("ERROR: No tests found to run!")
        return 1
    
    print(f"Loaded {suite.countTestCases()} test cases\n")
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)
    
    # Print summary and return exit code
    return print_summary(result, start_time)


def check_prerequisites():
    """Check if prerequisites are met"""
    print("Checking prerequisites...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("ERROR: Python 3.8+ required")
        return False
    
    # Check Selenium
    try:
        import selenium
        print(f"✓ Selenium {selenium.__version__} installed")
    except ImportError:
        print("ERROR: Selenium not installed. Run: pip install selenium webdriver-manager")
        return False
    
    # Check webdriver-manager
    try:
        import webdriver_manager
        print(f"✓ WebDriver Manager installed")
    except ImportError:
        print("WARNING: webdriver-manager not installed. Run: pip install webdriver-manager")
    
    # Check if test files exist
    test_files = ['base_test.py', 'test_authentication.py', 'test_reports_crud.py']
    for test_file in test_files:
        if not os.path.exists(test_file):
            print(f"ERROR: {test_file} not found")
            return False
        print(f"✓ {test_file} found")
    
    print("\nPrerequisites check passed!\n")
    return True


def main():
    """Main entry point"""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='ReportIt-Web Functional Test Runner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py                # Run all tests
  python run_tests.py --auth         # Run authentication tests only
  python run_tests.py --reports      # Run report CRUD tests only
  python run_tests.py --headless     # Run in headless mode (no GUI)
  python run_tests.py --verbose      # Detailed output
  python run_tests.py --auth --headless --verbose  # Combined options
        """
    )
    
    parser.add_argument(
        '--auth',
        action='store_true',
        help='Run authentication tests only'
    )
    
    parser.add_argument(
        '--reports',
        action='store_true',
        help='Run report CRUD tests only'
    )
    
    parser.add_argument(
        '--headless',
        action='store_true',
        help='Run browser in headless mode (no GUI)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )
    
    parser.add_argument(
        '--skip-check',
        action='store_true',
        help='Skip prerequisites check'
    )
    
    args = parser.parse_args()
    
    # Print banner
    print_header("REPORTIT-WEB FUNCTIONAL TEST SUITE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python Version: {sys.version.split()[0]}")
    print(f"Working Directory: {os.getcwd()}\n")
    
    # Check prerequisites
    if not args.skip_check:
        if not check_prerequisites():
            print("\nPrerequisites check failed. Fix issues and try again.")
            print("Or use --skip-check to bypass this check.\n")
            return 1
    
    # Print important reminders
    print("IMPORTANT REMINDERS:")
    print("  1. Ensure Django backend is running on http://localhost:8000")
    print("  2. Ensure Next.js frontend is running on http://localhost:3000")
    print("  3. Ensure test users exist (see README.md)")
    print("  4. Browser will open automatically (unless --headless)")
    print()
    
    # Prompt to continue
    if not args.skip_check:
        try:
            response = input("Continue with tests? (y/n): ").lower().strip()
            if response != 'y':
                print("Test run cancelled.")
                return 0
        except KeyboardInterrupt:
            print("\nTest run cancelled.")
            return 0
    
    # Run tests
    exit_code = run_tests(args)
    
    # Final message
    if exit_code == 0:
        print("\n✓ All tests completed successfully!")
    else:
        print("\n✗ Some tests failed. Check output above.")
        print("  Screenshots saved in: test_screenshots/")
    
    return exit_code


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest execution interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
