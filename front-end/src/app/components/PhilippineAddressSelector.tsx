"use client";

import { useEffect, useState } from "react";

interface Region {
  region_code: string;
  region_name: string;
}
interface Province {
  province_code: string;
  province_name: string;
  region_code: string;
}
interface City {
  city_code: string;
  city_name: string;
  province_code: string;
}
interface Barangay {
  brgy_name: string;
  city_code: string;
}

interface Props {
  onChange: (fullAddress: string) => void;
  defaultRegionCode?: string;
  defaultProvinceCode?: string;
  defaultCityCode?: string;
}

const selectClass =
  "w-full px-3 py-2 rounded-xl border border-orange-200 bg-white text-stone-900 text-xs font-medium focus:outline-none focus:border-orange-500 disabled:bg-stone-50 disabled:text-stone-400 cursor-pointer";

// Default pre-populated records for Region 3 -> Zambales -> Olongapo
const INITIAL_REGIONS: Region[] = [
  { region_code: "03", region_name: "Region 3" },
];

const INITIAL_PROVINCES: Province[] = [
  { province_code: "0371", province_name: "Zambales", region_code: "03" },
];

const INITIAL_CITIES: City[] = [
  { city_code: "037107", city_name: "Olongapo", province_code: "0371" },
];

// Olongapo City's 17 official barangays
const OLONGAPO_BARANGAYS: Barangay[] = [
  { brgy_name: "Asinan", city_code: "037107" },
  { brgy_name: "Banicain", city_code: "037107" },
  { brgy_name: "Barreto", city_code: "037107" },
  { brgy_name: "East Bajac-bajac", city_code: "037107" },
  { brgy_name: "East Tapinac", city_code: "037107" },
  { brgy_name: "Gordon Heights", city_code: "037107" },
  { brgy_name: "Kalaklan", city_code: "037107" },
  { brgy_name: "Mabayuan", city_code: "037107" },
  { brgy_name: "New Cabalan", city_code: "037107" },
  { brgy_name: "New Ilalim", city_code: "037107" },
  { brgy_name: "New Kababae", city_code: "037107" },
  { brgy_name: "New Kalalake", city_code: "037107" },
  { brgy_name: "Old Cabalan", city_code: "037107" },
  { brgy_name: "Pag-asa", city_code: "037107" },
  { brgy_name: "Santa Rita", city_code: "037107" },
  { brgy_name: "West Bajac-bajac", city_code: "037107" },
  { brgy_name: "West Tapinac", city_code: "037107" },
];

