import type { InvestorReadinessResult } from "@/lib/engine/investor-readiness";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function InvestorReadinessCard({ result }: { result: InvestorReadinessResult }) {
  const color = result.score >= 70 ? "text-emerald-600" : result.score >= 40 ? "text-amber-500" : "text-red-600";
  const barColor = result.score >= 70 ? "bg-emerald-500" : result.score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">Investor Readiness Score</CardTitle>
        <CardDescription>Qué tan lista está tu empresa para levantar inversión, según señales objetivas (spec §16.5).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <p className={cn("text-4xl font-bold", color)}>{result.score}</p>
          <p className="text-sm text-slate-500">/ 100</p>
        </div>
        <div className="flex flex-col gap-2">
          {result.breakdown.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{item.label}</span>
                <span className="text-slate-500">
                  {item.points}/{item.maxPoints}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div className={cn("h-1.5 rounded-full", barColor)} style={{ width: `${(item.points / item.maxPoints) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
