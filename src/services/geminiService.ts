import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface UniversityScore {
  year: number;
  schoolName: string;
  province: string;
  track: "理科" | "文科";
  minScore: number;
  minRank?: number;
}

export interface MajorScore {
  year: number;
  schoolName: string;
  majorName: string;
  track: "理科" | "文科";
  minScore: number;
}

export const geminiService = {
  // 查询院校分数线
  async searchUniversityScores(schoolName: string): Promise<UniversityScore[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `查询“${schoolName}”在2023年、2024年和2025年的全国一本及以上投档线。请提供真实或高度准确的模拟数据。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.INTEGER },
              schoolName: { type: Type.STRING },
              province: { type: Type.STRING },
              track: { type: Type.STRING, enum: ["理科", "文科"] },
              minScore: { type: Type.INTEGER },
              minRank: { type: Type.INTEGER },
            },
            required: ["year", "schoolName", "province", "track", "minScore"],
          },
        },
      },
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse university scores", e);
      return [];
    }
  },

  // 查询专业分数线
  async searchMajorScores(schoolName: string): Promise<MajorScore[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `查询“${schoolName}”在2023年、2024年和2025年的各主要专业录取分数线。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.INTEGER },
              schoolName: { type: Type.STRING },
              majorName: { type: Type.STRING },
              track: { type: Type.STRING, enum: ["理科", "文科"] },
              minScore: { type: Type.INTEGER },
            },
            required: ["year", "schoolName", "majorName", "track", "minScore"],
          },
        },
      },
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse major scores", e);
      return [];
    }
  },

  // 录取概率评测
  async evaluateAdmissionProbability(schoolName: string, score: number, track: string, province: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `考生分数：${score}，科类：${track}，所在地：${province}。目标院校：${schoolName}。
      请结合该校2023-2025年的录取数据，分析该考生被录取的概率。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            probability: { type: Type.NUMBER, description: "录取概率，0-1之间" },
            analysis: { type: Type.STRING, description: "详细分析建议" },
            riskLevel: { type: Type.STRING, enum: ["极高风险", "高风险", "中等风险", "低风险", "极低风险"] },
          },
          required: ["probability", "analysis", "riskLevel"],
        },
      },
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to evaluate probability", e);
      return null;
    }
  },

  // 自动推荐高校
  async recommendUniversities(score: number, track: string, province: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `考生分数：${score}，科类：${track}，所在地：${province}。
      请推荐10个录取概率较高的全国一本及以上院校，并给出推荐理由和预估概率。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              schoolName: { type: Type.STRING },
              estimatedProbability: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["schoolName", "estimatedProbability", "reason"],
          },
        },
      },
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to recommend universities", e);
      return [];
    }
  },

  // 专业解读与就业指南
  async getMajorInterpretation(schoolName: string, majorName: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请对“${schoolName}”的“${majorName}”专业进行深度解读。
      内容包括：专业核心课程、专业优势/特色、就业方向（具体岗位）、薪资水平预估、深造建议。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "专业概况与特色" },
            courses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "核心课程" },
            careerPaths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "就业方向" },
            salaryExpectation: { type: Type.STRING, description: "薪资水平预估" },
            furtherStudy: { type: Type.STRING, description: "深造建议" },
          },
          required: ["overview", "courses", "careerPaths", "salaryExpectation", "furtherStudy"],
        },
      },
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to get major interpretation", e);
      return null;
    }
  },
};
