
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GameScene } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateNextScene(
  userInput: string,
  history: string
): Promise<GameScene> {
  // Use gemini-3-pro-preview for complex text tasks like interactive storytelling with JSON schema
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `历史剧情背景: ${history}\n\n北北的选择: ${userInput}\n\n请生成下一个浪漫场景。`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 1.0,
    },
  });

  try {
    // Accessing .text property directly as per guidelines
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    
    // Construct a safe GameScene object with defaults
    const scene: GameScene = {
      story: typeof parsed.story === 'string' ? parsed.story : '',
      options: Array.isArray(parsed.options) ? parsed.options.map((opt: any) => ({
        id: String(opt.id || ''),
        text: String(opt.text || '')
      })) : [],
      location: typeof parsed.location === 'string' ? parsed.location : '神秘的时空角落',
      tone: parsed.tone === 'gentleman' ? 'gentleman' : 'cute',
      heartMessage: typeof parsed.heartMessage === 'string' ? parsed.heartMessage : undefined,
      imagePrompt: typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt : 'A beautiful romantic scenery in 3D anime style',
    };
    
    return scene;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("故事的线索突然乱掉了喵... 可能是时空裂缝的影响，北北再试一次好不好？");
  }
}

export async function generateSceneImage(prompt: string): Promise<string> {
  try {
    // Using gemini-2.5-flash-image via generateContent for image generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A highly romantic, cinematic, artistic digital painting in Animal Crossing/Studio Ghibli style: ${prompt}. Soft lighting, detailed textures, 4k, magical atmosphere, pastel colors.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    if (!response.candidates || response.candidates.length === 0) return "";
    
    const content = response.candidates[0].content;
    if (!content || !content.parts) return "";

    // Iterate through parts to find the image data
    for (const part of content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Failed to generate image:", error);
    return "";
  }
}
