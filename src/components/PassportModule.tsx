import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Dog,
  Plus,
  Save,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Trash2,
  Clock,
  Stethoscope,
  Activity,
  Sparkles
} from 'lucide-react';
import { PetProfile, TriageResult, LanguageOption, Species, MedicalRecord, SeverityTier } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface PassportModuleProps {
  language: LanguageOption;
  pets: PetProfile[];
  selectedPetId: string;
  setSelectedPetId: (id: string) => void;
  onSavePet: (pet: PetProfile) => void;
  activeTriage: TriageResult | null;
}

export const PassportModule: React.FC<PassportModuleProps> = ({
  language,
  pets,
  selectedPetId,
  setSelectedPetId,
  onSavePet,
  activeTriage
}) => {
  const t = TRANSLATIONS[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  // Sync form state when selected pet changes
  const [isEditingPet, setIsEditingPet] = useState(false);
  const [name, setName] = useState(selectedPet?.name || 'Bruno');
  const [species, setSpecies] = useState<Species>(selectedPet?.species || 'Dog');
  const [breed, setBreed] = useState(selectedPet?.breed || 'Labrador Retriever');
  const [ageYears, setAgeYears] = useState(selectedPet?.ageYears ? String(selectedPet.ageYears) : '3');
  const [weightKg, setWeightKg] = useState(selectedPet?.weightKg ? String(selectedPet.weightKg) : '15');
  const [allergies, setAllergies] = useState(selectedPet?.allergies?.join(', ') || 'None');
  const [chronicConditions, setChronicConditions] = useState(selectedPet?.chronicConditions?.join(', ') || 'None');
  const [emergencyContact, setEmergencyContact] = useState(selectedPet?.emergencyContact || '+91 98100 23456');

  // Manual Diagnosis Form State
  const [showAddManualRecord, setShowAddManualRecord] = useState(false);
  const [manualDiagnosis, setManualDiagnosis] = useState('');
  const [manualSeverity, setManualSeverity] = useState<SeverityTier>('Monitor');
  const [manualSymptoms, setManualSymptoms] = useState('');

  useEffect(() => {
    if (selectedPet) {
      setName(selectedPet.name);
      setSpecies(selectedPet.species);
      setBreed(selectedPet.breed);
      setAgeYears(String(selectedPet.ageYears));
      setWeightKg(String(selectedPet.weightKg));
      setAllergies(selectedPet.allergies?.join(', ') || '');
      setChronicConditions(selectedPet.chronicConditions?.join(', ') || '');
      setEmergencyContact(selectedPet.emergencyContact || '');
    }
  }, [selectedPet?.id]);

  // Derive most recent medical record & diagnosis
  const medicalHistory = selectedPet?.medicalHistory || [];
  const latestRecord = medicalHistory[0] || null;

  const latestDiagnosis = activeTriage
    ? `${activeTriage.knowledgeItem?.name || activeTriage.intake.suspected_substance_or_hazard || 'Hazard Ingestion'} (${activeTriage.severity})`
    : latestRecord
    ? latestRecord.diagnosis
    : 'No diagnosis recorded';

  const latestDiagnosisDate = activeTriage
    ? activeTriage.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : latestRecord
    ? latestRecord.date
    : 'N/A';

  // Generate QR Payload String in clean, human-readable plain text (reception intake format)
  const generateQrString = () => {
    const petNameVal = selectedPet?.name || name;
    const speciesVal = selectedPet?.species || species;
    const breedVal = selectedPet?.breed || breed;
    const weightVal = selectedPet?.weightKg ? `${selectedPet.weightKg} kg` : `${weightKg} kg`;
    const allergiesVal = (selectedPet?.allergies && selectedPet.allergies.length > 0) ? selectedPet.allergies.join(', ') : 'None';
    const contactVal = selectedPet?.emergencyContact || emergencyContact || 'N/A';

    let severityVal = 'N/A';
    let symptomsVal = 'None reported';
    let reasoningVal = '';

    if (activeTriage) {
      severityVal = activeTriage.severity;
      if (activeTriage.intake.symptoms?.length) symptomsVal = activeTriage.intake.symptoms.join(', ');
      if (activeTriage.ruleReasoning) reasoningVal = activeTriage.ruleReasoning;
    } else if (latestRecord) {
      severityVal = latestRecord.severity || 'N/A';
      if (latestRecord.symptoms?.length) symptomsVal = latestRecord.symptoms.join(', ');
      if (latestRecord.ruleReasoning) reasoningVal = latestRecord.ruleReasoning;
    }

    const lines = [
      `=== VET LENS EMERGENCY CLINICAL HANDOFF ===`,
      `Pet Name: ${petNameVal}`,
      `Species & Breed: ${speciesVal} (${breedVal})`,
      `Weight: ${weightVal}`,
      `Allergies: ${allergiesVal}`,
      `Emergency Contact: ${contactVal}`,
      `------------------------------------------`,
      `Diagnosis / Hazard: ${latestDiagnosis}`,
      `Triage Severity: ${severityVal}`,
      `Assessment Date: ${latestDiagnosisDate}`,
      `Observed Symptoms: ${symptomsVal}`,
      ...(reasoningVal ? [`Clinical Rule Note: ${reasoningVal}`] : []),
      `==========================================`,
      `Scanned via Vet Lens 24/7 ER Triage System`
    ];

    return lines.join('\n');
  };

  // Render QR Code onto Canvas
  useEffect(() => {
    if (canvasRef.current) {
      const qrText = generateQrString();
      QRCode.toCanvas(
        canvasRef.current,
        qrText,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('QR rendering error:', error);
        }
      );
    }
  }, [selectedPet, selectedPet?.medicalHistory, activeTriage, latestDiagnosis, latestDiagnosisDate, name, species, breed, weightKg, allergies, chronicConditions, emergencyContact]);

  // Handle Save Pet Profile
  const handleSavePetForm = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PetProfile = {
      id: selectedPet?.id || `pet-${Date.now()}`,
      name,
      species,
      breed,
      ageYears: parseFloat(ageYears) || 1,
      weightKg: parseFloat(weightKg) || 1,
      allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
      chronicConditions: chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
      vaccinations: selectedPet?.vaccinations || [
        { name: 'Rabies 3-Year', date: '2026-01-10' },
        { name: 'DHPP Combo', date: '2026-01-10' }
      ],
      medicalHistory: selectedPet?.medicalHistory || [],
      emergencyContact
    };
    onSavePet(updated);
    setSelectedPetId(updated.id);
    setIsEditingPet(false);
  };

  // Handle Add Manual Medical Record (Appends to medicalHistory)
  const handleAddManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDiagnosis.trim()) return;

    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const todayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: MedicalRecord = {
      id: `med-${Date.now()}`,
      date: `${todayDate}, ${todayTime}`,
      diagnosis: `${manualDiagnosis.trim()} (${manualSeverity})`,
      hazardOrSubstance: manualDiagnosis.trim(),
      severity: manualSeverity,
      symptoms: manualSymptoms ? manualSymptoms.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    const updated: PetProfile = {
      ...selectedPet,
      medicalHistory: [newRecord, ...(selectedPet.medicalHistory || [])]
    };

    onSavePet(updated);
    setManualDiagnosis('');
    setManualSymptoms('');
    setShowAddManualRecord(false);
  };

  // Handle Delete Record
  const handleDeleteRecord = (recordId: string) => {
    const updatedHistory = (selectedPet.medicalHistory || []).filter(r => r.id !== recordId);
    onSavePet({
      ...selectedPet,
      medicalHistory: updatedHistory
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadgeClass = (sev?: SeverityTier) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'Vet Today':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Monitor':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Safe':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <QrCode className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t.qrTitle}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.qrSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingPet(!isEditingPet)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{isEditingPet ? 'View Passport' : t.addPetProfile}</span>
            </button>
          </div>
        </div>

        {/* Pet Switcher Bar */}
        {pets.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Selected Pet Passport:</span>
            {pets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPetId(p.id);
                  setIsEditingPet(false);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                  p.id === selectedPet?.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75">({p.species})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Handoff QR Code Display */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
          <div className="mb-3">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 inline-flex">
              <ShieldCheck className="w-4 h-4" />
              CLINICAL HANDOFF QR CODE
            </span>
          </div>

          <p className="text-xs text-slate-400 max-w-xs mb-4">
            Encodes pet name, latest diagnosis, date & clinical details for instant vet ER desk scanning.
          </p>

          {/* QR Canvas Frame */}
          <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-emerald-500/50 mb-4 inline-block">
            <canvas ref={canvasRef} />
          </div>

          {/* Encoded Data Display Card */}
          <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2 mb-4">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Pet Name:</span>
              <span className="font-bold text-white">{selectedPet?.name || name}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Latest Diagnosis:</span>
              <span className={`font-bold ${latestDiagnosis === 'No diagnosis recorded' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {latestDiagnosis}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Diagnosis Date:</span>
              <span className="font-semibold text-slate-300">{latestDiagnosisDate}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Species & Weight:</span>
              <span className="font-bold text-slate-200">
                {selectedPet?.species || species} ({selectedPet?.weightKg || weightKg} kg)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Emergency Contact:</span>
              <span className="font-semibold text-slate-300">{selectedPet?.emergencyContact || emergencyContact}</span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{t.printHandoffBtn}</span>
          </button>
        </div>

        {/* Right Column: Pet Profile Manager & Medical History Timeline */}
        <div className="lg:col-span-7 space-y-5">
          {isEditingPet ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Dog className="w-5 h-5 text-emerald-400" />
                {t.addPetProfile}
              </h3>

              <form onSubmit={handleSavePetForm} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.petName}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.species}</label>
                    <select
                      value={species}
                      onChange={(e) => setSpecies(e.target.value as Species)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Rabbit">Rabbit</option>
                      <option value="Bird">Bird</option>
                      <option value="Exotic">Exotic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.breed}</label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.weight}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.allergies}</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">{t.chronicConditions}</label>
                    <input
                      type="text"
                      value={chronicConditions}
                      onChange={(e) => setChronicConditions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.savePetBtn}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              {/* Pet Info Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <Dog className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPet?.name}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedPet?.breed} • {selectedPet?.species} ({selectedPet?.ageYears} yrs)
                    </p>
                  </div>
                </div>

                <span className="text-xs bg-slate-950 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 font-semibold">
                  {selectedPet?.weightKg} kg
                </span>
              </div>

              {/* Medical History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Medical History & Vet Lens Diagnoses
                  </h4>

                  <button
                    onClick={() => setShowAddManualRecord(!showAddManualRecord)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddManualRecord ? 'Cancel' : 'Add Diagnosis Record'}</span>
                  </button>
                </div>

                {/* Manual Record Form Drawer */}
                {showAddManualRecord && (
                  <form onSubmit={handleAddManualRecord} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                    <h5 className="font-bold text-slate-200">Record New Diagnosis or Vet Visit</h5>
                    <div>
                      <label className="block text-slate-400 mb-1">Diagnosis / Condition Name *</label>
                      <input
                        type="text"
                        required
                        value={manualDiagnosis}
                        onChange={(e) => setManualDiagnosis(e.target.value)}
                        placeholder="e.g. Parvovirus Vaccination / Chocolate Ingestion"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Severity Tier</label>
                        <select
                          value={manualSeverity}
                          onChange={(e) => setManualSeverity(e.target.value as SeverityTier)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Safe">Safe / Routine</option>
                          <option value="Monitor">Monitor</option>
                          <option value="Vet Today">Vet Today</option>
                          <option value="Critical">Critical Emergency</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Observed Symptoms (comma separated)</label>
                        <input
                          type="text"
                          value={manualSymptoms}
                          onChange={(e) => setManualSymptoms(e.target.value)}
                          placeholder="e.g. Vomiting, Lethargy"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-all shadow"
                    >
                      Save & Append to Passport History
                    </button>
                  </form>
                )}

                {/* Medical History Timeline List */}
                {medicalHistory.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">No diagnosis recorded yet.</p>
                    <p className="text-[11px] text-slate-500">
                      When you perform a Vet Lens triage assessment, the diagnosis will automatically append here and update your QR code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {medicalHistory.map((rec, index) => (
                      <div
                        key={rec.id}
                        className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5 relative group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {index === 0 && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                LATEST
                              </span>
                            )}
                            <h5 className="font-bold text-white text-xs sm:text-sm">{rec.diagnosis}</h5>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadgeClass(rec.severity)}`}>
                              {rec.severity || 'Diagnosis'}
                            </span>
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              title="Delete record"
                              className="text-slate-600 hover:text-rose-400 text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center text-[11px] text-slate-400 space-x-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> {rec.date}
                          </span>
                          {rec.symptoms && rec.symptoms.length > 0 && (
                            <span className="text-slate-400">
                              Symptoms: {rec.symptoms.join(', ')}
                            </span>
                          )}
                        </div>

                        {rec.reassuringSummary && (
                          <p className="text-[11px] text-slate-300 italic border-l-2 border-emerald-500/60 pl-2 mt-1">
                            "{rec.reassuringSummary}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergies & Chronic Conditions */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Known Allergies:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedPet?.allergies?.length ? selectedPet.allergies.join(', ') : 'None'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Chronic Conditions:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedPet?.chronicConditions?.length ? selectedPet.chronicConditions.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {/* Vaccinations */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="font-bold text-slate-300 block mb-2">Vaccination Log:</span>
                <div className="space-y-1.5">
                  {selectedPet?.vaccinations?.map((vac, i) => (
                    <div key={i} className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {vac.name}
                      </span>
                      <span>{vac.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
