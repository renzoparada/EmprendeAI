import type { ChatMessageView } from "@/lib/actions/chat-actions";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatMessageView }) {
  const isUser = message.role === "USER";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
          isUser ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
