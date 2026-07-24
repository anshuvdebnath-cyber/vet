import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, Clock, AlertTriangle, Copy, Check, QrCode, MapPin, RefreshCw, ShieldAlert, Sparkles, PhoneCall, Navigation, Compass, Stethoscope, ExternalLink } from 'lucide-react';
import { LanguageOption, SeverityTier, TriageResult, EmergencyClinic } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { EMERGENCY_CLINICS } from '../data/clinicsData';

// Haversine distance formula
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

interface TriageResultViewProps {
  result: TriageResult;
  language: LanguageOption;
  onReset: () => void;
  onJumpToMap: () => void;
  onJumpToQr: () => void;
}

export const TriageResultView: React.FC<TriageResultViewProps> = ({
  result,
  language,
  onReset,
  onJumpToMap,
  onJumpToQr
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  // Auto GPS & Nearest Clinic state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [nearestClinic, setNearestClinic] = useState<{ clinic: EmergencyClinic; distanceKm: number; driveTimeMins: number } | null>(null);

  const { intake, severity, knowledgeItem, isUnidentifiedRisk, ruleReasoning, explanation, timestamp } = result;

  // Immediately detect GPS location after triage completes
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      // Fallback to default first clinic
      setNearestClinic({
        clinic: EMERGENCY_CLINICS[0],
        distanceKm: EMERGENCY_CLINICS[0].distanceKm,
        driveTimeMins: EMERGENCY_CLINICS[0].driveTimeMins
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserCoords({ lat: uLat, lng: uLng });

        // Calculate distance to all clinics and find nearest
        let closest: EmergencyClinic = EMERGENCY_CLINICS[0];
        let minDist = Infinity;

        EMERGENCY_CLINICS.forEach((c) => {
          const dist = calculateHaversineKm(uLat, uLng, c.lat, c.lng);
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        });

        const estDriveTime = Math.max(3, Math.round((minDist / 35) * 60)); // ~35 km/h avg speed

        setNearestClinic({
          clinic: closest,
          distanceKm: minDist,
          driveTimeMins: estDriveTime
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed or permission denied:', err);
        setIsLocating(false);
        // Default fallback to first clinic
        setNearestClinic({
          clinic: EMERGENCY_CLINICS[0],
          distanceKm: EMERGENCY_CLINICS[0].distanceKm,
          driveTimeMins: EMERGENCY_CLINICS[0].driveTimeMins
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Severity styling helper
  const getSeverityBadge = (tier: SeverityTier) => {
    switch (tier) {
      case 'Critical':
        return {
          bg: 'bg-rose-950/80 border-rose-600/80 text-rose-100',
          badgeBg: 'bg-rose-600 text-white',
          icon: <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />,
          title: t.severityCritical
        };
      case 'Vet Today':
        return {
          bg: 'bg-amber-950/80 border-amber-600/80 text-amber-100',
          badgeBg: 'bg-amber-600 text-white',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          title: t.severityVetToday
        };
      case 'Monitor':
        return {
          bg: 'bg-yellow-950/80 border-yellow-600/80 text-yellow-100',
          badgeBg: 'bg-yellow-600 text-slate-950 font-bold',
          icon: <Clock className="w-6 h-6 text-yellow-400" />,
          title: t.severityMonitor
        };
      case 'Safe':
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-600/80 text-emerald-100',
          badgeBg: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          title: t.severitySafe
        };
    }
  };

  const severityStyle = getSeverityBadge(severity);

  const copyTranscript = () => {
    navigator.clipboard.writeText(explanation.whatToTellVet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Locked Severity Tier */}
      <div className={`p-6 rounded-2xl border ${severityStyle.bg} shadow-2xl relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              {severityStyle.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${severityStyle.badgeBg}`}>
                  {severity} TIER
                </span>
                <span className="text-xs text-slate-400">Assessed at {timestamp}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                {severityStyle.title}
              </h1>
            </div>
          </div>

          <a
            href="tel:+919810023456"
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency Vet Hotline</span>
          </a>
        </div>

        {/* UNIDENTIFIED RISK FALLBACK BANNER */}
        {isUnidentifiedRisk && (
          <div className="mt-4 bg-rose-950/90 border border-rose-500/80 p-3.5 rounded-xl flex items-start space-x-3 text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-rose-300 block">{t.unidentifiedRiskBadge}</span>
              <span>
                Substance or hazard could not be verified in the local toxicology database.
                Per VetLens Edge safety protocols, unverified hazards default to High Alert (Critical) to prevent fatal delayed toxicity.
              </span>
            </div>
          </div>
        )}

        {/* Reassuring Calm Explanation Header */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 text-sm sm:text-base text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-4 rounded-xl">
          "{explanation.reassuringSummary}"
        </div>
      </div>

      {/* NEAREST EMERGENCY PET CLINIC CARD (AUTO GPS DETECTED) */}
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-emerald-400 animate-bounce" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase">
              Nearest Emergency Pet Clinic & ER Doctor
            </h3>
          </div>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            {isLocating ? 'Detecting Live GPS...' : userCoords ? 'GPS Live Location Active' : 'Default ER Hospital'}
          </span>
        </div>

        {nearestClinic && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded border border-rose-500/40">
                  24/7 OPEN ER
                </span>
                <span className="text-xs text-slate-400 font-semibold">{nearestClinic.clinic.city}</span>
              </div>

              <h4 className="text-lg font-extrabold text-white">{nearestClinic.clinic.name}</h4>

              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                <Stethoscope className="w-4 h-4 shrink-0 text-emerald-400" />
                <span><strong>{nearestClinic.clinic.leadDoctor}</strong> — {nearestClinic.clinic.doctorSpecialty}</span>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {nearestClinic.clinic.address}
              </p>

              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                {nearestClinic.clinic.hasICU && (
                  <span className="bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
                    ICU Intensive Care
                  </span>
                )}
                {nearestClinic.clinic.treatsExotics && (
                  <span className="bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
                    Exotics Accepted
                  </span>
                )}
                <span className="bg-slate-950 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-800 font-bold">
                  ★ {nearestClinic.clinic.rating} ({nearestClinic.clinic.reviewsCount}+ reviews)
                </span>
              </div>
            </div>

            {/* Distance & Actions Column */}
            <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">
                  {nearestClinic.distanceKm} km
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  ~{nearestClinic.driveTimeMins} mins estimated drive
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href={`tel:${nearestClinic.clinic.phone}`}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {nearestClinic.clinic.phone}</span>
                </a>

                <button
                  onClick={onJumpToMap}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View Map & All Clinics</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestClinic.clinic.lat},${nearestClinic.clinic.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-[11px] flex items-center justify-center space-x-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span>Get Google Maps Directions</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Rule Engine Reasoning Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4" />
          {t.whySeverityLocked}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
          {ruleReasoning}
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          {explanation.whyThisSeverity}
        </p>
      </div>

      {/* Structured Intake Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Structured Triage Profile</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Species</span>
            <span className="font-semibold text-slate-200">{intake.species}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Weight</span>
            <span className="font-semibold text-slate-200">{intake.weight_kg ? `${intake.weight_kg} kg` : 'Unknown'}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Suspected Hazard</span>
            <span className="font-semibold text-emerald-400">{knowledgeItem?.name || intake.suspected_substance_or_hazard}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Elapsed Time</span>
            <span className="font-semibold text-slate-200">{intake.elapsed_time_minutes ? `${intake.elapsed_time_minutes} mins ago` : 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* First Aid Steps (DOs) & Critical Warnings (DON'Ts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DOs */}
        <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {t.firstAidHeader}
          </h3>
          <ul className="space-y-2.5">
            {explanation.firstAidSteps?.map((step, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-slate-200 flex items-start space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DON'Ts */}
        <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {t.warningsHeader}
          </h3>
          <ul className="space-y-2.5">
            {explanation.warningsAndDonts?.map((warning, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-rose-200 flex items-start space-x-2 bg-rose-950/40 p-3 rounded-xl border border-rose-900/40">
                <span className="bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
                  STOP
                </span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clinical Transcript for Vet Receptionist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.vetSummaryHeader}</h3>
          <button
            onClick={copyTranscript}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-medium flex items-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.summaryCopied : t.copySummaryBtn}</span>
          </button>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
          {explanation.whatToTellVet}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onJumpToMap}
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all"
        >
          <MapPin className="w-4 h-4" />
          <span>{t.findNearbyVetsBtn}</span>
        </button>

        <button
          onClick={onJumpToQr}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 border border-slate-700 transition-all"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>{t.generateQrBtn}</span>
        </button>

        <button
          onClick={onReset}
          className="py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-slate-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Scan</span>
        </button>
      </div>
    </div>
  );
};
