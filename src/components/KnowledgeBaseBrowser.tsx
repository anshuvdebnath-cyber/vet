import React, { useState } from 'react';
import { BookOpen, Search, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { KnowledgeBaseItem, LanguageOption } from '../types';
import { KNOWLEDGE_BASE } from '../data/knowledgeBase';
import { TRANSLATIONS } from '../data/translations';

interface KnowledgeBaseBrowserProps {
  language: LanguageOption;
}

export const KnowledgeBaseBrowser: React.FC<KnowledgeBaseBrowserProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const categories = ['All', 'Toxic Food', 'Plant', 'Chemical/Corrosive', 'Medication', 'Bite/Sting', 'Foreign Object'];

  const filteredItems = KNOWLEDGE_BASE.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.toxicPrinciple.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t.knowledgeBaseTab}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Curated veterinary toxicology & hazard database for instant offline lookup
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chocolate, dettol, lily..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto space-x-2 mt-4 pt-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          const isExpanded = expandedKey === item.key;
          const isCritical = item.defaultSeverity === 'Critical';

          return (
            <div
              key={item.key}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                isCritical ? 'border-rose-900/60' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">{item.name}</h3>
                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.toxicPrinciple}</p>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  item.defaultSeverity === 'Critical'
                    ? 'bg-rose-600 text-white'
                    : item.defaultSeverity === 'Vet Today'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {item.defaultSeverity}
                </span>
              </div>

              {/* Common Symptoms */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">Common Symptoms:</span>
                <div className="flex flex-wrap gap-1">
                  {item.commonSymptoms.map((sym, idx) => (
                    <span key={idx} className="bg-slate-950 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-800">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expand Toggle */}
              <button
                onClick={() => setExpandedKey(isExpanded ? null : item.key)}
                className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>{isExpanded ? 'Hide Protocols' : 'View First-Aid Protocol & Warnings'}</span>
              </button>

              {/* Expanded Protocols */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40">
                    <span className="font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Immediate First Aid (DOs):
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {item.immediateFirstAid.map((doStep, i) => (
                        <li key={i}>{doStep}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-900/40">
                    <span className="font-bold text-rose-400 block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Critical Warnings (DON'Ts):
                    </span>
                    <ul className="list-disc list-inside text-rose-200 space-y-1">
                      {item.criticalWarnings.map((dontStep, i) => (
                        <li key={i}>{dontStep}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
