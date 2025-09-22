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

export function getUserBarangay(userEmail) {
  if (!userEmail) return "";
  return USER_BARANGAY_MAP[userEmail] || "";
}

export function isUserAdmin(userEmail) {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail);
}

export function getMapCoordinatesForUser(userEmail) {
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