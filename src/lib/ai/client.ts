import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

const DEFAULT_MODEL = "claude-sonnet-5";

// Todo lo que llama a la IA (chat, narrativas de escenario, plan de acción
// de Mis Metas, explicación de alertas, Business Plan) pasa por
// `askEmprendeAI` — un único choke point, igual que `resolveActiveCompany`
// en guard.ts. Poner el rate limit aquí lo aplica a todas esas features sin
// tener que tocar cada Server Action que las usa.
const AI_RATE_LIMIT = 20;
const AI_RATE_WINDOW_MS = 10 * 60 * 1000;

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

export interface ChatTurn {
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface AIResponse {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Llama al modelo con el system prompt (que ya incluye los datos del
 * negocio, ver lib/ai/prompt.ts) y el historial de la conversación. No
 * expone ninguna tool/función al modelo — no puede ejecutar cálculos ni
 * consultar la base de datos por su cuenta (spec §27). Devuelve el uso de
 * tokens de la respuesta para el Panel Admin (spec §25 "uso de IA/tokens").
 */
export async function askEmprendeAI(systemPrompt: string, history: ChatTurn[]): Promise<AIResponse> {
  const session = await auth();
  if (session?.user?.id) {
    await enforceRateLimit(`ai:${session.user.id}`, AI_RATE_LIMIT, AI_RATE_WINDOW_MS);
  }

  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: history.map((turn) => ({
      role: turn.role === "USER" ? "user" : "assistant",
      content: turn.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "No pude generar una respuesta. Intenta de nuevo.";

  return {
    text,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  };
}
