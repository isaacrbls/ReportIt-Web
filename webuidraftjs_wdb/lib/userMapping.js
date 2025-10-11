import { getUserBarangayFromDB, getUserRoleFromDB } from './userDataUtils';

// Legacy hardcoded mappings - kept for backwards compatibility with test accounts
export const USER_BARANGAY_MAP = {
  "testpinagbakahan@example.com": "Pinagbakahan",
  "testbulihan@example.com": "Bulihan", 
  "testtiaong@example.com": "Tiaong",
  "testdakila@example.com": "Dakila",
  "testmojon@example.com": "Mojon",
  "testlook@example.com": "Look 1st",
  "testlongos@example.com": "Longos",
};

export const ADMIN_EMAILS = [
  "testpinagbakahan@example.com",
  "testbulihan@example.com", 
  "testtiaong@example.com",
  "testdakila@example.com",
  "testmojon@example.com",
  "testlook@example.com",
  "testlongos@example.com",
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
  "Tiaong": {
    center: [14.9502, 120.9002],
    zoom: 16
  },
  "Dakila": {
    center: [14.8555, 120.8186],
    zoom: 16
  },
  "Mojon": {
    center: [14.8617, 120.8118],
    zoom: 16
  },
  "Look 1st": {
    center: [14.8657, 120.8154],
    zoom: 16
  },
  "Longos": {
    center: [14.849, 120.813],
    zoom: 16
  }
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
      console.log(`✅ getUserBarangay: Found barangay from DB for ${userEmail}: ${barangay}`);
      return barangay;
    }
  } catch (error) {
    console.error(`❌ getUserBarangay: Error getting barangay from DB:`, error);
  }
  
  // Fallback to hardcoded map for test accounts
  const fallback = USER_BARANGAY_MAP[userEmail] || "";
  if (fallback) {
    console.log(`📋 getUserBarangay: Using hardcoded barangay for ${userEmail}: ${fallback}`);
  }
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
      console.log(`✅ isUserAdmin: Found role from DB for ${userEmail}: ${role} (isAdmin: ${isAdmin})`);
      return isAdmin;
    }
  } catch (error) {
    console.error(`❌ isUserAdmin: Error getting role from DB:`, error);
  }
  
  // Fallback to hardcoded list for test accounts
  const isTestAdmin = ADMIN_EMAILS.includes(userEmail);
  if (isTestAdmin) {
    console.log(`📋 isUserAdmin: Using hardcoded admin list for ${userEmail}: ${isTestAdmin}`);
  }
  return isTestAdmin;
}

/**
 * Get map coordinates for a user based on their barangay
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object|null>} Map coordinates {center, zoom} or null
 */
export async function getMapCoordinatesForUser(userEmail) {
  if (!userEmail) {
    console.log("🗺️ No user email provided (user may still be loading)");
    return null;
  }
  
  const barangay = await getUserBarangay(userEmail);
  
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    console.log("🗺️ No specific coordinates found for user:", userEmail);
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  console.log("🎯 Map coordinates for", userEmail, "(" + barangay + "):", coordinates);
  
  return coordinates;
}

export function getMapCoordinatesForBarangay(barangay) {
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    console.log("🗺️ No specific coordinates found for barangay:", barangay);
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  console.log("🎯 Map coordinates for barangay", barangay + ":", coordinates);
  
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