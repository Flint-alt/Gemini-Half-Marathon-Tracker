import { TrainingWeek } from '../types';

export const TRAINING_PLAN: TrainingWeek[] = [
  // Phase 1: Jan - Mar (Build to 10k)
  { weekNumber: 1, startDate: '2026-01-05', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 7, isRecovery: false },
  { weekNumber: 2, startDate: '2026-01-12', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 7.5, isRecovery: false },
  { weekNumber: 3, startDate: '2026-01-19', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 8, isRecovery: false },
  { weekNumber: 4, startDate: '2026-01-26', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 6, isRecovery: true },
  { weekNumber: 5, startDate: '2026-02-02', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 8.5, isRecovery: false },
  { weekNumber: 6, startDate: '2026-02-09', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 9, isRecovery: false },
  { weekNumber: 7, startDate: '2026-02-16', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 9.5, isRecovery: false },
  { weekNumber: 8, startDate: '2026-02-23', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 7, isRecovery: true },
  { weekNumber: 9, startDate: '2026-03-02', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 10, isRecovery: false, milestone: 'First 10k!' },
  { weekNumber: 10, startDate: '2026-03-09', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 10, isRecovery: false },
  { weekNumber: 11, startDate: '2026-03-16', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 10, isRecovery: false },
  { weekNumber: 12, startDate: '2026-03-23', phase: 1, plannedParkrunKm: 5, plannedLongRunKm: 8, isRecovery: true },

  // Phase 2: Apr - Jun (Extend to 15k)
  { weekNumber: 13, startDate: '2026-03-30', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 11, isRecovery: false },
  { weekNumber: 14, startDate: '2026-04-06', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 11.5, isRecovery: false },
  { weekNumber: 15, startDate: '2026-04-13', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 12, isRecovery: false },
  { weekNumber: 16, startDate: '2026-04-20', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 9, isRecovery: true },
  { weekNumber: 17, startDate: '2026-04-27', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 12.5, isRecovery: false },
  { weekNumber: 18, startDate: '2026-05-04', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 13, isRecovery: false },
  { weekNumber: 19, startDate: '2026-05-11', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 13.5, isRecovery: false },
  { weekNumber: 20, startDate: '2026-05-18', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 10, isRecovery: true },
  { weekNumber: 21, startDate: '2026-05-25', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 14, isRecovery: false },
  { weekNumber: 22, startDate: '2026-06-01', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 14.5, isRecovery: false },
  { weekNumber: 23, startDate: '2026-06-08', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 15, isRecovery: false, milestone: 'First 15k!' },
  { weekNumber: 24, startDate: '2026-06-15', phase: 2, plannedParkrunKm: 5, plannedLongRunKm: 11, isRecovery: true },

  // Phase 3: Jul - Sep (Build to 20k)
  { weekNumber: 25, startDate: '2026-06-22', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 15.5, isRecovery: false },
  { weekNumber: 26, startDate: '2026-06-29', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 16, isRecovery: false },
  { weekNumber: 27, startDate: '2026-07-06', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 16.5, isRecovery: false },
  { weekNumber: 28, startDate: '2026-07-13', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 12, isRecovery: true },
  { weekNumber: 29, startDate: '2026-07-20', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 17, isRecovery: false },
  { weekNumber: 30, startDate: '2026-07-27', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 17.5, isRecovery: false },
  { weekNumber: 31, startDate: '2026-08-03', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 18, isRecovery: false },
  { weekNumber: 32, startDate: '2026-08-10', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 13, isRecovery: true },
  { weekNumber: 33, startDate: '2026-08-17', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 18.5, isRecovery: false },
  { weekNumber: 34, startDate: '2026-08-24', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 19, isRecovery: false },
  { weekNumber: 35, startDate: '2026-08-31', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 20, isRecovery: false, milestone: 'Longest Run!' },
  { weekNumber: 36, startDate: '2026-09-07', phase: 3, plannedParkrunKm: 5, plannedLongRunKm: 14, isRecovery: true },

  // Phase 4: Oct - Nov (Race Prep)
  { weekNumber: 37, startDate: '2026-09-14', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 18, isRecovery: false },
  { weekNumber: 38, startDate: '2026-09-21', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 19, isRecovery: false },
  { weekNumber: 39, startDate: '2026-09-28', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 15, isRecovery: true },
  { weekNumber: 40, startDate: '2026-10-05', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 18, isRecovery: false },
  { weekNumber: 41, startDate: '2026-10-12', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 16, isRecovery: false },
  { weekNumber: 42, startDate: '2026-10-19', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 13, isRecovery: false },
  { weekNumber: 43, startDate: '2026-10-26', phase: 4, plannedParkrunKm: 5, plannedLongRunKm: 10, isRecovery: false },
  { weekNumber: 44, startDate: '2026-11-02', phase: 4, plannedParkrunKm: 3, plannedLongRunKm: 21.1, isRecovery: false, milestone: 'Half Marathon!' },
];