import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';
import { LanguageOption } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface EmergencyBannerProps {
  language: LanguageOption;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white border-b border-rose-700/60 py-2.5 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-medium">
        <div className="flex items-center space-x-2 text-rose-100">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>{t.emergencyAlertBanner}</span>
        </div>
        <a
          href="tel:+919810023456"
          className="inline-flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1 rounded-full text-xs shadow transition-all shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>+91 98100 23456 (24/7 ER)</span>
        </a>
      </div>
    </div>
  );
};
