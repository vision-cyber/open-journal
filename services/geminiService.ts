
import { GoogleGenAI, Type } from "@google/genai";
import { Journal, Mood } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMorePosts = async (currentCount: number): Promise<Journal[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 unique, deeply personal public journal entries. 
      Include a 'tags' array for each with 2-3 relevant emotional tags (e.g., #growth, #lonely, #gratitude).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              authorName: { type: Type.STRING },
              authorHandle: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              mood: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              imageUrl: { type: Type.STRING },
              createdAt: { type: Type.STRING }
            },
            required: ["title", "authorName", "authorHandle", "excerpt", "content", "mood", "createdAt", "tags"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((item: any, index: number) => ({
      ...item,
      id: `gen-${currentCount + index}`,
      visibility: 'public',
      updatedAt: item.createdAt
    }));
  } catch (error) {
    return [];
  }
};

export const suggestTags = async (content: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this journal content, suggest 3 relevant emotion or theme tags (without # prefix). Content: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch {
    return ["reflection", "thoughts"];
  }
};

export const generateDailyPrompt = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate one deeply reflective, short, and evocative daily journal prompt. Max 15 words.",
    });
    return response.text || "What is a lesson you learned the hard way recently?";
  } catch {
    return "What are you holding onto that you need to let go of?";
  }
};

export const generateCoverImage = async (title: string, content: string): Promise<string | null> => {
  try {
    const prompt = `A beautiful, atmospheric, artistic photography or abstract painting representing the themes of this journal entry. 
    Title: "${title}". 
    Snippet: "${content.substring(0, 100)}". 
    No text in image. High resolution, professional composition.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};