"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"

// Sample data for crime incidents
const crimeIncidents = [
	{
		id: 1,
		location: [14.8527, 120.816], // Bulihan coordinates
		title: "Smartphone theft",
		description: "Victim reported smartphone snatched while shopping at the public market",
		category: "Theft",
		risk: "High",
		date: "May 15, 2023",
		time: "2:30 PM",
	},
	{
		id: 2,
		location: [14.858, 120.814], // Mojon coordinates
		title: "Wallet snatching",
		description: "Wallet stolen from backpack while victim was riding a jeepney",
		category: "Theft",
		risk: "High",
		date: "May 14, 2023",
		time: "6:45 PM",
	},
	{
		id: 3,
		location: [14.855, 120.812], // Dakila coordinates
		title: "Motorcycle theft",
		description: "Motorcycle stolen from parking area near the market",
		category: "Vehicle Theft",
		risk: "Medium",
		date: "May 14, 2023",
		time: "9:15 AM",
	},
	{
		id: 4,
		location: [14.851, 120.818], // Look 1st coordinates
		title: "Store robbery",
		description: "Armed individuals robbed a convenience store",
		category: "Robbery",
		risk: "Medium",
		date: "May 13, 2023",
		time: "10:10 PM",
	},
	{
		id: 5,
		location: [14.849, 120.813], // Longos coordinates
		title: "Phone snatching",
		description: "Phone snatched while victim was texting near the plaza",
		category: "Theft",
		risk: "Low",
		date: "May 13, 2023",
		time: "4:20 PM",
	},
	{
		id: 6,
		location: [14.847, 120.815], // Pinagbakahan coordinates
		title: "Attempted break-in",
		description: "Attempted break-in at a residential property",
		category: "Burglary",
		risk: "Low",
		date: "May 12, 2023",
		time: "2:15 AM",
	},
	{
		id: 7,
		location: [14.8535, 120.8165], // Bulihan area
		title: "Bag snatching",
		description: "Bag snatched from pedestrian near the market",
		category: "Theft",
		risk: "High",
		date: "May 11, 2023",
		time: "5:30 PM",
	},
	{
		id: 8,
		location: [14.8575, 120.8145], // Mojon area
		title: "Shop theft",
		description: "Items stolen from a convenience store",
		category: "Theft",
		risk: "High",
		date: "May 10, 2023",
		time: "8:20 PM",
	},
]

