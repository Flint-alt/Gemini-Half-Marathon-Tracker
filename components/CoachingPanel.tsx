import React from 'react';
import { CoachingInsight } from '../types';
import { BrainCircuit, Activity, Zap } from 'lucide-react';

interface CoachingPanelProps {
  insight: CoachingInsight | null;
  loading: boolean;
}

export const CoachingPanel: React.FC<CoachingPanelProps> = ({ insight, loading }) => {
  if (loading) {
    return (
      <div className="premium-glass rounded-[40px] p-12 shadow-xl animate-pulse min-h-[500px] flex flex-col justify-center items-center border border-white/5">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
          <BrainCircuit className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">Processing Biometrics</h2>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="premium-glass rounded-[40px] p-12 shadow-xl flex flex-col items-center justify-center text-center min-h-[500px] border border-white/5">
        <div className="w-20 h-20 bg-slate-800/80 rounded-[28px] flex items-center justify-center mb-10 border border-white/5">
          <Zap className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-xl font-black mb-4 tracking-tight uppercase text-white">Neural Core Idle</h2>
        <p className="text-slate-500 text-[10px] leading-relaxed max-w-[200px] font-black uppercase tracking-[0.2em]">
          Ready for session sync.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-glass rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col gap-10 border border-white/5 min-h-[600px]">
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
        <BrainCircuit className="w-64 h-64 scale-150 rotate-12 text-white" />
      </div>

      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/20">
             <BrainCircuit className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Neural Advice</h2>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Strategy</h2>
          </div>
        </div>
        <div className="bg-white/5 px-5 py-2 rounded-full border border-white/10">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-200">
            {insight.focusArea}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <span className="absolute -left-4 -top-8 text-8xl font-serif text-white/5">“</span>
        <p className="text-2xl font-extrabold leading-[1.3] text-white tracking-tight">
          {insight.summary}
        </p>
      </div>

      <div className="relative z-10 bg-white/5 rounded-[32px] p-8 border-l-4 border-indigo-500 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
            Biomechanics
          </h4>
        </div>
        <p className="text-lg font-bold text-slate-200 leading-relaxed tracking-tight">
          {insight.toneCheck}
        </p>
      </div>

      <div className="relative z-10 mt-auto bg-emerald-500/10 rounded-[32px] p-8 border-l-4 border-emerald-500/50">
        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3">
          Prescription
        </h4>
        <p className="text-xl font-black text-emerald-100 tracking-tight leading-snug">
          {insight.recommendation}
        </p>
      </div>
    </div>
  );
};