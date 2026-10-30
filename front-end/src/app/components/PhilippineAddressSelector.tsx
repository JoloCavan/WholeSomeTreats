"use client";

import { useEffect, useState } from "react";

interface Region   { region_code: string; region_name: string; }
interface Province { province_code: string; province_name: string; region_code: string; }
interface City     { city_code: string; city_name: string; province_code: string; }
interface Barangay { brgy_name: string; city_code: string; }

interface Props {
  onChange: (fullAddress: string) => void;
  /** Pre-select to speed up UX — region_code e.g. "03" for Central Luzon */
  defaultRegionCode?: string;
}

const selectClass =
  "w-full px-3 py-2 rounded-xl border border-orange-200 bg-white text-stone-900 text-xs font-medium focus:outline-none focus:border-orange-500 disabled:bg-stone-50 disabled:text-stone-400 cursor-pointer";

export default function PhilippineAddressSelector({ onChange, defaultRegionCode }: Props) {
  const [regions,   setRegions]   = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities,    setCities]    = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [selRegion,   setSelRegion]   = useState("");
  const [selProvince, setSelProvince] = useState("");
  const [selCity,     setSelCity]     = useState("");
  const [selBarangay, setSelBarangay] = useState("");
  const [street,      setStreet]      = useState("");

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity,     setLoadingCity]     = useState(false);
  const [loadingBarangay, setLoadingBarangay] = useState(false);

  // Load regions on mount
  useEffect(() => {
    fetch("/ph-address/region.json")
      .then(r => r.json())
      .then((data: Region[]) => {
        setRegions(data);
        if (defaultRegionCode) {
          const match = data.find(r => r.region_code === defaultRegionCode);
          if (match) handleRegionChange(defaultRegionCode);
        }
      })
      .catch(() => {});
  }, []);

  // Notify parent whenever any part changes
  useEffect(() => {
    if (!selRegion || !selProvince || !selCity || !selBarangay) {
      onChange("");
      return;
    }
    const regionName   = regions.find(r => r.region_code === selRegion)?.region_name ?? "";
    const provinceName = provinces.find(p => p.province_code === selProvince)?.province_name ?? "";
    const cityName     = cities.find(c => c.city_code === selCity)?.city_name ?? "";
    const parts = [
      street.trim(),
      selBarangay,
      cityName,
      provinceName,
      regionName,
    ].filter(Boolean);
    onChange(parts.join(", "));
  }, [selRegion, selProvince, selCity, selBarangay, street]);

  async function handleRegionChange(code: string) {
    setSelRegion(code);
    setSelProvince(""); setSelCity(""); setSelBarangay("");
    setProvinces([]); setCities([]); setBarangays([]);
    if (!code) return;
    setLoadingProvince(true);
    try {
      const data: Province[] = await fetch("/ph-address/province.json").then(r => r.json());
      setProvinces(data.filter(p => p.region_code === code));
    } finally { setLoadingProvince(false); }
  }

  async function handleProvinceChange(code: string) {
    setSelProvince(code);
    setSelCity(""); setSelBarangay("");
    setCities([]); setBarangays([]);
    if (!code) return;
    setLoadingCity(true);
    try {
      const data: City[] = await fetch("/ph-address/city.json").then(r => r.json());
      setCities(data.filter(c => c.province_code === code));
    } finally { setLoadingCity(false); }
  }

  async function handleCityChange(code: string) {
    setSelCity(code);
    setSelBarangay(""); setBarangays([]);
    if (!code) return;
    setLoadingBarangay(true);
    try {
      const data: Barangay[] = await fetch("/ph-address/barangay.json").then(r => r.json());
      setBarangays(data.filter(b => b.city_code === code));
    } finally { setLoadingBarangay(false); }
  }

  return (
    <div className="space-y-2">
      {/* Region */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">Region</label>
        <select
          value={selRegion}
          onChange={e => handleRegionChange(e.target.value)}
          className={selectClass}
        >
          <option value="">— Select Region —</option>
          {regions.map(r => (
            <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
          ))}
        </select>
      </div>

      {/* Province */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">Province</label>
        <select
          value={selProvince}
          onChange={e => handleProvinceChange(e.target.value)}
          disabled={!selRegion || loadingProvince}
          className={selectClass}
        >
          <option value="">{loadingProvince ? "Loading..." : "— Select Province —"}</option>
          {provinces.map(p => (
            <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
          ))}
        </select>
      </div>

      {/* City / Municipality */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">City / Municipality</label>
        <select
          value={selCity}
          onChange={e => handleCityChange(e.target.value)}
          disabled={!selProvince || loadingCity}
          className={selectClass}
        >
          <option value="">{loadingCity ? "Loading..." : "— Select City / Municipality —"}</option>
          {cities.map(c => (
            <option key={c.city_code} value={c.city_code}>{c.city_name}</option>
          ))}
        </select>
      </div>

      {/* Barangay */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">Barangay</label>
        <select
          value={selBarangay}
          onChange={e => setSelBarangay(e.target.value)}
          disabled={!selCity || loadingBarangay}
          className={selectClass}
        >
          <option value="">{loadingBarangay ? "Loading..." : "— Select Barangay —"}</option>
          {barangays.map(b => (
            <option key={b.brgy_name} value={b.brgy_name}>{b.brgy_name}</option>
          ))}
        </select>
      </div>

      {/* Street / House No. (optional) */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
          Street / House No. <span className="text-stone-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={street}
          onChange={e => setStreet(e.target.value)}
          placeholder="e.g. 123 Rizal St."
          className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white text-stone-900 text-xs font-medium focus:outline-none focus:border-orange-500 placeholder-stone-400"
        />
      </div>
    </div>
  );
}
