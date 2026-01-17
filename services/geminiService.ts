
import { GoogleGenAI, Type } from "@google/genai";

// Utilisation exclusive de process.env.API_KEY pour la sécurité.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

/**
 * Nettoie la sortie de l'IA pour ne garder que le JSON pur.
 */
const sanitizeJson = (text: string): string => {
  try {
    // Cherche un bloc JSON si l'IA a mis du markdown
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : text.trim();
  } catch (e) {
    return text.trim();
  }
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

export const parseLeadFromText = async (text: string): Promise<any> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Tu es un assistant iVISION spécialisé en extraction de données. 
      Extrais les infos suivantes du texte : "${text}"
      Renvoie UNIQUEMENT un objet JSON avec les clés : name, company, email, phone, valueMin (nombre), valueMax (nombre), description.
      Si un budget est "50k", écris 50000.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            company: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            valueMin: { type: Type.NUMBER },
            valueMax: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["name"]
        }
      }
    });

    const cleanText = sanitizeJson(response.text || "{}");
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};