// Hotspot data - areas with high crime rates
const hotspots = [
	{
		id: 1,
		center: [14.8527, 120.816], // Bulihan center
		radius: 300,
		name: "Bulihan Market Area",
		risk: "High",
		incidents: 24,
		color: "#ef4444", // Red for high risk
	},
	{
		id: 2,
		center: [14.858, 120.814], // Mojon center
		radius: 250,
		name: "Mojon Shopping District",
		risk: "High",
		incidents: 19,
		color: "#ef4444", // Red for high risk
	},
	{
		id: 3,
		center: [14.855, 120.812], // Dakila center
		radius: 200,
		name: "Dakila Bus Terminal",
		risk: "Medium",
		incidents: 12,
		color: "#eab308", // Yellow for medium risk
	},
	{
		id: 4,
		center: [14.851, 120.818], // Look 1st center
		radius: 180,
		name: "Look 1st Commercial Zone",
		risk: "Medium",
		incidents: 10,
		color: "#eab308", // Yellow for medium risk
	},
	{
		id: 5,
		center: [14.849, 120.813], // Longos center
		radius: 150,
		name: "Longos Residential Area",
		risk: "Low",
		incidents: 5,
		color: "#22c55e", // Green for low risk
	},
	{
		id: 6,
		center: [14.847, 120.815], // Pinagbakahan center
		radius: 120,
		name: "Pinagbakahan Community",
		risk: "Low",
		incidents: 4,
		color: "#22c55e", // Green for low risk
	},
]

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
}) {
	const [incidents, setIncidents] = useState([]) // Will be populated from database
	const mapRef = useRef(null)
	const mapInstanceRef = useRef(null)
	
	// Fetch reports from Firebase and convert to incident format
	const fetchReports = async () => {
		try {
			console.log("🔄 Fetching reports from database...");
			const querySnapshot = await getDocs(collection(db, "reports"));
			const reportsData = [];
			
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				console.log("📄 Processing report:", data);
				
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
						status: data.Status || "Pending"
					};
					
					// Filter by barangay if specified
					if (!barangay || data.Barangay === barangay) {
						reportsData.push(incident);
					}
				}
			});
			
			console.log("📍 Found reports with geolocation:", reportsData.length);
			setIncidents(reportsData);
		} catch (error) {
			console.error("❌ Error fetching reports:", error);
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
	
	// Fetch reports when component mounts or barangay changes
	useEffect(() => {
		fetchReports();
	}, [barangay]);
	
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
		console.log("🔄 Updating markers for", incidents.length, "incidents");
		incidents.forEach((incident) => {
			const marker = L.marker(incident.location, {
				icon: createCustomIcon(incident.risk),
			}).addTo(mapInstanceRef.current)

			const popupContent = `
				<div class="p-2">
					<h3 class="font-medium text-sm">${incident.title}</h3>
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
			marker.on("click", () => {
				if (onMarkerClick) {
					onMarkerClick(incident)
				}
			})

			markersRef.current.push({ marker, incident })
		});
	}, [incidents]);
	const markersRef = useRef([])
	const hotspotsRef = useRef([])
	const newMarkerRef = useRef(null)

	// Initialize map
	useEffect(() => {
		// Import Leaflet CSS
		require("leaflet/dist/leaflet.css")
		fixLeafletIcons()

		console.log("MapComponent received barangay:", barangay);
		console.log("Prop center:", propCenter, "Prop zoom:", propZoom);

		// Use prop center/zoom if provided, otherwise determine based on barangay
		let center = propCenter || [14.8447, 120.8102]; // Default: Pinagbakahan, Malolos, Bulacan
		let zoom = propZoom || (barangay ? 16 : 15);
		
		// Only override with barangay-based coordinates if no prop center is provided
		if (!propCenter && barangay) {
			console.log("Checking barangay:", barangay);
			if (barangay === "Bulihan") {
				// Center on Bulihan, Malolos, Bulacan - Updated coordinates for better focus
				center = [14.8527, 120.8160]; // More accurate Bulihan coordinates
				zoom = 17; // Increased zoom for better focus
				console.log("✅ Setting Bulihan center:", center, "zoom:", zoom);
			}
			else if (barangay === "Mojon") {
				center = [14.858, 120.814];
				console.log("✅ Setting Mojon center:", center);
			}
			else if (barangay === "Dakila") {
				center = [14.855, 120.812];
				console.log("✅ Setting Dakila center:", center);
			}
			else if (barangay === "Look 1st") {
				center = [14.851, 120.818];
				console.log("✅ Setting Look 1st center:", center);
			}
			else if (barangay === "Longos") {
				center = [14.849, 120.813];
				console.log("✅ Setting Longos center:", center);
			}
			else if (barangay === "Pinagbakahan") {
				center = [14.8447, 120.8102]; // Pinagbakahan, Malolos, Bulacan
				zoom = 16;
				console.log("✅ Setting Pinagbakahan center:", center);
			}
			else if (barangay === "Tiaong") {
				center = [14.9502, 120.9002]; // Tiaong, Baliuag, Bulacan
				zoom = 16;
				console.log("✅ Setting Tiaong center:", center);
			}
			else {
				console.log("❌ No matching barangay found for:", barangay);
			}
		}
		
		console.log("🗺️ Final map center:", center, "zoom:", zoom);
		// Add more as needed

		const mapInstance = L.map(mapRef.current).setView(center, zoom);
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

			const popupContent = `
				<div class="p-2">
					<h3 class="font-medium text-sm">${incident.title}</h3>
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
			marker.on("click", () => {
				onMarkerClick(incident)
			})

			markersRef.current.push({ marker, incident })
		})

		// Listen for new incidents
		const handleAddIncident = (e) => {
			const newIncident = e.detail
			setIncidents((prev) => [...prev, newIncident])

			const marker = L.marker(newIncident.location, {
				icon: createCustomIcon(newIncident.risk),
			}).addTo(mapInstance)

			const popupContent = `
				<div class="p-1">
					<h3 class="font-medium">${newIncident.title}</h3>
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
			marker.on("click", () => {
				onMarkerClick(newIncident)
			})

			markersRef.current.push({ marker, incident: newIncident })
		}

		window.addEventListener("addIncident", handleAddIncident)

		// Cleanup
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove()
			}
			window.removeEventListener("addIncident", handleAddIncident)
		}
	}, [])

	// Handle hotspots visualization
	useEffect(() => {
		if (!mapInstanceRef.current || !hotspots || hotspots.length === 0) return;

		// Clear existing hotspot circles
		hotspotsRef.current.forEach(circle => {
			if (circle) {
				circle.remove();
			}
		});
		hotspotsRef.current = [];

		// Add new hotspot circles
		console.log("🔥 Adding", hotspots.length, "hotspots to map");
		hotspots.forEach((hotspot, index) => {
			const color = hotspot.riskLevel === 'high' ? '#ef4444' : 
						  hotspot.riskLevel === 'medium' ? '#eab308' : '#f97316';
			
			const circle = L.circle([hotspot.lat, hotspot.lng], {
				color: color,
				fillColor: color,
				fillOpacity: 0.3,
				radius: hotspot.radius || 100, // Use calculated radius or default
				weight: 2,
			}).addTo(mapInstanceRef.current);

			// Add popup to hotspot
			const popupContent = `
				<div class="p-2">
					<h3 class="font-medium text-sm">🔥 Crime Hotspot</h3>
					<p class="text-xs text-gray-600 mb-1">
						Risk Level: <span class="font-medium ${
							hotspot.riskLevel === 'high' ? 'text-red-600' :
							hotspot.riskLevel === 'medium' ? 'text-yellow-600' : 'text-orange-600'
						}">${hotspot.riskLevel.toUpperCase()}</span>
					</p>
					<p class="text-xs text-gray-600 mb-1">
						📊 ${hotspot.incidentCount} incidents in this area
					</p>
					<p class="text-xs text-gray-500">
						📍 ${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
					</p>
				</div>
			`;

			circle.bindPopup(popupContent);
			hotspotsRef.current.push(circle);
		});
	}, [hotspots]);

	// Recenter map when barangay changes
	useEffect(() => {
		if (!mapInstanceRef.current) return;
		let center = [14.8447, 120.8102]; // Default: Pinagbakahan, Malolos, Bulacan
		let zoom = barangay ? 16 : 15;
		
		if (barangay === "Bulihan") {
			center = [14.8527, 120.8160]; // Updated Bulihan coordinates
			zoom = 17; // Increased zoom for better focus
			console.log("🔄 Re-centering to Bulihan:", center, "zoom:", zoom);
		}
		else if (barangay === "Mojon") center = [14.858, 120.814];
		else if (barangay === "Dakila") center = [14.855, 120.812];
		else if (barangay === "Look 1st") center = [14.851, 120.818];
		else if (barangay === "Longos") center = [14.849, 120.813];
		else if (barangay === "Pinagbakahan") {
			center = [14.8447, 120.8102]; // Pinagbakahan, Malolos, Bulacan
			zoom = 16;
		}
		else if (barangay === "Tiaong") {
			center = [14.9502, 120.9002]; // Tiaong, Baliuag, Bulacan
			zoom = 16;
		}
		
		console.log("🔄 Final re-center:", center, "zoom:", zoom);
		mapInstanceRef.current.setView(center, zoom);
	}, [barangay]);

	// Handle new incident location
	useEffect(() => {
		if (!mapInstanceRef.current) return

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
	}, [newIncidentLocation, newIncidentRisk])

	return <div ref={mapRef} className="h-full w-full" />
}
