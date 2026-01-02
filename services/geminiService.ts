
import { GoogleGenAI, Type } from "@google/genai";

export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    // Note: The system automatically injects the key into process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-3-flash-preview for speed and efficiency on brief recommendations
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Rôle : Expert Marketing Digital Senior & Analyste d'Agence.
      Tâche : Analyse les KPIs de l'agence et propose exactement 3 actions stratégiques.
      
      Contraintes de formatage :
      - 3 lignes maximum.
      - Pas de Markdown (** ou #).
      - Pas de salutations.
      - Utilise des verbes d'action.

      Données actuelles : ${context}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "Aucune recommandation disponible.";
  } catch (error) {
    console.error("Erreur Gemini Insight:", error);
    return "Analyse indisponible pour le moment.";
  }
};

export const brainstormTaskIdeas = async (topic: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `Génère 5 idées de tâches marketing concrètes pour le sujet suivant : "${topic}". Format JSON uniquement.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Erreur Gemini Brainstorm:", error);
    return ["Audit SEO", "Rédaction Newsletter", "Planification Ads"];
  }
};
