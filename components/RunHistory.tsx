import React from 'react';
import { RunData } from '../types';
import { Calendar, Edit3, Image as ImageIcon, ClipboardList, Timer, Zap } from 'lucide-react';

interface RunHistoryProps {
  runs: RunData[];
  onEditRun: (run: RunData) => void;
}

export const RunHistory: React.FC<RunHistoryProps> = ({ runs, onEditRun }) => {
  const sortedRuns = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="premium-glass rounded-[40px] p-10 border border-white/5">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Protocol Logs</h3>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Activity</h2>
        </div>
      </div>
      
      <div className="space-y-5">
        {sortedRuns.length === 0 ? (
          <div className="text-center py-24 bg-slate-800/20 rounded-[32px] border border-dashed border-white/5">
            <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Neural Interface Waiting</p>
          </div>
        ) : (
          sortedRuns.map((run) => (
            <div 
              key={run.id} 
              onClick={() => onEditRun(run)}
              className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/5 rounded-[32px] hover:bg-white/[0.08] transition-all duration-500 border border-transparent hover:border-white/10 cursor-pointer active:scale-[0.99] shadow-xl"
            >
              <div className="flex items-center gap-8 mb-6 md:mb-0">
                <div className={`${run.source === 'upload' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} w-16 h-16 rounded-[22px] border flex items-center justify-center transition-all duration-700 group-hover:scale-105 group-hover:rotate-3`}>
                  {run.source === 'upload' ? <ImageIcon className="w-7 h-7" /> : <ClipboardList className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-white text-3xl tracking-tighter">{run.distanceKm.toFixed(2)}</span>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest mt-2">KM</span>
                    <span className={`ml-3 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${run.type === 'parkrun' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-400'}`}>
                      {run.type}
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(run.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-10 md:gap-16">
                <div className="flex gap-10 md:gap-14">
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5"/> Time</span>
                      <span className="text-base font-black text-slate-200 tracking-tight tabular-nums">{run.duration}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> Pace</span>
                      <span className="text-base font-black text-slate-200 tracking-tight tabular-nums">{run.pace}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-500">
                  <Edit3 className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};