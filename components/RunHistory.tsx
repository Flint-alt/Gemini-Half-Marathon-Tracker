import React, { useState } from 'react';
import { RunData } from '../types';
import { Calendar, Edit3, Image as ImageIcon, ClipboardList, Timer, Zap, Filter } from 'lucide-react';

interface RunHistoryProps {
  runs: RunData[];
  onEditRun: (run: RunData) => void;
  theme?: 'dark' | 'light';
}

type RunFilter = 'all' | 'parkrun' | 'long' | 'easy' | 'treadmill' | 'other';

export const RunHistory: React.FC<RunHistoryProps> = ({ runs, onEditRun, theme = 'dark' }) => {
  const [filter, setFilter] = useState<RunFilter>('all');
  
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const filteredRuns = filter === 'all' 
    ? sortedRuns 
    : sortedRuns.filter(r => r.type === filter);

  const counts = {
    all: runs.length,
    parkrun: runs.filter(r => r.type === 'parkrun').length,
    long: runs.filter(r => r.type === 'long').length,
    easy: runs.filter(r => r.type === 'easy').length,
    treadmill: runs.filter(r => r.type === 'treadmill').length,
    other: runs.filter(r => r.type === 'other').length,
  };

  const FilterChip = ({ type, label }: { type: RunFilter, label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
        filter === type 
          ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' 
          : theme === 'dark'
            ? 'bg-slate-800/40 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
            : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {label} <span className={`ml-1.5 opacity-60 ${filter === type ? 'text-white' : 'text-slate-600'}`}>({counts[type]})</span>
    </button>
  );

  return (
    <div className={`premium-glass rounded-[40px] p-6 sm:p-10 border ${theme === 'dark' ? 'border-white/5' : 'border-transparent'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Protocol Logs</h3>
          <h2 className={`text-3xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Activity</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Filter System</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-4 scrollbar-hide no-scrollbar">
        <FilterChip type="all" label="All Units" />
        <FilterChip type="parkrun" label="Parkrun" />
        <FilterChip type="long" label="Long Run" />
        <FilterChip type="easy" label="Easy" />
        <FilterChip type="treadmill" label="Treadmill" />
        <FilterChip type="other" label="Other" />
      </div>
      
      <div className="space-y-5">
        {filteredRuns.length === 0 ? (
          <div className={`text-center py-20 rounded-[32px] border border-dashed ${theme === 'dark' ? 'bg-slate-800/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">No matching protocols found</p>
          </div>
        ) : (
          filteredRuns.map((run) => (
            <div 
              key={run.id} 
              onClick={() => onEditRun(run)}
              className={`group flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 rounded-[32px] transition-all duration-500 border cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-xl ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/[0.08] border-transparent hover:border-white/10' 
                  : 'bg-white/80 hover:bg-white border-slate-100 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center gap-6 sm:gap-8 mb-6 md:mb-0">
                <div className={`${run.source === 'upload' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] border flex items-center justify-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-3 flex-shrink-0`}>
                  {run.source === 'upload' ? <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" /> : <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <span className={`font-black text-2xl sm:text-3xl tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{run.distanceKm.toFixed(2)}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">KM</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${
                      run.type === 'parkrun' ? 'bg-amber-500/10 text-amber-500' : 
                      run.type === 'long' ? 'bg-indigo-500/10 text-indigo-500' :
                      run.type === 'treadmill' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {run.type}
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(run.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-10 md:gap-16">
                <div className="flex gap-8 sm:gap-10 md:gap-14">
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5"/> Time</span>
                      <span className={`text-sm sm:text-base font-black tracking-tight tabular-nums ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{run.duration}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> Pace</span>
                      <span className={`text-sm sm:text-base font-black tracking-tight tabular-nums ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{run.pace}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  title="Edit Session"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRun(run);
                  }}
                  className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-500 flex-shrink-0 cursor-pointer ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} hover:scale-110 active:scale-95`}
                >
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};