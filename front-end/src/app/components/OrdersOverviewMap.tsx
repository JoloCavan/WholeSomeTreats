"use client";

import { useEffect, useRef, useState } from "react";
import { BakeryStoreLocation, DEFAULT_BAKERY_LOCATION } from "@/app/types";

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
  bakeryLocation?: BakeryStoreLocation;
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

function makeBakerySvgIcon() {
  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
      <ellipse cx="24" cy="51" rx="11" ry="4" fill="rgba(0,0,0,0.22)"/>
      <path d="M24 2C13.5 2 5 10.5 5 21c0 14 19 32 19 32s19-18 19-32c0-10.5-8.5-19-19-19z"
            fill="#c2410c" stroke="#fef08a" stroke-width="3"/>
      <circle cx="24" cy="21" r="14" fill="#ea580c"/>
      <text x="24" y="26" text-anchor="middle" font-size="15">🏪</text>
    </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
}

// Olongapo City default center coordinates
const OLONGAPO_CENTER: [number, number] = [14.8387, 120.2842];
const DEFAULT_ZOOM = 13;

export default function OrdersOverviewMap({ pins, bakeryLocation = DEFAULT_BAKERY_LOCATION }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const activeLineRef = useRef<any>(null);
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
        const initialCenter: [number, number] = [
          bakeryLocation?.lat ?? OLONGAPO_CENTER[0],
          bakeryLocation?.lng ?? OLONGAPO_CENTER[1],
        ];

        // Explicitly enable dragging, zoomControl, and scrollWheelZoom
        const map = L.map(containerRef.current, {
          center: initialCenter,
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

  // Update markers when pins or bakeryLocation change
  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      const layer = markersLayerRef.current;
      if (layer) {
        layer.clearLayers();
      }
      if (activeLineRef.current) {
        map.removeLayer(activeLineRef.current);
        activeLineRef.current = null;
      }

      const bounds: [number, number][] = [];

      // 1. Render Bakery HQ Store Marker
      if (bakeryLocation && typeof bakeryLocation.lat === "number" && typeof bakeryLocation.lng === "number") {
        const bakeryIcon = L.icon({
          iconUrl: makeBakerySvgIcon(),
          iconSize: [48, 56],
          iconAnchor: [24, 56],
          popupAnchor: [0, -54],
        });

        const bakeryPopup = L.popup({ maxWidth: 300 }).setContent(`
          <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;padding:4px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:22px">🏪</span>
              <div>
                <div style="font-weight:900;font-size:14px;color:#c2410c">${bakeryLocation.storeName || "WholesomeTreats Bakery (HQ)"}</div>
                <div style="font-size:10px;font-weight:700;color:#f97316">Central Bakery & Origin Point</div>
              </div>
            </div>
            <div style="margin-bottom:4px;color:#292524"><b>Address:</b> ${bakeryLocation.address}</div>
            <div style="color:#78716c;font-size:11px;font-family:monospace">GPS: ${bakeryLocation.lat.toFixed(5)}, ${bakeryLocation.lng.toFixed(5)}</div>
            ${bakeryLocation.contactNumber ? `<div style="color:#44403c;margin-top:2px"><b>Contact:</b> ${bakeryLocation.contactNumber}</div>` : ""}
            <div style="margin-top:8px;padding:5px 10px;background:#ffedd5;border:1px solid #fed7aa;border-radius:12px;color:#9a3412;font-weight:800;font-size:11px;text-align:center">
              📍 Origin for all order delivery calculations
            </div>
          </div>
        `);

        const bakeryMarker = L.marker([bakeryLocation.lat, bakeryLocation.lng], {
          icon: bakeryIcon,
          zIndexOffset: 1000,
        }).bindPopup(bakeryPopup);

        if (layer) {
          layer.addLayer(bakeryMarker);
        } else {
          bakeryMarker.addTo(map);
        }
        bounds.push([bakeryLocation.lat, bakeryLocation.lng]);
      }

      // 2. Render Customer Order Pins with Exact Distance in Meters Calculation
      pins.forEach((pin) => {
        const color = getColor(pin.status);
        const abbr  = pin.status.slice(0, 1).toUpperCase();
        const icon  = L.icon({
          iconUrl:    makeSvgIcon(color, abbr),
          iconSize:   [36, 44],
          iconAnchor: [18, 44],
          popupAnchor:[0, -44],
        });

        // Compute exact geodesic distance in meters from Bakery HQ
        let distanceMeters: number | null = null;
        let distanceFormatted = "";
        if (bakeryLocation && typeof bakeryLocation.lat === "number" && typeof bakeryLocation.lng === "number") {
          const pBakery = L.latLng(bakeryLocation.lat, bakeryLocation.lng);
          const pCustomer = L.latLng(pin.lat, pin.lng);
          distanceMeters = Math.round(pBakery.distanceTo(pCustomer));
          distanceFormatted = distanceMeters >= 1000
            ? `${distanceMeters.toLocaleString()} meters (${(distanceMeters / 1000).toFixed(2)} km)`
            : `${distanceMeters.toLocaleString()} meters`;
        }

        const directionsUrl = bakeryLocation
          ? `https://www.google.com/maps/dir/?api=1&origin=${bakeryLocation.lat},${bakeryLocation.lng}&destination=${pin.lat},${pin.lng}`
          : `https://maps.google.com/?q=${pin.lat},${pin.lng}`;

        const popup = L.popup({ maxWidth: 290 }).setContent(`
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

            <!-- EXACT DISTANCE FROM BAKERY IN METERS -->
            ${distanceMeters !== null ? `
              <div style="margin-top:8px;padding:8px 10px;background:#fff7ed;border:1px solid #fdba74;border-radius:12px;display:flex;align-items:center;gap:8px">
                <div style="width:28px;height:28px;border-radius:8px;background:#ea580c;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
                  📏
                </div>
                <div>
                  <div style="font-size:10px;font-weight:800;color:#c2410c;text-transform:uppercase;letter-spacing:0.5px">Distance from Bakery</div>
                  <div style="font-size:13px;font-weight:900;color:#9a3412">${distanceFormatted}</div>
                </div>
              </div>
            ` : ""}

            <a href="${directionsUrl}" target="_blank"
               style="display:block;margin-top:8px;text-align:center;padding:6px 0;background:#ea580c;color:white;border-radius:8px;font-weight:700;text-decoration:none;font-size:11px">
              🚗 Open Driving Directions from Bakery
            </a>
          </div>
        `);

        const marker = L.marker([pin.lat, pin.lng], { icon }).bindPopup(popup);

        // When customer popup opens, draw a dashed visual line from Bakery to Customer
        marker.on("popupopen", () => {
          if (bakeryLocation && activeLineRef.current) {
            map.removeLayer(activeLineRef.current);
          }
          if (bakeryLocation) {
            const line = L.polyline(
              [[bakeryLocation.lat, bakeryLocation.lng], [pin.lat, pin.lng]],
              {
                color: "#ea580c",
                weight: 3,
                dashArray: "6, 8",
                opacity: 0.85,
              }
            ).addTo(map);

            if (distanceFormatted) {
              line.bindTooltip(`📏 ${distanceFormatted}`, { permanent: false, sticky: true });
            }
            activeLineRef.current = line;
          }
        });

        marker.on("popupclose", () => {
          if (activeLineRef.current) {
            map.removeLayer(activeLineRef.current);
            activeLineRef.current = null;
          }
        });

        if (layer) {
          layer.addLayer(marker);
        } else {
          marker.addTo(map);
        }
        bounds.push([pin.lat, pin.lng]);
      });

      // Fit bounds on initial load if the user hasn't actively navigated away
      if (bounds.length > 0 && !hasFittedInitialBoundsRef.current && !userInteractedRef.current) {
        try {
          map.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 });
          hasFittedInitialBoundsRef.current = true;
        } catch { }
      }
    });
  }, [mounted, pins, bakeryLocation]);

  const handleCenterOlongapo = () => {
    if (mapRef.current) {
      userInteractedRef.current = true;
      mapRef.current.setView(OLONGAPO_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  };

  const handleFocusBakery = () => {
    if (mapRef.current && bakeryLocation) {
      userInteractedRef.current = true;
      mapRef.current.setView([bakeryLocation.lat, bakeryLocation.lng], 15, { animate: true });
    }
  };

  const handleFitAllPins = () => {
    if (mapRef.current) {
      userInteractedRef.current = true;
      const allPoints: [number, number][] = pins.map((p) => [p.lat, p.lng]);
      if (bakeryLocation) {
        allPoints.push([bakeryLocation.lat, bakeryLocation.lng]);
      }
      if (allPoints.length > 0) {
        try {
          mapRef.current.fitBounds(allPoints as any, { padding: [50, 50], maxZoom: 15 });
        } catch { }
      }
    }
  };

  if (!mounted) {
    return (
      <div className="h-[520px] rounded-2xl bg-stone-100 border border-orange-200 flex items-center justify-center">
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
        style={{ height: 520, width: "100%" }}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Floating Map Navigation Utility Controls */}
      <div className="absolute top-3 right-3 z-[999] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleFocusBakery}
          className="bg-white/95 hover:bg-white text-orange-800 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 backdrop-blur-sm"
          title="Center on Bakery Store Location"
        >
          <span>🏪</span>
          <span>Focus Bakery HQ</span>
        </button>
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
            title="Fit all customer pins and bakery HQ in view"
          >
            <span>🎯</span>
            <span>Fit All Pins ({pins.length})</span>
          </button>
        )}
      </div>

      <div className="bg-stone-50 px-3.5 py-2.5 text-[11px] text-stone-500 font-medium border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-700 flex items-center gap-1">
            <span>🏪</span>
            <span>Origin:</span>
          </span>
          <span className="text-stone-700 font-semibold truncate max-w-sm">
            {bakeryLocation.address} ({bakeryLocation.lat.toFixed(4)}, {bakeryLocation.lng.toFixed(4)})
          </span>
        </div>
        <span className="font-bold text-orange-600">Click any order pin to view exact distance in meters</span>
      </div>
    </div>
  );
}
