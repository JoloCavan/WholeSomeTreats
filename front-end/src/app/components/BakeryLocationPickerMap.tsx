"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function makeStorePinSvg() {
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="54" viewBox="0 0 46 54">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.3"/>
        </filter>
      </defs>
      <ellipse cx="23" cy="50" rx="10" ry="4" fill="rgba(0,0,0,0.2)"/>
      <path d="M23 2C13.06 2 5 10.06 5 20c0 13 18 31 18 31s18-18 18-31c0-9.94-8.06-18-18-18z"
            fill="#c2410c" stroke="#fef08a" stroke-width="3" filter="url(#shadow)"/>
      <circle cx="23" cy="20" r="13" fill="#ea580c"/>
      <text x="23" y="25" text-anchor="middle" font-size="14">🏪</text>
    </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
}

export default function BakeryLocationPickerMap({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  // Stable ref for onChange to prevent re-attaching listeners on every render
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (typeof window === "undefined") return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !containerRef.current) return;

      // Fix Next.js default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialLat = typeof lat === "number" && !isNaN(lat) && lat !== 0 ? lat : 14.8387;
      const initialLng = typeof lng === "number" && !isNaN(lng) && lng !== 0 ? lng : 120.2842;

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          touchZoom: true,
        });

        map.dragging.enable();
        map.scrollWheelZoom.enable();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const storeIcon = L.icon({
          iconUrl: makeStorePinSvg(),
          iconSize: [46, 54],
          iconAnchor: [23, 54],
          popupAnchor: [0, -50],
        });

        const marker = L.marker([initialLat, initialLng], {
          icon: storeIcon,
          draggable: true,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:#c2410c;text-align:center">
            🏪 Bakery / House Location<br/>
            <span style="font-size:10px;color:#78716c;font-family:monospace">${initialLat.toFixed(5)}, ${initialLng.toFixed(5)}</span>
          </div>
        `);

        // Click anywhere on map to drop / move pin and set coordinates
        map.on("click", (e: any) => {
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          marker.setLatLng([newLat, newLng]);
          marker.setPopupContent(`
            <div style="font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:#c2410c;text-align:center">
              🏪 Bakery / House Location<br/>
              <span style="font-size:10px;color:#78716c;font-family:monospace">${newLat.toFixed(5)}, ${newLng.toFixed(5)}</span>
            </div>
          `);
          marker.openPopup();
          onChangeRef.current(newLat, newLng);
        });

        // Drag marker to adjust location
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          marker.setPopupContent(`
            <div style="font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:#c2410c;text-align:center">
              🏪 Bakery / House Location<br/>
              <span style="font-size:10px;color:#78716c;font-family:monospace">${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</span>
            </div>
          `);
          marker.openPopup();
          onChangeRef.current(pos.lat, pos.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Invalidate size once rendered in container across animation frames
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 350);
        setTimeout(() => map.invalidateSize(), 600);
      }
    });

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isSubscribed = false;
      window.removeEventListener("resize", handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        delete (containerRef.current as any)._leaflet_id;
      }
    };
  }, [mounted]);

  // Update marker position when external lat/lng changes
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return;

    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`
        <div style="font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:#c2410c;text-align:center">
          🏪 Bakery / House Location<br/>
          <span style="font-size:10px;color:#78716c;font-family:monospace">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
        </div>
      `);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  if (!mounted) {
    return (
      <div className="h-[250px] rounded-2xl bg-stone-100 border border-orange-200 flex items-center justify-center">
        <div className="text-xs text-stone-400 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Loading location picker...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-stone-700 flex items-center gap-1.5">
          <span>📍</span>
          <span>Click Map to Drop Store Location Pin</span>
        </label>
        <span className="text-[11px] font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-lg">
          GPS: {lat ? lat.toFixed(5) : "14.83870"}, {lng ? lng.toFixed(5) : "120.28420"}
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-orange-200 shadow-inner bg-stone-100">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>{`
          .leaflet-container { font-family: inherit; width: 100%; height: 100%; z-index: 10; }
          .leaflet-control-zoom { border-radius: 10px !important; overflow: hidden; border: 1px solid #fed7aa !important; }
        `}</style>

        <div
          ref={containerRef}
          style={{ height: 250, width: "100%" }}
          className="cursor-crosshair"
        />

        <div className="absolute bottom-2 left-2 right-2 z-[999] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xs border border-orange-200/80 px-2.5 py-1 rounded-xl text-[10px] font-bold text-stone-700 shadow-sm flex items-center justify-between">
            <span>💡 Click anywhere on your house or store to drop the pin</span>
            <span className="text-orange-600 font-extrabold">Coordinates set automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
}
