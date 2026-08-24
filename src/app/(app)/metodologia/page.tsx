import { METHODOLOGY_TOPICS } from "@/lib/methodology";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MetodologiaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Metodología</h1>
        <p className="text-sm text-slate-500">
          El fundamento teórico detrás de cada motor de la plataforma, en lenguaje simple — de dónde viene cada
          modelo, no solo la fórmula (spec §22). Cualquier resultado numérico de la plataforma enlaza aquí desde su
          &ldquo;¿Cómo se calcula?&rdquo;.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {METHODOLOGY_TOPICS.map((topic) => (
          <Card key={topic.id} id={topic.id} className="scroll-mt-20">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold text-slate-900">{topic.title}</CardTitle>
              </div>
              <CardDescription className="flex flex-wrap gap-1.5 pt-1">
                {topic.usedIn.map((mod) => (
                  <Badge key={mod} variant="secondary">
                    {mod}
                  </Badge>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-slate-700">{topic.explanation}</p>
              {topic.reference && <p className="text-xs text-slate-500">{topic.reference}</p>}
              <p className="text-xs text-slate-400">{topic.formula}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
