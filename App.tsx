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
  Upload, Scale, X, Plus, ShieldCheck, 
  LayoutGrid, ChevronUp, ChevronDown,
  Sun, Moon, Route, Timer, Cloud, Copy, Download, UploadCloud, RefreshCw, Check
} from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: "Athlete",
  condition: "Cerebral Palsy",
  baseline: "30 min 5k",
  startingWeight: 74.5,
  targetWeight: 65,
  goals: {
    shortTerm: { name: "10k Milestone", date: "2026-03-02", distance: 10 },
    longTerm: { name: "Half Marathon", date: "2026-11-02", distance: 21.1 }
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('neurostride_theme');
    return (saved as 'dark' | 'light') || 'light';
  });
  
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showManualRunInput, setShowManualRunInput] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [importKey, setImportKey] = useState('');
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [isArchitectMode, setIsArchitectMode] = useState(false);

  const [layoutOrder, setLayoutOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('neurostride_layout');
    return saved ? JSON.parse(saved) : ['strategy', 'charts', 'history'];
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
    localStorage.setItem('neurostride_theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  // Cloud Sync Logic
  const generateSyncKey = () => {
    const data = { runs, weights, theme, layoutOrder };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    navigator.clipboard.writeText(encoded);
    setSyncStatus('copied');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleImportSyncKey = () => {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(importKey)));
      if (decoded.runs) setRuns(decoded.runs);
      if (decoded.weights) setWeights(decoded.weights);
      if (decoded.theme) setTheme(decoded.theme);
      if (decoded.layoutOrder) setLayoutOrder(decoded.layoutOrder);
      setShowSyncPanel(false);
      setImportKey('');
      alert("Neural Profile Synced Successfully!");
    } catch (e) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const currentWeek = TRAINING_PLAN.find(w => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const now = new Date();
    return now >= start && now < end;
  }) || TRAINING_PLAN[0];

  const handleEditRun = (run: RunData) => {
    setManualRun({
      distance: run.distanceKm.toString(),
      duration: run.duration,
      date: run.date ? run.date.split('T')[0] : new Date().toISOString().split('T')[0],
      type: run.type
    });
    setEditingRunId(run.id);
    setShowManualRunInput(true);
  };

  const calculatePace = (dist: number, dur: string) => {
    const parts = dur.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else seconds = parts[0] || 0;
    
    if (dist === 0 || seconds === 0) return "0:00";
    const paceSec = seconds / dist;
    return `${Math.floor(paceSec / 60)}:${Math.floor(paceSec % 60).toString().padStart(2, '0')}`;
  };

  const handleManualRunSubmit = async () => {
    if (!manualRun.distance || !manualRun.duration) return;
    setLoading(true);
    const dist = parseFloat(manualRun.distance);
    
    const newRunData = {
      distanceKm: dist,
      duration: manualRun.duration,
      pace: calculatePace(dist, manualRun.duration),
      date: manualRun.date,
      type: manualRun.type
    };

    let updatedRuns: RunData[];
    if (editingRunId) {
      updatedRuns = runs.map(r => r.id === editingRunId ? { ...r, ...newRunData } : r);
    } else {
      const newRun: RunData = {
        id: Date.now().toString(),
        ...newRunData,
        source: 'manual'
      };
      updatedRuns = [newRun, ...runs];
    }

    setRuns(updatedRuns);
    setShowManualRunInput(false);
    setEditingRunId(null);
    setManualRun({ distance: '', duration: '', date: new Date().toISOString().split('T')[0], type: 'long' });
    
    try {
      const targetRun = editingRunId ? updatedRuns.find(r => r.id === editingRunId)! : updatedRuns[0];
      const insight = await getCoachingAdvice(targetRun, updatedRuns, INITIAL_PROFILE);
      setCoachingInsight(insight);
    } finally { 
      setLoading(false); 
    }
  };

  const handleWeightSubmit = () => {
    if (!newWeight) return;
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weightKg: parseFloat(newWeight)
    };
    setWeights([entry, ...weights]);
    setNewWeight('');
    setShowWeightInput(false);
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
          type: (extracted.distanceKm || 0) < 6 ? 'parkrun' : 'long'
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

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const list = [...layoutOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setLayoutOrder(list);
  };

  const ArchitectControls = ({ index, total }: { index: number, total: number }) => {
    if (!isArchitectMode) return null;
    return (
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button disabled={index === 0} onClick={() => moveItem(index, 'up')} className="p-2 bg-indigo-500 text-white rounded-lg disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
        <button disabled={index === total - 1} onClick={() => moveItem(index, 'down')} className="p-2 bg-indigo-500 text-white rounded-lg disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
      </div>
    );
  };

  const renderMainItem = (id: string, index: number) => {
    const tileClass = `relative ${isArchitectMode ? 'ring-2 ring-indigo-500/40 ring-offset-4 rounded-[42px]' : ''}`;
    
    switch(id) {
      case 'strategy':
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={layoutOrder.length} />
            <div className="premium-glass rounded-[40px] p-8 sm:p-10 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-3 ${theme === 'dark' ? 'text-indigo-300' : 'text-blue-600'}`}>Adaptive Strategy</h3>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'gemini-text'}`}>Week {currentWeek.weekNumber}</h2>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${currentWeek.isRecovery ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">{currentWeek.isRecovery ? 'Recovery' : 'Loading'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                <div className="p-6 rounded-[28px] border bg-white/5 border-white/10">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Short Goal</p>
                  <p className="text-2xl font-black text-white">{currentWeek.plannedParkrunKm}KM</p>
                </div>
                <div className="p-6 rounded-[28px] border bg-white/5 border-white/10">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Long Goal</p>
                  <p className="text-2xl font-black text-white">{currentWeek.plannedLongRunKm}KM</p>
                </div>
                <div className="p-6 rounded-[28px] border bg-white/5 border-white/10">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Objective</p>
                  <p className="text-xl font-black text-white truncate">{currentWeek.milestone || 'Steady'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'charts': return <div key={id} className={tileClass}><ArchitectControls index={index} total={layoutOrder.length} /><MetricsCharts runs={runs} weightHistory={weights} theme={theme} /></div>;
      case 'history': return <div key={id} className={tileClass}><ArchitectControls index={index} total={layoutOrder.length} /><RunHistory runs={runs} onEditRun={handleEditRun} theme={theme} /></div>;
      default: return null;
    }
  };

  const modalInputClass = theme === 'dark' 
    ? "w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500" 
    : "w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400";

  return (
    <div className={`min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-12`}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Route className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Outrun</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 mt-1">Neural Performance Tracking</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setShowSyncPanel(true)} className="p-4 rounded-[22px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <Cloud className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-4 rounded-[22px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          <button onClick={() => setIsArchitectMode(!isArchitectMode)} className={`p-4 rounded-[22px] border transition-all ${isArchitectMode ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => setShowWeightInput(true)} className="flex items-center gap-3 px-6 py-4 rounded-[22px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest text-slate-300">
            <Scale className="w-4 h-4" /> Log Weight
          </button>
          <button 
            onClick={() => {
              setEditingRunId(null);
              setManualRun({ distance: '', duration: '', date: new Date().toISOString().split('T')[0], type: 'long' });
              setShowManualRunInput(true);
            }} 
            className="flex items-center gap-3 px-8 py-4 rounded-[22px] bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Log Session
          </button>
        </div>
      </header>

      <GoalProgress goals={INITIAL_PROFILE.goals} theme={theme} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {layoutOrder.map((id, idx) => renderMainItem(id, idx))}
        </div>
        
        <div className="lg:col-span-4 space-y-12">
          <CoachingPanel insight={coachingInsight} loading={loading} theme={theme} />
          
          <div className="premium-glass rounded-[40px] p-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-indigo-400">Bio-Ingestion</h3>
            <label className="flex flex-col items-center justify-center p-12 rounded-[32px] border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group">
              <RefreshCw className={`w-10 h-10 mb-4 transition-all group-hover:scale-110 ${isUploading ? 'animate-spin text-indigo-400' : 'text-slate-600'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sync Strava Visual</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* Sync Panel Modal */}
      {showSyncPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-xl border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
             <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <Cloud className="w-8 h-8 text-indigo-500" />
                <h2 className={`text-2xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Neural Portability</h2>
              </div>
              <button onClick={() => setShowSyncPanel(false)} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-10">
              <div className="p-8 rounded-[32px] bg-indigo-500/5 border border-indigo-500/20">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Export to Phone / PC</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Generate a unique sync key to migrate your current performance logs to another device.</p>
                <button 
                  onClick={generateSyncKey} 
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                  {syncStatus === 'copied' ? <><Check className="w-4 h-4" /> Key Copied</> : <><Copy className="w-4 h-4" /> Copy Sync Key</>}
                </button>
              </div>

              <div className="p-8 rounded-[32px] bg-slate-800/20 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Import Neural Profile</h3>
                <textarea 
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  placeholder="Paste sync key here..."
                  className={`w-full h-24 bg-black/20 rounded-2xl p-4 text-[10px] font-mono text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none mb-6 resize-none ${theme === 'light' ? 'bg-slate-50' : ''}`}
                />
                <button 
                  onClick={handleImportSyncKey}
                  disabled={!importKey}
                  className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-20"
                >
                  <UploadCloud className="w-4 h-4" /> Load Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Run Modal */}
      {showManualRunInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-xl border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
            <div className="flex justify-between items-center mb-10">
              <h2 className={`text-2xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{editingRunId ? 'Edit' : 'Log'} Session</h2>
              <button onClick={() => { setShowManualRunInput(false); setEditingRunId(null); }} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} /></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Distance (KM)</label>
                  <input type="number" step="0.01" value={manualRun.distance} onChange={e => setManualRun({...manualRun, distance: e.target.value})} className={modalInputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Duration (HH:MM:SS)</label>
                  <input type="text" value={manualRun.duration} onChange={e => setManualRun({...manualRun, duration: e.target.value})} className={modalInputClass} placeholder="00:00:00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={manualRun.date} 
                      onChange={e => setManualRun({...manualRun, date: e.target.value})} 
                      className={`${modalInputClass} cursor-pointer`} 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Type</label>
                  <select value={manualRun.type} onChange={e => setManualRun({...manualRun, type: e.target.value as any})} className={`${modalInputClass} appearance-none cursor-pointer`}>
                    <option value="long">Long Run</option>
                    <option value="parkrun">Parkrun</option>
                    <option value="easy">Easy</option>
                    <option value="treadmill">Treadmill</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button onClick={handleManualRunSubmit} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl mt-6 shadow-xl shadow-indigo-500/20">
                {loading ? 'Processing...' : editingRunId ? 'Update Session' : 'Commit to Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-md border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
            <div className="flex justify-between items-center mb-10">
              <h2 className={`text-2xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Log Mass</h2>
              <button onClick={() => setShowWeightInput(false)} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} /></button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Current Bodyweight (KG)</label>
                <input type="number" step="0.1" autoFocus value={newWeight} onChange={e => setNewWeight(e.target.value)} className={`${modalInputClass} text-5xl text-center`} placeholder="00.0" />
              </div>
              <button onClick={handleWeightSubmit} className="w-full py-6 bg-rose-600 hover:bg-rose-500 transition-all text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-xl shadow-rose-500/20">
                Update Gradient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);