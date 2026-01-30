
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Line, ComposedChart, ReferenceLine, Cell, AreaChart, Area, Legend, BarChart
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
    // Filter out "Trend" if present
    const filteredPayload = payload.filter((entry: any) => entry.name !== 'Trend');
    
    return (
      <div className={`backdrop-blur-xl p-4 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1e293b]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 border-b pb-2 ${theme === 'dark' ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>{label}</p>
        {filteredPayload.map((entry: any, index: number) => {
          const value = entry.value !== undefined && entry.value !== null ? entry.value : 0;
          return (
            <div key={index} className="flex items-center justify-between gap-6 py-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{entry.name}</span>
              </div>
              <span className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value.toFixed(1)} KM</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, theme }: any) => {
  return (
    <div className="flex justify-center gap-6 mb-6">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div className="w-8 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ runs, weightHistory, theme = 'dark' }) => {
  const now = new Date();
  
  const volumeData = TRAINING_PLAN.map(week => {
    const weekStart = new Date(week.startDate);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyActual = runs.reduce((sum, run) => {
      const runDate = new Date(run.date);
      if (runDate >= weekStart && runDate < weekEnd) return sum + run.distanceKm;
      return sum;
    }, 0);

    const target = week.plannedLongRunKm + week.plannedParkrunKm;
    const isCurrent = now >= weekStart && now < weekEnd;
    const isPast = now >= weekEnd;
    
    const hasData = weeklyActual > 0;
    const shouldShowActual = isPast || isCurrent || hasData;

    return {
      weekLabel: `Week ${week.weekNumber}`,
      Planned: target,
      Actual: shouldShowActual ? weeklyActual : 0,
      isCurrent: isCurrent
    };
  });

  const weightDataFormatted = [...weightHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => ({
        date: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        weight: w.weightKg
    }));

  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
  const barPlannedColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const barActualColor = '#3b82f6';

  return (
    <div className="space-y-12">
      {/* Weekly Mileage Analysis */}
      <div className={`premium-glass p-8 sm:p-10 rounded-[40px] ${theme === 'dark' ? 'inner-glow' : ''}`}>
        <div className="mb-10">
          <h2 className={`text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Weekly Mileage</h2>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={volumeData} 
              margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="weekLabel" 
                tick={{fontSize: 10, fontWeight: 600, fill: axisColor}} 
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                interval={Math.floor(volumeData.length / 6)}
                dy={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tick={{fontSize: 10, fontWeight: 600, fill: axisColor}} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 'dataMax + 4']}
                ticks={[0, 4, 8, 12, 16]}
              />
              <Tooltip 
                content={<CustomTooltip theme={theme} />} 
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} 
              />
              <Legend content={<CustomLegend theme={theme} />} verticalAlign="top" align="center" />
              
              <Bar 
                dataKey="Planned" 
                fill={barPlannedColor} 
                radius={[4, 4, 0, 0]} 
                name="Planned" 
                barSize={10}
              />

              <Bar 
                dataKey="Actual" 
                fill={barActualColor} 
                radius={[4, 4, 0, 0]} 
                name="Actual" 
                barSize={10}
              />

              {/* Keep the current week indicator subtle */}
              {volumeData.map((entry, index) => (
                entry.isCurrent ? (
                  <ReferenceLine 
                    key={`ref-${index}`}
                    x={entry.weekLabel} 
                    stroke="#fbbf24" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                ) : null
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Training Week</p>
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
