import { GoogleGenAI, Type } from "@google/genai";

export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    // Initialize inside function to avoid top-level crash if env is missing at boot
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    // Prompt optimisé pour être direct et sans formatage Markdown complexe
    const prompt = `
      Rôle : Expert Marketing Digital Senior.
      Tâche : Analyse les KPIs suivants et donne exactement 3 recommandations stratégiques courtes et actionnables.
      Contraintes :
      1. Réponds uniquement par 3 phrases simples.
      2. Une recommandation par ligne.
      3. Pas de gras (**), pas de titres, pas d'introduction ("Voici les recommandations...").
      4. Ton direct et professionnel.

      Contexte : ${context}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "Impossible de générer des insights pour le moment.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Le service d'IA est temporairement indisponible.";
  }
};

export const brainstormTaskIdeas = async (topic: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    const prompt = `Génère 5 idées de tâches concrètes et professionnelles pour une campagne marketing sur le sujet : "${topic}".`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Force la structure de réponse à être un tableau de chaînes de caractères
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
    
    // Le parsing est maintenant beaucoup plus sûr grâce au Schema
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Erreur Gemini Brainstorm:", error);
    return ["Analyse de la concurrence", "Définition des personas", "Rédaction du calendrier éditorial", "Création des visuels", "Configuration des campagnes Ads"]; // Fallback data
  }
};