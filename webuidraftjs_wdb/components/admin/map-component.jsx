"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"
import { getMapConfig, getMapOptions } from "@/lib/mapUtils"
import { getMapCoordinatesForBarangay } from "@/lib/userMapping"
import { useCurrentUser } from "@/hooks/use-current-user"

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
			link.href = 'https:
			document.head.appendChild(link);
			leafletCSSLoaded = true;
		}
	}
};

const fixLeafletIcons = () => {
	
	delete L.Icon.Default.prototype._getIconUrl

	L.Icon.Default.mergeOptions({
		iconRetinaUrl: "https:
		iconUrl: "https:
		shadowUrl: "https:
	})
}

const createCustomIcon = (riskLevel) => {
	return new L.Icon({
		iconUrl:
			riskLevel === "High"
				? "https:
				: riskLevel === "Medium"
				? "https:
				: "https:
		shadowUrl: "https:
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
}) {
	const [incidents, setIncidents] = useState([]) 
	const mapRef = useRef(null)
	const mapInstanceRef = useRef(null)
	const { user, isLoading: isUserLoading } = useCurrentUser() 
	const [isMapReady, setIsMapReady] = useState(false)
	const [mapError, setMapError] = useState(null)
	const cleanupTimeoutRef = useRef(null)

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

	const fetchReports = async () => {
		try {
			console.log("Fetching reports from database...");
			const querySnapshot = await getDocs(collection(db, "reports"));
			const reportsData = [];
			
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				console.log("Processing report:", data);

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
			return date.toLocaleDateString();
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
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

	useEffect(() => {
		if (!mapInstanceRef.current || incidents.length === 0) return;

		markersRef.current.forEach(markerData => {
			if (markerData.marker) {
				markerData.marker.remove();
			}
		});
		markersRef.current = [];

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

		if (preloadedIncidents && newMarkers.length > 0) {
			if (newMarkers.length === 1) {
				
				const markerPosition = newMarkers[0].getLatLng();
				mapInstanceRef.current.setView(markerPosition, 17);
				console.log("🎯 Centering map on single report marker:", markerPosition, "zoom: 17");

				setTimeout(() => {
					newMarkers[0].openPopup();
				}, 500);
			} else if (!propCenter) {
				
				const group = new L.featureGroup(newMarkers);
				mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
				console.log("🎯 Fitting map bounds to show all", newMarkers.length, "markers");
			} else {
				
				console.log("🎯 Respecting explicit center coordinates, not auto-fitting bounds to markers");
			}
		}
	}, [incidents, preloadedIncidents]);
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

				const mapInstance = L.map(mapRef.current, mapOptions).setView(mapConfig.center, mapConfig.zoom);
				mapInstanceRef.current = mapInstance

				L.tileLayer("https:
					attribution: '&copy; <a href="https:
				}).addTo(mapInstance)

				mapInstance.on("click", (e) => {
					if (addingIncident) {
						const { lat, lng } = e.latlng
						onMapClick([lat, lng])
					}
				})

				console.log("📍 Rendering incidents on map:", incidents.length);
				
				incidents.forEach((incident) => {
					const marker = L.marker(incident.location, {
						icon: createCustomIcon(incident.risk),
					}).addTo(mapInstance)

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

					if (showPopups && onMarkerClick) {
						marker.on("click", () => {
							onMarkerClick(incident)
						})
					}

					markersRef.current.push({ marker, incident })
				})

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

		renderHotspots(hotspots);
	}, [hotspots]);

	useEffect(() => {
		if (isMapReady && mapInstanceRef.current && hotspots && hotspots.length > 0) {
			
			if (hotspotsRef.current.length > 0) {
				console.log("🔥 Hotspots already rendered, skipping");
				return;
			}
			
			console.log("🔥 Map ready - adding deferred hotspots:", hotspots.length);
			renderHotspots(hotspots);
		}
	}, [isMapReady, hotspots]);

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
		
		try {
			
			const barangayCoordinates = getMapCoordinatesForBarangay(barangay);
			
			console.log("🔄 Re-centering to", barangay + ":", barangayCoordinates.center, "zoom:", barangayCoordinates.zoom);
			mapInstanceRef.current.setView(barangayCoordinates.center, barangayCoordinates.zoom);
		} catch (error) {
			console.error("❌ Error re-centering map:", error);
		}
	}, [barangay]);

	useEffect(() => {
		if (!mapInstanceRef.current) return

		try {
			
			if (newMarkerRef.current) {
				newMarkerRef.current.remove()
				newMarkerRef.current = null
			}

			if (newIncidentLocation) {
				newMarkerRef.current = L.marker(newIncidentLocation, {
					icon: createCustomIcon(newIncidentRisk || "Medium"),
				}).addTo(mapInstanceRef.current)
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
