"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"
import { getMapConfig, getMapOptions, reverseGeocode, filterExpiredMarkers } from "@/lib/mapUtils"
import { getMapCoordinatesForBarangay } from "@/lib/userMapping"
import { useCurrentUser } from "@/hooks/use-current-user"
import { clusterIncidents } from "@/lib/clusterUtils"

let leafletCSSLoaded = false;
const loadLeafletCSS = () => {
	if (typeof window !== 'undefined' && !leafletCSSLoaded) {
		try {
			require("leaflet/dist/leaflet.css");
			leafletCSSLoaded = true;
		} catch (error) {
			console.warn("Failed to load Leaflet CSS:", error);
			
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
			leafletCSSLoaded = true;
		}
	}
};

const fixLeafletIcons = () => {
	
	delete L.Icon.Default.prototype._getIconUrl

	L.Icon.Default.mergeOptions({
		iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
		iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
		shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
	})
}

const createCustomIcon = (riskLevel) => {
	const getMarkerColor = (riskLevel) => {
		switch (riskLevel) {
			case "High":
			case "high":
				return "#ef4444"; // Red
			case "Medium":
			case "medium":
				return "#f97316"; // Orange
			case "Low":
			case "low":
			default:
				return "#eab308"; // Yellow
		}
	};

	const color = getMarkerColor(riskLevel);
	
	const markerSvg = `
		<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
			<path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" 
				  fill="${color}" 
				  stroke="#ffffff" 
				  stroke-width="2"/>
			<circle cx="12.5" cy="12.5" r="6" fill="#ffffff"/>
			<circle cx="12.5" cy="12.5" r="3" fill="${color}"/>
		</svg>
	`;

	const iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg);

	return new L.Icon({
		iconUrl: iconUrl,
		shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
	})
}

