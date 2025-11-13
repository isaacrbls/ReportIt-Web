"""
ReportIt-Web Functional Testing Suite

This package contains comprehensive functional tests for the ReportIt-Web application.

Test Modules:
- base_test: Base test configuration and utilities
- test_authentication: Authentication and user management tests
- test_reports_crud: Report CRUD operation tests

Usage:
    python run_tests.py                # Run all tests
    python run_tests.py --auth         # Authentication tests only
    python run_tests.py --reports      # Report CRUD tests only

For detailed documentation, see README.md
"""

__version__ = '1.0.0'
__author__ = 'ReportIt-Web Team'
__all__ = ['base_test', 'test_authentication', 'test_reports_crud', 'run_tests']
