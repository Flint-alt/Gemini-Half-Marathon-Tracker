import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RunData, WeightEntry, UserProfile, CoachingInsight } from './types';
import { TRAINING_PLAN } from './data/trainingPlan';
import { analyzeRunScreenshot, getCoachingAdvice } from './services/geminiService';
import { RunHistory } from './components/RunHistory';
import { MetricsCharts } from './components/MetricsCharts';
import { CoachingPanel } from './components/CoachingPanel';
import { GoalProgress } from './components/GoalProgress';
import { 
  Upload, Scale, X, FlaskConical, Plus, Bug, Activity, ShieldCheck, 
  Zap, Settings, RefreshCcw, Trash2, Calendar, LayoutGrid, ChevronUp, ChevronDown,
  Sun, Moon, Sparkles, Route, Timer
} from 'lucide-react';

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
  
  // Updated Theme Initialization: Defaults to 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('neurostride_theme');
    return (saved as 'dark' | 'light') || 'light';
  });
  
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showManualRunInput, setShowManualRunInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [isArchitectMode, setIsArchitectMode] = useState(false);

  // Layout Management
  const [layoutOrder, setLayoutOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('neurostride_layout');
    return saved ? JSON.parse(saved) : ['strategy', 'charts', 'history'];
  });
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('neurostride_sidebar');
    return saved ? JSON.parse(saved) : ['coaching', 'weight', 'diagnostics'];
  });

  const [newWeight, setNewWeight] = useState('');
  const [manualRun, setManualRun] = useState({ 
    distance: '', 
    duration: '', 
    date: new Date().toISOString().split('T')[0],
    type: 'long' as 'parkrun' | 'long' | 'easy' | 'treadmill' | 'other'
  });

  useEffect(() => {
    localStorage.setItem('neurostride_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('neurostride_weights', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('neurostride_layout', JSON.stringify(layoutOrder));
  }, [layoutOrder]);

  useEffect(() => {
    localStorage.setItem('neurostride_sidebar', JSON.stringify(sidebarOrder));
  }, [sidebarOrder]);

  // Updated Theme Effect: Toggles .dark-mode class
  useEffect(() => {
    localStorage.setItem('neurostride_theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  const currentWeek = TRAINING_PLAN.find(w => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const now = new Date();
    return now >= start && now < end;
  }) || TRAINING_PLAN[0];

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
    setManualRun({ distance: '', duration: '', date: new Date().toISOString().split('T')[0], type: 'long' });
    try {
      const insight = await getCoachingAdvice(newRun, updatedRuns, INITIAL_PROFILE);
      setCoachingInsight(insight);
    } finally { setLoading(false); }
  };

  const calculatePace = (dist: number, dur: string) => {
    const parts = dur.split(':').map(Number);
    let seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] || 0;
    if (dist === 0 || seconds === 0) return "0:00";
    const paceSec = seconds / dist;
    return `${Math.floor(paceSec / 60)}:${Math.floor(paceSec % 60).toString().padStart(2, '0')}`;
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
      } catch (err) { console.error(err); } finally { setIsUploading(false); setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const moveItem = (index: number, direction: 'up' | 'down', listType: 'main' | 'sidebar') => {
    const list = listType === 'main' ? [...layoutOrder] : [...sidebarOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    
    if (listType === 'main') setLayoutOrder(list);
    else setSidebarOrder(list);
  };

  const ArchitectControls = ({ index, total, listType }: { index: number, total: number, listType: 'main' | 'sidebar' }) => {
    if (!isArchitectMode) return null;
    return (
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
        <button 
          disabled={index === 0}
          onClick={() => moveItem(index, 'up', listType)}
          className="p-3 bg-indigo-500 text-white rounded-xl shadow-xl disabled:opacity-30 hover:bg-indigo-400 transition-all active:scale-90"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button 
          disabled={index === total - 1}
          onClick={() => moveItem(index, 'down', listType)}
          className="p-3 bg-indigo-500 text-white rounded-xl shadow-xl disabled:opacity-30 hover:bg-indigo-400 transition-all active:scale-90"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const resetData = () => {
    if (confirm("DANGER: Purge local cache?")) {
      setRuns([]);
      setWeights([{ id: '0', date: '2025-01-01', weightKg: 74.5 }]);
      setCoachingInsight(null);
      setShowSettings(false);
    }
  };

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);

  const renderMainItem = (id: string, index: number) => {
    // Manually handle the ring offset color based on theme since 'light-mode:' is not standard
    const ringOffsetColor = theme === 'dark' ? 'ring-offset-[#1e293b]' : 'ring-offset-[#f8fafc]';
    const tileClass = `relative group transition-all duration-500 ${isArchitectMode ? `ring-2 ring-indigo-500/40 ring-offset-4 ${ringOffsetColor} rounded-[42px]` : ''}`;
    
    switch(id) {
      case 'strategy':
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={layoutOrder.length} listType="main" />
            <div className="premium-glass rounded-[40px] p-6 sm:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 transform group-hover:scale-110">
                <Activity className={`w-48 h-48 ${theme === 'dark' ? 'text-indigo-300' : 'text-blue-600'}`} />
              </div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                  <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-3 ${theme === 'dark' ? 'text-indigo-300' : 'text-blue-600'}`}>Adaptive Strategy v1</h3>
                    <h2 className={`text-3xl sm:text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>Phase Week {currentWeek.weekNumber}</h2>
                  </div>
                  <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${currentWeek.isRecovery ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-600 dark:text-emerald-300' : theme === 'dark' ? 'bg-indigo-400/10 border-indigo-400/20 text-indigo-200' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{currentWeek.isRecovery ? 'Recovery Block' : 'Loading Block'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { label: 'Short Target', val: currentWeek.plannedParkrunKm, unit: 'KM', desc: 'Parkrun baseline' },
                    { label: 'Long Target', val: currentWeek.plannedLongRunKm, unit: 'KM', desc: 'Endurance extension' },
                    { label: 'Focus', val: currentWeek.milestone || 'Extend', unit: '', desc: 'Weekly objective' }
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 sm:p-8 rounded-[28px] border transition-all duration-500 hover:translate-y-[-4px] ${theme === 'dark' ? 'bg-slate-700/20 border-white/10 hover:border-indigo-400/30' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>{stat.label}</p>
                      <p className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {stat.val}<span className="text-sm ml-1 text-slate-400 font-bold uppercase">{stat.unit}</span>
                      </p>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{stat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'charts':
        return <div key={id} className={tileClass}><ArchitectControls index={index} total={layoutOrder.length} listType="main" /><MetricsCharts runs={runs} weightHistory={weights} theme={theme} /></div>;
      case 'history':
        return <div key={id} className={tileClass}><ArchitectControls index={index} total={layoutOrder.length} listType="main" /><RunHistory runs={runs} onEditRun={() => {}} theme={theme} /></div>;
      default:
        return null;
    }
  };

  const renderSidebarItem = (id: string, index: number) => {
    // Manually handle the ring offset color based on theme
    const ringOffsetColor = theme === 'dark' ? 'ring-offset-[#1e293b]' : 'ring-offset-[#f8fafc]';
    const tileClass = `relative transition-all duration-500 ${isArchitectMode ? `ring-2 ring-indigo-500/40 ring-offset-4 ${ringOffsetColor} rounded-[42px]` : ''}`;

    switch(id) {
      case 'coaching':
        return <div key={id} className={tileClass}><ArchitectControls index={index} total={sidebarOrder.length} listType="sidebar" /><CoachingPanel insight={coachingInsight} loading={loading} theme={theme} /></div>;
      case 'weight':
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={sidebarOrder.length} listType="sidebar" />
            <div className={`premium-glass rounded-[40px] p-10 border-t-4 ${theme === 'dark' ? 'border-rose-400/80' : 'border-pink-500'}`}>
              <div className="flex justify-between items-center mb-10">
                <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-rose-300' : 'text-pink-600'}`}>Neural Mass</h3>
                <button onClick={() => setShowWeightInput(!showWeightInput)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${theme === 'dark' ? 'bg-rose-400/10 text-rose-300 border-rose-400/10 hover:bg-rose-400/20' : 'bg-pink-50 text-pink-500 border-pink-100 hover:bg-pink-100'}`}>
                  <Scale className="w-5 h-5" />
                </button>
              </div>
              {showWeightInput && (
                <div className="flex gap-3 mb-10 animate-in slide-in-from-top-4 duration-500">
                  <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} className={`flex-1 border rounded-xl px-5 py-3 font-bold outline-none focus:border-rose-400/40 ${theme === 'dark' ? 'bg-slate-700/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`} placeholder="00.0" />
                  <button onClick={() => { if(!newWeight) return; setWeights([...weights, { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], weightKg: parseFloat(newWeight) }]); setNewWeight(''); setShowWeightInput(false); }} className="bg-rose-500 text-white px-6 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-rose-500/20">Update</button>
                </div>
              )}
              <div className="flex items-baseline gap-3 mb-8">
                <span className={`text-7xl font-black tracking-tighter drop-shadow-2xl ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>{weights[weights.length-1].weightKg}</span>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">KG</span>
              </div>
              <div className="space-y-5">
                <div className={`w-full h-3 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-200'}`}>
                  <div className={`h-full rounded-full transition-all duration-1000 ${theme === 'dark' ? 'bg-gradient-to-r from-rose-500 to-rose-300' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`} style={{ width: `${Math.min(100, Math.max(5, (74.5 - weights[weights.length-1].weightKg) / (74.5 - 65) * 100))}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Start: 74.5</span>
                  <span className={theme === 'dark' ? 'text-rose-300' : 'text-pink-600'}>Milestone: 65.0</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'diagnostics':
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={sidebarOrder.length} listType="sidebar" />
            <div className={`p-8 border rounded-[32px] flex flex-col items-center gap-5 opacity-90 hover:opacity-100 transition-opacity duration-500 ${theme === 'dark' ? 'bg-slate-700/10 border-white/10' : 'bg-white/60 border-transparent shadow-sm'}`}>
              <FlaskConical className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-300' : 'text-blue-500'}`} />
              <p className={`text-[10px] font-black uppercase tracking-[0.25em] text-center leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Neural Core v4.8<br/>Encrypted Lab Access</p>
              <div className="flex gap-4">
                <button onClick={() => setShowSettings(true)} className={`p-3 border rounded-xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-700/30 border-white/10 hover:text-indigo-300 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:bg-blue-50 text-slate-400 hover:text-blue-500'}`}><Settings className="w-4 h-4" /></button>
                <button onClick={() => setShowDiagnostics(true)} className={`p-3 border rounded-xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-700/30 border-white/10 hover:text-rose-300 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:bg-pink-50 text-slate-400 hover:text-pink-500'}`}><Bug className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen relative ${overlayActive ? 'scanning-active' : ''}`}>
      {overlayActive && <div className="scanning-line" />}
      
      <button onClick={() => setShowManualRunInput(true)} className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 md:hidden active:scale-90 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      {/* Manual Input Modal */}
      {showManualRunInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="premium-glass w-full max-w-md rounded-[40px] p-8 sm:p-10 border border-white/10 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Log Session</h2>
              <button onClick={() => setShowManualRunInput(false)} className="text-slate-400 hover:text-white transition-colors"><X/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Session Date</label>
                <div className="relative group">
                   <input type="date" value={manualRun.date} onChange={e => setManualRun({...manualRun, date: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 font-bold appearance-none focus:border-indigo-500/50 outline-none transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['parkrun', 'long', 'easy', 'treadmill', 'other'] as const).map((t) => (
                    <button key={t} onClick={() => setManualRun({...manualRun, type: t})} className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${manualRun.type === t ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : theme === 'dark' ? 'bg-slate-800/50 border-white/5 text-slate-500 hover:border-white/20' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Distance (KM)</label>
                <div className="relative group">
                   <input type="number" step="0.01" inputMode="decimal" value={manualRun.distance} onChange={e => setManualRun({...manualRun, distance: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 font-bold focus:border-indigo-500/50 outline-none transition-colors ${theme === 'dark' ? 'bg-slate-800/50 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} placeholder="5.00" />
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Route className="w-4 h-4" />
                   </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Duration (HH:MM:SS)</label>
                <div className="relative group">
                  <input type="text" value={manualRun.duration} onChange={e => setManualRun({...manualRun, duration: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 font-bold focus:border-indigo-500/50 outline-none transition-colors ${theme === 'dark' ? 'bg-slate-800/50 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} placeholder="00:30:00" />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Timer className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <button onClick={handleManualRunSubmit} className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95">Execute Protocol</button>
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-[60] backdrop-blur-3xl border-b transition-colors duration-500 ${theme === 'dark' ? 'bg-[#334155]/40 border-white/10' : 'bg-white/70 border-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center text-white shadow-xl flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>Outrun</h1>
              <div className="hidden xs:flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)] ${theme === 'dark' ? 'bg-indigo-400' : 'bg-blue-500'}`} />
                <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-500'}`}>Protocol {currentWeek.phase}.{currentWeek.weekNumber}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-700/40 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-blue-600 shadow-sm hover:bg-slate-50'}`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsArchitectMode(!isArchitectMode)} 
              className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isArchitectMode ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' : theme === 'dark' ? 'bg-slate-700/40 hover:bg-slate-700/60 text-slate-100 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{isArchitectMode ? 'Exit Architect' : 'Architect Mode'}</span>
            </button>
            <button onClick={() => setShowManualRunInput(true)} className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${theme === 'dark' ? 'bg-slate-700/40 hover:bg-slate-700/60 text-slate-100 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'}`}><Plus className="w-4 h-4" /><span className="hidden sm:inline">Log Session</span><span className="inline sm:hidden">Log</span></button>
            <label className={`cursor-pointer group relative overflow-hidden px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${theme === 'dark' ? (isUploading ? 'bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-400') : (isUploading ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-500')} text-white shadow-xl shadow-indigo-500/20 flex items-center`}>{isUploading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <div className="flex items-center gap-2"><Upload className="w-4 h-4" /> <span className="hidden xs:inline">Sync</span></div>}<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24">
        <GoalProgress goals={INITIAL_PROFILE.goals} theme={theme} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-12">
            {layoutOrder.map((id, index) => renderMainItem(id, index))}
          </div>
          <div className="lg:col-span-4 space-y-12">
            {sidebarOrder.map((id, index) => renderSidebarItem(id, index))}
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