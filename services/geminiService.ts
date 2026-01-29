
import { GoogleGenAI } from "@google/genai";

/**
 * Génère des insights stratégiques à partir du contexte marketing fourni
 * en utilisant le modèle Gemini 3 Flash.
 */
export const generateMarketingInsight = async (context: string): Promise<string> => {
  // Always use { apiKey: process.env.API_KEY } for initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Simplified contents to a direct string as per coding guidelines for simple text tasks.
      contents: `En tant qu'expert en stratégie marketing chez iVISION, analyse les données suivantes et fournis un insight court, stratégique et percutant pour le dashboard : ${context}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // Access .text property directly, not as a method.
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Échec de l'analyse automatique.";
  }
};
