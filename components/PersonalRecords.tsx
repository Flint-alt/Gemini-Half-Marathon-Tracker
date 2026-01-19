
import React, { useMemo } from 'react';
import { RunData } from '../types';
import { Trophy, Zap, Ruler, Timer, ArrowUpRight, Plus } from 'lucide-react';

interface PersonalRecordsProps {
  runs: RunData[];
  theme?: 'dark' | 'light';
}

interface RecordCardProps {
  title: string;
  value: string;
  unit: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  runId?: string;
  subLabel?: string;
  isEmpty?: boolean;
}

export const PersonalRecords: React.FC<PersonalRecordsProps> = ({ runs, theme = 'dark' }) => {
  const records = useMemo(() => {
    if (runs.length === 0) return null;

    const paceToSeconds = (pace: string) => {
      const parts = pace.split(':').map(Number);
      if (parts.length === 2) return (parts[0] * 60) + parts[1];
      return parts[0] || 0;
    };

    const longest = [...runs].sort((a, b) => b.distanceKm - a.distanceKm)[0];
    const bestPace = [...runs].sort((a, b) => paceToSeconds(a.pace) - paceToSeconds(b.pace))[0];
    const fastest5k = [...runs]
      .filter(r => r.distanceKm >= 4.9) // Allowing slight margin for GPS diff
      .sort((a, b) => paceToSeconds(a.pace) - paceToSeconds(b.pace))[0];

    return { longest, bestPace, fastest5k };
  }, [runs]);

  const scrollToRun = (id: string) => {
    const element = document.getElementById(`run-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-4', 'scale-[1.02]');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-4', 'scale-[1.02]');
      }, 2000);
    }
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-500' : 'text-slate-400';

  const RecordCard = ({ title, value, unit, date, icon: Icon, colorClass, runId, subLabel, isEmpty }: RecordCardProps) => (
    <button
      onClick={() => !isEmpty && runId && scrollToRun(runId)}
      disabled={isEmpty}
      className={`premium-glass rounded-[32px] p-6 text-left transition-all duration-500 group relative overflow-hidden border ${
        theme === 'dark' ? 'border-white/5' : 'border-slate-100'
      } ${!isEmpty ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : 'opacity-60 cursor-default'}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 transition-transform ${!isEmpty ? 'group-hover:scale-110 group-hover:rotate-12' : ''} ${colorClass}`}>
        <Icon className="w-full h-full" />
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          isEmpty 
            ? 'bg-slate-500/5 border-slate-500/10 text-slate-500' 
            : colorClass.replace('text-', 'bg-').replace('-400', '-500/10 border-').replace('-600', '-50/20 border-')
        }`}>
          <Icon className={`w-5 h-5 ${isEmpty ? 'text-slate-500' : colorClass}`} />
        </div>
        {!isEmpty && <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity ${textSecondary}`} />}
      </div>

      <h4 className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${isEmpty ? 'text-slate-500' : colorClass}`}>{title}</h4>
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-2xl font-black tracking-tighter ${isEmpty ? 'text-slate-700' : textPrimary}`}>
          {isEmpty ? '--:--' : value}
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>{unit}</span>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <span className={`text-[8px] font-black uppercase tracking-widest ${textSecondary}`}>
          {isEmpty ? 'Pending Entry' : subLabel}
        </span>
        <span className={`text-[8px] font-black uppercase tracking-widest ${textSecondary}`}>
          {isEmpty ? 'No Data' : new Date(date).toLocaleDateString('en-GB')}
        </span>
      </div>
    </button>
  );

  return (
    <div className={`premium-glass rounded-[40px] p-8 sm:p-10 mb-12 border ${theme === 'dark' ? 'border-white/5' : 'border-transparent'}`}>
      <div className="flex items-center gap-4 mb-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
          <Trophy className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Hall of Fame</h3>
          <h2 className={`text-2xl font-black tracking-tighter uppercase ${textPrimary}`}>Personal Records</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <RecordCard 
          title="Fastest 5K"
          value={records?.fastest5k?.duration.slice(-5)}
          unit="Time"
          date={records?.fastest5k?.date}
          icon={Timer}
          colorClass="text-amber-400"
          runId={records?.fastest5k?.id}
          subLabel={`${records?.fastest5k?.pace}/km`}
          isEmpty={!records?.fastest5k}
        />
        <RecordCard 
          title="Longest Run"
          value={records?.longest?.distanceKm.toFixed(2)}
          unit="KM"
          date={records?.longest?.date}
          icon={Ruler}
          colorClass="text-indigo-400"
          runId={records?.longest?.id}
          subLabel={records?.longest?.type}
          isEmpty={!records?.longest}
        />
        <RecordCard 
          title="Best Pace"
          value={records?.bestPace?.pace}
          unit="/KM"
          date={records?.bestPace?.date}
          icon={Zap}
          colorClass="text-emerald-400"
          runId={records?.bestPace?.id}
          subLabel={`${records?.bestPace?.distanceKm}km`}
          isEmpty={!records?.bestPace}
        />
      </div>
    </div>
  );
};
