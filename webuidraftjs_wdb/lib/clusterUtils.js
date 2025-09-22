// Utility functions for clustering incidents

// Calculate distance between two points in meters using Haversine formula
export const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Cluster incidents based on proximity
export const clusterIncidents = (incidents, maxDistance = 500, minClusterSize = 6) => {
  if (!incidents || incidents.length === 0) return [];
  
  const clusters = [];
  const processed = new Set();
  
  // Location names for areas
  const locationNames = [
    "Golden Ville Estates", "Phase 7F Cactus 2st", "Casa Hips", 
    "Humel Heritage Homes", "Longos II Elementary School", 
    "Bulihan Central", "Mojon Heights", "Dakila Village",
    "Pinagbakahan District", "Look 1st Subdivision", "Tiaong Plaza"
  ];
  
  incidents.forEach((incident, i) => {
    if (processed.has(i)) return;
    
    const cluster = {
      id: Date.now() + i,
      lat: incident.Latitude,
      lng: incident.Longitude,
      incidents: [incident],
      locationName: locationNames[Math.floor(Math.random() * locationNames.length)]
    };
    
    // Find nearby incidents
    incidents.forEach((other, j) => {
      if (i !== j && !processed.has(j)) {
        const distance = getDistance(incident.Latitude, incident.Longitude, other.Latitude, other.Longitude);
        if (distance <= maxDistance) {
          cluster.incidents.push(other);
          processed.add(j);
        }
      }
    });
    
    // Calculate cluster center (weighted average)
    const totalLat = cluster.incidents.reduce((sum, inc) => sum + inc.Latitude, 0);
    const totalLng = cluster.incidents.reduce((sum, inc) => sum + inc.Longitude, 0);
    cluster.lat = totalLat / cluster.incidents.length;
    cluster.lng = totalLng / cluster.incidents.length;
    cluster.count = cluster.incidents.length;
    
    processed.add(i);
    
    // Only add clusters that meet minimum size requirement
    if (cluster.count >= minClusterSize) {
      clusters.push(cluster);
    }
  });
  
  // Sort by incident count (highest first)
  clusters.sort((a, b) => b.count - a.count);
  return clusters;
};

// Count high-risk areas (clusters with 6+ incidents)
export const countHighRiskAreas = (incidents) => {
  const clusters = clusterIncidents(incidents, 500, 6);
  return clusters.length;
};