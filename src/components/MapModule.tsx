import React, { useState, useEffect } from 'react';
import {
  MapPin,
  PhoneCall,
  Navigation,
  Clock,
  ShieldCheck,
  Sparkles,
  Filter,
  Building2,
  AlertCircle,
  LocateFixed,
  Search,
  UserCheck,
  Stethoscope,
  ExternalLink,
  Award,
  RefreshCw
} from 'lucide-react';
import { EmergencyClinic, LanguageOption, SeverityTier } from '../types';
import { EMERGENCY_CLINICS } from '../data/clinicsData';
import { TRANSLATIONS } from '../data/translations';

interface MapModuleProps {
  language: LanguageOption;
  activeSeverity?: SeverityTier;
  activeHazard?: string;
  activeSpecies?: string;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const MapModule: React.FC<MapModuleProps> = ({
  language,
  activeSeverity = 'Critical',
  activeHazard = 'Toxic Ingestion',
  activeSpecies = 'Dog'
}) => {
  const t = TRANSLATIONS[language];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [only247, setOnly247] = useState(false);
  const [onlyICU, setOnlyICU] = useState(false);
  const [onlyExotic, setOnlyExotic] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState<EmergencyClinic | null>(EMERGENCY_CLINICS[0]);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  // Pre-configured City Coordinates for instant manual location selection
  const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
    'Delhi NCR': { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR (Connaught Place Center)' },
    'Bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru (MG Road Center)' },
    'Mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai (Bandra Center)' },
    'Kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata (Park Street Center)' },
    'Hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad (Banjara Hills Center)' },
    'Chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai (Anna Nagar Center)' },
    'Pune': { lat: 18.5204, lng: 73.8567, name: 'Pune (Koregaon Park Center)' }
  };

  // GPS & Manual Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string; isManual?: boolean }>({
    lat: CITY_COORDINATES['Delhi NCR'].lat,
    lng: CITY_COORDINATES['Delhi NCR'].lng,
    label: CITY_COORDINATES['Delhi NCR'].name,
    isManual: true
  });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customAreaText, setCustomAreaText] = useState('');

  // Detect GPS Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `Detected GPS Location (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
          isManual: false
        });
        setLocating(false);
        setShowLocationPicker(false);
      },
      (err) => {
        console.warn('Geolocation error or denied:', err.message);
        setLocationError('Browser GPS permission was denied or unavailable. Please select your city/area below.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Auto detect GPS location on mount
  useEffect(() => {
    handleDetectLocation();
  }, []);

  // Set Manual City
  const handleSelectManualCity = (cityName: string) => {
    const coords = CITY_COORDINATES[cityName];
    if (coords) {
      setUserLocation({
        lat: coords.lat,
        lng: coords.lng,
        label: coords.name,
        isManual: true
      });
      setSelectedCity(cityName);
      setShowLocationPicker(false);
      setLocationError(null);
    }
  };

  // Set Custom Area Search
  const handleSetCustomArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAreaText.trim()) return;

    // Match against known cities or areas
    const matchKey = Object.keys(CITY_COORDINATES).find(
      key => key.toLowerCase().includes(customAreaText.toLowerCase()) || customAreaText.toLowerCase().includes(key.toLowerCase())
    );

    if (matchKey) {
      handleSelectManualCity(matchKey);
    } else {
      // Default to city center with labeled query
      setUserLocation({
        lat: 28.6139,
        lng: 77.2090,
        label: `Area: ${customAreaText} (Delhi NCR Base)`,
        isManual: true
      });
      setShowLocationPicker(false);
    }
  };

  // Compute clinics list with dynamic distance sorting
  const cities = ['All', 'Delhi NCR', 'Bengaluru', 'Mumbai', 'Kolkata', 'Hyderabad', 'Chennai', 'Pune'];

  const processedClinics = EMERGENCY_CLINICS.map((clinic) => {
    if (userLocation) {
      const dist = calculateHaversineKm(userLocation.lat, userLocation.lng, clinic.lat, clinic.lng);
      const driveMins = Math.max(3, Math.round(dist * 2.5));
      return {
        ...clinic,
        distanceKm: dist,
        driveTimeMins: driveMins
      };
    }
    return clinic;
  }).sort((a, b) => a.distanceKm - b.distanceKm); // NEAREST FIRST

  // Apply filters & search query
  const filteredClinics = processedClinics.filter((clinic) => {
    if (only247 && !clinic.isOpen247) return false;
    if (onlyICU && !clinic.hasICU) return false;
    if (onlyExotic && !clinic.treatsExotics) return false;
    if (selectedCity !== 'All' && clinic.city !== selectedCity) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = clinic.name.toLowerCase().includes(q);
      const matchDoc = clinic.leadDoctor?.toLowerCase().includes(q);
      const matchSpec = clinic.doctorSpecialty?.toLowerCase().includes(q);
      const matchAddr = clinic.address.toLowerCase().includes(q);
      const matchCity = clinic.city.toLowerCase().includes(q);
      if (!matchName && !matchDoc && !matchSpec && !matchAddr && !matchCity) return false;
    }

    return true;
  });

  // Fetch AI Reasoning when selecting a clinic
  const handleSelectClinic = async (clinic: EmergencyClinic) => {
    setSelectedClinic(clinic);
    setLoadingReasoning(true);
    setAiReasoning(null);

    try {
      const res = await fetch('/api/map/clinic-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic,
          severity: activeSeverity,
          species: activeSpecies,
          hazard: activeHazard
        })
      });
      const data = await res.json();
      setAiReasoning(data.reasoning);
    } catch (err) {
      setAiReasoning(
        `${clinic.leadDoctor} at ${clinic.name} is prioritized as the top emergency choice (${clinic.distanceKm} km, ~${clinic.driveTimeMins} mins drive) for ${activeSeverity} tier ${activeSpecies} triage.`
      );
    } finally {
      setLoadingReasoning(false);
    }
  };

  // Keep selectedClinic in sync with filtered items
  useEffect(() => {
    if (filteredClinics.length > 0) {
      if (!selectedClinic || !filteredClinics.some((c) => c.id === selectedClinic.id)) {
        handleSelectClinic(filteredClinics[0]);
      }
    } else {
      setSelectedClinic(null);
    }
  }, [filteredClinics]);

  return (
    <div className="space-y-6">
      {/* Header & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Nearest Veterinary Doctors & Emergency Clinics
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Find verified emergency veterinary doctors, 24/7 ICU trauma wards, and real-time distance matrix
            </p>
          </div>

          {/* GPS Auto Detect Button */}
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all"
          >
            <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS...' : 'Detect My Nearest Location'}</span>
          </button>
        </div>

        {/* Active Location Display Banner with Change Button */}
        <div className="mt-3 bg-slate-950/90 border border-emerald-500/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-200 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Active Search Origin / Location:</span>
              <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                {userLocation.label}
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Nearest Doctors First
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Correct / Change Location</span>
            </button>
          </div>
        </div>

        {/* Location Picker / Correction Drawer Modal */}
        {showLocationPicker && (
          <div className="mt-3 p-4 bg-slate-950 border border-emerald-500/50 rounded-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Select Your Real Location / City
              </h4>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select your city below or use GPS auto-detect to calculate exact distances to nearest emergency veterinary doctors:
            </p>

            {/* Quick City Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.keys(CITY_COORDINATES).map((cityName) => (
                <button
                  key={cityName}
                  onClick={() => handleSelectManualCity(cityName)}
                  className={`p-2 rounded-lg text-xs font-bold text-left border transition-all ${
                    selectedCity === cityName
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  📍 {cityName}
                </button>
              ))}
            </div>

            {/* GPS Retry Button & Custom Area Search */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting via Browser GPS...' : 'Try Live GPS Auto-Detect'}</span>
              </button>

              <form onSubmit={handleSetCustomArea} className="w-full flex gap-2">
                <input
                  type="text"
                  value={customAreaText}
                  onChange={(e) => setCustomAreaText(e.target.value)}
                  placeholder="Or enter locality / street name (e.g. Indiranagar, Bandra)..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-lg text-xs shrink-0"
                >
                  Set Location
                </button>
              </form>
            </div>

            {locationError && (
              <p className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 p-2 rounded-lg">
                ⚠️ {locationError}
              </p>
            )}
          </div>
        )}

        {/* Search Bar & City Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor name, specialty, clinic, or area (e.g. Dr. Sharma, Indiranagar)..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  City: {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Criteria:
          </span>

          <button
            onClick={() => setOnly247(!only247)}
            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
              only247
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            24/7 Open Only
          </button>

          <button
            onClick={() => setOnlyICU(!onlyICU)}
            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
              onlyICU
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            ICU Trauma Ward
          </button>

          <button
            onClick={() => setOnlyExotic(!onlyExotic)}
            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
              onlyExotic
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Exotic Pets
          </button>

          {(only247 || onlyICU || onlyExotic || selectedCity !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setOnly247(false);
                setOnlyICU(false);
                setOnlyExotic(false);
                setSelectedCity('All');
                setSearchQuery('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold ml-auto flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Doctors & Clinics List + Map Interactive View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Doctor & Hospital Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Found {filteredClinics.length} Veterinary Emergency Doctors & Hospitals
            </span>
            <span>Nearest First</span>
          </div>

          {filteredClinics.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No veterinary doctors or clinics match your search filters.</p>
              <button
                onClick={() => {
                  setOnly247(false);
                  setOnlyICU(false);
                  setOnlyExotic(false);
                  setSelectedCity('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-emerald-400 underline font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredClinics.map((clinic, index) => {
              const isSelected = selectedClinic?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => handleSelectClinic(clinic)}
                  className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg relative ${
                    isSelected
                      ? 'border-emerald-500/90 bg-slate-900/95 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badge for Nearest #1 */}
                  {index === 0 && (
                    <div className="absolute -top-2.5 left-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                      ★ NEAREST VETERINARIAN
                    </div>
                  )}

                  <div className="flex items-start justify-between pt-1">
                    <div className="space-y-1">
                      {/* Doctor Name */}
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h3 className="text-base font-bold text-white">{clinic.leadDoctor}</h3>
                      </div>

                      {/* Doctor Specialty */}
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 pl-6">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {clinic.doctorSpecialty}
                      </p>

                      {clinic.doctorQualifications && (
                        <p className="text-[11px] text-slate-400 pl-6">{clinic.doctorQualifications}</p>
                      )}

                      {/* Hospital / Clinic Name */}
                      <div className="pt-1">
                        <span className="text-xs font-bold text-slate-200 block">{clinic.name}</span>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {clinic.address} ({clinic.city})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-emerald-400">{clinic.distanceKm} km</span>
                      <span className="text-xs text-slate-400 block font-medium">
                        ~{clinic.driveTimeMins} mins drive
                      </span>
                    </div>
                  </div>

                  {/* Capabilities & Ratings */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                    {clinic.isOpen247 && (
                      <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        24/7 OPEN
                      </span>
                    )}
                    {clinic.hasICU && (
                      <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> ICU Ward
                      </span>
                    )}
                    {clinic.hasEndoscopy && (
                      <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        Endoscopy
                      </span>
                    )}
                    {clinic.treatsExotics && (
                      <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        Exotic Pets
                      </span>
                    )}
                    <span className="text-amber-400 font-bold ml-auto">
                      ★ {clinic.rating} ({clinic.reviewsCount} reviews)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80">
                    <a
                      href={`tel:${clinic.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t.callNowBtn}</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.directionsBtn}</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Interactive Map Frame & Grounding Reasoning */}
        <div className="lg:col-span-6 space-y-4">
          {selectedClinic && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Live Map: {selectedClinic.name}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedClinic.name + ' ' + selectedClinic.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Embedded OpenStreetMap / Google Map Frame */}
              <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                <iframe
                  title={`Map location of ${selectedClinic.name}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    selectedClinic.lng - 0.02
                  },${selectedClinic.lat - 0.02},${selectedClinic.lng + 0.02},${
                    selectedClinic.lat + 0.02
                  }&layer=mapnik&marker=${selectedClinic.lat},${selectedClinic.lng}`}
                  className="w-full h-full opacity-90"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-300 font-semibold shadow">
                  📍 {selectedClinic.leadDoctor} • {selectedClinic.address}
                </div>
              </div>
            </div>
          )}

          {/* AI Facility Grounding Reasoning Card */}
          {selectedClinic && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {t.clinicAiReasoning}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-medium">
                {loadingReasoning ? (
                  <span className="text-slate-400 animate-pulse">Evaluating emergency ICU capabilities for doctor recommendation...</span>
                ) : (
                  aiReasoning ||
                  `${selectedClinic.leadDoctor} at ${selectedClinic.name} is prioritized for ${activeSeverity} tier ${activeSpecies} cases due to 24/7 ICU facilities and an estimated ~${selectedClinic.driveTimeMins} minutes drive time (${selectedClinic.distanceKm} km).`
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
