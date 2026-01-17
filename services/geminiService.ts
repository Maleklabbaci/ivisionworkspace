
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY exclusively as per Gemini guidelines.
// Assume process.env.API_KEY is pre-configured and valid.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const generateMarketingInsight = async (context: string): Promise<string> => {
  try {
    const ai = getAIClient();
    // Use the recommended model for basic text/summarization tasks.
    const model = 'gemini-3-flash-preview';
    
    // Always call generateContent directly on ai.models.
    const response = await ai.models.generateContent({
      model: model,
      contents: `Expert Marketing. Analyse ces KPIs iVISION et donne 3 conseils courts (max 50 mots total) : ${context}`,
    });

    // Access the extracted string directly from the text property (getter).
    return response.text?.trim() || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de l'analyse IA. Vérifiez la configuration de la clé API.";
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

    // Directly access text property from GenerateContentResponse.
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Audit de campagne", "Optimisation SEO", "Rédaction contenu"];
  }
};

export const parseLeadFromText = async (text: string): Promise<any> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Analyse ce texte et extrait les informations du prospect iVISION.
      Texte : "${text}"
      
      Règles pour le budget :
      - Si un seul montant est donné, valueMin = montant, valueMax = montant.
      - Si une plage est donnée (ex: 50k-100k), valueMin = 50000, valueMax = 100000.
      - Retourne des nombres purs pour les montants.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nom complet du prospect" },
            company: { type: Type.STRING, description: "Nom de l'entreprise" },
            email: { type: Type.STRING, description: "Adresse email" },
            phone: { type: Type.STRING, description: "Numéro de téléphone" },
            valueMin: { type: Type.NUMBER, description: "Budget minimum en DZD" },
            valueMax: { type: Type.NUMBER, description: "Budget maximum en DZD" },
            description: { type: Type.STRING, description: "Résumé ou détails additionnels" }
          },
          required: ["name"]
        }
      }
    });

    // Directly access text property from GenerateContentResponse.
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Magic Tool Error:", error);
    throw error;
  }
};
