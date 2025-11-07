/**
 * 🔥 Hotspot Utilities for ReportIt Web
 * 
 * This module implements the hotspot calculation algorithm from ReportIt Mobile.
 * Hotspots are dynamic heat zones that visualize high-incident areas within a time window.
 * 
 * @see Implementation Guide: Hotspot Implementation Guide - ReportIt Mobile
 */

/**
 * Grid-based spatial clustering configuration
 * Grid size of 0.001 degrees ≈ 111 meters at equator
 * At Philippines latitude (~14°N), 1° longitude ≈ 108km
 */
export const HOTSPOT_CONFIG = {
  GRID_SIZE: 0.001,           // ~111 meters
  HOTSPOT_THRESHOLD: 2,       // Minimum incidents to qualify as hotspot
  DEFAULT_DAYS_WINDOW: 30,    // Default time window in days
  MIN_RADIUS: 50,             // Minimum circle radius in meters
  MAX_RADIUS: 150,            // Maximum circle radius in meters
  RADIUS_SCALE_FACTOR: 60,    // Scale factor for radius calculation
  
  // Risk level thresholds
  HIGH_RISK_THRESHOLD: 5,     // 5+ incidents = high risk
  MEDIUM_RISK_THRESHOLD: 3,   // 3-4 incidents = medium risk
  // 2 incidents = low risk (implicit)
  
  // Visual styling
  COLORS: {
    high: '#DC2626',    // red-600
    medium: '#F59E0B',  // amber-500
    low: '#10B981',     // emerald-500
  },
  OPACITY: 0.2,
  BORDER_WEIGHT: 3,
};

/**
 * Get color for a risk level
 * @param {string} riskLevel - 'low' | 'medium' | 'high'
 * @returns {string} Hex color code
 */
export const getHotspotColor = (riskLevel) => {
  return HOTSPOT_CONFIG.COLORS[riskLevel] || HOTSPOT_CONFIG.COLORS.low;
};

/**
 * Calculate risk level based on incident count
 * @param {number} incidentCount - Number of incidents in hotspot
 * @returns {string} Risk level: 'low' | 'medium' | 'high'
 */
export const calculateRiskLevel = (incidentCount) => {
  if (incidentCount >= HOTSPOT_CONFIG.HIGH_RISK_THRESHOLD) return 'high';
  if (incidentCount >= HOTSPOT_CONFIG.MEDIUM_RISK_THRESHOLD) return 'medium';
  return 'low';
};

/**
 * Calculate dynamic hotspot radius based on incident density
 * Formula: radius = sqrt(count) * scale_factor, clamped between min-max
 * 
 * Examples:
 * - 2 incidents → 85 meters
 * - 3 incidents → 104 meters
 * - 5 incidents → 134 meters
 * - 10+ incidents → 150 meters (max)
 * 
 * @param {number} incidentCount - Number of incidents in hotspot
 * @returns {number} Radius in meters
 */
export const calculateHotspotRadius = (incidentCount) => {
  const { MIN_RADIUS, MAX_RADIUS, RADIUS_SCALE_FACTOR } = HOTSPOT_CONFIG;
  return Math.max(
    MIN_RADIUS, 
    Math.min(
      Math.sqrt(incidentCount) * RADIUS_SCALE_FACTOR, 
      MAX_RADIUS
    )
  );
};

/**
 * Validate if a report should be included in hotspot calculation
 * Filters:
 * - Must be verified
 * - Must have valid coordinates (not 0,0 or null)
 * - Must not be sensitive
 * - Must be within time window
 * 
 * @param {Object} report - Report object from Firestore
 * @param {Date} dateThreshold - Minimum date for inclusion
 * @param {string|null} targetBarangay - Optional barangay filter
 * @returns {boolean} True if report should be included
 */
export const isReportValidForHotspot = (report, dateThreshold, targetBarangay = null) => {
  // Must be verified
  if (report.Status !== "Verified") return false;

  // Must have valid coordinates
  if (!report.Latitude || !report.Longitude || 
      report.Latitude === 0 || report.Longitude === 0) {
    return false;
  }

  // Must not be sensitive
  if (report.isSensitive === true) return false;

  // Check date (handle different date formats)
  let reportDate = null;
  if (report.DateTime) {
    if (typeof report.DateTime === 'string') {
      reportDate = new Date(report.DateTime);
    } else if (report.DateTime.seconds) {
      // Firestore Timestamp
      reportDate = new Date(report.DateTime.seconds * 1000);
    } else if (report.DateTime.toDate) {
      reportDate = report.DateTime.toDate();
    }
  }
  
  if (!reportDate || isNaN(reportDate.getTime())) {
    return false;
  }

  if (reportDate < dateThreshold) return false;

  // Optional barangay filter
  if (targetBarangay && report.Barangay !== targetBarangay) {
    return false;
  }

  return true;
};

/**
 * Group reports into grid cells for spatial clustering
 * Uses grid-based clustering to group nearby incidents
 * 
 * @param {Array} reports - Array of filtered reports
 * @returns {Object} Grid cells keyed by 'lat_lng'
 */
