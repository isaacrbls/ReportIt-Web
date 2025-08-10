"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"

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
}) {
	const [incidents, setIncidents] = useState(crimeIncidents)
	const mapRef = useRef(null)
	const mapInstanceRef = useRef(null)
	
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
	const markersRef = useRef([])
	const hotspotsRef = useRef([])
	const newMarkerRef = useRef(null)

	// Initialize map
	useEffect(() => {
		// Import Leaflet CSS
		require("leaflet/dist/leaflet.css")
		fixLeafletIcons()

		// Determine map center based on barangay
		let center = [14.8447, 120.8102]; // Default: Pinagbakahan, Malolos, Bulacan
		let zoom = barangay ? 16 : 15;
		if (barangay === "Bulihan") {
			// Center on Bulihan, Malolos, Bulacan (based on screenshot)
			center = [14.8575, 120.8145];
			zoom = 16;
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

		// Filter incidents by barangay if provided
		const filteredIncidents = barangay
			? incidents.filter((i) => {
					if (barangay === "Bulihan") return i.location[0] >= 14.85 && i.location[0] <= 14.86 && i.location[1] >= 120.81 && i.location[1] <= 120.82;
					if (barangay === "Mojon") return i.location[0] >= 14.857 && i.location[0] <= 14.86 && i.location[1] >= 120.813 && i.location[1] <= 120.815;
					if (barangay === "Dakila") return i.location[0] >= 14.854 && i.location[0] <= 14.856 && i.location[1] >= 120.811 && i.location[1] <= 120.813;
					if (barangay === "Look 1st") return i.location[0] >= 14.85 && i.location[0] <= 14.852 && i.location[1] >= 120.817 && i.location[1] <= 120.819;
					if (barangay === "Longos") return i.location[0] >= 14.848 && i.location[0] <= 14.85 && i.location[1] >= 120.812 && i.location[1] <= 120.814;
					if (barangay === "Tiaong") return i.location[0] >= 14.945 && i.location[0] <= 14.955 && i.location[1] >= 120.895 && i.location[1] <= 120.905;
					return false;
				})
			: incidents;

		filteredIncidents.forEach((incident) => {
			const marker = L.marker(incident.location, {
				icon: createCustomIcon(incident.risk),
			}).addTo(mapInstance)

			const popupContent = `
				<div class="p-1">
					<h3 class="font-medium">${incident.title}</h3>
					<p class="text-xs text-muted-foreground">
						${incident.date} at ${incident.time}
					</p>
					<div class="mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium bg-${
						incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"
					}-100 text-${incident.risk === "High" ? "red" : incident.risk === "Medium" ? "yellow" : "green"}-800">
						${incident.risk} Risk
					</div>
					<p class="mt-1 text-sm">${incident.description}</p>
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

	// Recenter map when barangay changes
	useEffect(() => {
		if (!mapInstanceRef.current) return;
		let center = [14.8447, 120.8102]; // Updated: Pinagbakahan, Malolos, Bulacan
		let zoom = barangay ? 16 : 15;
		if (barangay === "Bulihan") center = [14.8527, 120.816];
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
		// Add more as needed
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
