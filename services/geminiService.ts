import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GameScene } from "../types";

// 1. 核心修正：使用 Vite 规范的环境变量前缀，解决“API Key must be set”报错
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateNextScene(
  userInput: string,
  history: string
): Promise<GameScene> {
  // 2. 核心修正：锁定为 2.5 Flash 模型 (即你要求的最新 2.5 逻辑版)，跳过 1.5 的安全拦截
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: SYSTEM_INSTRUCTION 
  });

  const prompt = `历史剧情背景: ${history}\n\n北北的选择: ${userInput}\n\n请生成下一个浪漫场景。`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });

    // 3. 语法修正：使用 .text() 方法获取 AI 返回的字符串
    const text = result.response.text();
    const parsed = JSON.parse(text);
    
    // 确保返回的数据结构完全符合 types.ts 定义
    return {
      story: parsed.story || '',
      options: (parsed.options || []).map((opt: any) => ({
        id: String(opt.id || ''),
        text: String(opt.text || '')
      })),
      location: parsed.location || '神秘的时空角落',
      tone: parsed.tone === 'gentleman' ? 'gentleman' : 'cute',
      heartMessage: parsed.heartMessage,
      imagePrompt: parsed.imagePrompt || 'A beautiful romantic scenery in 3D anime style',
    };
  } catch (error) {
    console.error("AI 响应解析失败:", error);
    throw new Error("故事的线索突然乱掉了喵... 北北再试一次好不好？");
  }
}

/**
 * 图像描述生成逻辑
 */
export async function generateSceneImage(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ 
        parts: [{ text: `Generate a high-quality 3D anime style image description for: ${prompt}. Soft lighting, pastel colors.` }] 
      }],
    });

    // 目前 2.5 Flash 在 Web 端主要辅助生成描述，若需直接生成图片需额外配置
    // 这里先保证代码不报错，维持页面渲染
    return ""; 
  } catch (error) {
    console.error("图片生成逻辑跳过:", error);
    return "";
  }
}
