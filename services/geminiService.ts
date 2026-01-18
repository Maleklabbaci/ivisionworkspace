
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Initialise le client Google GenAI.
 * La clé API est récupérée exclusivement depuis process.env.API_KEY.
 * Pour le développeur : il suffit de s'assurer que process.env.API_KEY est défini globalement.
 */
const getAIClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("Clé API Gemini non configurée.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Nettoie la sortie de l'IA pour ne garder que le JSON pur si nécessaire.
 */
const sanitizeJson = (text: string): string => {
  try {
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
      contents: `Tu es l'analyste stratégique iVISION. Analyse ces données et donne un conseil direct, sans bla-bla, max 30 mots : ${context}`,
    });

    return response.text?.trim() || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Intelligence iV momentanément hors ligne.";
  }
};

export const parseLeadFromText = async (text: string): Promise<any> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
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

    return JSON.parse(sanitizeJson(response.text || "{}"));
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};
