export interface RunData {
  id: string;
  date: string;
  distanceKm: number;
  duration: string; // "00:30:00"
  pace: string; // "6:00"
  avgHeartRate?: number;
  avgCadence?: number;
  notes?: string;
  source: 'manual' | 'upload';
  type: 'parkrun' | 'long' | 'other';
  completedGym?: boolean;
  bodyweightCount?: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string;
  phase: 1 | 2 | 3 | 4;
  plannedParkrunKm: number;
  plannedLongRunKm: number;
  isRecovery: boolean;
  milestone?: string;
}

export interface UserProfile {
  name: string;
  goals: {
    shortTerm: { name: string; date: string; distance: number };
    longTerm: { name: string; date: string; distance: number };
  };
  condition: string;
  baseline: string;
  startingWeight: number;
  targetWeight: number;
}

export interface CoachingInsight {
  summary: string;
  toneCheck: string;
  recommendation: string;
  focusArea: 'Recovery' | 'Endurance' | 'Speed' | 'Mobility';
}