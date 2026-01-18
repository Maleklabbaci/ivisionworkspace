import { GoogleGenAI, Type } from "@google/genai";

/**
 * Génère une analyse stratégique iVISION basée sur le contexte marketing fourni.
 */
export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    // Initialise le client Google GenAI right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Utilisation directe de ai.models.generateContent avec le nom de modèle complet recommandé.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es l'analyste stratégique iVISION. Analyse ces données et donne un conseil direct, sans bla-bla, max 30 mots : ${context}`,
    });

    // Extraction directe de la propriété .text du résultat.
    return response.text?.trim() || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Intelligence iV momentanément hors ligne.";
  }
};

/**
 * Extrait les données structurées d'un prospect à partir d'un texte brut en utilisant un schéma JSON.
 */
export const parseLeadFromText = async (text: string): Promise<any> => {
  try {
    // Initialise le client Google GenAI right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Utilisation de responseMimeType et responseSchema pour forcer une sortie JSON valide.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extrais les données de prospect du texte suivant : "${text}"`,
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

    // Avec responseMimeType: "application/json", response.text contient directement le JSON.
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};