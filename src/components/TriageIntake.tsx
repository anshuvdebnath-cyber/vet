import React, { useState, useRef } from 'react';
import { Camera, Mic, Send, Sparkles, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { LanguageOption, PetProfile, Species, TriageResult } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface TriageIntakeProps {
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  activePet?: PetProfile;
  onTriageComplete: (result: TriageResult) => void;
}

export const TriageIntake: React.FC<TriageIntakeProps> = ({
  language,
  setLanguage,
  activePet,
  onTriageComplete
}) => {
  const t = TRANSLATIONS[language];

  const [textInput, setTextInput] = useState('');
  const [species, setSpecies] = useState<Species>(activePet?.species || 'Dog');
  const [weightKg, setWeightKg] = useState<string>(activePet?.weightKg ? String(activePet.weightKg) : '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active pet if provided
  React.useEffect(() => {
    if (activePet) {
      setSpecies(activePet.species);
      if (activePet.weightKg) setWeightKg(String(activePet.weightKg));
    }
  }, [activePet]);

  // Client-side Canvas API Image Compressor (max 1024px, JPEG 0.7)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1024;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedDataUrl);
          setCompressedBase64(compressedDataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Dictation handler (uses browser SpeechRecognition if supported)
  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your input.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Sample Scenarios for quick 1-click testing
  const loadSampleScenario = (scenarioText: string, scenarioSpecies: Species, scenarioWeight: string) => {
    setTextInput(scenarioText);
    setSpecies(scenarioSpecies);
    setWeightKg(scenarioWeight);
    setErrorMessage(null);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !compressedBase64) {
      setErrorMessage('Please describe what happened or attach a photo.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Send to Gemma structuring pass
      const parseRes = await fetch('/api/triage/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textInput,
          species,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          language,
          imageBase64: compressedBase64
        })
      });

      const parseData = await parseRes.json();
      if (!parseData.success) {
        throw new Error(parseData.error || 'Failed to parse triage input.');
      }

      // 2. Send to Gemma explanation pass (with deterministic locked severity)
      const explainRes = await fetch('/api/triage/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: parseData.intake,
          severity: parseData.severity,
          knowledgeItem: parseData.knowledgeItem,
          isUnidentifiedRisk: parseData.isUnidentifiedRisk,
          targetLanguage: language
        })
      });

      const explainData = await explainRes.json();

      const fullResult: TriageResult = {
        intake: parseData.intake,
        severity: parseData.severity,
        knowledgeItem: parseData.knowledgeItem,
        isUnidentifiedRisk: parseData.isUnidentifiedRisk,
        ruleReasoning: parseData.ruleReasoning,
        explanation: explainData.explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onTriageComplete(fullResult);
    } catch (err: any) {
      console.error('Triage submission error:', err);
      setErrorMessage(err.message || 'Error executing triage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      {/* Header Banner */}
      <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t.intakeTitle}</h2>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safety Locked Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.intakeSubtitle}</p>
        </div>
      </div>

      {/* Sample Scenario Chips */}
      <div className="mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <span className="text-xs font-semibold text-slate-400 block mb-2">{t.sampleScenarios}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadSampleScenario(
              "mera dog (around 15kg, Labrador) ne chocolate cake khaya poora, abhi 20 min hua hoga, vomiting bhi kar raha hai",
              "Dog",
              "15"
            )}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-all text-left"
          >
            🍫 <span className="font-medium">Chocolate Cake</span> (Hinglish Dog)
          </button>

          <button
            type="button"
            onClick={() => loadSampleScenario(
              "cat (3kg) licked Dettol floor cleaner liquid off paws, mouth se foam aa raha hai 5 min pehle",
              "Cat",
              "3"
            )}
            className="text-xs bg-rose-950/50 hover:bg-rose-900/50 text-rose-200 px-2.5 py-1.5 rounded-lg border border-rose-800/50 transition-all text-left"
          >
            🧼 <span className="font-medium">Dettol Cleaner</span> (Corrosive Hazard)
          </button>

          <button
            type="button"
            onClick={() => loadSampleScenario(
              "puppy ne balcony me rakha plant khaya tha, weight unknown, muh se lar aa raha hai",
              "Dog",
              ""
            )}
            className="text-xs bg-amber-950/50 hover:bg-amber-900/50 text-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-800/50 transition-all text-left"
          >
            🌱 <span className="font-medium">Unknown Plant</span> (Unidentified Risk)
          </button>

          <button
            type="button"
            onClick={() => loadSampleScenario(
              "Cat ate 1 piece of Easter Lily flower, 10 mins ago, no symptoms yet",
              "Cat",
              "4"
            )}
            className="text-xs bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 px-2.5 py-1.5 rounded-lg border border-purple-800/50 transition-all text-left"
          >
            🌸 <span className="font-medium">Easter Lily</span> (Fatal Cat Risk)
          </button>

          <button
            type="button"
            onClick={() => loadSampleScenario(
              "dog (10kg) ne rat poison cake ka chota piece khaya, kis time khaya pata nahi",
              "Dog",
              "10"
            )}
            className="text-xs bg-red-950/50 hover:bg-red-900/50 text-red-200 px-2.5 py-1.5 rounded-lg border border-red-800/50 transition-all text-left"
          >
            ☠️ <span className="font-medium">Rat Poison</span> (Rodenticide)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Incident Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Incident Description
            </label>
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center space-x-1 transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? t.listening : t.voiceDictation}</span>
            </button>
          </div>
          <textarea
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t.describeIncidentPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl p-3.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none"
          />
        </div>

        {/* Species, Weight, Language selectors in grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Species */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.selectSpecies}</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as Species)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl p-2.5 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="Dog">Dog (कुत्ता)</option>
              <option value="Cat">Cat (बिल्ली)</option>
              <option value="Rabbit">Rabbit (खरगोश)</option>
              <option value="Bird">Bird (पक्षी)</option>
              <option value="Exotic">Exotic Pet</option>
              <option value="Unknown">Unknown Species</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.petWeight}</label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder={t.unknownWeight}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl p-2.5 focus:outline-none focus:border-emerald-500/60 placeholder-slate-500"
            />
          </div>

          {/* Output Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.languageSelect}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageOption)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl p-2.5 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="English">English</option>
              <option value="Hinglish">Hinglish (Hindi + English)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        {/* Photo Upload & Compression Banner */}
        <div className="bg-slate-950 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-3 cursor-pointer py-2 text-slate-400 hover:text-slate-200"
            >
              <Camera className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block">{t.uploadPhotoLabel}</span>
                <span className="text-[11px] text-slate-500">Auto-compressed client-side canvas API (1024px JPEG 0.7) for low 2G/3G data usage.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={imagePreview} alt="Incident Upload" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                <div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.photoUploaded}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Ready for Gemma vision analysis</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setCompressedBase64(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 bg-rose-950/40 rounded border border-rose-800/40"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
            isLoading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{t.analyzingBtn}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{t.analyzeEmergencyBtn}</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
