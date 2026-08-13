import { requireCompany } from "@/lib/actions/guard";
import { loadChatState } from "@/lib/actions/chat-actions";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { EmprendeAIChatPanel } from "@/components/chat/emprende-ai-chat-panel";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await requireCompany();
  const [chatState, companies] = await Promise.all([
    loadChatState(),
    prisma.company.findMany({ where: { userId: session.user.id }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          companies={companies}
          activeCompanyId={company.id}
          userName={session.user.name ?? session.user.email ?? ""}
          isAdmin={session.user.role === "ADMIN"}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">{children}</main>
      </div>
      <EmprendeAIChatPanel initialState={chatState} />
    </div>
  );
}
