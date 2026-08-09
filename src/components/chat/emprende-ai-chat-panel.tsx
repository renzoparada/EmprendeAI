"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, AlertTriangle } from "lucide-react";
import { sendChatMessage, type ChatState } from "@/lib/actions/chat-actions";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SAMPLE_QUESTIONS = [
  "¿Cuánto estoy ganando?",
  "¿Cuál es mi producto más rentable?",
  "¿Cuánto debo vender para ganar 50.000 al mes?",
  "¿Dónde estoy perdiendo dinero?",
];

/**
 * Panel lateral desplegable disponible en toda la plataforma (spec §10/§23.8)
 * — no una pantalla completa, no interrumpe el flujo de trabajo.
 */
export function EmprendeAIChatPanel({ initialState }: { initialState: ChatState }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(sendChatMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.reset();
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Abrir chat EMPRENDE AI"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar chat"
            className="flex-1 cursor-default bg-slate-950/30"
            onClick={() => setOpen(false)}
          />
          <div className="flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">EMPRENDE AI</p>
                <p className="text-xs text-slate-500">Tu copiloto financiero y estratégico</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {state.messages.length === 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-500">
                    Pregúntame sobre los números reales de tu negocio. Solo respondo con datos calculados por el
                    Financial Engine de la plataforma.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SAMPLE_QUESTIONS.map((q) => (
                      <p key={q} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {q}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {state.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-400">Pensando...</div>
                </div>
              )}
            </div>

            {!state.aiConfigured && (
              <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>El chat todavía no está configurado: falta la variable de entorno ANTHROPIC_API_KEY.</span>
              </div>
            )}
            {state.error && state.aiConfigured && <p className="border-t border-slate-100 px-4 py-2 text-xs text-red-600">{state.error}</p>}

            <form ref={formRef} action={formAction} className="flex gap-2 border-t border-slate-200 p-3">
              <input type="hidden" name="conversationId" value={state.conversationId ?? ""} />
              <Input
                name="message"
                placeholder="Escribe tu pregunta..."
                required
                disabled={isPending || !state.aiConfigured}
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={isPending || !state.aiConfigured}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
