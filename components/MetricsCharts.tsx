
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Line, ComposedChart, ReferenceLine, Cell, AreaChart, Area
} from 'recharts';
import { RunData, WeightEntry } from '../types';
import { TRAINING_PLAN } from '../data/trainingPlan';

interface MetricsChartsProps {
  runs: RunData[];
  weightHistory: WeightEntry[];
  theme?: 'dark' | 'light';
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  theme?: 'dark' | 'light';
}

const CustomTooltip = ({ active, payload, label, theme }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Filter out "Trend" to avoid redundant info in the tooltip
    const filteredPayload = payload.filter((entry) => entry.name !== 'Trend');
    
    return (
      <div className={`backdrop-blur-xl p-5 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1e293b]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 border-b pb-2 ${theme === 'dark' ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>{label}</p>
        {filteredPayload.map((entry, index: number) => {
          const value = entry.value !== undefined && entry.value !== null ? entry.value : 0;
          return (
            <div key={index} className="flex items-center justify-between gap-8 py-1.5">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{entry.name}</span>
              </div>
              <span className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value.toFixed(1)} {entry.name === 'Weight' ? 'KG' : 'KM'}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ runs, weightHistory, theme = 'dark' }) => {
  const now = new Date();
  
  const volumeData = TRAINING_PLAN.map(week => {
    const weekStart = new Date(week.startDate);
    weekStart.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7); // Exactly 7 days later (start of next week's day 1)

    // Calculate actual volume for this week
    const weeklyActual = runs.reduce((sum, run) => {
      const runDate = new Date(run.date);
      // Run must be >= start and strictly < start of next week
      if (runDate >= weekStart && runDate < weekEnd) return sum + run.distanceKm;
      return sum;
    }, 0);

    const target = week.plannedLongRunKm + week.plannedParkrunKm;
    const isCurrent = now >= weekStart && now < weekEnd;
    const isPast = now >= weekEnd;
    
    // Show actual data if week has passed, is current, or has manual entries
    const hasData = weeklyActual > 0;
    const shouldShowActual = isPast || isCurrent || hasData;

    return {
      weekLabel: `W${week.weekNumber}`,
      target: target,
      actual: shouldShowActual ? weeklyActual : undefined,
      isCurrent: isCurrent
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
            <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Training Plan</h3>
            <h2 className={`text-2xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Weekly Volume Delta</h2>
          </div>
          <div className={`flex gap-6 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
             <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-200'}`} />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target KM</span>
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
              <Tooltip 
                content={<CustomTooltip theme={theme} />} 
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} 
              />
              
              {/* Target KM Backdrop */}
              <Bar 
                dataKey="target" 
                fill={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                radius={[8, 8, 0, 0]} 
                name="Target KM" 
                barSize={12}
              />

              {/* Actual KM Filling vertically */}
              <Bar 
                dataKey="actual" 
                fill="#6366f1" 
                radius={[8, 8, 0, 0]} 
                name="Actual" 
                barSize={12}
                style={{ transform: 'translateX(-12px)' }} 
              />

              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={false}
                connectNulls={false} 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                name="Trend"
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

              {/* Milestone Indicators */}
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

      {/* Weight Tracker */}
      <div className={`premium-glass p-10 rounded-[40px] ${theme === 'dark' ? 'inner-glow' : ''}`}>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-10 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>Weight Tracker</h3>
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
