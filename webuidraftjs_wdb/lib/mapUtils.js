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

// Local area mapping for Malolos (approximate coordinates to known areas)
const localAreas = [
  { lat: 14.8743, lng: 120.8264, name: "A. Mabini Street, North Highlands Subdivision" },
  { lat: 14.8715, lng: 120.8207, name: "Dakila Village" },
  { lat: 14.8701, lng: 120.8185, name: "Longos Central Area" },
  { lat: 14.8692, lng: 120.8234, name: "Bulihan District" },
  { lat: 14.8724, lng: 120.8176, name: "Mojon Heights" },
  { lat: 14.8678, lng: 120.8198, name: "Pinagbakahan Area" },
  { lat: 14.8756, lng: 120.8145, name: "Look 1st Subdivision" },
  { lat: 14.8689, lng: 120.8267, name: "Tiaong Plaza Area" },
  { lat: 14.8734, lng: 120.8298, name: "Guinhawa Subdivision" },
  { lat: 14.8667, lng: 120.8223, name: "Babatnin District" },
  { lat: 14.8745, lng: 120.8312, name: "Maunlad Homes" },
  { lat: 14.8712, lng: 120.8289, name: "San Vicente Area" }
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1  
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get the nearest local area name based on coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Nearest local area name
 */
function getNearestLocalArea(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const area of localAreas) {
    const distance = calculateDistance(lat, lng, area.lat, area.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = area;
    }
  }
  
  // If we found a nearby area (within 2km), use it
  if (nearest && minDistance < 2) {
    return nearest.name;
  }
  
  // Otherwise, create a generic area name based on the general Malolos area
  if (lat >= 14.85 && lat <= 14.88 && lng >= 120.80 && lng <= 120.85) {
    return "Malolos City Area";
  } else if (lat >= 14.86 && lat <= 14.89 && lng >= 120.78 && lng <= 120.82) {
    return "Northern Malolos District";
  } else if (lat >= 14.84 && lat <= 14.87 && lng >= 120.80 && lng <= 120.84) {
    return "Central Malolos Area";
  } else {
    return "Bulacan Area";
  }
}

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
        // Fallback to display_name but clean it up, or use local area
        addressName = data.display_name?.split(',').slice(0, 2).join(', ') || 
                     getNearestLocalArea(lat, lng);
      }
    } else {
      addressName = getNearestLocalArea(lat, lng);
    }

    // Cache the result
    geocodeCache.set(cacheKey, addressName);
    return addressName;
    
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    
    // Enhanced fallback: try to match coordinates to known local areas
    const nearestLocation = getNearestLocalArea(lat, lng);
    geocodeCache.set(cacheKey, nearestLocation);
    return nearestLocation;
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