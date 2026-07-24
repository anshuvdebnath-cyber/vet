import React from 'react';
import { Cpu, ShieldCheck, Database, Layers, CheckCircle2, AlertTriangle, ArrowRight, Lock, Image, Globe } from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Safety Architecture: Gemma 4 Explains, Local Code Decides
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Why an unconstrained LLM should NEVER sit upstream of a safety-critical medical decision
            </p>
          </div>
        </div>
      </div>

      {/* Core Architectural Diagram Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          The Two-Pass Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">1. NLU Structuring Pass</span>
              <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                Gemma 4 API
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Parses messy Hinglish text or photo into a strict JSON schema (species, weight, substance key, elapsed time, symptoms).
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-amber-300 font-mono border border-slate-800">
              Missing fields default to <span className="text-rose-400 font-bold">null</span>, never guessed.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/50 space-y-2 ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300">2. Deterministic Rule Engine</span>
              <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> CODE DECIDES
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium">
              Calculates severity by evaluating <code className="text-emerald-400 font-mono">knowledge_base.json</code>. The ONLY component authorized to assign severity tiers.
            </p>
            <div className="bg-rose-950/60 p-2 rounded text-[11px] text-rose-200 font-mono border border-rose-800">
              No match = Automatic High Alert Fallback (Critical)
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">3. Multilingual Explanation Pass</span>
              <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                Gemma 4 API
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Invoked ONLY after severity is locked to phrase first-aid steps calmly in English, Hindi, or Hinglish.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 font-mono border border-slate-800">
              Never modifies the locked verdict.
            </div>
          </div>
        </div>
      </div>

      {/* Safety Tradeoffs & Engineering Honesty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Unrecognized Hazard Protocol */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h4 className="font-bold text-rose-400 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Unrecognized Hazard Protocol
          </h4>
          <p className="text-slate-300 leading-relaxed">
            In emergency triage, a false negative ("it's fine" for something lethal) is catastrophic.
            When an entity key cannot be verified against the local toxicology database, the system executes an immediate High Alert (Critical) override with an explicit <code className="text-rose-300 bg-rose-950 px-1 py-0.5 rounded">UNIDENTIFIED-RISK</code> banner.
          </p>
        </div>

        {/* Client-Side Canvas Compression */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
            <Image className="w-4 h-4 text-emerald-400" />
            Canvas API Data Compression
          </h4>
          <p className="text-slate-300 leading-relaxed">
            In Tier-2/3 Indian cities on patchy 2G/3G mobile data, large camera photos fail mid-emergency.
            Client-side Canvas API resizes photos to max 1024px JPEG 0.7 prior to transmission, reducing payload size by ~85% for instant submission.
          </p>
        </div>
      </div>
    </div>
  );
};
