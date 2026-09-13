import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Route data shape expected from in-memory state
 */
interface RouteInput {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  riskLabel: string;
}

interface HazardInput {
  id: string;
  title: string;
  severity: string;
  corridorName: string;
}

interface WeatherInput {
  name: string;
  conditionLabel: string;
  metrics: Array<{ label: string; value: string }>;
  advisory: string;
}

export interface AiExplanation {
  factor: string;
  impact: string;
  detail: string;
}

export interface AiEvaluatedRoute {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  riskLabel: string;
  aiScore: number;
  confidence: string;
  explanations: AiExplanation[];
}

export interface AiRecommendation {
  recommendedRoute: AiEvaluatedRoute;
  alternatives: AiEvaluatedRoute[];
  generatedAt: string;
  poweredBy: "gemini" | "heuristic-fallback";
}

/**
 * Build the prompt that feeds live telemetry to Gemini
 */
function buildPrompt(
  routes: RouteInput[],
  hazards: HazardInput[],
  weather: WeatherInput[],
): string {
  return `You are an expert military logistics AI advisor for the Indian Army, deployed in the North-Eastern Region (Sector 07, Sikkim corridor). You analyze real-time data and recommend the safest, most efficient convoy route.

## CURRENT LIVE TELEMETRY DATA

### Available Routes:
${routes.map((r) => `- ${r.name} (ID: ${r.id}): ${r.distanceKm}km, ETA: ${r.etaMinutes} min, Current Risk: ${r.riskLabel}`).join("\n")}

### Active Hazards:
${hazards.map((h) => `- ${h.title} (ID: ${h.id}): Severity=${h.severity}, Corridor=${h.corridorName}`).join("\n")}

### Weather Stations:
${weather.map((w) => `- ${w.name}: ${w.conditionLabel}, ${w.metrics.map((m) => `${m.label}: ${m.value}`).join(", ")}${w.advisory ? ` [Advisory: ${w.advisory}]` : ""}`).join("\n")}

## YOUR TASK

Analyze the live data above and score each route from 0 to 100 (100 = perfectly safe and efficient). For each route, provide specific risk factors that influenced the score.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "routes": [
    {
      "id": "<route id>",
      "aiScore": <number 0-100>,
      "confidence": "<percentage string like 92.1%>",
      "explanations": [
        {
          "factor": "<short factor name>",
          "impact": "<e.g. -25 or +5>",
          "detail": "<1-2 sentence explanation>"
        }
      ]
    }
  ],
  "reasoning": "<2-3 sentence overall analysis>"
}

Be specific about WHY each factor matters. Reference actual data values (temperatures, distances, hazard names). A blocked route should score very low (0-20). A route with weather risks should be penalized proportionally.`;
}

/**
 * Parse the Gemini response and merge with route data
 */
function parseGeminiResponse(
  text: string,
  routes: RouteInput[],
): AiEvaluatedRoute[] {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  const geminiRoutes: Array<{
    id: string;
    aiScore: number;
    confidence: string;
    explanations: AiExplanation[];
  }> = parsed.routes;

  return geminiRoutes.map((gr) => {
    const original = routes.find((r) => r.id === gr.id);
    return {
      id: gr.id,
      name: original?.name ?? gr.id,
      distanceKm: original?.distanceKm ?? 0,
      etaMinutes: original?.etaMinutes ?? 0,
      riskLabel: original?.riskLabel ?? "Unknown",
      aiScore: Math.max(0, Math.min(100, gr.aiScore)),
      confidence: gr.confidence,
      explanations: gr.explanations,
    };
  });
}

/**
 * Call Gemini to evaluate routes using live telemetry
 */
export async function evaluateRoutesWithGemini(
  routes: RouteInput[],
  hazards: HazardInput[],
  weather: WeatherInput[],
): Promise<AiRecommendation> {
  const prompt = buildPrompt(routes, hazards, weather);

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    generationConfig: {
      temperature: 0.3, // Low temperature for consistent analytical output
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const evaluated = parseGeminiResponse(text, routes);
  evaluated.sort((a, b) => b.aiScore - a.aiScore);

  return {
    recommendedRoute: evaluated[0],
    alternatives: evaluated.slice(1),
    generatedAt: new Date().toISOString(),
    poweredBy: "gemini",
  };
}
