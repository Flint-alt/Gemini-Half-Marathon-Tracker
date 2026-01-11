import React from 'react';
import { UserProfile } from '../types';
import { Flag, Trophy } from 'lucide-react';

interface GoalProgressProps {
  goals: UserProfile['goals'];
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ goals }) => {
  const calculateDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className="premium-glass edge-border glow-gold rounded-[40px] p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-amber-500/10 active:scale-[0.99]">
        <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 w-12 h-12 flex items-center justify-center rounded-[18px] mb-8">
            <Flag className="w-6 h-6" />
        </div>
        <h3 className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.3em] mb-3">Alpha Milestone</h3>
        <p className="text-3xl font-black text-white tracking-tight leading-tight mb-8">{goals.shortTerm.name}</p>
        <div className="flex items-end justify-between">
            <div>
                <span className="text-6xl font-black text-white leading-none tabular-nums drop-shadow-2xl">{calculateDaysLeft(goals.shortTerm.date)}</span>
                <span className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-widest inline-block mb-1">Days Remaining</span>
            </div>
            <div className="text-right pl-8 border-l border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vector</p>
                <p className="text-2xl font-black text-white tracking-tighter">{goals.shortTerm.distance}KM</p>
            </div>
        </div>
      </div>

      <div className="premium-glass edge-border glow-indigo rounded-[40px] p-10 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-indigo-500/10 active:scale-[0.99]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -mr-40 -mt-40"></div>
        <div className="relative z-10">
            <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-12 h-12 flex items-center justify-center rounded-[18px] mb-8">
                <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.3em] mb-3">Grand Objective</h3>
            <p className="text-3xl font-black text-white tracking-tight leading-tight mb-8">{goals.longTerm.name}</p>
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-6xl font-black text-white leading-none tabular-nums drop-shadow-2xl">{calculateDaysLeft(goals.longTerm.date)}</span>
                    <span className="text-[10px] font-black text-slate-500 ml-3 uppercase tracking-widest inline-block mb-1">Days Countdown</span>
                </div>
                <div className="text-right pl-8 border-l border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{goals.longTerm.distance}KM</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};