// Centralized user to barangay mapping configuration
// This ensures consistent mapping across all components

export const USER_BARANGAY_MAP = {
  "testpinagbakahan@example.com": "Pinagbakahan",
  "testbulihan@example.com": "Bulihan", 
  "testtiaong@example.com": "Tiaong",
  "testdakila@example.com": "Dakila",
  "testmojon@example.com": "Mojon",
  "testlook@example.com": "Look 1st",
  "testlongos@example.com": "Longos",
  // Add more accounts and their barangay names here
};

// Centralized map coordinates for each barangay
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
 * Get barangay name for a user email
 * @param {string} userEmail - The user's email address
 * @returns {string} The barangay name or empty string if not found
 */
export function getUserBarangay(userEmail) {
  if (!userEmail) return "";
  return USER_BARANGAY_MAP[userEmail] || "";
}

/**
 * Get map coordinates for a user based on their email
 * @param {string} userEmail - The user's email address
 * @returns {object|null} Object containing center and zoom properties, or null if not found
 */
export function getMapCoordinatesForUser(userEmail) {
  // If userEmail is undefined or empty, return null
  if (!userEmail) {
    console.log("🗺️ No user email provided (user may still be loading)");
    return null;
  }
  
  const barangay = getUserBarangay(userEmail);
  
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    console.log("🗺️ No specific coordinates found for user:", userEmail);
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  console.log("🎯 Map coordinates for", userEmail, "(" + barangay + "):", coordinates);
  
  return coordinates;
}

/**
 * Get map coordinates for a barangay name
 * @param {string} barangay - The barangay name
 * @returns {object|null} Object containing center and zoom properties, or null if not found
 */
export function getMapCoordinatesForBarangay(barangay) {
  if (!barangay || !BARANGAY_COORDINATES[barangay]) {
    console.log("🗺️ No specific coordinates found for barangay:", barangay);
    return null;
  }
  
  const coordinates = BARANGAY_COORDINATES[barangay];
  console.log("🎯 Map coordinates for barangay", barangay + ":", coordinates);
  
  return coordinates;
}

/**
 * Check if a barangay should have map movement restrictions
 * @param {string} barangay - The barangay name
 * @returns {object|null} Bounds object if restricted, null if free movement
 */
export function getMapBounds(barangay) {
  // Only Bulihan has movement restrictions based on current logic
  if (barangay === "Bulihan") {
    return {
      bounds: [
        [14.8580, 120.8040], // Southwest corner of Bulihan
        [14.8640, 120.8100]  // Northeast corner of Bulihan
      ],
      viscosity: 1.0
    };
  }
  
  // All other barangays have free movement
  return null;
}