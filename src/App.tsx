import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { TriageIntake } from './components/TriageIntake';
import { TriageResultView } from './components/TriageResultView';
import { MapModule } from './components/MapModule';
import { PassportModule } from './components/PassportModule';
import { KnowledgeBaseBrowser } from './components/KnowledgeBaseBrowser';
import { ArchitectureModal } from './components/ArchitectureModal';
import { PetProfile, TriageResult, LanguageOption, MedicalRecord } from './types';

// Default initial pet profile
const DEFAULT_PETS: PetProfile[] = [
  {
    id: 'pet-1',
    name: 'Bruno',
    species: 'Dog',
    breed: 'Labrador Retriever',
    ageYears: 3,
    weightKg: 15,
    allergies: ['Dust Mites'],
    chronicConditions: ['None'],
    vaccinations: [
      { name: 'Rabies 3-Year', date: '2026-01-10' },
      { name: 'DHPP Combo', date: '2026-01-10' }
    ],
    medicalHistory: [],
    emergencyContact: '+91 98100 23456'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'triage' | 'map' | 'passport' | 'knowledge' | 'architecture'>('triage');
  const [language, setLanguage] = useState<LanguageOption>('Hinglish');
  const [pets, setPets] = useState<PetProfile[]>(() => {
    const saved = localStorage.getItem('vetlens_pets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_PETS; }
    }
    return DEFAULT_PETS;
  });
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || 'pet-1');
  const [activeTriage, setActiveTriage] = useState<TriageResult | null>(null);

  // Save pets to localStorage
  useEffect(() => {
    localStorage.setItem('vetlens_pets', JSON.stringify(pets));
  }, [pets]);

  const activePet = pets.find(p => p.id === selectedPetId) || pets[0];

  const handleSavePet = (pet: PetProfile) => {
    setPets(prev => {
      const exists = prev.some(p => p.id === pet.id);
      if (exists) {
        return prev.map(p => p.id === pet.id ? pet : p);
      }
      return [...prev, pet];
    });
  };

  const handleTriageComplete = (result: TriageResult) => {
    setActiveTriage(result);

    const hazardName = result.knowledgeItem?.name || result.intake.suspected_substance_or_hazard || 'Hazard Ingestion';
    const diagnosisTitle = `${hazardName} (${result.severity})`;
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const todayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: MedicalRecord = {
      id: `med-${Date.now()}`,
      date: `${todayDate}, ${todayTime}`,
      diagnosis: diagnosisTitle,
      hazardOrSubstance: hazardName,
      severity: result.severity,
      symptoms: result.intake.symptoms || [],
      reassuringSummary: result.explanation?.reassuringSummary,
      ruleReasoning: result.ruleReasoning
    };

    setPets(prevPets => {
      const targetId = selectedPetId || prevPets[0]?.id;
      if (!targetId) return prevPets;
      return prevPets.map(p => {
        if (p.id === targetId) {
          const pastHistory = p.medicalHistory || [];
          return {
            ...p,
            medicalHistory: [newRecord, ...pastHistory]
          };
        }
        return p;
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        pets={pets}
        selectedPetId={selectedPetId}
        setSelectedPetId={setSelectedPetId}
      />

      {/* Emergency Hotline Alert Strip */}
      <EmergencyBanner language={language} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'triage' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!activeTriage ? (
              <TriageIntake
                language={language}
                setLanguage={setLanguage}
                activePet={activePet}
                onTriageComplete={handleTriageComplete}
              />
            ) : (
              <TriageResultView
                result={activeTriage}
                language={language}
                onReset={() => setActiveTriage(null)}
                onJumpToMap={() => setActiveTab('map')}
                onJumpToQr={() => setActiveTab('passport')}
              />
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <MapModule
            language={language}
            activeSeverity={activeTriage?.severity || 'Critical'}
            activeHazard={activeTriage?.knowledgeItem?.name || activeTriage?.intake.suspected_substance_or_hazard || 'Emergency Case'}
            activeSpecies={activeTriage?.intake.species || activePet?.species || 'Dog'}
          />
        )}

        {activeTab === 'passport' && (
          <PassportModule
            language={language}
            pets={pets}
            selectedPetId={selectedPetId}
            setSelectedPetId={setSelectedPetId}
            onSavePet={handleSavePet}
            activeTriage={activeTriage}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseBrowser language={language} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureModal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-400 mb-1">
            VetLens Edge • Grounded AI Veterinary Decision Support
          </p>
          <p className="text-[11px] text-slate-600">
            Safety Disclaimer: VetLens Edge is a grounded decision support tool designed for rapid first-aid guidance. In life-threatening veterinary emergencies, always contact or transport your pet to an accredited 24/7 veterinary clinic immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}
