import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RunData, WeightEntry, UserProfile, CoachingInsight, TrainingWeek } from './types';
import { TRAINING_PLAN } from './data/trainingPlan';
import { analyzeRunScreenshot, getCoachingAdvice } from './services/geminiService';
import { RunHistory } from './components/RunHistory';
import { MetricsCharts } from './components/MetricsCharts';
import { CoachingPanel } from './components/CoachingPanel';
import { GoalProgress } from './components/GoalProgress';
import { Upload, Scale, Target, X, Check, FlaskConical, Scan, Plus, Bug, ClipboardList, Bell, Activity, ShieldCheck, Zap, Settings, RefreshCcw, Trash2 } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: "Athlete",
  condition: "Cerebral Palsy",
  baseline: "30 min 5k",
  startingWeight: 74.5,
  targetWeight: 65,
  goals: {
    shortTerm: { name: "10k Milestone", date: "2026-03-31", distance: 10 },
    longTerm: { name: "Half Marathon", date: "2026-11-01", distance: 21.1 }
  }
};

const App: React.FC = () => {
  const [runs, setRuns] = useState<RunData[]>(() => {
    const saved = localStorage.getItem('neurostride_runs');
    return saved ? JSON.parse(saved) : [];
  });
  const [weights, setWeights] = useState<WeightEntry[]>(() => {
    const saved = localStorage.getItem('neurostride_weights');
    return saved ? JSON.parse(saved) : [{ id: '0', date: '2025-01-01', weightKg: 74.5 }];
  });
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showManualRunInput, setShowManualRunInput] = useState(false);
  
  // Lab UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false); // Default to off

  const [newWeight, setNewWeight] = useState('');
  const [manualRun, setManualRun] = useState({ 
    distance: '', 
    duration: '', 
    date: new Date().toISOString().split('T')[0],
    type: 'long' as 'parkrun' | 'long' | 'other'
  });

  useEffect(() => {
    localStorage.setItem('neurostride_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('neurostride_weights', JSON.stringify(weights));
  }, [weights]);

  const currentWeek = TRAINING_PLAN.find(w => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const now = new Date();
    return now >= start && now < end;
  }) || TRAINING_PLAN[0];

  const calculatePace = (dist: number, dur: string) => {
    const parts = dur.split(':').map(Number);
    let seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
    if (dist === 0) return "0:00";
    const paceSec = seconds / dist;
    return `${Math.floor(paceSec / 60)}:${Math.floor(paceSec % 60).toString().padStart(2, '0')}`;
  };

  const handleManualRunSubmit = async () => {
    if (!manualRun.distance || !manualRun.duration) return;
    setLoading(true);
    const dist = parseFloat(manualRun.distance);
    const newRun: RunData = {
      id: Date.now().toString(),
      date: manualRun.date,
      distanceKm: dist,
      duration: manualRun.duration,
      pace: calculatePace(dist, manualRun.duration),
      source: 'manual',
      type: manualRun.type
    };
    const updatedRuns = [newRun, ...runs];
    setRuns(updatedRuns);
    setShowManualRunInput(false);
    try {
      const insight = await getCoachingAdvice(newRun, updatedRuns, INITIAL_PROFILE);
      setCoachingInsight(insight);
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const extracted = await analyzeRunScreenshot(base64Data);
        const newRun: RunData = {
          id: Date.now().toString(),
          date: extracted.date || new Date().toISOString().split('T')[0],
          distanceKm: extracted.distanceKm || 0,
          duration: extracted.duration || "00:00:00",
          pace: extracted.pace || "0:00",
          source: 'upload',
          type: extracted.distanceKm && extracted.distanceKm < 6 ? 'parkrun' : 'long'
        };
        const updatedRuns = [newRun, ...runs];
        setRuns(updatedRuns);
        const insight = await getCoachingAdvice(newRun, updatedRuns, INITIAL_PROFILE);
        setCoachingInsight(insight);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetData = () => {
    if (confirm("DANGER: This will purge all neural logs and reset your training history. Proceed?")) {
      setRuns([]);
      setWeights([{ id: '0', date: '2025-01-01', weightKg: 74.5 }]);
      setCoachingInsight(null);
      setShowSettings(false);
    }
  };

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);

  return (
    <div className={`min-h-screen relative ${overlayActive ? 'scanning-active' : ''}`}>
      {overlayActive && <div className="scanning-line" />}
      
      {/* Modal: Manual Entry */}
      {showManualRunInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="premium-glass w-full max-w-md rounded-[40px] p-10 border border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Log Session</h2>
              <button onClick={() => setShowManualRunInput(false)} className="text-slate-400 hover:text-white transition-colors"><X/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Distance (KM)</label>
                <input type="number" step="0.01" value={manualRun.distance} onChange={e => setManualRun({...manualRun, distance: e.target.value})} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold" placeholder="5.00" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Duration (HH:MM:SS)</label>
                <input type="text" value={manualRun.duration} onChange={e => setManualRun({...manualRun, duration: e.target.value})} className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold" placeholder="00:30:00" />
              </div>
              <button onClick={handleManualRunSubmit} className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all">Execute Protocol</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settings */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="premium-glass w-full max-w-md rounded-[40px] p-10 border border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Core Config</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors"><X/></button>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-black text-sm uppercase text-white mb-1">Neural Overlay</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Toggle Scanning Animation</p>
                </div>
                <button 
                  onClick={() => setOverlayActive(!overlayActive)}
                  className={`w-14 h-8 rounded-full transition-all duration-500 p-1 flex items-center ${overlayActive ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ${overlayActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <button 
                onClick={resetData}
                className="w-full py-6 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-3xl flex items-center justify-center gap-3 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-[0.2em]">Purge Local Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Diagnostics */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="w-full max-w-2xl bg-black border border-indigo-500/30 rounded-3xl p-10 font-mono text-indigo-400 shadow-[0_0_100px_rgba(79,70,229,0.1)]">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                <h2 className="text-xl font-bold uppercase tracking-widest">System Diagnostics</h2>
              </div>
              <button onClick={() => setShowDiagnostics(false)} className="text-indigo-800 hover:text-indigo-400"><X/></button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="flex justify-between border-b border-indigo-500/10 pb-2"><span>KERNEL_VERSION</span> <span>v4.8.2-PROD</span></p>
              <p className="flex justify-between border-b border-indigo-500/10 pb-2"><span>TOTAL_RECORDS</span> <span>{runs.length} Runs | {weights.length} Weight Entries</span></p>
              <p className="flex justify-between border-b border-indigo-500/10 pb-2"><span>VOLUMETRIC_TOTAL</span> <span>{totalKm.toFixed(2)} KM</span></p>
              <p className="flex justify-between border-b border-indigo-500/10 pb-2"><span>TARGET_DATE</span> <span>2026-11-01</span></p>
              <p className="flex justify-between border-b border-indigo-500/10 pb-2"><span>API_STATUS</span> <span className="text-emerald-500">READY</span></p>
              <p className="mt-8 text-indigo-800 italic">// Diagnostic complete. All systems nominal for Half-Marathon pursuit.</p>
            </div>
            <button onClick={() => setShowDiagnostics(false)} className="mt-10 w-full py-4 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors uppercase font-bold tracking-widest text-[10px]">Close Readout</button>
          </div>
        </div>
      )}

      {/* Light Frosted Header */}
      <header className="sticky top-0 z-[60] bg-[#334155]/40 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 bg-indigo-500 rounded-[14px] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter text-white">NeuroStride</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Protocol {currentWeek.phase}.{currentWeek.weekNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowManualRunInput(true)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-700/40 hover:bg-slate-700/60 text-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">
              <Plus className="w-4 h-4" /> Log Session
            </button>
            <label className={`cursor-pointer group relative overflow-hidden px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isUploading ? 'bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-400'} text-white shadow-xl shadow-indigo-500/20`}>
              {isUploading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <div className="flex items-center gap-2"><Upload className="w-4 h-4" /> <span>Sync</span></div>}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <GoalProgress goals={INITIAL_PROFILE.goals} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-12">
            
            {/* Phase Dashboard Card */}
            <div className="premium-glass rounded-[40px] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 transform group-hover:scale-110">
                <Activity className="w-48 h-48 text-indigo-300" />
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                  <div>
                    <h3 className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-3">Adaptive Strategy v1</h3>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Phase Week {currentWeek.weekNumber}</h2>
                  </div>
                  <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${currentWeek.isRecovery ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300' : 'bg-indigo-400/10 border-indigo-400/20 text-indigo-200'}`}>
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{currentWeek.isRecovery ? 'Recovery Block' : 'Loading Block'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Short Target', val: currentWeek.plannedParkrunKm, unit: 'KM', desc: 'Parkrun baseline' },
                    { label: 'Long Target', val: currentWeek.plannedLongRunKm, unit: 'KM', desc: 'Endurance extension' },
                    { label: 'Focus', val: currentWeek.milestone || 'Extend', unit: '', desc: 'Weekly objective' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-700/20 p-8 rounded-[28px] border border-white/10 hover:border-indigo-400/30 transition-all duration-500 hover:translate-y-[-4px]">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">{stat.label}</p>
                      <p className="text-3xl font-black text-white tracking-tight mb-2">
                        {stat.val}<span className="text-sm ml-1 text-slate-400 font-bold uppercase">{stat.unit}</span>
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <MetricsCharts runs={runs} weightHistory={weights} />
            <RunHistory runs={runs} onEditRun={() => {}} />
          </div>

          <div className="lg:col-span-4 space-y-12">
            <CoachingPanel insight={coachingInsight} loading={loading} />
            
            {/* Weight Technical Readout */}
            <div className="premium-glass rounded-[40px] p-10 border-t-4 border-rose-400/80">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-[11px] font-black text-rose-300 uppercase tracking-[0.3em]">Neural Mass</h3>
                <button onClick={() => setShowWeightInput(!showWeightInput)} className="w-10 h-10 bg-rose-400/10 text-rose-300 rounded-xl flex items-center justify-center hover:bg-rose-400/20 transition-colors border border-rose-400/10">
                  <Scale className="w-5 h-5" />
                </button>
              </div>

              {showWeightInput && (
                <div className="flex gap-3 mb-10 animate-in slide-in-from-top-4 duration-500">
                  <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="flex-1 bg-slate-700/30 border border-white/10 rounded-xl px-5 py-3 font-bold text-white outline-none focus:border-rose-400/40" placeholder="00.0" />
                  <button onClick={() => {
                    if(!newWeight) return;
                    setWeights([...weights, { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], weightKg: parseFloat(newWeight) }]);
                    setNewWeight(''); setShowWeightInput(false);
                  }} className="bg-rose-500 text-white px-6 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-rose-500/20">Update</button>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl">{weights[weights.length-1].weightKg}</span>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">KG</span>
              </div>

              <div className="space-y-5">
                <div className="w-full bg-slate-800/40 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-rose-300 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(5, (74.5 - weights[weights.length-1].weightKg) / (74.5 - 65) * 100))}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Start: 74.5</span>
                  <span className="text-rose-300">Milestone: 65.0</span>
                </div>
              </div>
            </div>

            {/* Neural Diagnostics Panel */}
            <div className="p-8 border border-white/10 rounded-[32px] bg-slate-700/10 flex flex-col items-center gap-5 opacity-90 hover:opacity-100 transition-opacity duration-500">
              <FlaskConical className="w-6 h-6 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 text-center leading-relaxed">Neural Core v4.8<br/>Encrypted Lab Access</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-slate-700/30 border border-white/10 rounded-xl hover:text-indigo-300 hover:bg-slate-700/50 transition-all active:scale-90"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowDiagnostics(true)}
                  className="p-3 bg-slate-700/30 border border-white/10 rounded-xl hover:text-rose-300 hover:bg-slate-700/50 transition-all active:scale-90"
                >
                  <Bug className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