export default function MapComponent({
	onMapClick,
	onMarkerClick,
	addingIncident,
	newIncidentLocation,
	newIncidentRisk,
	barangay,
	center: propCenter,
	zoom: propZoom,
	hotspots = [], 
	preloadedIncidents = null, 
	showPopups = true,
	showHotspots = true,
	showClusters = false,
	showOnlyTopCluster = false,
}) {
	const [incidents, setIncidents] = useState([]) 
	const mapRef = useRef(null)
	const mapInstanceRef = useRef(null)
	const { user, isLoading: isUserLoading } = useCurrentUser() 
	const [isMapReady, setIsMapReady] = useState(false)
	const [mapError, setMapError] = useState(null)
	const [clusters, setClusters] = useState([])
	const cleanupTimeoutRef = useRef(null)

	// Safe marker cleanup function
	const safeCleanupMarkers = () => {
		markersRef.current.forEach(markerData => {
			if (markerData && markerData.marker) {
				try {
					// Check if marker is still on the map before removing
					if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(markerData.marker)) {
						mapInstanceRef.current.removeLayer(markerData.marker);
					}
				} catch (error) {
					console.warn('Warning during marker cleanup:', error);
				}
			}
		});
		markersRef.current = [];
	};

	const renderHotspots = (hotspotsToRender) => {
		if (!mapInstanceRef.current || !hotspotsToRender || hotspotsToRender.length === 0) {
			return false;
		}

		try {
			
			hotspotsRef.current.forEach(circle => {
				if (circle) {
					try {
						circle.remove();
					} catch (error) {
						console.warn("Warning removing hotspot circle:", error);
					}
				}
			});
			hotspotsRef.current = [];

			console.log("🔥 Rendering", hotspotsToRender.length, "hotspots to map");
			hotspotsToRender.forEach((hotspot, index) => {
				const color = hotspot.riskLevel === 'high' ? '#ef4444' :     
							  hotspot.riskLevel === 'medium' ? '#f97316' :   
							  '#eab308';                                     
				
				console.log(`🎯 Hotspot ${index + 1}: ${hotspot.incidentCount} incidents, ${hotspot.radius}m radius, ${hotspot.riskLevel} risk at [${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}]`);
			
				const circle = L.circle([hotspot.lat, hotspot.lng], {
					color: color,
					fillColor: color,
					fillOpacity: 0.25,
					radius: hotspot.radius,
					weight: 2,
					opacity: 0.8,
				}).addTo(mapInstanceRef.current);

				const popupContent = `
					<div class="p-3">
						<h3 class="font-medium text-sm mb-2">Crime Hotspot</h3>
						<div class="space-y-1">
							<p class="text-xs text-gray-600">
								Risk Level: <span class="font-medium ${
									hotspot.riskLevel === 'high' ? 'text-red-600' :
									hotspot.riskLevel === 'medium' ? 'text-orange-600' : 'text-yellow-600'
								}">${hotspot.riskLevel.charAt(0).toUpperCase() + hotspot.riskLevel.slice(1)}</span>
							</p>
							<p class="text-xs text-gray-600">
								${hotspot.incidentCount} incidents in ${hotspot.radius}m radius
							</p>
							<p class="text-xs text-gray-500">
								${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
							</p>
							<p class="text-xs text-gray-500 mt-2">
								Based on verified reports within 100m grid
							</p>
						</div>
					</div>
				`;

				circle.bindPopup(popupContent);
				hotspotsRef.current.push(circle);
			});
			return true;
		} catch (error) {
			console.error("❌ Error rendering hotspots to map:", error);
			return false;
		}
	};

	const clustersRef = useRef([]);

	const renderClusters = (clustersToRender) => {
		if (!mapInstanceRef.current || !clustersToRender || clustersToRender.length === 0) {
			return false;
		}

		try {
			// Clear existing cluster markers
			clustersRef.current.forEach(marker => {
				if (marker) {
					try {
						marker.remove();
					} catch (error) {
						console.warn("Warning removing cluster marker:", error);
					}
				}
			});
			clustersRef.current = [];

			console.log("🎯 Rendering", clustersToRender.length, "clusters to map");
			
			clustersToRender.forEach((cluster, index) => {
				// Create custom icon with count
				const clusterIcon = L.divIcon({
					html: `
						<div class="relative">
							<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
								${cluster.count}
							</div>
						</div>
					`,
					className: 'cluster-marker',
					iconSize: [32, 32],
					iconAnchor: [16, 16],
				});

				const marker = L.marker([cluster.lat, cluster.lng], { 
					icon: clusterIcon 
				}).addTo(mapInstanceRef.current);

				// Add location label
				const labelIcon = L.divIcon({
					html: `
						<div class="bg-white px-2 py-1 rounded shadow-md border text-xs font-medium text-gray-700 whitespace-nowrap">
							${cluster.locationName}
						</div>
					`,
					className: 'location-label',
					iconSize: [0, 0],
					iconAnchor: [-20, -40],
				});

				const labelMarker = L.marker([cluster.lat, cluster.lng], { 
					icon: labelIcon,
					zIndexOffset: 1000
				}).addTo(mapInstanceRef.current);

				// Popup with cluster details
				const popupContent = `
					<div class="p-3">
						<h3 class="font-medium text-sm mb-2">${cluster.locationName}</h3>
						<div class="space-y-1">
							<p class="text-xs text-gray-600">
								<span class="font-medium">${cluster.count}</span> incidents in this cluster
							</p>
							<p class="text-xs text-gray-500">
								${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}
							</p>
						</div>
					</div>
				`;

				marker.bindPopup(popupContent);
				
				clustersRef.current.push(marker);
				clustersRef.current.push(labelMarker);
			});
			
			// Center the map on the top cluster (first cluster, as they're sorted by count)
			if (clustersToRender.length > 0 && showOnlyTopCluster) {
				const topCluster = clustersToRender[0];
				setTimeout(() => {
					mapInstanceRef.current.setView([topCluster.lat, topCluster.lng], 16);
					console.log(`🎯 Centered map on top cluster at [${topCluster.lat.toFixed(4)}, ${topCluster.lng.toFixed(4)}] with ${topCluster.count} incidents`);
				}, 100);
			}
			
			return true;
		} catch (error) {
			console.error("❌ Error rendering clusters to map:", error);
			return false;
		}
	};

	const fetchReports = async () => {
		try {
			console.log("Fetching reports from database...");
			const querySnapshot = await getDocs(collection(db, "reports"));
			const reportsData = [];
			
			// Determine if this is a dashboard view or report detail view
			const isDashboardView = !preloadedIncidents || preloadedIncidents.length === 0;
			
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				console.log("Processing report:", data);

				if (data.Latitude && data.Longitude) {
					const incident = {
						id: doc.id,
						location: [data.Latitude, data.Longitude],
						title: data.Title || data.IncidentType || "Incident",
						description: data.Description || "No description available",
						category: data.IncidentType || "Other",
						risk: determineRiskLevel(data.IncidentType),
						date: formatDate(data.DateTime),
						time: formatTime(data.DateTime),
						barangay: data.Barangay || "Unknown",
						status: data.Status || "Pending",
						isSensitive: data.isSensitive || false,
						DateTime: data.DateTime // Include original DateTime for expiration check
					};

					if ((!barangay || data.Barangay === barangay) && 
						(data.Status === "Verified" || data.Status === "Pending")) {
						reportsData.push(incident);
					}
				}
			});
			
			// Apply marker expiration filtering for dashboard views only
			const filteredReports = filterExpiredMarkers(reportsData, isDashboardView);
			
			console.log("Found reports with geolocation:", reportsData.length);
			if (isDashboardView) {
				console.log("Filtered expired markers for dashboard:", filteredReports.length, "remaining");
			}
			
			setIncidents(filteredReports);
		} catch (error) {
			console.error("Error fetching reports:", error);
		}
	};

	const determineRiskLevel = (incidentType) => {
		if (!incidentType) return "Medium";
		const type = incidentType.toLowerCase();
		if (type.includes("robbery") || type.includes("assault") || type.includes("violence")) {
			return "High";
		} else if (type.includes("theft") || type.includes("burglary")) {
			return "High";
		} else if (type.includes("vandalism") || type.includes("disturbance")) {
			return "Medium";
		}
		return "Medium";
	};

	const formatDate = (dateValue) => {
		if (!dateValue) return "Unknown date";
		try {
			let date;
			if (dateValue.seconds) {
				
				date = new Date(dateValue.seconds * 1000);
			} else if (dateValue.toDate) {
				
				date = dateValue.toDate();
			} else {
				date = new Date(dateValue);
			}
			// Format as "September 6, 2025" (date only, no time)
			const options = {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			};
			return date.toLocaleDateString('en-US', options);
		} catch (error) {
			return "Unknown date";
		}
	};

	const formatTime = (dateValue) => {
		if (!dateValue) return "Unknown time";
		try {
			let date;
			if (dateValue.seconds) {
				date = new Date(dateValue.seconds * 1000);
			} else if (dateValue.toDate) {
				date = dateValue.toDate();
			} else {
				date = new Date(dateValue);
			}
			// Format as "3:00 PM" without timezone
			const options = {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			};
			return date.toLocaleTimeString('en-US', options);
		} catch (error) {
			return "Unknown time";
		}
	};

	useEffect(() => {
		const style = document.createElement('style')
		style.textContent = `
			.leaflet-map-pane {
				z-index: 1 !important;
			}
			.leaflet-popup-pane {
				z-index: 999 !important;
			}
			.leaflet-control-container {
				z-index: 1 !important;
			}
			.leaflet-top {
				z-index: 1 !important;
			}
			.leaflet-bottom {
				z-index: 1 !important;
			}
			.leaflet-control {
				z-index: 1 !important;
			}
		`
		document.head.appendChild(style)
		return () => document.head.removeChild(style)
	}, [])

	useEffect(() => {
		if (preloadedIncidents) {
			
			console.log("Processing preloaded incidents for report detail:", preloadedIncidents);
			const formattedIncidents = preloadedIncidents.map(report => ({
				id: report.id,
				location: [report.Latitude, report.Longitude],
				title: report.Title || report.IncidentType || "Incident",
				description: report.Description || "No description available",
				category: report.IncidentType || "Other",
				risk: determineRiskLevel(report.IncidentType),
				date: formatDate(report.DateTime),
				time: formatTime(report.DateTime),
				barangay: report.Barangay || "Unknown",
				status: report.Status || "Pending",
				isSensitive: report.isSensitive || false
			}));
			console.log("Formatted incidents for map:", formattedIncidents);
			setIncidents(formattedIncidents);
			
			// Process clusters if clustering is enabled
			if (showClusters) {
				const clusteredData = clusterIncidents(preloadedIncidents, 500, showOnlyTopCluster ? 1 : 6);
				const finalClusters = showOnlyTopCluster ? clusteredData.slice(0, 1) : clusteredData;
				console.log("Generated clusters:", finalClusters);
				setClusters(finalClusters);
			}
		} else {
			fetchReports();
		}
	}, [barangay, preloadedIncidents]);

	useEffect(() => {
		// Skip this effect if we have preloadedIncidents as they're handled during map initialization
		if (preloadedIncidents && preloadedIncidents.length > 0) {
			console.log("⏭️ Skipping marker creation effect - preloaded incidents handled in initialization");
			return;
		}

		if (!mapInstanceRef.current || incidents.length === 0) return;

		// Clean up existing markers safely
		safeCleanupMarkers();

	console.log("Updating markers for", incidents.length, "incidents");
		const newMarkers = [];
		incidents.forEach((incident) => {
			const marker = L.marker(incident.location, {
				icon: createCustomIcon(incident.risk),
			}).addTo(mapInstanceRef.current)

			const popupContent = `
				<div class="p-4 min-w-[220px]">
					<h3 class="font-semibold text-lg mb-2 text-gray-800">${incident.title}</h3>
					<p class="text-sm text-gray-600 mb-3">${incident.category}</p>
					<p class="text-xs text-gray-600 mb-3">
						${incident.date} at ${incident.time}
					</p>
					<div class="flex items-center gap-2 mb-3 flex-wrap">
						<span class="px-2 py-1 rounded-md bg-${
							incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
						}-100 text-${
							incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
						}-700 text-xs font-medium border border-${
							incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
						}-300">${incident.risk} Risk</span>
						<span class="px-2 py-1 rounded-md border text-xs font-medium ${
							incident.status === "Verified" ? "bg-green-100 text-green-700 border-green-300" :
							incident.status === "Pending" ? "bg-white text-black border-gray-300" :
							"bg-red-100 text-red-700 border-red-300"
						}">${incident.status}</span>
						${incident.isSensitive ? '<span class="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium border border-orange-300">Sensitive</span>' : ''}
					</div>
					<p class="text-sm text-gray-700 mb-2">${incident.description}</p>
					<div id="location-${incident.id}" class="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
						<strong>Location:</strong> Loading address...
					</div>
				</div>
			`

			marker.bindPopup(popupContent)
			
			// Asynchronously fetch street address and update popup
			reverseGeocode(incident.location[0], incident.location[1])
				.then(streetAddress => {
					try {
						if (streetAddress && streetAddress !== 'Unknown location' && marker) {
							const updatedContent = popupContent.replace(
								`<strong>Location:</strong> Loading address...`,
								`<strong>Location:</strong> ${streetAddress}`
							);
							marker.setPopupContent(updatedContent);
						}
					} catch (error) {
						console.warn('Warning updating marker popup:', error);
					}
				})
				.catch(error => {
					console.error('Failed to get street address:', error);
					try {
						if (marker) {
							const fallbackContent = popupContent.replace(
								`<strong>Location:</strong> Loading address...`,
								`<strong>Location:</strong> ${incident.location[0].toFixed(4)}, ${incident.location[1].toFixed(4)}`
							);
							marker.setPopupContent(fallbackContent);
						}
					} catch (error) {
						console.warn('Warning setting fallback popup content:', error);
					}
				});
			
			try {
				marker.on("click", () => {
					if (onMarkerClick) {
						onMarkerClick(incident)
					}
				})
			} catch (error) {
				console.warn('Warning setting marker click handler:', error);
			}

			if (marker) {
				markersRef.current.push({ marker, incident })
				newMarkers.push(marker);
			}
		});

		// Auto-fit bounds for regular incidents (not preloaded) - skip when adding new incident
		if (newMarkers.length > 0 && !propCenter && !addingIncident) {
			if (newMarkers.length === 1) {
				const markerPosition = newMarkers[0].getLatLng();
				mapInstanceRef.current.setView(markerPosition, 17);
				console.log("🎯 Centering map on single incident marker:", markerPosition);
			} else {
				const group = new L.featureGroup(newMarkers);
				mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
				console.log("🎯 Fitting map bounds to show all", newMarkers.length, "incident markers");
			}
		}
	}, [incidents, preloadedIncidents, addingIncident]);
	const markersRef = useRef([])
	const hotspotsRef = useRef([])
	const newMarkerRef = useRef(null)

	useEffect(() => {
		
		if (cleanupTimeoutRef.current) {
			clearTimeout(cleanupTimeoutRef.current);
			cleanupTimeoutRef.current = null;
		}

		if (!mapRef.current) {
			console.log("⚠️ Map container not ready, skipping initialization");
			return;
		}

		if (!propCenter && !preloadedIncidents && isUserLoading) {
			console.log("⏳ Map initialization delayed - waiting for user to load");
			return;
		}

		if (mapInstanceRef.current) {
			console.log("🧹 Cleaning up existing map instance");
			try {
				// Clean up markers first before removing map
				safeCleanupMarkers();
				mapInstanceRef.current.remove();
			} catch (error) {
				console.warn("Warning during map cleanup:", error);
			}
			mapInstanceRef.current = null;
		}

		const initTimeout = setTimeout(() => {
			try {
				setMapError(null);
				setIsMapReady(false);

				if (!mapRef.current) {
					console.error("❌ Map container disappeared during initialization");
					return;
				}

				loadLeafletCSS();
				fixLeafletIcons()

				console.log("MapComponent received barangay:", barangay);
				console.log("Prop center:", propCenter, "Prop zoom:", propZoom);
				console.log("Preloaded incidents:", preloadedIncidents);
				console.log("Current user:", user);

				const mapConfig = getMapConfig(user?.email, {
					propCenter,
					propZoom, 
					preloadedIncidents
				});

				const isReportDetail = preloadedIncidents && preloadedIncidents.length > 0;
				const mapOptions = getMapOptions(mapConfig.bounds, isReportDetail, addingIncident);

				if (!mapRef.current) {
					console.error("❌ Map container disappeared during initialization");
					return;
				}

				const mapInstance = L.map(mapRef.current, {
					...mapOptions,
					attributionControl: false
				}).setView(mapConfig.center, mapConfig.zoom);
				mapInstanceRef.current = mapInstance

				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: ''
				}).addTo(mapInstance)

				mapInstance.on("click", (e) => {
					if (addingIncident) {
						const { lat, lng } = e.latlng
						onMapClick([lat, lng])
					}
				})

				// Handle preloaded incidents immediately during map initialization
				let incidentsToRender = incidents;
				if (preloadedIncidents && preloadedIncidents.length > 0) {
					console.log("📍 Processing preloaded incidents during map initialization:", preloadedIncidents);
					incidentsToRender = preloadedIncidents.map(report => ({
						id: report.id,
						location: [report.Latitude, report.Longitude],
						title: report.Title || report.IncidentType || "Incident",
						description: report.Description || "No description available",
						category: report.IncidentType || "Other",
						risk: determineRiskLevel(report.IncidentType),
						date: formatDate(report.DateTime),
						time: formatTime(report.DateTime),
						barangay: report.Barangay || "Unknown",
						status: report.Status || "Pending",
						isSensitive: report.isSensitive || false
					}));
				}

				console.log("📍 Rendering incidents on map:", incidentsToRender.length);
				
				// Only render individual markers if clustering is not active
				if (!showClusters) {
					incidentsToRender.forEach((incident) => {
						const marker = L.marker(incident.location, {
							icon: createCustomIcon(incident.risk),
						}).addTo(mapInstance)

					if (showPopups) {
						const popupContent = `
							<div class="p-4 min-w-[220px]">
								<h3 class="font-semibold text-lg mb-2 text-gray-800">${incident.title}</h3>
								<p class="text-sm text-gray-600 mb-3">${incident.category}</p>
								<p class="text-xs text-gray-600 mb-3">
									${incident.date} at ${incident.time}
								</p>
								<div class="flex items-center gap-2 mb-3 flex-wrap">
									<span class="px-2 py-1 rounded-md bg-${
										incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
									}-100 text-${
										incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
									}-700 text-xs font-medium border border-${
										incident.risk === "High" ? "red" : incident.risk === "Medium" ? "orange" : "green"
									}-300">${incident.risk} Risk</span>
									<span class="px-2 py-1 rounded-md border text-xs font-medium ${
										incident.status === "Verified" ? "bg-green-100 text-green-700 border-green-300" :
										incident.status === "Pending" ? "bg-white text-black border-gray-300" :
										"bg-red-100 text-red-700 border-red-300"
									}">${incident.status}</span>
									${incident.isSensitive ? '<span class="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium border border-orange-300">Sensitive</span>' : ''}
								</div>
								<p class="text-sm text-gray-700 mb-2">${incident.description}</p>
								<div id="location-${incident.id}" class="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
									<strong>Location:</strong> Loading address...
								</div>
							</div>
						`

						marker.bindPopup(popupContent)
						
						// Asynchronously fetch street address and update popup
						reverseGeocode(incident.location[0], incident.location[1])
							.then(streetAddress => {
								if (streetAddress && streetAddress !== 'Unknown location') {
									const updatedContent = popupContent.replace(
										`<strong>Location:</strong> Loading address...`,
										`<strong>Location:</strong> ${streetAddress}`
									);
									marker.setPopupContent(updatedContent);
								}
							})
							.catch(error => {
								console.error('Failed to get street address:', error);
								const fallbackContent = popupContent.replace(
									`<strong>Location:</strong> Loading address...`,
									`<strong>Location:</strong> ${incident.location[0].toFixed(4)}, ${incident.location[1].toFixed(4)}`
								);
								marker.setPopupContent(fallbackContent);
							});
					}					if (showPopups && onMarkerClick) {
						marker.on("click", () => {
							onMarkerClick(incident)
						})
					}

					markersRef.current.push({ marker, incident })
				})
				} // End of if (!showClusters) block

				// If we have preloaded incidents, center and focus on them
				if (preloadedIncidents && preloadedIncidents.length > 0 && markersRef.current.length > 0) {
					if (preloadedIncidents.length === 1) {
						// Single report - center on the marker
						const markerPosition = markersRef.current[0].marker.getLatLng();
						mapInstance.setView(markerPosition, 17);
						console.log("🎯 Centering map on single preloaded report:", markerPosition);
						
						// Open popup after a short delay to ensure map is ready
						setTimeout(() => {
							markersRef.current[0].marker.openPopup();
						}, 300);
					} else {
						// Multiple reports - fit bounds to show all
						const group = new L.featureGroup(markersRef.current.map(m => m.marker));
						mapInstance.fitBounds(group.getBounds(), { padding: [20, 20] });
						console.log("🎯 Fitting map bounds to show all", preloadedIncidents.length, "preloaded reports");
					}
				}

				const handleAddIncident = (e) => {
					const newIncident = e.detail
					setIncidents((prev) => [...prev, newIncident])

					const marker = L.marker(newIncident.location, {
						icon: createCustomIcon(newIncident.risk),
					}).addTo(mapInstance)

					if (showPopups) {
						const popupContent = `
							<div class="p-1">
								<div class="flex items-center gap-2 mb-1">
									<h3 class="font-medium">${newIncident.title}</h3>
									${newIncident.isSensitive ? '<span class="px-2 py-0.5 rounded-md bg-orange-100 text-orange-600 text-xs font-medium border border-orange-300">Sensitive</span>' : ''}
								</div>
								<p class="text-xs text-muted-foreground">
									${newIncident.date} at ${newIncident.time}
								</p>
								<div class="flex items-center gap-2 mt-1 flex-wrap">
									<div class="rounded-full px-2 py-0.5 text-center text-xs font-medium bg-${
										newIncident.risk === "High" ? "red" : newIncident.risk === "Medium" ? "yellow" : "green"
									}-100 text-${newIncident.risk === "High" ? "red" : newIncident.risk === "Medium" ? "yellow" : "green"}-800">
										${newIncident.risk} Risk
									</div>
									${newIncident.status ? `<span class="px-2 py-1 rounded-md border text-xs font-medium ${
										newIncident.status === "Verified" ? "bg-green-100 text-green-700 border-green-300" :
										newIncident.status === "Pending" ? "bg-white text-black border-gray-300" :
										"bg-red-100 text-red-700 border-red-300"
									}">${newIncident.status}</span>` : ''}
								</div>
								<p class="mt-1 text-sm">${newIncident.description}</p>
							</div>
						`

						marker.bindPopup(popupContent)
					}

					if (showPopups && onMarkerClick) {
						marker.on("click", () => {
							onMarkerClick(newIncident)
						})
					}

					markersRef.current.push({ marker, incident: newIncident })
				}

				window.addEventListener("addIncident", handleAddIncident);

				setIsMapReady(true);

				return () => {
					console.log("🧹 Cleaning up map instance and event listeners");
					setIsMapReady(false);

					cleanupTimeoutRef.current = setTimeout(() => {
						try {
							// Clean up markers first before removing map
							safeCleanupMarkers();
							
							if (mapInstanceRef.current) {
								mapInstanceRef.current.remove()
								mapInstanceRef.current = null
							}
						} catch (error) {
							console.warn("Warning during map cleanup:", error);
						}
						window.removeEventListener("addIncident", handleAddIncident)
					}, 100);
				};

			} catch (error) {
				console.error("❌ Error initializing map:", error);
				setMapError(error.message);
				
				if (mapInstanceRef.current) {
					try {
						mapInstanceRef.current.remove();
					} catch (cleanupError) {
						console.warn("Warning during error cleanup:", cleanupError);
					}
					mapInstanceRef.current = null;
				}
			}
		}, 100); 

		return () => {
			if (initTimeout) {
				clearTimeout(initTimeout);
			}
		};
	}, [
		
		...(propCenter ? [] : [user]),
		propCenter, 
		propZoom, 
		preloadedIncidents
	]) 

	useEffect(() => {
		if (!hotspots || hotspots.length === 0) {
			console.log("🔥 Skipping hotspots - no hotspots data");
			return;
		}

		if (!mapInstanceRef.current) {
			console.log("🔥 Map not ready yet, deferring hotspots rendering");
			return;
		}

		if (showHotspots) {
			renderHotspots(hotspots);
		}
		
		if (showClusters && clusters.length > 0) {
			renderClusters(clusters);
		}
	}, [hotspots, clusters]);

	useEffect(() => {
		if (isMapReady && mapInstanceRef.current) {
			if (showHotspots && hotspots && hotspots.length > 0) {
				// Skip hotspots if already rendered
				if (hotspotsRef.current.length > 0) {
					console.log("🔥 Hotspots already rendered, skipping");
				} else {
					console.log("🔥 Map ready - adding deferred hotspots:", hotspots.length);
					renderHotspots(hotspots);
				}
			}
			
			if (showClusters && clusters && clusters.length > 0) {
				if (clustersRef.current.length > 0) {
					console.log("🎯 Clusters already rendered, skipping");
				} else {
					console.log("🎯 Map ready - adding deferred clusters:", clusters.length);
					renderClusters(clusters);
				}
			}
		}
	}, [isMapReady, hotspots, clusters, showHotspots, showClusters]);

	useEffect(() => {
		const handleResize = () => {
			if (mapInstanceRef.current) {
				
				setTimeout(() => {
					try {
						mapInstanceRef.current.invalidateSize();
						console.log("🔄 Map size invalidated due to resize");
					} catch (error) {
						console.warn("Warning invalidating map size:", error);
					}
				}, 50);
			}
		};

		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		if (!mapInstanceRef.current || !barangay) return;
		
		// Skip re-centering when adding a new incident to maintain user's preferred view
		if (addingIncident) {
			console.log("🚫 Skipping barangay re-centering - adding incident mode");
			return;
		}
		
		try {
			
			const barangayCoordinates = getMapCoordinatesForBarangay(barangay);
			
			console.log("🔄 Re-centering to", barangay + ":", barangayCoordinates.center, "zoom:", barangayCoordinates.zoom);
			mapInstanceRef.current.setView(barangayCoordinates.center, barangayCoordinates.zoom);
		} catch (error) {
			console.error("❌ Error re-centering map:", error);
		}
	}, [barangay, addingIncident]);

	useEffect(() => {
		if (!mapInstanceRef.current) {
			console.log("⏳ Map instance not ready yet for new incident marker");
			return;
		}
		
		try {
			console.log("📍 Updating new incident marker:", newIncidentLocation);
			
			// Remove existing marker
			if (newMarkerRef.current) {
				console.log("🗑️ Removing old marker");
				newMarkerRef.current.remove()
				newMarkerRef.current = null
			}

			// Add new marker if location exists
			if (newIncidentLocation && Array.isArray(newIncidentLocation) && newIncidentLocation.length === 2) {
				console.log("✅ Creating new marker at:", newIncidentLocation);
				
				const icon = createCustomIcon(newIncidentRisk || "Medium");
				newMarkerRef.current = L.marker(newIncidentLocation, {
					icon: icon,
					draggable: false
				}).addTo(mapInstanceRef.current)
				
				// Center map on the new marker location with smooth animation
				mapInstanceRef.current.setView(newIncidentLocation, mapInstanceRef.current.getZoom(), {
					animate: true,
					duration: 0.5
				})
				
				console.log("✅ Marker created and map centered");
			}
		} catch (error) {
			console.error("❌ Error handling new incident location:", error);
		}
	}, [newIncidentLocation, newIncidentRisk])

	if (!propCenter && !preloadedIncidents && user === undefined) {
		return (
			<div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
					<p className="text-gray-600 text-sm">Loading map...</p>
				</div>
			</div>
		);
	}

	return <div ref={mapRef} className="h-full w-full" />
}
