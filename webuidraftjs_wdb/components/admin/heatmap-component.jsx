"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

export default function HeatmapComponent({
  reports = [],
  barangay,
  center,
  zoom = 15,
  className = "h-[500px] w-full",
  showLegend = true,
  baseRadius = 40, 
  maxRadius = 120, 
  minOpacity = 0.2, 
  maxOpacity = 0.8, 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatCirclesRef = useRef([]);
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
    });
  }, []);

  useEffect(() => {
    if (!reports || reports.length === 0) {
      setHeatmapData([]);
      return;
    }

    let filteredReports = reports.filter(
      (report) => 
        report.Latitude && 
        report.Longitude && 
        report.Status === "Verified" &&
        (!barangay || report.Barangay === barangay)
    );

    if (filteredReports.length === 0) {
      setHeatmapData([]);
      return;
    }

    const processedData = createCustomHeatmapData(filteredReports);
    setHeatmapData(processedData);
  }, [reports, barangay]);

  const createCustomHeatmapData = (reports) => {
    
    const fineGridSize = 0.0002; 
    const initialClusters = {};
    const spatialIndex = new Map(); 

    reports.forEach((report) => {
      const gridLat = Math.floor(report.Latitude / fineGridSize) * fineGridSize;
      const gridLng = Math.floor(report.Longitude / fineGridSize) * fineGridSize;
      const key = `${gridLat.toFixed(6)}_${gridLng.toFixed(6)}`;

      if (!initialClusters[key]) {
        initialClusters[key] = {
          incidents: [],
          totalWeight: 0,
          centerLat: gridLat + fineGridSize / 2,
          centerLng: gridLng + fineGridSize / 2,
          gridKey: key,
          neighbors: new Set(),
        };

        const gridX = Math.floor(report.Longitude / fineGridSize);
        const gridY = Math.floor(report.Latitude / fineGridSize);
        spatialIndex.set(key, { x: gridX, y: gridY, cluster: initialClusters[key] });
      }

      initialClusters[key].incidents.push(report);
      const incidentWeight = calculateIncidentWeight(report);
      initialClusters[key].totalWeight += incidentWeight;
    });

    const clusters = Object.values(initialClusters);
    const mergedClusters = [];
    const processed = new Set();

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3; 
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

    clusters.forEach((cluster, index) => {
      if (processed.has(index)) return;

      const mergedCluster = {
        incidents: [...cluster.incidents],
        totalWeight: cluster.totalWeight,
        centerLat: cluster.centerLat,
        centerLng: cluster.centerLng,
      };

      const incidentCount = cluster.incidents.length;
      const avgWeight = cluster.totalWeight / incidentCount;
      
      let mergeDistanceMeters;
      
      if (avgWeight > 0.8 && incidentCount >= 2) {
        mergeDistanceMeters = 400; 
      } else if (incidentCount === 1) {
        mergeDistanceMeters = 100; 
      } else if (incidentCount <= 3) {
        mergeDistanceMeters = 200; 
      } else {
        mergeDistanceMeters = 350; 
      }

      const searchRadius = Math.ceil(mergeDistanceMeters / 111000 / fineGridSize); 
      const clusterSpatialData = spatialIndex.get(cluster.gridKey);
      
      if (clusterSpatialData) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            const neighborKey = `${(clusterSpatialData.x + dx) * fineGridSize}_${(clusterSpatialData.y + dy) * fineGridSize}`;
            const neighborSpatialData = spatialIndex.get(neighborKey);
            
            if (neighborSpatialData && neighborSpatialData.cluster !== cluster) {
              const otherIndex = clusters.findIndex(c => c === neighborSpatialData.cluster);
              if (otherIndex !== -1 && !processed.has(otherIndex)) {
                const distance = calculateDistance(
                  cluster.centerLat, cluster.centerLng,
                  neighborSpatialData.cluster.centerLat, neighborSpatialData.cluster.centerLng
                );
                
                if (distance <= mergeDistanceMeters) {
                  
                  mergedCluster.incidents.push(...neighborSpatialData.cluster.incidents);
                  mergedCluster.totalWeight += neighborSpatialData.cluster.totalWeight;
                  processed.add(otherIndex);
                }
              }
            }
          }
        }
      }

      if (mergedCluster.incidents.length > 0) {
        let totalLat = 0, totalLng = 0, totalWeights = 0;
        
        mergedCluster.incidents.forEach(incident => {
          const weight = calculateIncidentWeight(incident);
          totalLat += incident.Latitude * weight;
          totalLng += incident.Longitude * weight;
          totalWeights += weight;
        });
        
        mergedCluster.centerLat = totalLat / totalWeights;
        mergedCluster.centerLng = totalLng / totalWeights;
      }

      mergedClusters.push(mergedCluster);
      processed.add(index);
    });

    if (mergedClusters.length === 0) return [];

    const maxWeight = Math.max(...mergedClusters.map(c => c.totalWeight));
    const minWeight = Math.min(...mergedClusters.map(c => c.totalWeight));
    const weightRange = maxWeight - minWeight || 1;

    const processedCircles = mergedClusters.map((cluster) => {
      const incidentCount = cluster.incidents.length;
      const normalizedWeight = weightRange > 0 ? (cluster.totalWeight - minWeight) / weightRange : 0.5;
      const avgWeight = cluster.totalWeight / incidentCount;

      const now = new Date();
      const recentIncidents = cluster.incidents.filter(incident => {
        try {
          const incidentDate = incident.DateTime?.seconds ? 
            new Date(incident.DateTime.seconds * 1000) : 
            new Date(incident.DateTime || now);
          return (now - incidentDate) / (1000 * 60 * 60 * 24) <= 7; 
        } catch {
          return false;
        }
      }).length;
      
      const recentActivity = recentIncidents / incidentCount;
      const isHotArea = recentActivity > 0.5 && incidentCount >= 3;

      let radius, visualStrategy, riskLevel;
      
      if (incidentCount === 1) {
        radius = isHotArea ? 15 : 12;
        visualStrategy = 'individual';
        riskLevel = avgWeight > 0.7 ? 'medium' : 'low';
      } else if (incidentCount <= 3) {
        radius = isHotArea ? 30 + (incidentCount * 8) : 20 + (incidentCount * 6);
        visualStrategy = 'small_cluster';
        riskLevel = isHotArea || avgWeight > 0.6 ? 'medium' : 'low';
      } else if (incidentCount <= 8) {
        radius = isHotArea ? 70 + (incidentCount * 12) : 50 + (incidentCount * 8);
        visualStrategy = 'medium_hotspot';
        riskLevel = isHotArea ? 'high' : 'medium';
      } else if (incidentCount <= 15) {
        radius = isHotArea ? 150 + (incidentCount * 10) : 120 + (incidentCount * 6);
        visualStrategy = 'large_hotspot';
        riskLevel = 'high';
      } else {
        radius = 280;
        visualStrategy = 'major_area';
        riskLevel = 'critical';
      }

      let color;
      if (riskLevel === 'critical') {
        color = "#dc2626"; 
      } else if (riskLevel === 'high') {
        color = isHotArea ? "#ef4444" : "#f97316"; 
      } else if (riskLevel === 'medium') {
        color = isHotArea ? "#f59e0b" : "#eab308"; 
      } else {
        color = "#3b82f6"; 
      }

      let opacity = 0.4 + (normalizedWeight * 0.3) + (recentActivity * 0.2);
      if (isHotArea) opacity += 0.1;
      opacity = Math.min(opacity, 0.85);
      
      return {
        lat: cluster.centerLat,
        lng: cluster.centerLng,
        weight: cluster.totalWeight,
        incidentCount: incidentCount,
        incidents: cluster.incidents,
        radius: radius,
        opacity: opacity,
        color: color,
        normalizedWeight: Math.round(normalizedWeight * 100) / 100,
        visualStrategy: visualStrategy,
        riskLevel: riskLevel,
        recentActivity: recentActivity,
        recentIncidents: recentIncidents,
        isHotArea: isHotArea,
        avgWeight: Math.round(avgWeight * 100) / 100,
      };
    });

    console.log("🔥 Hybrid clustering processed:", {
      originalReports: reports.length,
      initialClusters: clusters.length,
      mergedClusters: mergedClusters.length,
      individual: processedCircles.filter(c => c.visualStrategy === 'individual').length,
      smallClusters: processedCircles.filter(c => c.visualStrategy === 'small_cluster').length,
      mediumHotspots: processedCircles.filter(c => c.visualStrategy === 'medium_hotspot').length,
      largeHotspots: processedCircles.filter(c => c.visualStrategy === 'large_hotspot').length,
      majorAreas: processedCircles.filter(c => c.visualStrategy === 'major_area').length,
      largestCluster: Math.max(...processedCircles.map(c => c.incidentCount)),
    });

    return processedCircles;
  };

  const getIntensityColorByCount = (count, normalizedWeight) => {
    if (count === 1 || count === 2) {
      return "#3b82f6"; 
    } else if (count >= 3 && count <= 5) {
      return "#eab308"; 
    } else {
      return "#ef4444"; 
    }
  };

  const calculateIncidentWeight = (report) => {
    let weight = 1.0; 

    const incidentTypeWeights = {
      "Robbery": 1.0,
      "Assault": 0.95,
      "Vehicle Theft": 0.9,
      "Theft": 0.8,
      "Burglary": 0.7,
      "Breaking and Entering": 0.6,
      "Vandalism": 0.4,
      "Fraud": 0.3,
      "Harassment": 0.2,
    };

    const typeWeight = incidentTypeWeights[report.IncidentType] || 0.5;
    weight *= typeWeight;

    const now = new Date();
    let incidentDate;
    
    try {
      if (report.DateTime) {
        if (report.DateTime.seconds) {
          incidentDate = new Date(report.DateTime.seconds * 1000);
        } else if (report.DateTime.toDate) {
          incidentDate = report.DateTime.toDate();
        } else {
          incidentDate = new Date(report.DateTime);
        }
      } else {
        incidentDate = new Date();
      }

      const daysDiff = (now - incidentDate) / (1000 * 60 * 60 * 24);

      let recencyWeight = 1.0;
      if (daysDiff > 7) {
        recencyWeight = Math.max(0.3, 1.0 - (daysDiff - 7) / 83 * 0.7);
      }
      
      weight *= recencyWeight;
    } catch (error) {
      
      weight *= 0.7;
    }

    return weight;
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = center || [14.8715, 120.8207];
    
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    heatCirclesRef.current.forEach(circle => {
      if (circle) {
        mapInstanceRef.current.removeLayer(circle);
      }
    });
    heatCirclesRef.current = [];

    if (heatmapData.length > 0) {
      heatmapData.forEach((data) => {
        
        const circle = L.circle([data.lat, data.lng], {
          radius: data.radius,
          fillColor: data.color,
          color: data.color,
          weight: data.incidentCount > 1 ? 2 : 1, 
          opacity: Math.min(data.opacity + 0.3, 0.9), 
          fillOpacity: data.opacity,
          className: 'crime-intensity-circle' 
        }).addTo(mapInstanceRef.current);

        const getStrategyLabel = (strategy, count) => {
          switch (strategy) {
            case 'individual': return 'Individual Incident';
            case 'small_cluster': return `Small Cluster (${count} incidents)`;
            case 'medium_hotspot': return `Crime Hotspot (${count} incidents)`;
            case 'large_hotspot': return `High-Risk Area (${count} incidents)`;
            case 'major_area': return `Major Crime Area (${count} incidents)`;
            default: return `Crime Area (${count} incidents)`;
          }
        };

        const strategyLabel = getStrategyLabel(data.visualStrategy, data.incidentCount);
        
        // Use proper risk level formatting
        const getRiskLevelText = (riskLevel) => {
          const levelMap = {
            'critical': 'Critical Risk',
            'high': 'High Risk',
            'medium': 'Medium Risk',
            'low': 'Low Risk'
          };
          return levelMap[riskLevel] || 'Unknown Risk';
        };
        
        const riskLevelText = getRiskLevelText(data.riskLevel);
        const riskIcon = data.riskLevel === 'critical' ? '🚨' :
                        data.riskLevel === 'high' ? '⚠️' :
                        data.riskLevel === 'medium' ? '⚡' : '📍';

        const popupContent = `
          <div class="p-3 min-w-[240px]">
            <h3 class="font-semibold text-sm mb-2 flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${data.color}"></div>
              ${strategyLabel}
              ${data.isHotArea ? '<span class="text-xs bg-red-100 text-red-700 px-1 rounded">HOT</span>' : ''}
            </h3>
            <div class="space-y-1 text-xs text-gray-600">
              <p><strong>📊 Total Incidents:</strong> ${data.incidentCount}</p>
              <p><strong>${riskIcon} Risk Level:</strong> <span class="font-medium" style="color: ${data.color}">${riskLevelText} Risk</span></p>
              <p><strong>� Recent Activity:</strong> ${data.recentIncidents} incidents (last 7 days)</p>
              <p><strong>�📍 Coverage Area:</strong> ~${data.radius}m radius</p>
              <p><strong>⚖️ Avg. Severity:</strong> ${(data.avgWeight * 100).toFixed(1)}%</p>
              ${data.isHotArea ? '<p><strong>🔥 Status:</strong> <span class="text-red-600 font-medium">Active Hotspot</span></p>' : ''}
            </div>
            ${data.incidentCount > 1 ? 
              `<div class="mt-2 p-2 bg-gray-50 rounded text-xs">
                <strong>Recent incidents in this area:</strong><br/>
                ${data.incidents.slice(0, 5).map(inc => {
                  const date = inc.DateTime?.seconds ? new Date(inc.DateTime.seconds * 1000) : new Date(inc.DateTime || Date.now());
                  const isRecent = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7;
                  return `• ${inc.IncidentType || 'Incident'} (${date.toLocaleDateString()}) ${isRecent ? '🔥' : ''}`;
                }).join('<br/>')}
                ${data.incidents.length > 5 ? `<br/>• +${data.incidents.length - 5} more incidents...` : ''}
              </div>` : 
              `<div class="mt-2 p-2 bg-gray-50 rounded text-xs">
                <strong>Incident Details:</strong><br/>
                • Type: ${data.incidents[0].IncidentType || 'Unknown'}<br/>
                • Date: ${data.incidents[0].DateTime ? new Date(data.incidents[0].DateTime.seconds ? data.incidents[0].DateTime.seconds * 1000 : data.incidents[0].DateTime).toLocaleDateString() : 'Unknown'}<br/>
                • Severity: ${(calculateIncidentWeight(data.incidents[0]) * 100).toFixed(1)}%
              </div>`
            }
            <p class="text-xs text-gray-500 mt-2 italic">
              ${data.riskLevel === 'critical' ? '🚨 Immediate attention required' : 
                data.riskLevel === 'high' ? '⚠️ High priority patrol area' :
                data.riskLevel === 'medium' ? '⚡ Moderate risk zone' :
                '📍 Low risk area'}
            </p>
          </div>
        `;

        circle.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'crime-cluster-popup'
        });

        circle.on('click', () => {
          console.log("🔍 Crime cluster clicked:", {
            incidents: data.incidentCount,
            location: [data.lat, data.lng],
            details: data.incidents
          });
        });

        circle.on('mouseover', function(e) {
          this.setStyle({
            fillOpacity: Math.min(data.opacity + 0.2, 0.8),
            weight: 3
          });
        });

        circle.on('mouseout', function(e) {
          this.setStyle({
            fillOpacity: data.opacity,
            weight: data.incidentCount > 1 ? 2 : 1
          });
        });

        heatCirclesRef.current.push(circle);
      });
      
      console.log("🗺️ Precise heatmap circles added:", heatmapData.length, "clusters with improved visualization");
    }
  }, [heatmapData]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
          <h4 className="text-sm font-semibold mb-3">Smart Crime Analysis</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs">Low Risk (1-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs">Medium Risk (3-8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-xs">High Risk (9-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span className="text-xs">Critical (16+)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">
              Enhanced Features:
            </p>
            <p className="text-xs text-gray-500">
              • Temporal analysis (recent activity)<br/>
              • Weighted incident severity<br/>
              • Hot area detection 🔥<br/>
              • Optimized clustering algorithm
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {heatmapData.length} analysis areas
              {heatmapData.filter(d => d.isHotArea).length > 0 && 
                ` • ${heatmapData.filter(d => d.isHotArea).length} hot areas 🔥`
              }
            </p>
          </div>
        </div>
      )}
      
      {heatmapData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No incident data available</p>
            <p className="text-sm">Heatmap will update when verified reports are available</p>
            {barangay && (
              <p className="text-xs mt-1">Showing data for: {barangay}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
