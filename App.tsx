
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { RunData, WeightEntry, UserProfile, CoachingInsight } from './types';
import { TRAINING_PLAN } from './data/trainingPlan';
import { analyzeRunScreenshot, getCoachingAdvice } from './services/geminiService';
import { auth, googleProvider, subscribeToNeuralCloud, syncUserData } from './services/firebaseService';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { RunHistory } from './components/RunHistory';
import { MetricsCharts } from './components/MetricsCharts';
import { CoachingPanel } from './components/CoachingPanel';
import { GoalProgress } from './components/GoalProgress';
import { PersonalRecords } from './components/PersonalRecords';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  Upload, Scale, X, Plus, ShieldCheck,
  LayoutGrid, ChevronUp, ChevronDown,
  Sun, Moon, Route, Timer, Cloud, Copy, Download, UploadCloud, RefreshCw, Check, QrCode, Wifi, WifiOff, LogIn, LogOut, User, Calendar, Terminal, Heart
} from 'lucide-react';
import {
  validateDistance,
  validateDuration,
  validateHeartRate,
  validateWeight,
  validateDate,
  calculatePaceSafe
} from './utils/validation';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'copied' | 'error' | 'synced' | 'connecting' | 'teleported'>('idle');
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [teleportCode, setTeleportCode] = useState('');

  // Self-healing layout logic
  const [layoutOrder, setLayoutOrder] = useState<string[]>(() => {
    const defaultOrder = ['strategy', 'records', 'charts', 'history'];
    const saved = localStorage.getItem('neurostride_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.includes('records')) {
          const strategyIdx = parsed.indexOf('strategy');
          parsed.splice(strategyIdx !== -1 ? strategyIdx + 1 : 0, 0, 'records');
        }
        return parsed;
      } catch (e) {
        return defaultOrder;
      }
    }
    return defaultOrder;
  });

  const [newWeight, setNewWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualRun, setManualRun] = useState({
    distance: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    type: 'long' as 'parkrun' | 'long' | 'easy' | 'treadmill' | 'other',
    avgHeartRate: ''
  });
  const [validationError, setValidationError] = useState<string>('');

  const currentWeek = TRAINING_PLAN.find(week => {
    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const now = new Date();
    return now >= weekStart && now < weekEnd;
  }) || TRAINING_PLAN[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get('sync');
    if (syncData) {
      handleTeleport(syncData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (auth && auth.onAuthStateChanged) {
      return onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) setSyncStatus('synced');
      });
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToNeuralCloud(currentUser.uid, (cloudData) => {
      if (cloudData.runs) setRuns(cloudData.runs);
      if (cloudData.weights) setWeights(cloudData.weights);
      if (cloudData.layoutOrder) setLayoutOrder(cloudData.layoutOrder);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('neurostride_runs', JSON.stringify(runs));
    localStorage.setItem('neurostride_weights', JSON.stringify(weights));
    localStorage.setItem('neurostride_layout', JSON.stringify(layoutOrder));
    if (currentUser) {
      syncUserData(currentUser.uid, { runs, weights, layoutOrder });
    }
  }, [runs, weights, layoutOrder, currentUser]);

  useEffect(() => {
    localStorage.setItem('neurostride_theme', theme);
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [theme]);

  const handleTeleport = (payload: string) => {
    try {
      const actualCode = payload.includes('?sync=') ? payload.split('?sync=')[1] : payload;
      const decoded = JSON.parse(decodeURIComponent(atob(actualCode)));
      
      if (decoded.runs) setRuns(decoded.runs);
      if (decoded.weights) setWeights(decoded.weights);
      if (decoded.theme) setTheme(decoded.theme);
      if (decoded.layoutOrder) setLayoutOrder(decoded.layoutOrder);
      
      setSyncStatus('teleported');
      setTeleportCode('');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      console.error("Teleport Failed", e);
      setSyncStatus('error');
    }
  };

  const handleLogin = async () => {
    if (!googleProvider) {
      alert("Cloud Sync is in simulation mode because Firebase keys are missing.");
      return;
    }
    setSyncStatus('connecting');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleLogout = () => {
    if (signOut) signOut(auth);
    else setCurrentUser(null);
  };

  const getSyncPayload = useCallback(() => {
    const data = { runs, weights, theme, layoutOrder };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }, [runs, weights, theme, layoutOrder]);

  const copySyncLink = () => {
    const payload = getSyncPayload();
    const link = `${window.location.origin}${window.location.pathname}?sync=${payload}`;
    navigator.clipboard.writeText(link);
    setSyncStatus('copied');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleEditRun = (run: RunData) => {
    setEditingRunId(run.id);
    setManualRun({
      distance: run.distanceKm.toString(),
      duration: run.duration,
      date: run.date,
      type: run.type,
      avgHeartRate: run.avgHeartRate?.toString() || ''
    });
    setShowManualRunInput(true);
  };

  const handleManualRunSubmit = async () => {
    // Clear previous errors
    setValidationError('');

    // Validate all inputs
    const distanceValidation = validateDistance(manualRun.distance);
    if (!distanceValidation.isValid) {
      setValidationError(distanceValidation.error || 'Invalid distance');
      return;
    }

    const durationValidation = validateDuration(manualRun.duration);
    if (!durationValidation.isValid) {
      setValidationError(durationValidation.error || 'Invalid duration');
      return;
    }

    const heartRateValidation = validateHeartRate(manualRun.avgHeartRate);
    if (!heartRateValidation.isValid) {
      setValidationError(heartRateValidation.error || 'Invalid heart rate');
      return;
    }

    const dateValidation = validateDate(manualRun.date);
    if (!dateValidation.isValid) {
      setValidationError(dateValidation.error || 'Invalid date');
      return;
    }

    setLoading(true);

    const dist = distanceValidation.value!;
    const { pace, error: paceError } = calculatePaceSafe(dist, manualRun.duration);

    if (paceError) {
      setValidationError(paceError);
      setLoading(false);
      return;
    }

    const newRunData = {
      distanceKm: dist,
      duration: manualRun.duration,
      pace,
      date: manualRun.date,
      type: manualRun.type,
      avgHeartRate: heartRateValidation.value
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
    setManualRun({ distance: '', duration: '', date: new Date().toISOString().split('T')[0], type: 'long', avgHeartRate: '' });

    try {
      const insight = await getCoachingAdvice(updatedRuns[0], updatedRuns, INITIAL_PROFILE);
      setCoachingInsight(insight);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = () => {
    // Clear previous errors
    setValidationError('');

    // Validate weight input
    const weightValidation = validateWeight(newWeight);
    if (!weightValidation.isValid) {
      setValidationError(weightValidation.error || 'Invalid weight');
      return;
    }

    // Validate date
    const dateValidation = validateDate(weightDate);
    if (!dateValidation.isValid) {
      setValidationError(dateValidation.error || 'Invalid date');
      return;
    }

    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: weightDate,
      weightKg: weightValidation.value!
    };
    const updatedWeights = [entry, ...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWeights(updatedWeights);
    setNewWeight('');
    setWeightDate(new Date().toISOString().split('T')[0]);
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

        // Validate extracted data
        const distanceKm = extracted.distanceKm || 0;
        const duration = extracted.duration || "00:00:00";

        // Basic validation - ensure we have reasonable data
        if (distanceKm <= 0 || distanceKm > 200) {
          throw new Error('Extracted distance is invalid. Please enter run data manually.');
        }

        // Validate duration format
        const durationValidation = validateDuration(duration);
        if (!durationValidation.isValid) {
          throw new Error('Extracted duration is invalid. Please enter run data manually.');
        }

        // Calculate pace safely
        const { pace, error: paceError } = calculatePaceSafe(distanceKm, duration);
        if (paceError) {
          throw new Error('Could not calculate pace. Please enter run data manually.');
        }

        // Validate heart rate if present
        if (extracted.avgHeartRate) {
          const hrValidation = validateHeartRate(extracted.avgHeartRate.toString());
          if (!hrValidation.isValid) {
            // Don't fail, just omit invalid heart rate
            extracted.avgHeartRate = undefined;
          }
        }

        const newRun: RunData = {
          id: Date.now().toString(),
          date: extracted.date || new Date().toISOString().split('T')[0],
          distanceKm,
          duration,
          pace,
          avgHeartRate: extracted.avgHeartRate,
          source: 'upload',
          type: distanceKm < 6 ? 'parkrun' : 'long'
        };
        const updatedRuns = [newRun, ...runs];
        setRuns(updatedRuns);
        const insight = await getCoachingAdvice(newRun, updatedRuns, INITIAL_PROFILE);
        setCoachingInsight(insight);
      } catch (err) {
        console.error(err);
        setValidationError(err instanceof Error ? err.message : 'Failed to extract run data from image');
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
        <button disabled={index === 0} onClick={() => moveItem(index, 'up')} className="p-2 bg-indigo-500 text-white rounded-lg"><ChevronUp className="w-4 h-4" /></button>
        <button disabled={index === total - 1} onClick={() => moveItem(index, 'down')} className="p-2 bg-indigo-500 text-white rounded-lg"><ChevronDown className="w-4 h-4" /></button>
      </div>
    );
  };

  const renderMainItem = (id: string, index: number) => {
    const tileClass = `relative ${isArchitectMode ? 'ring-2 ring-indigo-500/40 ring-offset-4 rounded-[42px]' : ''}`;
    const valueTextColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
    const labelTextColor = 'text-slate-500';

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
                <div className={`p-6 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/40 border-slate-200'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 ${labelTextColor}`}>Short Goal</p>
                  <p className={`text-2xl font-black ${valueTextColor}`}>{currentWeek.plannedParkrunKm}KM</p>
                </div>
                <div className={`p-6 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/40 border-slate-200'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 ${labelTextColor}`}>Long Goal</p>
                  <p className={`text-2xl font-black ${valueTextColor}`}>{currentWeek.plannedLongRunKm}KM</p>
                </div>
                <div className={`p-6 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/40 border-slate-200'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 ${labelTextColor}`}>Objective</p>
                  <p className={`text-xl font-black truncate ${valueTextColor}`}>{currentWeek.milestone || 'Steady'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'records':
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={layoutOrder.length} />
            <PersonalRecords runs={runs} theme={theme} />
          </div>
        );
      case 'charts': 
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={layoutOrder.length} />
            <MetricsCharts runs={runs} weightHistory={weights} theme={theme} />
          </div>
        );
      case 'history': 
        return (
          <div key={id} className={tileClass}>
            <ArchitectControls index={index} total={layoutOrder.length} />
            <RunHistory runs={runs} onEditRun={handleEditRun} theme={theme} />
          </div>
        );
      default: return null;
    }
  };

  const modalInputClass = theme === 'dark' 
    ? "w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500" 
    : "w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400";

  const modalHeaderClass = `text-3xl font-black tracking-tighter uppercase mb-2 text-center drop-shadow-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`;

  return (
    <div className={`min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-12`}>
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12 lg:mb-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-[18px] lg:rounded-[22px] bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <Route className="text-white w-7 h-7 lg:w-8 lg:h-8" />
          </div>
          <div>
            <h1 className={`text-4xl lg:text-5xl font-black tracking-tighter uppercase italic leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Outrun</h1>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:auto">
          {/* Controls Bar */}
          <div className={`flex items-center gap-3 p-2 rounded-[28px] border justify-between sm:justify-start ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button onClick={() => setShowSyncPanel(true)} className={`p-4 rounded-[20px] transition-all group flex items-center gap-2 relative ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-50'}`}>
              <Wifi className={`w-6 h-6 transition-transform ${currentUser ? 'text-emerald-400' : 'text-indigo-400 group-hover:scale-110'}`} />
            </button>
            <div className={`w-px h-8 mx-1 hidden sm:block ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-4 rounded-[20px] transition-all ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-50'}`}>
              {theme === 'dark' ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-600" />}
            </button>
            <button onClick={() => setIsArchitectMode(!isArchitectMode)} className={`p-4 rounded-[20px] transition-all ${isArchitectMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-white/10'}`}>
              <LayoutGrid className="w-6 h-6" />
            </button>
          </div>

          {/* HIGH VISIBILITY ACTION BUTTONS */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setShowWeightInput(true); setValidationError(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-4 px-10 py-5 rounded-[28px] font-black uppercase text-[12px] tracking-[0.2em] transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-xl ${
                theme === 'dark'
                  ? 'bg-rose-500/10 text-rose-400 border-2 border-rose-500/30 hover:bg-rose-500/20 shadow-rose-900/10'
                  : 'bg-white text-rose-600 border-2 border-rose-500/20 hover:border-rose-500/40 shadow-rose-200/50'
              }`}
            >
              <Scale className="w-5 h-5" />
              <span>Weight Tracker</span>
            </button>

            <button
              onClick={() => { setShowManualRunInput(true); setValidationError(''); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-4 px-12 py-5 rounded-[28px] bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 transform hover:scale-[1.03] active:scale-95 text-white font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/20"
            >
              <Plus className="w-6 h-6" />
              <span>Running Logs</span>
            </button>
          </div>
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Sync Strava Visual</p>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      {showSyncPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-xl border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
             <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <Cloud className="w-8 h-8 text-indigo-500" />
                <h2 className="text-2xl font-black tracking-tighter uppercase text-white">Neural Cloud</h2>
              </div>
              <button onClick={() => setShowSyncPanel(false)} className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
              {!currentUser ? (
                <div className="p-10 rounded-[40px] bg-indigo-600 text-center text-white">
                  <User className="w-12 h-12 mx-auto mb-6 opacity-40" />
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Initialize Cloud Sync</h3>
                  <button onClick={handleLogin} className="w-full py-5 bg-white text-indigo-600 rounded-[22px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all">
                    <LogIn className="w-4 h-4" /> {syncStatus === 'connecting' ? 'Connecting...' : 'Sign in with Google'}
                  </button>
                </div>
              ) : (
                <div className="p-8 rounded-[40px] bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-4 mb-8">
                    <img src={currentUser.photoURL} className="w-12 h-12 rounded-full border-2 border-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Live Link Active</p>
                      <p className={`text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentUser.displayName}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 border border-white/5 flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Disconnect
                  </button>
                </div>
              )}

              <div className={`p-8 rounded-[32px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <Terminal className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teleport Protocol</h4>
                </div>
                <textarea 
                  value={teleportCode}
                  onChange={(e) => setTeleportCode(e.target.value)}
                  placeholder="Paste sync code or full teleport link here..."
                  className={`w-full h-24 p-4 rounded-2xl text-[10px] font-mono border resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 ${theme === 'dark' ? 'bg-slate-950/50 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-800'}`}
                />
                <button 
                  onClick={() => handleTeleport(teleportCode)}
                  disabled={!teleportCode}
                  className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 transition-all text-white font-black uppercase text-[9px] tracking-[0.2em] rounded-2xl"
                >
                  {syncStatus === 'teleported' ? 'Handshake Successful' : 'Initiate Handshake'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-slate-800/20 border border-white/5 text-center">
                   <QrCode className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Device Outbound</h4>
                   <button onClick={copySyncLink} className="text-indigo-400 font-black uppercase text-[9px] tracking-widest hover:underline">
                    {syncStatus === 'copied' ? 'Link Copied!' : 'Copy Teleport Link'}
                   </button>
                </div>
                <div className="p-8 rounded-[32px] bg-slate-800/20 border border-white/5 text-center">
                   <ShieldCheck className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Neural Guard</h4>
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Data Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualRunInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-xl border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
            <div className="flex justify-between items-center mb-10">
              <div className="flex-1">
                <h2 className={modalHeaderClass}>{editingRunId ? 'Edit' : 'Log'} Session</h2>
                <div className="w-12 h-1 bg-indigo-500 mx-auto rounded-full"></div>
              </div>
              <button onClick={() => { setShowManualRunInput(false); setEditingRunId(null); setValidationError(''); }} className={`p-3 rounded-2xl absolute top-8 right-8 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Distance (KM)</label>
                  <input type="number" step="0.01" value={manualRun.distance} onChange={e => setManualRun({...manualRun, distance: e.target.value})} className={modalInputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Duration (HH:MM:SS)</label>
                  <input type="text" value={manualRun.duration} onChange={e => setManualRun({...manualRun, duration: e.target.value})} className={modalInputClass} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Avg Heart Rate (BPM)</label>
                  <div className="relative">
                    <input type="number" value={manualRun.avgHeartRate} onChange={e => setManualRun({...manualRun, avgHeartRate: e.target.value})} className={`${modalInputClass} pr-14`} placeholder="Optional" />
                    <Heart className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Date</label>
                  <input type="date" value={manualRun.date} onChange={e => setManualRun({...manualRun, date: e.target.value})} className={modalInputClass} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Session Profile</label>
                <select value={manualRun.type} onChange={e => setManualRun({...manualRun, type: e.target.value as any})} className={modalInputClass}>
                  <option value="long">Long Run</option>
                  <option value="parkrun">Parkrun</option>
                  <option value="easy">Easy</option>
                  <option value="treadmill">Treadmill</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-rose-500 text-sm font-bold text-center">{validationError}</p>
                </div>
              )}

              <button onClick={handleManualRunSubmit} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl mt-6 shadow-xl shadow-indigo-500/20">
                {loading ? 'Processing...' : editingRunId ? 'Update Session' : 'Commit to Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeightInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80">
          <div className={`premium-glass rounded-[48px] p-10 w-full max-w-xl border shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'border-white/10' : 'border-white/40'}`}>
            <div className="flex justify-between items-center mb-10">
              <div className="flex-1">
                <h2 className={modalHeaderClass}>Log Mass</h2>
                <div className="w-12 h-1 bg-rose-500 mx-auto rounded-full"></div>
              </div>
              <button onClick={() => { setShowWeightInput(false); setValidationError(''); }} className={`p-3 rounded-2xl absolute top-8 right-8 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Bodyweight (KG)</label>
                  <input type="number" step="0.1" autoFocus value={newWeight} onChange={e => setNewWeight(e.target.value)} className={`${modalInputClass} text-5xl text-center h-32`} placeholder="00.0" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Log Date</label>
                  <input type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} className={`${modalInputClass} h-32 flex items-center justify-center text-center cursor-pointer`} />
                </div>
              </div>
              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-rose-500 text-sm font-bold text-center">{validationError}</p>
                </div>
              )}

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
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
