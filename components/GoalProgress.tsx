import React from 'react';
import { UserProfile } from '../types';
import { Flag, Trophy } from 'lucide-react';

interface GoalProgressProps {
  goals: UserProfile['goals'];
  theme?: 'dark' | 'light';
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ goals, theme = 'dark' }) => {
  const calculateDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className={`premium-glass edge-border glow-gold rounded-[40px] p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-amber-500/10 active:scale-[0.99] ${theme === 'light' ? 'border-transparent shadow-lg shadow-amber-500/5' : ''}`}>
        <div className={`w-12 h-12 flex items-center justify-center rounded-[18px] mb-8 ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
            <Flag className="w-6 h-6" />
        </div>
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${theme === 'dark' ? 'text-amber-400/80' : 'text-amber-600'}`}>Alpha Milestone</h3>
        <p className={`text-3xl font-black tracking-tight leading-tight mb-8 ${textPrimary}`}>{goals.shortTerm.name}</p>
        <div className="flex items-end justify-between">
            <div>
                <span className={`text-6xl font-black leading-none tabular-nums drop-shadow-2xl ${textPrimary}`}>{calculateDaysLeft(goals.shortTerm.date)}</span>
                <span className={`text-[10px] font-black ml-3 uppercase tracking-widest inline-block mb-1 ${textSecondary}`}>Days Remaining</span>
            </div>
            <div className={`text-right pl-8 border-l ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${textSecondary}`}>Vector</p>
                <p className={`text-2xl font-black tracking-tighter ${textPrimary}`}>{goals.shortTerm.distance}KM</p>
            </div>
        </div>
      </div>

      <div className={`premium-glass edge-border glow-indigo rounded-[40px] p-10 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-indigo-500/10 active:scale-[0.99] ${theme === 'light' ? 'border-transparent shadow-lg shadow-blue-500/5' : ''}`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -mr-40 -mt-40"></div>
        <div className="relative z-10">
            <div className={`w-12 h-12 flex items-center justify-center rounded-[18px] mb-8 ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                <Trophy className="w-6 h-6" />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${theme === 'dark' ? 'text-indigo-400/80' : 'text-blue-600'}`}>Grand Objective</h3>
            <p className={`text-3xl font-black tracking-tight leading-tight mb-8 ${textPrimary}`}>{goals.longTerm.name}</p>
            <div className="flex items-end justify-between">
                <div>
                    <span className={`text-6xl font-black leading-none tabular-nums drop-shadow-2xl ${textPrimary}`}>{calculateDaysLeft(goals.longTerm.date)}</span>
                    <span className={`text-[10px] font-black ml-3 uppercase tracking-widest inline-block mb-1 ${textSecondary}`}>Days Countdown</span>
                </div>
                <div className={`text-right pl-8 border-l ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${textSecondary}`}>Target</p>
                    <p className={`text-2xl font-black tracking-tighter ${textPrimary}`}>{goals.longTerm.distance}KM</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};