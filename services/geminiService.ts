
import { GoogleGenAI, Type } from "@google/genai";
import { DeliveryPoint, RouteAssignment } from "../types";

export const parseAssignmentCommand = async (command: string): Promise<RouteAssignment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse this Ramadan food delivery assignment command: "${command}". 
    Extract the list of unique location codes and the name of the delivery volunteer or vehicle. 
    If multiple codes are mentioned (e.g., "A1 to A5"), expand them if they follow a logical sequence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          deliveryName: { type: Type.STRING, description: "Name of the person or vehicle" },
          codes: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of location codes"
          },
        },
        required: ["deliveryName", "codes"],
      },
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text.trim());
};

export const generateRouteExplanation = async (
  points: DeliveryPoint[], 
  deliveryName: string,
  estimatedTime: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const pointsSummary = points.map((p, i) => `${i + 1}. الكود: ${p.code} | الاسم: ${p.name} | العنوان: ${p.address} | رقم الهاتف: ${p.phone}`).join("\n");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a Ramadan Logistics Coordinator. Write a summary in ARABIC for the driver ${deliveryName}.
    
    Format requirements:
    1. Start with a brief greeting in Arabic.
    2. Mention that the estimated time for completion is ${estimatedTime} minutes (calculated as 5 minutes per delivery).
    3. List the destinations in order like this:
       - الوجهة الأولى: [Code], [Name], [Address], [Phone]
       - الوجهة الثانية: [Code], [Name], [Address], [Phone]
       ...etc.
    4. DO NOT mention distance or fuel.
    5. Add a mandatory reminder: "يرجى الالتزام بالتواجد في الوقت المحدد." (Please be there on time).
    6. Add a mandatory note: "في حال احتجت إلى أي مساعدة، يرجى التواصل مع القائد المسؤول." (If you need help, contact the responsible leader).
    
    Data to use:
    ${pointsSummary}`,
  });

  return response.text || "تم تحديث المسار. يرجى التواصل مع القائد المسؤول.";
};
