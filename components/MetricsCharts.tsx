import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, ComposedChart, ReferenceLine
} from 'recharts';
import { RunData, WeightEntry } from '../types';
import { TRAINING_PLAN } from '../data/trainingPlan';

interface MetricsChartsProps {
  runs: RunData[];
  weightHistory: WeightEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b]/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-8 py-1.5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
            </div>
            <span className="text-xs font-black text-white tracking-tight">{entry.value.toFixed(1)} {entry.name === 'Weight' ? 'KG' : 'KM'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ runs, weightHistory }) => {
  const volumeData = TRAINING_PLAN.map(week => {
    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyActual = runs.reduce((sum, run) => {
      const runDate = new Date(run.date);
      if (runDate >= weekStart && runDate < weekEnd) return sum + run.distanceKm;
      return sum;
    }, 0);

    return {
      weekLabel: `W${week.weekNumber}`,
      planned: week.plannedLongRunKm,
      actual: weeklyActual,
      isCurrent: new Date() >= weekStart && new Date() < weekEnd
    };
  });

  const weightDataFormatted = [...weightHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: w.weightKg
    }));

  const currentWeekIndex = volumeData.findIndex(d => d.isCurrent);

  return (
    <div className="space-y-12">
      {/* 44-Week Volume Analysis */}
      <div className="premium-glass p-10 rounded-[40px] inner-glow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Performance Stream</h3>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Weekly Volume Delta</h2>
          </div>
          <div className="flex gap-6 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actual</span>
             </div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="weekLabel" 
                tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
                interval={Math.floor(volumeData.length / 8)} 
              />
              <YAxis 
                tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }} />
              
              <Area type="stepAfter" dataKey="planned" stroke="none" fill="rgba(100, 116, 139, 0.15)" name="Target" />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#818cf8" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#818cf8', strokeWidth: 3, stroke: '#0f172a' }} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                name="Actual"
              />

              {currentWeekIndex !== -1 && (
                <ReferenceLine x={`W${currentWeekIndex + 1}`} stroke="#fbbf24" strokeDasharray="4 4" label={{ position: 'top', value: 'SYNC POINT', fill: '#fbbf24', fontSize: 9, fontWeight: 900, letterSpacing: '2px' }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Trend */}
      <div className="premium-glass p-10 rounded-[40px] inner-glow">
        <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.4em] mb-10">Neural Mass Gradient</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightDataFormatted} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeightDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} hide={weightDataFormatted.length < 2} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorWeightDark)" 
                name="Weight" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};