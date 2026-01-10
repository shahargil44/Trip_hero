import { GoogleGenAI } from "@google/genai";
import { TripDay } from '../types';

const getClient = () => {
    // Ensure process.env exists before accessing it to avoid crashes in some environments
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    
    if (!apiKey) {
        console.warn("API Key is missing in process.env.API_KEY. AI features will not work.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const generateConciergeResponse = async (
    userPrompt: string, 
    chatHistory: { role: string, text: string }[],
    currentTripContext?: TripDay
): Promise<string> => {
    const client = getClient();
    if (!client) return "שגיאה: חסר מפתח API. אנא ודא שהגדרת את המפתח כראוי.";

    const systemInstruction = `
        You are a smart, helpful, and friendly Swiss Travel Concierge for a family trip (July 1-8, 2025).
        Family Composition: 2 Adults, 1 Teen (16), 1 Child (11).
        
        Key Logistics:
        - Adults: Swiss Half Fare Card.
        - Teen (16): Adult ticket + Half Fare Card.
        - Child (11): Family Card (Free travel).
        
        Tone: Professional yet warm, concise, Hebrew speaker.
        
        Instructions:
        1. Answer in Hebrew.
        2. Keep answers short and practical for mobile reading.
        3. If specific trip context is provided (a specific day), tailor advice to that location and schedule.
        4. If asked about prices, estimate in CHF.
    `;

    try {
        let fullPrompt = userPrompt;
        
        if (currentTripContext) {
            fullPrompt = `
            Context: Analyzing Day ${currentTripContext.id} - ${currentTripContext.title}.
            Location: ${currentTripContext.lodging}.
            Weather: ${currentTripContext.weather}.
            Activities: ${currentTripContext.activities.map(a => a.name).join(', ')}.
            
            User Question: ${userPrompt}`;
        }

        const model = 'gemini-3-flash-preview';
        
        const response = await client.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "לא הצלחתי לייצר תשובה כרגע.";
    } catch (error) {
        console.error("Gemini API Error Details:", error);
        return "מצטער, נתקלתי בבעיה בתקשורת עם השרת (ראה לוג).";
    }
};