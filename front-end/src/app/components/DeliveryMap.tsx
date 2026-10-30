"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

export interface LocationResult {
  lat: number;
  lng: number;
  displayAddress?: string;
}

interface Props {
  lat?: number | null;
  lng?: number | null;
  address?: string;           // Used to auto-geocode when address changes
  readOnly?: boolean;
  onLocationChange?: (loc: LocationResult) => void;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ──────────────────────────────────────────────
// Inner map component (only rendered client-side)
// ──────────────────────────────────────────────
function LeafletMap({ lat, lng, address, readOnly, onLocationChange }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const debouncedAddress = useDebounce(address ?? "", 900);

  const defaultLat = lat ?? 14.8387;   // Olongapo City default
  const defaultLng = lng ?? 120.2842;

  // ── Nominatim geocode helper ──
  const geocodeAddress = useCallback(async (query: string): Promise<LocationResult | null> => {
    if (!query || query.length < 6) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data?.[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayAddress: data[0].display_name };
      }
    } catch { }
    return null;
  }, []);

  // ── Reverse geocode (drag) ──
  const reverseGeocode = useCallback(async (location: LocationResult) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      location.displayAddress = data?.display_name ?? "";
    } catch { }
    onLocationChange?.(location);
  }, [onLocationChange]);

  // ── Init map once ──
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {
      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([defaultLat, defaultLng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: !readOnly }).addTo(map);

      if (!readOnly) {
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          reverseGeocode({ lat, lng });
        });
        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          reverseGeocode({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      mapRef.current    = map;
      markerRef.current = marker;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Move marker when lat/lng props change ──
  useEffect(() => {
    if (!mapReady || !markerRef.current || lat == null || lng == null) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current?.setView([lat, lng], mapRef.current.getZoom() < 15 ? 15 : mapRef.current.getZoom());
  }, [lat, lng, mapReady]);

  // ── Auto-geocode when address string changes ──
  useEffect(() => {
    if (!mapReady || !debouncedAddress || readOnly) return;
    if (lat != null && lng != null) return; // already have coords, don't override
    setGeocoding(true);
    geocodeAddress(debouncedAddress).then((loc) => {
      if (loc && markerRef.current) {
        markerRef.current.setLatLng([loc.lat, loc.lng]);
        mapRef.current?.setView([loc.lat, loc.lng], 16);
        onLocationChange?.(loc);
      }
      setGeocoding(false);
    });
  }, [debouncedAddress, mapReady]);

  // ── Use My Location ──
  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LocationResult = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        markerRef.current?.setLatLng([loc.lat, loc.lng]);
        mapRef.current?.setView([loc.lat, loc.lng], 17);
        reverseGeocode(loc);
      },
      () => alert("Location permission denied or unavailable."),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-orange-200 shadow-sm">
      {/* Leaflet CSS */}
      <style>{`
        .leaflet-container { font-family: inherit; }
        .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>

      {/* Map container */}
      <div ref={containerRef} style={{ height: 280, width: "100%" }} />

      {/* Loading overlay */}
      {geocoding && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl px-3 py-2 text-xs font-bold text-orange-600 shadow flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Finding location...
          </div>
        </div>
      )}

      {/* Controls */}
      {!readOnly && (
        <div className="absolute top-2 right-2 z-[999] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleMyLocation}
            className="bg-white text-orange-600 border border-orange-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow hover:bg-orange-50 cursor-pointer flex items-center gap-1"
          >
            📍 Use My Location
          </button>
        </div>
      )}

      <div className="bg-stone-50 px-3 py-1.5 text-[10px] text-stone-500 font-medium border-t border-stone-100">
        {readOnly ? "📌 Confirmed delivery location" : "💡 Click map or drag the pin to adjust exact location"}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SSR-safe dynamic export
// ──────────────────────────────────────────────
export default function DeliveryMap(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-[280px] rounded-2xl bg-stone-100 border border-orange-200 flex items-center justify-center">
        <div className="text-xs text-stone-400 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <LeafletMap {...props} />
    </>
  );
}
