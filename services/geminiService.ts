import { GoogleGenAI, Type } from "@google/genai";
import { RunData, UserProfile, CoachingInsight } from "../types";

const cleanJson = (text: string) => {
  // Finds the first '{' and last '}' to strip markdown or conversational filler
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return text.substring(jsonStart, jsonEnd + 1);
  }
  return text;
};

export const analyzeRunScreenshot = async (base64Image: string): Promise<Partial<RunData>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          {
            text: `Act as an elite OCR engine for Strava screenshots. Extract the running data precisely.
            
            Context:
            - Strava often shows "Distance" in large text.
            - "Moving Time" or "Time" is the duration.
            - "Avg Pace" or "Pace" is min/km or min/mi.
            - If units are in miles (mi), convert them to kilometers (km) (1 mi = 1.60934 km).
            
            Required JSON Schema:
            {
              "distanceKm": number,
              "duration": "HH:MM:SS",
              "pace": "MM:SS",
              "avgHeartRate": number,
              "avgCadence": number,
              "date": "YYYY-MM-DD"
            }

            If a piece of data is missing, omit the field. Return ONLY the JSON object.`
          }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Neural Engine.");
    
    const cleanedText = cleanJson(text);
    return JSON.parse(cleanedText);

  } catch (error: any) {
    console.error("OCR Analysis failed:", error);
    if (error?.status === 403 || error?.message?.includes('permission')) {
      throw new Error("PERMISSION_DENIED: Ensure model name is 'gemini-3-flash-preview' and API key is valid.");
    }
    throw new Error(error.message || "Neural Engine failed to parse image.");
  }
};

export const getCoachingAdvice = async (
  recentRun: RunData, 
  history: RunData[], 
  profile: UserProfile
): Promise<CoachingInsight> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Coach Persona: Expert in Adaptive Running & Cerebral Palsy.
      User Profile: ${profile.condition}, Goals: ${profile.goals.longTerm.name}.
      
      Analyze the latest Strava entry:
      Distance: ${recentRun.distanceKm}km, Pace: ${recentRun.pace}, Cadence: ${recentRun.avgCadence || 'N/A'}.

      Consider CP-specific factors: Spasticity, muscle fatigue, and the goal of ${profile.goals.longTerm.name} on ${profile.goals.longTerm.date}.

      Response Schema:
      {
        "summary": "Short 1-sentence impact of this run.",
        "toneCheck": "Specific advice for stiffness/spasticity today.",
        "recommendation": "Next session type (Rest, Active Recovery, Threshold).",
        "focusArea": "One of: Recovery, Endurance, Speed, Mobility"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No coaching text returned.");
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Coaching advice failed:", error);
    return {
      summary: "Run logged successfully.",
      toneCheck: "Neural link offline. Monitor your physical stiffness manually today.",
      recommendation: "Standard recovery protocol.",
      focusArea: "Recovery"
    };
  }
};