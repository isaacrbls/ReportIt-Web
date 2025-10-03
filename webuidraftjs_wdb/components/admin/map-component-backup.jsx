"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { reverseGeocode } from "../../lib/mapUtils";
import { clusterIncidents } from "../../lib/clusterUtils";

// Initialize Leaflet CSS
let leafletCSSLoaded = false;

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

const fixLeafletIcons = () => {
	delete L.Icon.Default.prototype._getIconUrl

	L.Icon.Default.mergeOptions({
		iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
		iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
		shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
	})
}

export default function MapComponent({
	onMapClick,
	onMarkerClick,
	addingIncident,
	incidents,
	hotspots,
	showPins = true,
	showHotspots = true,
	center,
	zoom = 16,
	preloadedIncidents = null,
	showPopups = false,
	onIncidentAdded,
	barangay,
	showOnlyTopCluster = false
}) {
	const mapRef = useRef(null);
	const mapContainerRef = useRef(null);
	const markersRef = useRef([]);
	const hotspotsRef = useRef([]);
	const [incidents, setIncidents] = useState([]);

	// Clean up markers
	const clearMarkers = () => {
		markersRef.current.forEach(({ marker }) => {
			if (mapRef.current) {
				mapRef.current.removeLayer(marker);
			}
		});
		markersRef.current = [];
	};

	// Clean up hotspots
	const clearHotspots = () => {
		hotspotsRef.current.forEach(circle => {
			if (mapRef.current) {
				mapRef.current.removeLayer(circle);
			}
		});
		hotspotsRef.current = [];
	};

	// Initialize map
	useEffect(() => {
		if (!mapContainerRef.current) return;

		fixLeafletIcons();

		const defaultCenter = center || [14.8715, 120.8207];
		const defaultZoom = zoom || 16;

		const map = L.map(mapContainerRef.current, {
			center: defaultCenter,
			zoom: defaultZoom,
			zoomControl: true,
			scrollWheelZoom: true,
			doubleClickZoom: true,
			dragging: true
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors'
		}).addTo(map);

		mapRef.current = map;

		// Handle map clicks
		map.on('click', (e) => {
			if (addingIncident && onMapClick) {
				onMapClick([e.latlng.lat, e.latlng.lng]);
			}
		});

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, []);

	// Update markers when incidents change
	useEffect(() => {
		if (!mapRef.current || !showPins) return;

		clearMarkers();

		const incidentsToShow = preloadedIncidents && preloadedIncidents.length > 0 ? preloadedIncidents : incidents;
		
		if (!incidentsToShow || incidentsToShow.length === 0) return;

		const newMarkers = [];

		incidentsToShow.forEach(incident => {
			const isPreloaded = preloadedIncidents && preloadedIncidents.length > 0;
			
			// Format incident data
			const formattedIncident = isPreloaded ? {
				id: incident.id,
				location: [incident.Latitude, incident.Longitude],
				title: incident.IncidentType || incident.title,
				description: incident.Description || incident.description,
				risk: incident.RiskLevel || incident.risk || 'Medium',
				date: incident.Date || incident.date,
				time: incident.Time || incident.time,
				barangay: incident.Barangay || incident.barangay,
				isSensitive: incident.isSensitive || false
			} : incident;

			// Create marker with risk-based color
			const color = formattedIncident.risk === "High" ? "#dc2626" : 
						 formattedIncident.risk === "Medium" ? "#ea580c" : "#16a34a";

			const marker = L.circleMarker([formattedIncident.location[0], formattedIncident.location[1]], {
				radius: 8,
				fillColor: color,
				color: "#fff",
				weight: 2,
				opacity: 1,
				fillOpacity: 0.8
			});

			marker.addTo(mapRef.current);

			// Create popup content
			const popupContent = `
				<div style="padding: 8px; min-width: 200px;">
					<h3 style="font-weight: 600; font-size: 16px; margin: 0 0 4px 0; color: #333;">${formattedIncident.title}</h3>
					<p style="font-size: 12px; color: #666; margin: 2px 0;">
						${formattedIncident.date} at ${formattedIncident.time}
					</p>
					<div style="background-color: ${formattedIncident.risk === "High" ? "#fecaca" : formattedIncident.risk === "Medium" ? "#fed7aa" : "#bbf7d0"}; 
								color: ${formattedIncident.risk === "High" ? "#dc2626" : formattedIncident.risk === "Medium" ? "#ea580c" : "#16a34a"}; 
								padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; 
								text-align: center; margin: 6px 0; display: inline-block;">
						${formattedIncident.risk} Risk
					</div>
					${formattedIncident.isSensitive ? `
					<div style="background-color: #fed7aa; color: #ea580c; padding: 2px 8px; border-radius: 12px; 
								font-size: 11px; font-weight: 500; text-align: center; margin: 6px 0; display: inline-block;">
						Sensitive
					</div>
					` : ''}
					<p style="font-size: 12px; color: #333; margin: 4px 0;">
						${formattedIncident.description || 'No description available'}
					</p>
					<div id="location-${formattedIncident.id}" style="font-size: 11px; color: #666; margin-top: 8px;">
						<strong>Location:</strong> Loading address...
					</div>
				</div>
			`;

			marker.bindPopup(popupContent);

			// Asynchronously fetch street address with robust retry logic
			const tryGetStreetAddress = async (retries = 3, delay = 1000) => {
				for (let i = 0; i < retries; i++) {
					try {
						const streetAddress = await reverseGeocode(formattedIncident.location[0], formattedIncident.location[1]);
						
						// Check if we got a valid street address (not coordinates)
						if (streetAddress && 
							streetAddress !== 'Unknown location' && 
							!streetAddress.includes('(') && 
							!streetAddress.match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
							
							const updatedContent = popupContent.replace(
								`<strong>Location:</strong> Loading address...`,
								`<strong>Location:</strong> ${streetAddress}`
							);
							marker.setPopupContent(updatedContent);
							return;
						}
					} catch (error) {
						console.warn(`Address lookup attempt ${i + 1} failed for incident ${formattedIncident.id}:`, error);
					}
					
					// Wait before retrying (except on last attempt)
					if (i < retries - 1) {
						await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
					}
				}
				
				// Final fallback: use barangay or generic location
				const fallbackLocation = formattedIncident.barangay || 
										 barangay || 
										 'Malolos City';
				
				const fallbackContent = popupContent.replace(
					`<strong>Location:</strong> Loading address...`,
					`<strong>Location:</strong> ${fallbackLocation}`
				);
				marker.setPopupContent(fallbackContent);
			};

			// Start address lookup
			tryGetStreetAddress();

			// Handle marker click
			if (onMarkerClick) {
				marker.on("click", () => {
					onMarkerClick(formattedIncident);
				});
			}

			markersRef.current.push({ marker, incident: formattedIncident });
			newMarkers.push(marker);
		});

		// Auto-fit bounds if we have markers
		if (newMarkers.length > 0 && !addingIncident) {
			const group = L.featureGroup(newMarkers);
			mapRef.current.fitBounds(group.getBounds().pad(0.1));
		}

	}, [incidents, preloadedIncidents, showPins, onMarkerClick, addingIncident, barangay]);

	// Update hotspots when they change
	useEffect(() => {
		if (!mapRef.current || !showHotspots || !hotspots) return;

		clearHotspots();

		hotspots.forEach(hotspot => {
			const circle = L.circle([hotspot.lat, hotspot.lng], {
				radius: 300,
				fillColor: "#ef4444",
				color: "#dc2626",
				weight: 2,
				opacity: 0.8,
				fillOpacity: 0.2
			});

			circle.addTo(mapRef.current);

			const popupContent = `
				<div style="padding: 8px;">
					<h4 style="margin: 0 0 4px 0; color: #dc2626;">High Risk Area</h4>
					<p style="margin: 0; font-size: 12px; color: #666;">
						${hotspot.count} incidents in this area<br/>
						Location: ${hotspot.locationName || 'Unknown'}
					</p>
				</div>
			`;

			circle.bindPopup(popupContent);
			hotspotsRef.current.push(circle);
		});
	}, [hotspots, showHotspots]);

	return (
		<div
			ref={mapContainerRef}
			className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
			style={{ zIndex: 1 }}
		/>
	);
}