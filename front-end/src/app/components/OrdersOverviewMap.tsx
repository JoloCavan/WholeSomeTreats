"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

export default function OrdersOverviewMap({ pins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {
      // Init map only once
      if (!mapRef.current) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        const map = L.map(containerRef.current!, { zoomControl: true }).setView([14.8387, 120.2842], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current;

      // Remove existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

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

        const popup = L.popup({ maxWidth: 260 }).setContent(`
          <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.5">
            <div style="font-weight:800;font-size:13px;margin-bottom:4px">Order #${pin.orderId}</div>
            <div><b>Customer:</b> ${pin.customerName}</div>
            <div><b>Address:</b> ${pin.address}</div>
            ${pin.contactNumber ? `<div><b>Contact:</b> ${pin.contactNumber}</div>` : ""}
            ${pin.deliveryDate ? `<div><b>Delivery:</b> ${pin.deliveryDate}</div>` : ""}
            <div style="margin-top:6px;display:flex;justify-content:space-between">
              <span style="padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;color:white;background:${color}">${pin.status}</span>
              <span style="font-weight:800;color:#ea580c">₱${pin.totalAmount.toFixed(2)}</span>
            </div>
            <a href="https://maps.google.com/?q=${pin.lat},${pin.lng}" target="_blank"
               style="display:block;margin-top:8px;text-align:center;padding:4px 0;background:#2563eb;color:white;border-radius:8px;font-weight:700;text-decoration:none;font-size:11px">
              🗺️ Open in Google Maps
            </a>
          </div>
        `);

        L.marker([pin.lat, pin.lng], { icon }).bindPopup(popup).addTo(map);
        bounds.push([pin.lat, pin.lng]);
      });

      if (bounds.length > 0) {
        try {
          map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 15 });
        } catch { }
      }
    });
  }, [mounted, pins]);

  if (!mounted) {
    return (
      <div className="h-[480px] rounded-2xl bg-stone-100 border border-orange-200 flex items-center justify-center">
        <div className="text-xs text-stone-400 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Loading delivery map...
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ height: 480, width: "100%", borderRadius: 16, overflow: "hidden" }} />
    </>
  );
}
