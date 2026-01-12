import React from 'react';
import { CoachingInsight } from '../types';
import { BrainCircuit, Activity, Zap, Sparkles } from 'lucide-react';

interface CoachingPanelProps {
  insight: CoachingInsight | null;
  loading: boolean;
  theme?: 'dark' | 'light';
}

export const CoachingPanel: React.FC<CoachingPanelProps> = ({ insight, loading, theme = 'dark' }) => {
  const panelClass = `premium-glass rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col gap-10 border min-h-[600px] transition-all duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-transparent'}`;

  if (loading) {
    return (
      <div className={`${panelClass} animate-pulse justify-center items-center`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-blue-50'}`}>
          <BrainCircuit className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`} />
        </div>
        <h2 className={`text-[10px] font-black tracking-[0.4em] uppercase ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`}>Processing Biometrics</h2>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className={`${panelClass} items-center justify-center text-center`}>
        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-10 border ${theme === 'dark' ? 'bg-slate-800/80 border-white/5' : 'bg-white border-slate-100 shadow-md'}`}>
          <Zap className={`w-10 h-10 ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-500'}`} />
        </div>
        <h2 className={`text-xl font-black mb-4 tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>Neural Core Idle</h2>
        <p className="text-slate-500 text-[10px] leading-relaxed max-w-[200px] font-black uppercase tracking-[0.2em]">
          Ready for session sync.
        </p>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
        <BrainCircuit className={`w-64 h-64 scale-150 rotate-12 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
      </div>

      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/20' : 'bg-blue-50 border-blue-100'}`}>
            {theme === 'dark' ? (
               <BrainCircuit className="w-6 h-6 text-indigo-300" />
            ) : (
               <Sparkles className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`}>Neural Advice</h2>
            <h2 className={`text-3xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>Strategy</h2>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-full border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-indigo-200' : 'bg-white border-blue-100 text-blue-600 shadow-sm'}`}>
          <span className="text-[9px] font-black uppercase tracking-[0.25em]">
            {insight.focusArea}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <span className={`absolute -left-4 -top-8 text-8xl font-serif ${theme === 'dark' ? 'text-white/5' : 'text-slate-200/50'}`}>“</span>
        <p className={`text-2xl font-extrabold leading-[1.3] tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          {insight.summary}
        </p>
      </div>

      <div className={`relative z-10 rounded-[32px] p-8 border-l-4 shadow-xl ${theme === 'dark' ? 'bg-white/5 border-indigo-500' : 'bg-white border-l-blue-500 border-t border-r border-b border-slate-100 shadow-lg shadow-blue-500/5'}`}>
        <div className="flex items-center gap-3 mb-5">
          <Activity className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-500'}`} />
          <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-indigo-400' : 'text-blue-600'}`}>
            Biomechanics
          </h4>
        </div>
        <p className={`text-lg font-bold leading-relaxed tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
          {insight.toneCheck}
        </p>
      </div>

      <div className={`relative z-10 mt-auto rounded-[32px] p-8 border-l-4 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white border-l-emerald-500 border-t border-r border-b border-slate-100 shadow-md'}`}>
        <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
          Prescription
        </h4>
        <p className={`text-xl font-black tracking-tight leading-snug ${theme === 'dark' ? 'text-emerald-100' : 'text-emerald-900'}`}>
          {insight.recommendation}
        </p>
      </div>
    </div>
  );
};