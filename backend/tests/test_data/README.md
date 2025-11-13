# Test Data Directory

This directory contains test data files used by the functional test suite.

## Required Files

### test_image.jpg
A sample image file used for testing image upload functionality (Test case REP-003).

**Requirements:**
- Format: JPG or PNG
- Size: Less than 5MB
- Dimensions: Any (e.g., 800x600)

You can place any test image here for upload testing.

### Creating Test Image

Option 1 - Use existing image:
```powershell
# Copy any image to this folder
Copy-Item "C:\path\to\your\image.jpg" -Destination "test_image.jpg"
```

Option 2 - Download sample image:
Visit https://via.placeholder.com/800x600.jpg and save as `test_image.jpg`

Option 3 - Create simple test image using Python:
```python
from PIL import Image

# Create a simple colored rectangle
img = Image.new('RGB', (800, 600), color='red')
img.save('test_image.jpg')
```

## Sample Data

### test_users.json
```json
{
  "admin": {
    "email": "admin@reportit.test",
    "password": "Admin123!",
    "role": "admin"
  },
  "user": {
    "email": "user@reportit.test",
    "password": "User123!",
    "role": "user"
  }
}
```

### test_reports.json
```json
[
  {
    "title": "Test Report 1",
    "description": "This is a test report for automated testing",
    "incident_type": "Suspicious Activity",
    "barangay": "Barangay 1",
    "latitude": 14.5995,
    "longitude": 120.9842
  }
]
```

## Usage in Tests

Test files automatically look for data in this directory:

```python
# In test_reports_crud.py
test_image_path = os.path.join(os.getcwd(), 'test_data', 'test_image.jpg')
```

## Notes

- Keep test data small and generic
- Do not commit sensitive or real user data
- Images should be appropriate and safe for testing
