"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"
import { getMapConfig, getMapOptions } from "@/lib/mapUtils"
import { getMapCoordinatesForBarangay } from "@/lib/userMapping"
import { useCurrentUser } from "@/hooks/use-current-user"

// Dynamically import Leaflet CSS to avoid SSR issues
let leafletCSSLoaded = false;
const loadLeafletCSS = () => {
	if (typeof window !== 'undefined' && !leafletCSSLoaded) {
		try {
			require("leaflet/dist/leaflet.css");
			leafletCSSLoaded = true;
		} catch (error) {
			console.warn("Failed to load Leaflet CSS:", error);
			// Fallback: add CSS link manually
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
			document.head.appendChild(link);
			leafletCSSLoaded = true;
		}
	}
};

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
	// Delete the default icon
	delete L.Icon.Default.prototype._getIconUrl

	// Set up the default icon paths
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
		iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
		shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
	})
}

// Custom icons for different risk levels
const createCustomIcon = (riskLevel) => {
	return new L.Icon({
		iconUrl:
			riskLevel === "High"
				? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
				: riskLevel === "Medium"
				? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
				: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
		shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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
	hotspots = [], // Add hotspots prop
	preloadedIncidents = null, // Add prop for pre-loaded incidents
	showPopups = true, // Add prop to control popup display
}) {
	const [incidents, setIncidents] = useState([]) // Will be populated from database
	const mapRef = useRef(null)
	const mapInstanceRef = useRef(null)
	const { user, isLoading: isUserLoading } = useCurrentUser() // Get current user for map configuration
	const [isMapReady, setIsMapReady] = useState(false)
	const [mapError, setMapError] = useState(null)
	const cleanupTimeoutRef = useRef(null)
	
	// Helper function to render hotspots
	const renderHotspots = (hotspotsToRender) => {
		if (!mapInstanceRef.current || !hotspotsToRender || hotspotsToRender.length === 0) {
			return false;
		}

		try {
			// Clear existing hotspot circles
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

			// Add new hotspot circles
			console.log("🔥 Rendering", hotspotsToRender.length, "hotspots to map");
			hotspotsToRender.forEach((hotspot, index) => {
				const color = hotspot.riskLevel === 'high' ? '#ef4444' :     // Red
							  hotspot.riskLevel === 'medium' ? '#f97316' :   // Orange
							  '#eab308';                                     // Yellow
				
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
								}">${hotspot.riskLevel.toUpperCase()}</span>
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
	
	// Fetch reports from Firebase and convert to incident format
	const fetchReports = async () => {
		try {
			console.log("Fetching reports from database...");
			const querySnapshot = await getDocs(collection(db, "reports"));
			const reportsData = [];
			
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				console.log("Processing report:", data);
				
				// Check if the report has geolocation data
				if (data.Latitude && data.Longitude) {
					const incident = {
						id: doc.id,
						location: [data.Latitude, data.Longitude],
						title: data.IncidentType || "Incident",
						description: data.Description || "No description available",
						category: data.IncidentType || "Other",
						risk: determineRiskLevel(data.IncidentType),
						date: formatDate(data.DateTime),
						time: formatTime(data.DateTime),
						barangay: data.Barangay || "Unknown",
						status: data.Status || "Pending",
						isSensitive: data.isSensitive || false
					};
					
					// Filter by barangay if specified and only show verified reports
					if ((!barangay || data.Barangay === barangay) && data.Status === "Verified") {
						reportsData.push(incident);
					}
				}
			});
			
			console.log("Found reports with geolocation:", reportsData.length);
			setIncidents(reportsData);
		} catch (error) {
			console.error("Error fetching reports:", error);
		}
	};
	
	// Helper function to determine risk level based on incident type
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
	
	// Helper function to format date
	const formatDate = (dateValue) => {
		if (!dateValue) return "Unknown date";
		try {
			let date;
			if (dateValue.seconds) {
				// Firestore Timestamp
				date = new Date(dateValue.seconds * 1000);
			} else if (dateValue.toDate) {
				// Firestore Timestamp with toDate method
				date = dateValue.toDate();
			} else {
				date = new Date(dateValue);
			}
			return date.toLocaleDateString();
		} catch (error) {
			return "Unknown date";
		}
	};
	
	// Helper function to format time
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
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch (error) {
			return "Unknown time";
		}
	};
	
	// Add CSS to ensure proper z-index layering
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
	
	// Fetch reports when component mounts or barangay changes, unless preloaded incidents are provided
	useEffect(() => {
		if (preloadedIncidents) {
			// Convert preloaded incidents to the expected format
			console.log("Processing preloaded incidents for report detail:", preloadedIncidents);
			const formattedIncidents = preloadedIncidents.map(report => ({
				id: report.id,
				location: [report.Latitude, report.Longitude],
				title: report.IncidentType || "Incident",
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
		} else {
			fetchReports();
		}
	}, [barangay, preloadedIncidents]);
	
	// Update markers when incidents change
	useEffect(() => {
		if (!mapInstanceRef.current || incidents.length === 0) return;
		
		// Clear existing markers
		markersRef.current.forEach(markerData => {
			if (markerData.marker) {
				markerData.marker.remove();
			}
		});
		markersRef.current = [];
		
		// Add new markers for incidents
	console.log("Updating markers for", incidents.length, "incidents");
		const newMarkers = [];
		incidents.forEach((incident) => {
			const marker = L.marker(incident.location, {
				icon: createCustomIcon(incident.risk),
			}).addTo(mapInstanceRef.current)

			const popupContent = `
				<div class="p-2">
					<div class="flex items-center gap-2 mb-1">
						<h3 class="font-medium text-sm">${incident.title}</h3>
						${incident.isSensitive ? '<span class="px-2 py-0.5 rounded-md bg-orange-100 text-orange-600 text-xs font-medium border border-orange-300">Sensitive</span>' : ''}
					</div>
					<p class="text-xs text-gray-600 mb-1">
						${incident.date} at ${incident.time}
					</p>
					<p class="text-xs text-gray-600 mb-1">
						${incident.barangay} • Status: ${incident.status}
					</p>
					<div class="mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium bg-${
						incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"
					}-100 text-${incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"}-800">
						${incident.risk} Risk
					</div>
					<p class="mt-1 text-xs">${incident.description}</p>
				</div>
			`

			marker.bindPopup(popupContent)
			marker.on("click", () => {
				if (onMarkerClick) {
					onMarkerClick(incident)
				}
			})

			markersRef.current.push({ marker, incident })
			newMarkers.push(marker);
		});
		
		// If we have preloaded incidents (like in report detail dialog), center map on markers
		if (preloadedIncidents && newMarkers.length > 0) {
			if (newMarkers.length === 1) {
				// For single marker (report detail view), center on it with detailed zoom level
				const markerPosition = newMarkers[0].getLatLng();
				mapInstanceRef.current.setView(markerPosition, 17);
				console.log("🎯 Centering map on single report marker:", markerPosition, "zoom: 17");
				
				// Open popup automatically to show report details
				setTimeout(() => {
					newMarkers[0].openPopup();
				}, 500);
			} else if (!propCenter) {
				// For multiple markers, fit bounds to show all ONLY if no explicit center is provided
				const group = new L.featureGroup(newMarkers);
				mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
				console.log("🎯 Fitting map bounds to show all", newMarkers.length, "markers");
			} else {
				// If explicit center is provided, respect it and don't auto-fit bounds
				console.log("🎯 Respecting explicit center coordinates, not auto-fitting bounds to markers");
			}
		}
	}, [incidents, preloadedIncidents]);
	const markersRef = useRef([])
	const hotspotsRef = useRef([])
	const newMarkerRef = useRef(null)

	// Initialize map
	useEffect(() => {
		// Clear any existing cleanup timeout
		if (cleanupTimeoutRef.current) {
			clearTimeout(cleanupTimeoutRef.current);
			cleanupTimeoutRef.current = null;
		}

		// Ensure mapRef.current exists before proceeding
		if (!mapRef.current) {
			console.log("⚠️ Map container not ready, skipping initialization");
			return;
		}

		// Don't initialize map if user is still loading and we don't have explicit coordinates
		// This prevents the map from centering on fallback coordinates then jumping
		if (!propCenter && !preloadedIncidents && isUserLoading) {
			console.log("⏳ Map initialization delayed - waiting for user to load");
			return;
		}

		// Clean up any existing map instance first
		if (mapInstanceRef.current) {
			console.log("🧹 Cleaning up existing map instance");
			try {
				mapInstanceRef.current.remove();
			} catch (error) {
				console.warn("Warning during map cleanup:", error);
			}
			mapInstanceRef.current = null;
		}

		// Add small delay to ensure DOM is ready
		const initTimeout = setTimeout(() => {
			try {
				setMapError(null);
				setIsMapReady(false);

				// Double-check container still exists
				if (!mapRef.current) {
					console.error("❌ Map container disappeared during initialization");
					return;
				}

				// Load Leaflet CSS and initialize icons
				loadLeafletCSS();
				fixLeafletIcons()

				console.log("MapComponent received barangay:", barangay);
				console.log("Prop center:", propCenter, "Prop zoom:", propZoom);
				console.log("Preloaded incidents:", preloadedIncidents);
				console.log("Current user:", user);

				// Get centralized map configuration based on current user and props
				const mapConfig = getMapConfig(user?.email, {
					propCenter,
					propZoom, 
					preloadedIncidents
				});

				// Get map options with bounds if needed
				const isReportDetail = preloadedIncidents && preloadedIncidents.length > 0;
				const mapOptions = getMapOptions(mapConfig.bounds, isReportDetail, addingIncident);

				// Final safety check for map container
				if (!mapRef.current) {
					console.error("❌ Map container disappeared during initialization");
					return;
				}

				const mapInstance = L.map(mapRef.current, mapOptions).setView(mapConfig.center, mapConfig.zoom);
				mapInstanceRef.current = mapInstance

				// Add tile layer
				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				}).addTo(mapInstance)

				// Add click event listener
				mapInstance.on("click", (e) => {
					if (addingIncident) {
						const { lat, lng } = e.latlng
						onMapClick([lat, lng])
					}
				})

				// Add hotspots
				// Hotspots removed

				// Use incidents from database (already filtered by barangay in fetchReports)
				console.log("📍 Rendering incidents on map:", incidents.length);
				
				incidents.forEach((incident) => {
					const marker = L.marker(incident.location, {
						icon: createCustomIcon(incident.risk),
					}).addTo(mapInstance)

					// Only bind popup if showPopups is true
					if (showPopups) {
						const popupContent = `
							<div class="p-2">
								<div class="flex items-center gap-2 mb-1">
									<h3 class="font-medium text-sm">${incident.title}</h3>
									${incident.isSensitive ? '<span class="px-2 py-0.5 rounded-md bg-orange-100 text-orange-600 text-xs font-medium border border-orange-300">Sensitive</span>' : ''}
								</div>
								<p class="text-xs text-gray-600 mb-1">
									${incident.date} at ${incident.time}
								</p>
								<p class="text-xs text-gray-600 mb-1">
									📍 ${incident.barangay} • Status: ${incident.status}
								</p>
								<div class="mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium bg-${
									incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"
								}-100 text-${incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"}-800">
									${incident.risk} Risk
								</div>
								<p class="mt-1 text-xs">${incident.description}</p>
							</div>
						`

						marker.bindPopup(popupContent)
					}

					// Only add click event if showPopups is true and onMarkerClick is provided
					if (showPopups && onMarkerClick) {
						marker.on("click", () => {
							onMarkerClick(incident)
						})
					}

					markersRef.current.push({ marker, incident })
				})

				// Listen for new incidents
				const handleAddIncident = (e) => {
					const newIncident = e.detail
					setIncidents((prev) => [...prev, newIncident])

					const marker = L.marker(newIncident.location, {
						icon: createCustomIcon(newIncident.risk),
					}).addTo(mapInstance)

					// Only bind popup if showPopups is true
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
								<div class="mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium bg-${
									newIncident.risk === "High" ? "red" : newIncident.risk === "Medium" ? "yellow" : "green"
								}-100 text-${newIncident.risk === "High" ? "red" : newIncident.risk === "Medium" ? "yellow" : "green"}-800">
									${newIncident.risk} Risk
								</div>
								<p class="mt-1 text-sm">${newIncident.description}</p>
							</div>
						`

						marker.bindPopup(popupContent)
					}

					// Only add click event if showPopups is true and onMarkerClick is provided
					if (showPopups && onMarkerClick) {
						marker.on("click", () => {
							onMarkerClick(newIncident)
						})
					}

					markersRef.current.push({ marker, incident: newIncident })
				}

				window.addEventListener("addIncident", handleAddIncident);

				// Mark map as ready
				setIsMapReady(true);

				// Cleanup function
				return () => {
					console.log("🧹 Cleaning up map instance and event listeners");
					setIsMapReady(false);
					
					// Use timeout to avoid immediate cleanup issues
					cleanupTimeoutRef.current = setTimeout(() => {
						try {
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
				// Cleanup on error
				if (mapInstanceRef.current) {
					try {
						mapInstanceRef.current.remove();
					} catch (cleanupError) {
						console.warn("Warning during error cleanup:", cleanupError);
					}
					mapInstanceRef.current = null;
				}
			}
		}, 100); // Small delay to ensure DOM is ready

		// Cleanup timeout on unmount
		return () => {
			if (initTimeout) {
				clearTimeout(initTimeout);
			}
		};
	}, [
		// Only include user if we don't have explicit coordinates
		...(propCenter ? [] : [user]),
		propCenter, 
		propZoom, 
		preloadedIncidents
	]) // Conditional user dependency to prevent unnecessary re-initialization

	// Handle hotspots visualization
	useEffect(() => {
		if (!hotspots || hotspots.length === 0) {
			console.log("🔥 Skipping hotspots - no hotspots data");
			return;
		}

		if (!mapInstanceRef.current) {
			console.log("🔥 Map not ready yet, deferring hotspots rendering");
			return;
		}

		renderHotspots(hotspots);
	}, [hotspots]);

	// Ensure hotspots are rendered when map becomes ready (after navigation)
	useEffect(() => {
		if (isMapReady && mapInstanceRef.current && hotspots && hotspots.length > 0) {
			// If hotspots are already rendered, skip
			if (hotspotsRef.current.length > 0) {
				console.log("🔥 Hotspots already rendered, skipping");
				return;
			}
			
			console.log("🔥 Map ready - adding deferred hotspots:", hotspots.length);
			renderHotspots(hotspots);
		}
	}, [isMapReady, hotspots]);

	// Handle window resize events to properly resize map
	useEffect(() => {
		const handleResize = () => {
			if (mapInstanceRef.current) {
				// Small delay to ensure container has resized
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

	// Recenter map when barangay changes
	useEffect(() => {
		if (!mapInstanceRef.current || !barangay) return;
		
		try {
			// Use centralized mapping for barangay coordinates
			const barangayCoordinates = getMapCoordinatesForBarangay(barangay);
			
			console.log("🔄 Re-centering to", barangay + ":", barangayCoordinates.center, "zoom:", barangayCoordinates.zoom);
			mapInstanceRef.current.setView(barangayCoordinates.center, barangayCoordinates.zoom);
		} catch (error) {
			console.error("❌ Error re-centering map:", error);
		}
	}, [barangay]);

	// Handle new incident location
	useEffect(() => {
		if (!mapInstanceRef.current) return

		try {
			// Remove previous new marker if exists
			if (newMarkerRef.current) {
				newMarkerRef.current.remove()
				newMarkerRef.current = null
			}

			// Add new marker if location exists
			if (newIncidentLocation) {
				newMarkerRef.current = L.marker(newIncidentLocation, {
					icon: createCustomIcon(newIncidentRisk || "Medium"),
				}).addTo(mapInstanceRef.current)
			}
		} catch (error) {
			console.error("❌ Error handling new incident location:", error);
		}
	}, [newIncidentLocation, newIncidentRisk])

	// Show loading state if user is not loaded and no explicit coordinates provided
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
