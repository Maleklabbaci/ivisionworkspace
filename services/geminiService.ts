
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: L'API Key est exclusivement gérée par process.env.API_KEY
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Expert Marketing. Analyse ces KPIs iVISION et donne 3 conseils courts (max 50 mots total) : ${context}`,
    });

    return response.text?.trim() || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de l'analyse IA.";
  }
};

export const brainstormTaskIdeas = async (topic: string): Promise<string[]> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Génère 5 idées de tâches marketing pour : "${topic}". Format JSON [string, string...]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Audit de campagne", "Optimisation SEO", "Rédaction contenu"];
  }
};
