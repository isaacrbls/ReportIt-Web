import { getMapCoordinatesForUser, getMapCoordinatesForBarangay, getMapBounds } from "./userMapping";

/**
 * Universal map configuration utility
 * This provides consistent map behavior across all components
 */

/**
 * Get complete map configuration for a user
 * @param {string} userEmail - The user's email address
 * @param {object} options - Optional configuration overrides
 * @param {array} options.propCenter - Override center coordinates
 * @param {number} options.propZoom - Override zoom level  
 * @param {array} options.preloadedIncidents - Incidents to center map on
 * @returns {object} Complete map configuration
 */
export function getMapConfig(userEmail, options = {}) {
  const { propCenter, propZoom, preloadedIncidents } = options;
  
  let config = {
    center: [14.8527, 120.816], // Default center
    zoom: 14, // Default zoom
    bounds: null,
    barangay: ""
  };

  // Priority 1: Use prop center/zoom if provided (from admin page for specific accounts)
  if (propCenter && propZoom) {
    config.center = propCenter;
    config.zoom = propZoom;
    console.log("🎯 Using prop center/zoom:", config.center, "zoom:", config.zoom);
  }
  // Priority 2: If we have preloaded incidents (single report view), use the first incident's location
  else if (preloadedIncidents && preloadedIncidents.length > 0 && preloadedIncidents[0].Latitude && preloadedIncidents[0].Longitude) {
    config.center = [preloadedIncidents[0].Latitude, preloadedIncidents[0].Longitude];
    config.zoom = propZoom || 17; // Higher zoom for individual report view
    console.log("🎯 Using report geolocation as center:", config.center, "zoom:", config.zoom);
  }
  // Priority 3: Use user-specific coordinates
  else {
    const userCoordinates = getMapCoordinatesForUser(userEmail);
    config.center = userCoordinates.center;
    config.zoom = userCoordinates.zoom;
    console.log("🎯 Using user-specific coordinates for", userEmail, ":", config.center, "zoom:", config.zoom);
  }

  // Get barangay from user mapping
  const userBarangay = getUserBarangayFromEmail(userEmail);
  config.barangay = userBarangay;

  // Get bounds restrictions if any
  config.bounds = getMapBounds(userBarangay);
  
  console.log("🗺️ Final map config:", config);
  return config;
}

/**
 * Get map configuration for a specific barangay
 * @param {string} barangay - The barangay name
 * @param {object} options - Optional configuration overrides
 * @returns {object} Complete map configuration
 */
export function getMapConfigForBarangay(barangay, options = {}) {
  const { propCenter, propZoom } = options;
  
  let config = {
    center: [14.8527, 120.816], // Default center
    zoom: 14, // Default zoom
    bounds: null,
    barangay: barangay || ""
  };

  // Use prop center/zoom if provided, otherwise use barangay coordinates
  if (propCenter && propZoom) {
    config.center = propCenter;
    config.zoom = propZoom;
  } else {
    const barangayCoordinates = getMapCoordinatesForBarangay(barangay);
    config.center = barangayCoordinates.center;
    config.zoom = barangayCoordinates.zoom;
  }

  // Get bounds restrictions if any
  config.bounds = getMapBounds(barangay);
  
  return config;
}

/**
 * Get standard map options with restrictions if needed
 * @param {object} bounds - Bounds configuration from getMapConfig
 * @param {boolean} isReportDetail - Whether this is for report detail view
 * @param {boolean} isAddReport - Whether this is for add report functionality
 * @returns {object} Map options for Leaflet
 */
export function getMapOptions(bounds, isReportDetail = false, isAddReport = false) {
  let mapOptions = {
    minZoom: 16, // Minimum zoom level - users can't zoom out beyond this
    maxZoom: 19, // Maximum zoom level
    dragging: true, // Enable map dragging/panning
    scrollWheelZoom: true, // Keep zoom with mouse wheel
    doubleClickZoom: true, // Keep double-click zoom
    boxZoom: false, // Disable box zoom
    keyboard: true, // Enable keyboard navigation
    zoomControl: true, // Keep zoom buttons
  };

  // For report detail view or add report, don't restrict bounds
  if (isReportDetail) {
    console.log("🎯 Report detail view: No map bounds restriction");
    return mapOptions;
  }
  
  if (isAddReport) {
    console.log("📝 Add report view: No map bounds restriction - free movement enabled");
    return mapOptions;
  }
  
  // Apply bounds restrictions if specified
  if (bounds) {
    mapOptions.maxBounds = bounds.bounds;
    mapOptions.maxBoundsViscosity = bounds.viscosity;
    console.log("🔒 Map movement restricted with bounds:", bounds.bounds);
  } else {
    console.log("🆓 Map: Free movement enabled - no bounds restriction");
  }

  return mapOptions;
}

// Helper function to get barangay from email (avoiding circular import)
function getUserBarangayFromEmail(userEmail) {
  const USER_BARANGAY_MAP = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan", 
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    "testlook@example.com": "Look 1st",
    "testlongos@example.com": "Longos",
  };
  
  return USER_BARANGAY_MAP[userEmail] || "";
}