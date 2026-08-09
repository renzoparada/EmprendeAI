"use server";

import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { buildAIContext } from "@/lib/ai/context";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { askEmprendeAI, isAIConfigured } from "@/lib/ai/client";

export interface ChatMessageView {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface ChatState {
  conversationId?: string;
  messages: ChatMessageView[];
  error?: string;
  aiConfigured: boolean;
}

export async function loadChatState(): Promise<ChatState> {
  const { company } = await requireCompany();

  const conversation = await prisma.aIConversation.findFirst({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return {
    conversationId: conversation?.id,
    messages: conversation?.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })) ?? [],
    aiConfigured: isAIConfigured(),
  };
}

export async function sendChatMessage(prevState: ChatState, formData: FormData): Promise<ChatState> {
  const { company } = await requireCompany();
  const text = ((formData.get("message") as string) ?? "").trim();

  if (!text) return prevState;

  if (!isAIConfigured()) {
    return { ...prevState, aiConfigured: false, error: "El chat EMPRENDE AI todavía no está configurado: falta ANTHROPIC_API_KEY." };
  }

  let conversationId = prevState.conversationId ?? (formData.get("conversationId")?.toString() || undefined);
  if (!conversationId) {
    const conversation = await prisma.aIConversation.create({ data: { companyId: company.id } });
    conversationId = conversation.id;
  } else {
    // Verifica que la conversación pertenece a esta empresa antes de escribir en ella.
    const owned = await prisma.aIConversation.findFirst({ where: { id: conversationId, companyId: company.id } });
    if (!owned) return { ...prevState, error: "Conversación no encontrada." };
  }

  await prisma.aIMessage.create({ data: { conversationId, role: "USER", content: text } });

  const [context, history] = await Promise.all([
    buildAIContext(company.id),
    prisma.aIMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: 40 }),
  ]);

  const systemPrompt = buildSystemPrompt(context);

  let replyText: string;
  try {
    replyText = await askEmprendeAI(
      systemPrompt,
      history.map((m) => ({ role: m.role, content: m.content }))
    );
  } catch (error) {
    console.error("EMPRENDE AI chat error:", error);
    replyText = "Tuve un problema técnico consultando a EMPRENDE AI. Intenta de nuevo en un momento.";
  }

  await prisma.aIMessage.create({ data: { conversationId, role: "ASSISTANT", content: replyText } });

  const messages = await prisma.aIMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });

  return {
    conversationId,
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    aiConfigured: true,
  };
}
