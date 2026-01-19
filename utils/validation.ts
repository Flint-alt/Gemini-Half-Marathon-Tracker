/**
 * Validation utilities for user inputs
 * Prevents NaN, Infinity, and invalid data from crashing the app
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  value?: any;
}

/**
 * Validates distance input (in kilometers)
 */
export const validateDistance = (input: string): ValidationResult => {
  const value = parseFloat(input);

  if (isNaN(value)) {
    return { isValid: false, error: 'Distance must be a valid number' };
  }

  if (value <= 0) {
    return { isValid: false, error: 'Distance must be greater than 0' };
  }

  if (value > 200) {
    return { isValid: false, error: 'Distance seems unreasonably high (max 200km)' };
  }

  return { isValid: true, value };
};

/**
 * Validates duration input (HH:MM:SS, MM:SS, or SS format)
 */
export const validateDuration = (input: string): ValidationResult => {
  if (!input || input.trim() === '') {
    return { isValid: false, error: 'Duration is required' };
  }

  const parts = input.split(':').map(p => p.trim());

  // Validate format
  if (parts.length < 1 || parts.length > 3) {
    return { isValid: false, error: 'Duration format must be HH:MM:SS, MM:SS, or SS' };
  }

  // Check each part is a valid number
  const numbers = parts.map(p => parseInt(p, 10));
  if (numbers.some(n => isNaN(n) || n < 0)) {
    return { isValid: false, error: 'Duration must contain valid numbers' };
  }

  // Validate ranges
  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = numbers;
    if (minutes >= 60 || seconds >= 60) {
      return { isValid: false, error: 'Minutes and seconds must be less than 60' };
    }
    if (hours > 24) {
      return { isValid: false, error: 'Duration too long (max 24 hours)' };
    }
  } else if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = numbers;
    if (seconds >= 60) {
      return { isValid: false, error: 'Seconds must be less than 60' };
    }
    if (minutes > 1440) {
      return { isValid: false, error: 'Duration too long (max 24 hours)' };
    }
  } else {
    // SS only
    if (numbers[0] > 86400) {
      return { isValid: false, error: 'Duration too long (max 24 hours)' };
    }
  }

  // Calculate total seconds
  let totalSeconds = 0;
  if (parts.length === 3) {
    totalSeconds = numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  } else if (parts.length === 2) {
    totalSeconds = numbers[0] * 60 + numbers[1];
  } else {
    totalSeconds = numbers[0];
  }

  if (totalSeconds === 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }

  return { isValid: true, value: input };
};

/**
 * Validates heart rate (in BPM)
 */
export const validateHeartRate = (input: string): ValidationResult => {
  // Heart rate is optional
  if (!input || input.trim() === '') {
    return { isValid: true, value: undefined };
  }

  const value = parseInt(input, 10);

  if (isNaN(value)) {
    return { isValid: false, error: 'Heart rate must be a valid number' };
  }

  if (value < 40) {
    return { isValid: false, error: 'Heart rate too low (min 40 BPM)' };
  }

  if (value > 220) {
    return { isValid: false, error: 'Heart rate too high (max 220 BPM)' };
  }

  return { isValid: true, value };
};

/**
 * Validates body weight (in kg)
 */
export const validateWeight = (input: string): ValidationResult => {
  const value = parseFloat(input);

  if (isNaN(value)) {
    return { isValid: false, error: 'Weight must be a valid number' };
  }

  if (value <= 0) {
    return { isValid: false, error: 'Weight must be greater than 0' };
  }

  if (value < 30) {
    return { isValid: false, error: 'Weight seems too low (min 30kg)' };
  }

  if (value > 300) {
    return { isValid: false, error: 'Weight seems too high (max 300kg)' };
  }

  return { isValid: true, value };
};

/**
 * Validates date input
 */
export const validateDate = (input: string): ValidationResult => {
  if (!input || input.trim() === '') {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(input);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  // Check if date is too far in the future (more than 1 day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date > tomorrow) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }

  // Check if date is too old (more than 5 years)
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  if (date < fiveYearsAgo) {
    return { isValid: false, error: 'Date too old (max 5 years ago)' };
  }

  return { isValid: true, value: input };
};

/**
 * Calculates pace safely with validation
 * Returns pace in MM:SS format or error message
 */
export const calculatePaceSafe = (distanceKm: number, duration: string): { pace: string; error?: string } => {
  // Validate distance
  if (distanceKm <= 0 || isNaN(distanceKm)) {
    return { pace: '0:00', error: 'Invalid distance' };
  }

  // Parse duration
  const parts = duration.split(':').map(Number);
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    totalSeconds = parts[0] || 0;
  }

  if (totalSeconds === 0 || isNaN(totalSeconds)) {
    return { pace: '0:00', error: 'Invalid duration' };
  }

  const paceSeconds = totalSeconds / distanceKm;

  if (!isFinite(paceSeconds)) {
    return { pace: '0:00', error: 'Cannot calculate pace' };
  }

  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);

  return { pace: `${minutes}:${seconds.toString().padStart(2, '0')}` };
};
