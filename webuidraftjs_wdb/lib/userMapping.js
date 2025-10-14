import { getUserBarangayFromDB, getUserRoleFromDB } from './userDataUtils';

// Legacy hardcoded mappings - kept for backwards compatibility with test accounts
export const USER_BARANGAY_MAP = {
  "testpinagbakahan@example.com": "Pinagbakahan",
  "testbulihan@example.com": "Bulihan", 
  "testdakila@example.com": "Dakila",
  "testmojon@example.com": "Mojon",
  "testlook@example.com": "Look 1st",
};

export const ADMIN_EMAILS = [
  "testpinagbakahan@example.com",
  "testbulihan@example.com", 
  "testdakila@example.com",
  "testmojon@example.com",
  "testlook@example.com",
];

export const BARANGAY_COORDINATES = {
  "Pinagbakahan": {
    center: [14.8715, 120.8207],
    zoom: 16
  },
  "Bulihan": {
    center: [14.8612, 120.8067],
    zoom: 16
  },
  "Dakila": {
    center: [14.851228, 120.836773],
    zoom: 16
  },
  "Mojon": {
    center: [14.866605, 120.820589],
    zoom: 16
  },
  "Look 1st": {
    center: [14.882806, 120.808643],
    zoom: 16
  },
};

/**
 * Get user's barangay - checks database first, falls back to hardcoded map for test accounts
 * @param {string} userEmail - User's email address
 * @returns {Promise<string>} User's barangay name
 */
export async function getUserBarangay(userEmail) {
  if (!userEmail) return "";
  
  // First, try to get from database
  try {
    const barangay = await getUserBarangayFromDB(userEmail);
    if (barangay) {
      return barangay;
    }
  } catch (error) {
    // Silent fail
  }
  
  // Fallback to hardcoded map for test accounts
  const fallback = USER_BARANGAY_MAP[userEmail] || "";
  return fallback;
}

/**
 * Check if user is an admin - checks database first, falls back to hardcoded list for test accounts
 * @param {string} userEmail - User's email address
 * @returns {Promise<boolean>} True if user is an admin
 */
export async function isUserAdmin(userEmail) {
  if (!userEmail) return false;
  
  // First, try to get role from database
  try {
    const role = await getUserRoleFromDB(userEmail);
    if (role) {
      const isAdmin = role.toLowerCase() === 'admin';
      return isAdmin;
    }
  } catch (error) {
    // Silent fail
  }
  
  // Fallback to hardcoded list for test accounts
  const isTestAdmin = ADMIN_EMAILS.includes(userEmail);
  return isTestAdmin;
}

/**
 * Get map coordinates for a user based on their barangay
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object|null>} Map coordinates {center, zoom} or null
 */
export async function getMapCoordinatesForUser(userEmail) {
  if (!userEmail) {
    return null;
  }
  
  const barangay = await getUserBarangay(userEmail);
  
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  
  return coordinates;
}

export function getMapCoordinatesForBarangay(barangay) {
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  
  return coordinates;
}

export function getMapBounds(barangay) {
  if (barangay === "Bulihan") {
    return {
      bounds: [
        [14.8580, 120.8040],
        [14.8640, 120.8100]
      ],
      viscosity: 1.0
    };
  }
  
  return null;
}
