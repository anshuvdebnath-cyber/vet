import React from 'react';
import { Shield, MapPin, QrCode, BookOpen, Cpu, PhoneCall, Globe, Dog } from 'lucide-react';
import { LanguageOption, PetProfile } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface NavbarProps {
  activeTab: 'triage' | 'map' | 'passport' | 'knowledge' | 'architecture';
  setActiveTab: (tab: 'triage' | 'map' | 'passport' | 'knowledge' | 'architecture') => void;
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  pets: PetProfile[];
  selectedPetId: string;
  setSelectedPetId: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  pets,
  selectedPetId,
  setSelectedPetId
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('triage')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/50">
              <Shield className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">{t.appTitle}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Gemma 4 Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Controls: Active Pet, Language Switcher, Emergency Hotline */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active Pet Selector */}
            {pets.length > 0 && (
              <div className="hidden md:flex items-center space-x-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1">
                <Dog className="w-4 h-4 text-emerald-400" />
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id} className="bg-slate-900 text-slate-200">
                      {pet.name} ({pet.species}, {pet.weightKg}kg)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="English" className="bg-slate-900 text-slate-200">English</option>
                <option value="Hinglish" className="bg-slate-900 text-slate-200">Hinglish</option>
                <option value="Hindi" className="bg-slate-900 text-slate-200">Hindi (हिंदी)</option>
              </select>
            </div>

            {/* Call Vet Button */}
            <a
              href="tel:+919810023456"
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-rose-900/30 animate-pulse"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.callEmergencyVet}</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 py-2 border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('triage')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'triage'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t.triageTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'map'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t.mapTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('passport')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'passport'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t.passportTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'knowledge'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.knowledgeBaseTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'architecture'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>{t.architectureTab}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
