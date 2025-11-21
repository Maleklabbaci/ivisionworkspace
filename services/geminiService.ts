import { GoogleGenAI } from "@google/genai";

export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    // Initialize inside function to avoid top-level crash if env is missing at boot
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Tu es un expert en marketing digital senior. 
      Analyse le contexte suivant et donne 3 recommandations stratégiques courtes et percutantes (bullet points).
      Contexte : ${context}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Impossible de générer des insights pour le moment.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Le service d'IA est temporairement indisponible. Veuillez vérifier votre clé API.";
  }
};

export const brainstormTaskIdeas = async (topic: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Génère 5 idées de tâches concrètes pour une campagne marketing sur le sujet : "${topic}".
      Retourne uniquement un tableau JSON de chaînes de caractères.
      Exemple: ["Créer visuel Instagram", "Rédiger article de blog"]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Erreur Gemini Brainstorm:", error);
    return [];
  }
};