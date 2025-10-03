import { getMapCoordinatesForUser, getMapCoordinatesForBarangay, getMapBounds } from "./userMapping";

export function getMapConfig(userEmail, options = {}) {
  const { propCenter, propZoom, preloadedIncidents } = options;
  
  let config = {
    center: [14.8527, 120.816], 
    zoom: 14, 
    bounds: null,
    barangay: ""
  };

  if (propCenter && propZoom) {
    config.center = propCenter;
    config.zoom = propZoom;
    console.log("🎯 Using prop center/zoom:", config.center, "zoom:", config.zoom);
  }
  
  else if (preloadedIncidents && preloadedIncidents.length > 0 && preloadedIncidents[0].Latitude && preloadedIncidents[0].Longitude) {
    config.center = [preloadedIncidents[0].Latitude, preloadedIncidents[0].Longitude];
    config.zoom = propZoom || 17; 
    console.log("🎯 Using report geolocation as center:", config.center, "zoom:", config.zoom);
  }
  
  else {
    const userCoordinates = getMapCoordinatesForUser(userEmail);
    config.center = userCoordinates.center;
    config.zoom = userCoordinates.zoom;
    console.log("🎯 Using user-specific coordinates for", userEmail, ":", config.center, "zoom:", config.zoom);
  }

  const userBarangay = getUserBarangayFromEmail(userEmail);
  config.barangay = userBarangay;

  config.bounds = getMapBounds(userBarangay);
  
  console.log("🗺️ Final map config:", config);
  return config;
}

export function getMapConfigForBarangay(barangay, options = {}) {
  const { propCenter, propZoom } = options;
  
  let config = {
    center: [14.8527, 120.816], 
    zoom: 14, 
    bounds: null,
    barangay: barangay || ""
  };

  if (propCenter && propZoom) {
    config.center = propCenter;
    config.zoom = propZoom;
  } else {
    const barangayCoordinates = getMapCoordinatesForBarangay(barangay);
    config.center = barangayCoordinates.center;
    config.zoom = barangayCoordinates.zoom;
  }

  config.bounds = getMapBounds(barangay);
  
  return config;
}

export function getMapOptions(bounds, isReportDetail = false, isAddReport = false) {
  let mapOptions = {
    minZoom: 16, 
    maxZoom: 19, 
    dragging: true, 
    scrollWheelZoom: true, 
    doubleClickZoom: true, 
    boxZoom: false, 
    keyboard: true, 
    zoomControl: true, 
  };

  if (isReportDetail) {
    console.log("🎯 Report detail view: No map bounds restriction");
    return mapOptions;
  }
  
  if (isAddReport) {
    console.log("📝 Add report view: No map bounds restriction - free movement enabled");
    return mapOptions;
  }

  if (bounds) {
    mapOptions.maxBounds = bounds.bounds;
    mapOptions.maxBoundsViscosity = bounds.viscosity;
    console.log("🔒 Map movement restricted with bounds:", bounds.bounds);
  } else {
    console.log("🆓 Map: Free movement enabled - no bounds restriction");
  }

  return mapOptions;
}

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

// Cache for storing geocoded addresses to avoid repeated API calls
const geocodeCache = new Map();

/**
 * Convert coordinates to a readable street address using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Formatted address or fallback location name
 */
export async function reverseGeocode(lat, lng) {
  const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // Use OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ReportIt-Web/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    let addressName = '';
    
    if (data && data.address) {
      const addr = data.address;
      
      // Priority order for street naming
      const streetName = addr.road || addr.pedestrian || addr.footway || addr.path;
      const buildingName = addr.building || addr.house_name;
      const housenumber = addr.house_number;
      const suburb = addr.suburb || addr.neighbourhood || addr.village;
      const barangay = addr.city_district || addr.district;
      
      if (streetName) {
        addressName = streetName;
        if (housenumber) {
          addressName = `${housenumber} ${streetName}`;
        }
        if (suburb && suburb !== streetName) {
          addressName += `, ${suburb}`;
        }
      } else if (buildingName) {
        addressName = buildingName;
        if (suburb) {
          addressName += `, ${suburb}`;
        }
      } else if (suburb) {
        addressName = suburb;
        if (barangay) {
          addressName += `, ${barangay}`;
        }
      } else {
        // Fallback to display_name but clean it up
        addressName = data.display_name?.split(',').slice(0, 2).join(', ') || 
                     `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    } else {
      addressName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }

    // Cache the result
    geocodeCache.set(cacheKey, addressName);
    return addressName;
    
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    // Return fallback name
    const fallbackName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    geocodeCache.set(cacheKey, fallbackName);
    return fallbackName;
  }
}

/**
 * Generate a hotspot name using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} barangay - Barangay name
 * @returns {Promise<string>} - Formatted hotspot name
 */
export async function generateHotspotName(lat, lng, barangay) {
  const streetAddress = await reverseGeocode(lat, lng);
  
  // If we got a meaningful street address, use it
  if (streetAddress && !streetAddress.startsWith('Location (')) {
    return `${streetAddress} Area`;
  }
  
  // Fallback to barangay-based naming
  return `${barangay} Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}