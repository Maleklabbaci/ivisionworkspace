
import { GoogleGenAI, Type } from "@google/genai";

// Fonction pour récupérer la meilleure clé disponible
const getAIClient = () => {
  const customKey = localStorage.getItem('ivision_custom_gemini_key');
  const apiKey = customKey || process.env.API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
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
    return "Erreur lors de l'analyse IA. Vérifiez la clé API dans les paramètres.";
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
