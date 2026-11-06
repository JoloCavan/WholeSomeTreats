"use client";

import { useEffect, useRef, useState } from "react";

export interface OrderPin {
  orderId: number;
  customerName: string;
  address: string;
  status: string;
  totalAmount: number;
  lat: number;
  lng: number;
  contactNumber?: string;
  deliveryDate?: string;
}

interface Props {
  pins: OrderPin[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending:    "#f59e0b",
  Approved:   "#10b981",
  Processing: "#f97316",
  Delivering: "#3b82f6",
  Completed:  "#6b7280",
  Declined:   "#ef4444",
  Cancelled:  "#9ca3af",
};

function getColor(status: string) {
  return STATUS_COLORS[status] ?? "#f97316";
}

function makeSvgIcon(color: string, label: string) {
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <ellipse cx="18" cy="41" rx="8" ry="3" fill="rgba(0,0,0,0.15)"/>
      <path d="M18 2C10.27 2 4 8.27 4 16c0 10 14 26 14 26S32 26 32 16C32 8.27 25.73 2 18 2z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <text x="18" y="20" text-anchor="middle" font-size="11" font-weight="bold"
            fill="white" font-family="Arial,sans-serif">${label}</text>
    </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
}

// Olongapo City default center coordinates
const OLONGAPO_CENTER: [number, number] = [14.8387, 120.2842];
const DEFAULT_ZOOM = 13;

export default function OrdersOverviewMap({ pins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userInteractedRef = useRef(false);
  const hasFittedInitialBoundsRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Initialize Leaflet map with dragging, zoomControl, and scrollWheelZoom enabled
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (typeof window === "undefined") return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !containerRef.current) return;

      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        // Explicitly enable dragging, zoomControl, and scrollWheelZoom
        const map = L.map(containerRef.current, {
          center: OLONGAPO_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          touchZoom: true,
          keyboard: true,
        });

        // Re-enable handlers explicitly to guarantee un-frozen interactive navigation
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoom.enable();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Marker layer group
        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;

        // Track user interaction so subsequent background updates don't jerk the viewport
        map.on("dragstart", () => { userInteractedRef.current = true; });
        map.on("zoomstart", () => { userInteractedRef.current = true; });

        mapRef.current = map;

        // Invalidate size once rendered in DOM tab container
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
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

  // Update markers when pins change without resetting the user's pan/zoom
  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      const layer = markersLayerRef.current;
      if (layer) {
        layer.clearLayers();
      }

      if (pins.length === 0) return;

      const bounds: [number, number][] = [];

      pins.forEach((pin) => {
        const color = getColor(pin.status);
        const abbr  = pin.status.slice(0, 1).toUpperCase();
        const icon  = L.icon({
          iconUrl:    makeSvgIcon(color, abbr),
          iconSize:   [36, 44],
          iconAnchor: [18, 44],
          popupAnchor:[0, -44],
        });

        const popup = L.popup({ maxWidth: 280 }).setContent(`
          <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;padding:2px">
            <div style="font-weight:800;font-size:13px;margin-bottom:4px;color:#1c1917">Order #${pin.orderId}</div>
            <div style="color:#44403c"><b>Customer:</b> ${pin.customerName}</div>
            <div style="color:#44403c"><b>Address:</b> ${pin.address}</div>
            ${pin.contactNumber ? `<div style="color:#44403c"><b>Contact:</b> ${pin.contactNumber}</div>` : ""}
            ${pin.deliveryDate ? `<div style="color:#44403c"><b>Delivery:</b> ${pin.deliveryDate}</div>` : ""}
            <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between">
              <span style="padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;color:white;background:${color}">${pin.status}</span>
              <span style="font-weight:800;color:#ea580c;font-size:13px">₱${pin.totalAmount.toFixed(2)}</span>
            </div>
            <a href="https://maps.google.com/?q=${pin.lat},${pin.lng}" target="_blank"
               style="display:block;margin-top:8px;text-align:center;padding:5px 0;background:#ea580c;color:white;border-radius:8px;font-weight:700;text-decoration:none;font-size:11px">
              🗺️ Open in Google Maps
            </a>
          </div>
        `);

        const marker = L.marker([pin.lat, pin.lng], { icon }).bindPopup(popup);
        if (layer) {
          layer.addLayer(marker);
        } else {
          marker.addTo(map);
        }
        bounds.push([pin.lat, pin.lng]);
      });

      // Fit bounds on first pins load if the user hasn't actively navigated away
      if (bounds.length > 0 && !hasFittedInitialBoundsRef.current && !userInteractedRef.current) {
        try {
          map.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 });
          hasFittedInitialBoundsRef.current = true;
        } catch { }
      }
    });
  }, [mounted, pins]);

  const handleCenterOlongapo = () => {
    if (mapRef.current) {
      userInteractedRef.current = true;
      mapRef.current.setView(OLONGAPO_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  };

  const handleFitAllPins = () => {
    if (mapRef.current && pins.length > 0) {
      userInteractedRef.current = true;
      const bounds = pins.map((p) => [p.lat, p.lng]);
      try {
        mapRef.current.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 });
      } catch { }
    }
  };

  if (!mounted) {
    return (
      <div className="h-[500px] rounded-2xl bg-stone-100 border border-orange-200 flex items-center justify-center">
        <div className="text-xs text-stone-400 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Loading delivery map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-orange-200 shadow-sm">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-container { font-family: inherit; width: 100%; height: 100%; z-index: 10; }
        .leaflet-control-zoom { border-radius: 12px !important; overflow: hidden; border: 1px solid #fed7aa !important; }
      `}</style>

      {/* Map Interactive Canvas */}
      <div
        ref={containerRef}
        style={{ height: 500, width: "100%" }}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Floating Map Navigation Utility Controls */}
      <div className="absolute top-3 right-3 z-[999] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCenterOlongapo}
          className="bg-white/95 hover:bg-white text-stone-800 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 backdrop-blur-sm"
          title="Pan & center on Olongapo City"
        >
          <span>📍</span>
          <span>Center Olongapo</span>
        </button>
        {pins.length > 0 && (
          <button
            type="button"
            onClick={handleFitAllPins}
            className="bg-white/95 hover:bg-white text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 backdrop-blur-sm"
            title="Fit all customer pins in view"
          >
            <span>🎯</span>
            <span>Fit All Pins ({pins.length})</span>
          </button>
        )}
      </div>

      <div className="bg-stone-50 px-3.5 py-2 text-[11px] text-stone-500 font-medium border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <span>💡 Drag to pan, scroll wheel / pinch to zoom anywhere across Olongapo</span>
        <span className="font-bold text-orange-600">Olongapo City, Zambales</span>
      </div>
    </div>
  );
}
