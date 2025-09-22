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