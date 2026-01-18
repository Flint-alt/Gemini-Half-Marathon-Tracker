
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, ComposedChart, ReferenceLine
} from 'recharts';
import { RunData, WeightEntry } from '../types';
import { TRAINING_PLAN } from '../data/trainingPlan';

interface MetricsChartsProps {
  runs: RunData[];
  weightHistory: WeightEntry[];
  theme?: 'dark' | 'light';
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`backdrop-blur-xl p-5 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1e293b]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b pb-2 ${theme === 'dark' ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-8 py-1.5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{entry.name}</span>
            </div>
            <span className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{entry.value.toFixed(1)} {entry.name === 'Weight' ? 'KG' : 'KM'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ runs, weightHistory, theme = 'dark' }) => {
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
      planned: week.plannedLongRunKm + week.plannedParkrunKm,
      actual: weeklyActual,
      isCurrent: new Date() >= weekStart && new Date() < weekEnd
    };
  });

  const weightDataFormatted = [...weightHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => ({
        date: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        weight: w.weightKg
    }));

  const currentWeekIndex = volumeData.findIndex(d => d.isCurrent);
  const tenKWeek = TRAINING_PLAN.find(w => w.milestone?.includes('10k'));
  const halfMarathonWeek = TRAINING_PLAN.find(w => w.milestone?.includes('Half Marathon'));

  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="space-y-12">
      {/* 44-Week Volume Analysis */}
      <div className={`premium-glass p-10 rounded-[40px] ${theme === 'dark' ? 'inner-glow' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Performance Stream</h3>
            <h2 className={`text-2xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Weekly Volume Delta</h2>
          </div>
          <div className={`flex gap-6 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
             <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-indigo-300'}`} />
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
            <ComposedChart data={volumeData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="weekLabel" 
                tick={{fontSize: 9, fontWeight: 900, fill: axisColor}} 
                axisLine={false}
                tickLine={false}
                interval={Math.floor(volumeData.length / 8)} 
              />
              <YAxis 
                tick={{fontSize: 9, fontWeight: 900, fill: axisColor}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
              
              <Area 
                type="stepAfter" 
                dataKey="planned" 
                stroke={theme === 'dark' ? "rgba(148, 163, 184, 0.3)" : "rgba(129, 140, 248, 0.6)"} 
                strokeWidth={1}
                fill={theme === 'dark' ? "rgba(148, 163, 184, 0.15)" : "rgba(129, 140, 248, 0.25)"} 
                name="Target" 
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 3, stroke: theme === 'dark' ? '#0f172a' : '#fff' }} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                name="Actual"
              />

              {/* Current Week Indicator */}
              {currentWeekIndex !== -1 && (
                <ReferenceLine 
                  x={`W${currentWeekIndex + 1}`} 
                  stroke="#fbbf24" 
                  strokeDasharray="4 4" 
                  label={{ position: 'top', value: 'SYNC POINT', fill: '#fbbf24', fontSize: 9, fontWeight: 900, letterSpacing: '2px' }} 
                />
              )}

              {/* 10K Milestone Indicator */}
              {tenKWeek && (
                <ReferenceLine 
                  x={`W${tenKWeek.weekNumber}`} 
                  stroke={theme === 'dark' ? '#10b981' : '#059669'} 
                  strokeDasharray="3 3" 
                  label={{ 
                    position: 'top', 
                    value: '10K GOAL', 
                    fill: theme === 'dark' ? '#10b981' : '#059669', 
                    fontSize: 9, 
                    fontWeight: 900, 
                    letterSpacing: '1px' 
                  }} 
                />
              )}

              {/* Half Marathon Milestone Indicator */}
              {halfMarathonWeek && (
                <ReferenceLine 
                  x={`W${halfMarathonWeek.weekNumber}`} 
                  stroke={theme === 'dark' ? '#a78bfa' : '#7c3aed'} 
                  strokeDasharray="3 3" 
                  label={{ 
                    position: 'top', 
                    value: 'HALF MARATHON', 
                    fill: theme === 'dark' ? '#a78bfa' : '#7c3aed', 
                    fontSize: 9, 
                    fontWeight: 900, 
                    letterSpacing: '1px' 
                  }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Trend */}
      <div className={`premium-glass p-10 rounded-[40px] ${theme === 'dark' ? 'inner-glow' : ''}`}>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-10 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>Neural Mass Gradient</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightDataFormatted} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeightTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 900, fill: axisColor}} hide={weightDataFormatted.length < 2} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 9, fontWeight: 900, fill: axisColor}} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip theme={theme} />} />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorWeightTrend)" 
                name="Weight" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