export const clusterReportsIntoGrids = (reports) => {
  const { GRID_SIZE } = HOTSPOT_CONFIG;
  const gridCells = {};
  
  reports.forEach(report => {
    // Round coordinates to nearest grid cell
    const gridLat = Math.floor(report.Latitude / GRID_SIZE) * GRID_SIZE;
    const gridLng = Math.floor(report.Longitude / GRID_SIZE) * GRID_SIZE;
    const key = `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
    
    if (!gridCells[key]) {
      gridCells[key] = {
        id: key,
        // Center point is midpoint of grid cell
        lat: gridLat + (GRID_SIZE / 2),
        lng: gridLng + (GRID_SIZE / 2),
        incidents: [],
        barangay: report.Barangay
      };
    }
    
    gridCells[key].incidents.push(report);
  });

  return gridCells;
};

/**
 * Convert grid cells to hotspot objects
 * @param {Object} gridCells - Grid cells from clusterReportsIntoGrids
 * @returns {Array} Array of hotspot objects
 */
export const convertGridCellsToHotspots = (gridCells) => {
  const { HOTSPOT_THRESHOLD } = HOTSPOT_CONFIG;
  
  return Object.values(gridCells)
    .filter(cell => cell.incidents.length >= HOTSPOT_THRESHOLD)
    .map(cell => {
      const incidentCount = cell.incidents.length;
      
      return {
        id: cell.id,
        lat: cell.lat,
        lng: cell.lng,
        incidentCount,
        riskLevel: calculateRiskLevel(incidentCount),
        incidents: cell.incidents,
        radius: calculateHotspotRadius(incidentCount),
        barangay: cell.barangay
      };
    })
    .sort((a, b) => b.incidentCount - a.incidentCount);
};

/**
 * Calculate hotspots from reports array
 * Main algorithm implementation
 * 
 * @param {Array} reports - All reports from database
 * @param {Object} options - Configuration options
 * @param {string|null} options.targetBarangay - Filter to specific barangay
 * @param {number} options.daysWindow - Number of days to look back (default: 30)
 * @returns {Array} Array of hotspot objects
 */
export const calculateHotspotsFromReports = (reports, options = {}) => {
  const { 
    targetBarangay = null, 
    daysWindow = HOTSPOT_CONFIG.DEFAULT_DAYS_WINDOW 
  } = options;

  console.log('🔥 Calculating hotspots...', { targetBarangay, daysWindow, totalReports: reports.length });
  
  if (!reports || !reports.length) {
    console.log('📊 No reports available');
    return [];
  }

  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysWindow);
  
  console.log('📅 Date threshold:', dateThreshold.toLocaleDateString());

  // Filter reports according to specs
  const filteredReports = reports.filter(report => 
    isReportValidForHotspot(report, dateThreshold, targetBarangay)
  );

  console.log('📊 Found', filteredReports.length, 'verified reports within', daysWindow, 'days');

  // Grid-based clustering
  const gridCells = clusterReportsIntoGrids(filteredReports);
  
  // Convert to hotspots
  const hotspots = convertGridCellsToHotspots(gridCells);

  // Log risk breakdown
  const riskBreakdown = {
    high: hotspots.filter(h => h.riskLevel === 'high').length,
    medium: hotspots.filter(h => h.riskLevel === 'medium').length,
    low: hotspots.filter(h => h.riskLevel === 'low').length,
  };
  
  console.log('🔥 Found', hotspots.length, 'hotspots:', riskBreakdown);

  return hotspots;
};

/**
 * Get statistics about hotspots
 * @param {Array} hotspots - Array of hotspot objects
 * @returns {Object} Hotspot statistics
 */
export const getHotspotStats = (hotspots) => {
  if (!hotspots || !hotspots.length) {
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalIncidents: 0,
      averageIncidentsPerHotspot: 0,
    };
  }

  const high = hotspots.filter(h => h.riskLevel === 'high').length;
  const medium = hotspots.filter(h => h.riskLevel === 'medium').length;
  const low = hotspots.filter(h => h.riskLevel === 'low').length;
  const totalIncidents = hotspots.reduce((sum, h) => sum + h.incidentCount, 0);

  return {
    total: hotspots.length,
    high,
    medium,
    low,
    totalIncidents,
    averageIncidentsPerHotspot: (totalIncidents / hotspots.length).toFixed(1),
  };
};

/**
 * Get the most dangerous hotspot (highest incident count)
 * @param {Array} hotspots - Array of hotspot objects
 * @returns {Object|null} Most dangerous hotspot or null
 */
export const getMostDangerousHotspot = (hotspots) => {
  if (!hotspots || !hotspots.length) return null;
  return hotspots[0]; // Already sorted by incident count descending
};

/**
 * Filter hotspots by risk level
 * @param {Array} hotspots - Array of hotspot objects
 * @param {string} riskLevel - 'low' | 'medium' | 'high'
 * @returns {Array} Filtered hotspots
 */
export const filterHotspotsByRiskLevel = (hotspots, riskLevel) => {
  return hotspots.filter(h => h.riskLevel === riskLevel);
};

/**
 * Format hotspot for popup display
 * @param {Object} hotspot - Hotspot object
 * @returns {Object} Formatted data for display
 */
export const formatHotspotForDisplay = (hotspot) => {
  const riskLevelDisplay = hotspot.riskLevel.charAt(0).toUpperCase() + hotspot.riskLevel.slice(1);
  const colorClass = 
    hotspot.riskLevel === 'high' ? 'text-red-600' :
    hotspot.riskLevel === 'medium' ? 'text-amber-600' : 
    'text-emerald-600';

  return {
    riskLevel: hotspot.riskLevel,
    riskLevelDisplay,
    colorClass,
    incidentCount: hotspot.incidentCount,
    radius: Math.round(hotspot.radius),
    location: `${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}`,
    barangay: hotspot.barangay || 'Unknown',
    emoji: hotspot.riskLevel === 'high' ? '🔥' : hotspot.riskLevel === 'medium' ? '⚠️' : '📍',
  };
};