export default function PhilippineAddressSelector({
  onChange,
  defaultRegionCode = "03",
  defaultProvinceCode = "0371",
  defaultCityCode = "037107",
}: Props) {
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [provinces, setProvinces] = useState<Province[]>(INITIAL_PROVINCES);
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [barangays, setBarangays] = useState<Barangay[]>(OLONGAPO_BARANGAYS);

  const [selRegion, setSelRegion] = useState<string>(defaultRegionCode);
  const [selProvince, setSelProvince] = useState<string>(defaultProvinceCode);
  const [selCity, setSelCity] = useState<string>(defaultCityCode);
  const [selBarangay, setSelBarangay] = useState<string>("");
  const [street, setStreet] = useState<string>("");

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingBarangay, setLoadingBarangay] = useState(false);

  // Load address database in background
  useEffect(() => {
    let isMounted = true;

    async function loadAddressData() {
      try {
        const [regData, provData, cityData, brgyData] = await Promise.all([
          fetch("/ph-address/region.json").then((r) => r.json()).catch(() => []),
          fetch("/ph-address/province.json").then((r) => r.json()).catch(() => []),
          fetch("/ph-address/city.json").then((r) => r.json()).catch(() => []),
          fetch("/ph-address/barangay.json").then((r) => r.json()).catch(() => []),
        ]);

        if (!isMounted) return;

        if (Array.isArray(regData) && regData.length > 0) {
          const formattedRegions: Region[] = regData.map((r: Region) => ({
            ...r,
            region_name:
              r.region_code === "03"
                ? "Region 3"
                : r.region_name.replace("Region III", "Region 3"),
          }));
          setRegions(formattedRegions);
        }

        if (Array.isArray(provData) && provData.length > 0) {
          const regProvs = provData.filter(
            (p: Province) => p.region_code === (selRegion || defaultRegionCode)
          );
          setProvinces(regProvs.length > 0 ? regProvs : INITIAL_PROVINCES);
        }

        if (Array.isArray(cityData) && cityData.length > 0) {
          const provCities = cityData
            .filter((c: City) => c.province_code === (selProvince || defaultProvinceCode))
            .map((c: City) => ({
              ...c,
              city_name: c.city_code === "037107" ? "Olongapo" : c.city_name,
            }));
          setCities(provCities.length > 0 ? provCities : INITIAL_CITIES);
        }

        if (Array.isArray(brgyData) && brgyData.length > 0) {
          const cityBrgys = brgyData.filter(
            (b: Barangay) => b.city_code === (selCity || defaultCityCode)
          );
          if (cityBrgys.length > 0) {
            setBarangays(cityBrgys);
          }
        }
      } catch (e) {
        console.error("Address data fetch notice:", e);
      }
    }

    loadAddressData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Notify parent whenever any part changes.
  // Note: If selBarangay is empty, address is incomplete (""), forcing user to select their neighborhood.
  useEffect(() => {
    if (!selRegion || !selProvince || !selCity || !selBarangay) {
      onChange("");
      return;
    }
    const regionName =
      regions.find((r) => r.region_code === selRegion)?.region_name ?? "Region 3";
    const provinceName =
      provinces.find((p) => p.province_code === selProvince)?.province_name ?? "Zambales";
    const cityName =
      cities.find((c) => c.city_code === selCity)?.city_name ?? "Olongapo";

    const parts = [street.trim(), selBarangay, cityName, provinceName, regionName].filter(
      Boolean
    );
    onChange(parts.join(", "));
  }, [selRegion, selProvince, selCity, selBarangay, street, regions, provinces, cities]);

  async function handleRegionChange(code: string) {
    setSelRegion(code);
    setSelProvince("");
    setSelCity("");
    setSelBarangay("");
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    if (!code) return;
    setLoadingProvince(true);
    try {
      const data: Province[] = await fetch("/ph-address/province.json")
        .then((r) => r.json())
        .catch(() => []);
      const filtered = data.filter((p) => p.region_code === code);
      setProvinces(filtered);

      // If user picks Region 3, auto-set Zambales -> Olongapo
      if (code === "03") {
        setSelProvince("0371");
        handleProvinceChange("0371");
      }
    } finally {
      setLoadingProvince(false);
    }
  }

  async function handleProvinceChange(code: string) {
    setSelProvince(code);
    setSelCity("");
    setSelBarangay("");
    setCities([]);
    setBarangays([]);
    if (!code) return;
    setLoadingCity(true);
    try {
      const data: City[] = await fetch("/ph-address/city.json")
        .then((r) => r.json())
        .catch(() => []);
      const filtered = data
        .filter((c) => c.province_code === code)
        .map((c) => ({
          ...c,
          city_name: c.city_code === "037107" ? "Olongapo" : c.city_name,
        }));
      setCities(filtered);

      // If user picks Zambales, auto-set Olongapo
      if (code === "0371") {
        setSelCity("037107");
        handleCityChange("037107");
      }
    } finally {
      setLoadingCity(false);
    }
  }

  async function handleCityChange(code: string) {
    setSelCity(code);
    setSelBarangay("");
    setBarangays([]);
    if (!code) return;
    setLoadingBarangay(true);
    try {
      if (code === "037107") {
        setBarangays(OLONGAPO_BARANGAYS);
      } else {
        const data: Barangay[] = await fetch("/ph-address/barangay.json")
          .then((r) => r.json())
          .catch(() => []);
        setBarangays(data.filter((b) => b.city_code === code));
      }
    } finally {
      setLoadingBarangay(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Region (Locked / Disabled) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            Region
          </label>
          <span className="text-[9px] text-stone-400 font-semibold flex items-center gap-0.5">
            🔒 Read-only
          </span>
        </div>
        <select
          value={selRegion}
          disabled={true}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 text-xs font-semibold cursor-not-allowed select-none opacity-90"
        >
          {regions.map((r) => (
            <option key={r.region_code} value={r.region_code}>
              {r.region_name}
            </option>
          ))}
        </select>
      </div>

      {/* Province (Locked / Disabled) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            Province
          </label>
          <span className="text-[9px] text-stone-400 font-semibold flex items-center gap-0.5">
            🔒 Read-only
          </span>
        </div>
        <select
          value={selProvince}
          disabled={true}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 text-xs font-semibold cursor-not-allowed select-none opacity-90"
        >
          {provinces.map((p) => (
            <option key={p.province_code} value={p.province_code}>
              {p.province_name}
            </option>
          ))}
        </select>
      </div>

      {/* City / Municipality (Locked / Disabled) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            City / Municipality
          </label>
          <span className="text-[9px] text-stone-400 font-semibold flex items-center gap-0.5">
            🔒 Read-only
          </span>
        </div>
        <select
          value={selCity}
          disabled={true}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 text-xs font-semibold cursor-not-allowed select-none opacity-90"
        >
          {cities.map((c) => (
            <option key={c.city_code} value={c.city_code}>
              {c.city_name}
            </option>
          ))}
        </select>
      </div>

      {/* Barangay */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
          Barangay <span className="text-orange-600">*</span>
        </label>
        <select
          value={selBarangay}
          onChange={(e) => setSelBarangay(e.target.value)}
          disabled={loadingBarangay}
          className={selectClass}
        >
          <option value="">{loadingBarangay ? "Loading..." : "— Select Barangay —"}</option>
          {barangays.map((b) => (
            <option key={b.brgy_name} value={b.brgy_name}>
              {b.brgy_name}
            </option>
          ))}
        </select>
      </div>

      {/* Street / House No. (optional) */}
      <div>
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1">
          Street / House No.{" "}
          <span className="text-stone-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="e.g. 123 Rizal St."
          className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white text-stone-900 text-xs font-medium focus:outline-none focus:border-orange-500 placeholder-stone-400"
        />
      </div>
    </div>
  );
}
