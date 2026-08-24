import { prisma } from "@/lib/db";
import { isAIConfigured } from "@/lib/ai/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminIaPage() {
  const messages = await prisma.aIMessage.findMany({
    where: { role: "ASSISTANT" },
    select: {
      inputTokens: true,
      outputTokens: true,
      conversation: { select: { company: { select: { id: true, name: true } } } },
    },
  });

  const byCompany = new Map<string, { name: string; messages: number; inputTokens: number; outputTokens: number }>();
  for (const m of messages) {
    const company = m.conversation.company;
    const entry = byCompany.get(company.id) ?? { name: company.name, messages: 0, inputTokens: 0, outputTokens: 0 };
    entry.messages += 1;
    entry.inputTokens += m.inputTokens ?? 0;
    entry.outputTokens += m.outputTokens ?? 0;
    byCompany.set(company.id, entry);
  }

  const rows = Array.from(byCompany.values()).sort((a, b) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens));
  const totalMessages = messages.length;
  const totalInput = rows.reduce((sum, r) => sum + r.inputTokens, 0);
  const totalOutput = rows.reduce((sum, r) => sum + r.outputTokens, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Uso de IA</h1>
          <p className="text-sm text-slate-500">Consumo del Chat EMPRENDE AI por empresa (spec §25).</p>
        </div>
        <Badge variant={isAIConfigured() ? "default" : "danger"}>{isAIConfigured() ? "IA configurada" : "ANTHROPIC_API_KEY no configurada"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Respuestas generadas</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalMessages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Tokens de entrada</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalInput.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Tokens de salida</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalOutput.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay uso del Chat EMPRENDE AI registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Mensajes</TableHead>
                  <TableHead className="text-right">Tokens entrada</TableHead>
                  <TableHead className="text-right">Tokens salida</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium text-slate-900">{r.name}</TableCell>
                    <TableCell className="text-right">{r.messages}</TableCell>
                    <TableCell className="text-right">{r.inputTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.outputTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">{(r.inputTokens + r.outputTokens).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
