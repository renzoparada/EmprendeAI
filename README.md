# EMPRENDE AI

**CFO Virtual + Business Planner + Analista de Negocios con IA**
*"El copiloto financiero y estratégico de tu negocio."*

Este repositorio contiene **MVP + v1.1 + v1.2 + v2.0 (parcial)** del roadmap (ver
[`docs/spec.md`](./docs/spec.md) §30):

- **MVP**: Onboarding, Mi Negocio, Estructura de Costos, Inversión Inicial, un Financial Engine
  determinístico (márgenes, punto de equilibrio, estado de resultados, flujo de caja), un
  Dashboard con KPIs y semáforo de solidez, Escenarios (Pesimista/Base/Optimista) editables,
  autenticación y planes FREE/STARTER.
- **v1.1**: Precificación Inteligente + Curva de Demanda (con Pricing Engine determinístico), el
  Chat EMPRENDE AI (capa de IA sobre el Financial/Pricing Engine, vía Anthropic API), y Reportes
  básicos exportables en PDF/Excel.
- **v1.2**: Análisis de Sensibilidad + Matriz de Riesgos (determinística), Multimoneda + Currency
  Engine + Costos de Importación, y Narrativa IA por escenario (JSON estructurado, spec §17.4).
- **v2.0 (parcial)**: Valuation Engine (WACC/CAPM, DCF, Múltiplos, Capitalización de utilidades,
  Berkus, Scorecard, VC Method) con selección automática de métodos por etapa y rango
  min-probable-max; Cap Table + Simulador de Ronda de Inversión + Simulador de Salida/Waterfall;
  Investor Readiness Score; VAN/TIR. **Multinegocio real, Panel Admin y plan CONSULTOR quedan
  fuera de esta fase** — ver "Alcance de v2.0" más abajo.

Los módulos que faltan (Mis Metas, Sales Forecast/embudo comercial, Dashboard para Inversores
como pantalla separada) aparecen en la navegación marcados como "Pronto".

## Stack

- **Next.js 16** (App Router) + TypeScript, Server Actions para todas las mutaciones.
- **PostgreSQL** + **Prisma 6** ORM.
- **Auth.js (NextAuth v5)**, proveedor Credentials (email + contraseña con bcrypt).
- **Tailwind CSS** + componentes propios sobre Radix UI (`src/components/ui`).
- **Recharts** para gráficos.
- **Anthropic SDK** (`@anthropic-ai/sdk`) para el chat EMPRENDE AI y la narrativa por escenario.
- **@react-pdf/renderer** + **exceljs** para los reportes PDF/Excel (sin navegador headless).
- **Vitest** para tests unitarios de los motores determinísticos.

## Arquitectura: separación de motores (spec §27)

```
src/lib/engine/financial.ts     ← Financial Engine: márgenes, punto de equilibrio, P&L, flujo de caja, VAN/TIR.
src/lib/engine/pricing.ts       ← Pricing Engine: curva de demanda, elasticidad, precios (§6, 21.11).
src/lib/engine/sensitivity.ts   ← ranking de variables + heatmap precio×ventas (§9/§17.1).
src/lib/engine/risk.ts          ← matriz de riesgos determinística, basada en reglas (§17.1).
src/lib/engine/currency.ts      ← conversión de moneda + costo de importación (§15, 6.3/21.13).
src/lib/engine/valuation.ts     ← Valuation Engine: WACC/CAPM, DCF, múltiplos, Berkus, Scorecard, VC Method (§16, 21.5-21.9).
src/lib/engine/captable.ts      ← dilución, simulador de ronda, waterfall de salida (§16.2-16.4, 21.9-21.10).
src/lib/engine/investor-readiness.ts ← Investor Readiness Score desde señales objetivas (§16.5).
src/lib/engine/solidity.ts      ← semáforo de solidez, compartido por Dashboard/Reportes/Escenarios/Valoración.
src/lib/engine/scenarios.ts     ← aplica deltas de escenario sobre los inputs del engine.
src/lib/engine/projection.ts    ← proyección de flujos con crecimiento, usada por VAN/TIR y DCF.
src/lib/mappers.ts              ← traduce registros de Prisma → inputs de los engines.
src/lib/ai/                     ← capa de IA: SOLO lee resultados de los engines, nunca calcula.
```

Los engines **nunca** tocan la base de datos ni llaman a un LLM: reciben números, devuelven
números, y cada fórmula está documentada con JSDoc citando la sección de la especificación
(§21) que implementa. Esto es intencional — spec §0.3/§27: *"la lógica financiera vive en
motores determinísticos... la IA interpreta y explica, nunca calcula"*. La matriz de riesgos es
un buen ejemplo: en vez de pedirle a un LLM que "invente" riesgos, `risk.ts` evalúa reglas
objetivas sobre los resultados del Financial Engine y solo devuelve los riesgos que realmente se
activan con los datos del negocio (spec §17.1: "filtrada al negocio, no genérica").

El chat EMPRENDE AI y la narrativa por escenario (`src/lib/ai/`) siguen esa misma regla al pie
de la letra: arman un snapshot de solo lectura con los engines, se lo inyectan al modelo como la
única fuente de datos permitida, y el modelo nunca recibe acceso a la base de datos ni a
herramientas de cálculo. La narrativa por escenario, además, se valida contra el esquema Zod
exacto de la spec §17.4 antes de mostrarse — "un JSON inválido no se publica".

El Valuation Engine y el Cap Table Engine (v2.0) siguen el mismo patrón: un método de valoración
que no tiene los supuestos necesarios (ej. sin múltiplo comparable cargado) queda marcado con
`unavailableReason` en vez de rellenarse con un valor inventado (spec §13: "nunca inventar
benchmarks").

## Modelo de datos

Ver `prisma/schema.prisma` — subconjunto de la spec §26 necesario para MVP + v1.1 + v1.2 + v2.0.
Multi-tenancy estricta: toda tabla de negocio cuelga de `Company`, y toda Server Action
resuelve la empresa a partir de la sesión autenticada (`src/lib/actions/guard.ts`) — nunca de
un id recibido del cliente.

## Requisitos

- Node.js 20+
- Docker (para Postgres local) o una base PostgreSQL propia
- Opcional: una API key de Anthropic para que el chat EMPRENDE AI y la narrativa por escenario
  respondan de verdad (sin ella, esas secciones se muestran igual pero avisan que falta
  configurarla).

## Setup local

```bash
cp .env.example .env
# Edita .env: DATABASE_URL si usas una base distinta a la de docker-compose,
# y ANTHROPIC_API_KEY si quieres que el chat EMPRENDE AI funcione.

docker compose up -d postgres
npm install
npx prisma migrate dev
npm run db:seed        # crea demo@emprendeai.com / demo1234 con datos de ejemplo

npm run dev             # http://localhost:3000
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios de los engines (Vitest) |
| `npm run db:seed` | Carga datos demo |
| `npx prisma studio` | Explorador visual de la base de datos |

## Estructura del proyecto

```
prisma/schema.prisma          Modelo de datos
prisma/seed.ts                Datos demo
src/app/(auth)/...            Login / registro
src/app/onboarding/           Wizard de 4 pasos (spec §1)
src/app/(app)/...             Shell autenticado: dashboard, mi-negocio, costos, inversion,
                               escenarios, precios, sensibilidad, multimoneda, valoracion,
                               socios, reportes, perfil
src/lib/engine/               Motores determinísticos (financial, pricing, sensitivity, risk,
                               currency, valuation, captable, investor-readiness, solidity,
                               scenarios, projection) + tests
src/lib/ai/                   Contexto de solo lectura, prompts, narrativa por escenario y
                               cliente Anthropic
src/lib/actions/              Server Actions (una por módulo de negocio)
src/lib/reports/              Agregación de datos + generadores PDF/Excel
src/lib/mappers.ts            Prisma → Engines (incluye integración de costos de importación)
src/lib/plans.ts              Catálogo de planes SaaS (spec §25)
src/components/ui/            Primitivos de UI (Button, Card, Dialog, Table, ...)
src/components/shared/        KpiCard (con modal "¿Qué significa?/...") y DeleteButton
src/components/chat/          Panel lateral desplegable del chat EMPRENDE AI (spec §23.8)
```

## Roadmap (spec §30)

- [x] **MVP** — Onboarding, Mi Negocio, Costos, Inversión, Financial Engine, Dashboard,
      Escenarios, Auth, planes FREE/STARTER.
- [x] **v1.1** — Precificación inteligente + curva de demanda, Chat EMPRENDE AI, Reportes
      básicos (PDF/Excel).
- [x] **v1.2** — Sensibilidad + matriz de riesgos, Multimoneda + Currency Engine + costos de
      importación, narrativa IA por escenario (JSON estructurado, spec §17.4).
- [x] **v2.0 (parcial)** — Valuation Engine (DCF, múltiplos, capitalización de utilidades,
      Berkus, Scorecard, VC Method), Cap Table + Simulador de Ronda + Waterfall de salida,
      Investor Readiness Score, VAN/TIR.
- [ ] **v2.0 (pendiente)** — Dashboard para Inversores como pantalla dedicada (spec §19; hoy sus
      elementos viven repartidos en Valoración/Socios/Dashboard), Multinegocio real (cambiar de
      empresa activa), Panel Administrador, plan CONSULTOR.

## Alcance de v2.0 — qué quedó fuera y por qué

La sección 14 del roadmap (§30) agrupa **Multinegocio, Panel Admin y plan CONSULTOR** junto con
Valoración/Cap Table/Investor Readiness (secciones 11-13). Se decidió separarlos:

- **Multinegocio, Panel Admin y plan CONSULTOR** son una superficie de producto distinta —
  gestión de cuentas, suscripciones, pagos y soporte a nivel plataforma, no cálculo financiero
  del negocio del usuario — y requieren su propio diseño de datos (facturación, roles de staff,
  relación consultor-cliente) que no estaba especificado en detalle. Construirlos de forma
  apresurada habría sido peor que dejarlos pendientes con el alcance documentado.
- **Valoración, Cap Table e Investor Readiness Score** (11-13) son el diferenciador central del
  producto para esta fase, tienen fórmulas exactas en la spec (§21.5-21.10) y ya siguen el mismo
  patrón de motor determinístico + tests que el resto de la plataforma — por eso se priorizaron.

`lib/plans.ts` sigue marcando PRO/BUSINESS/CONSULTOR como `available: false` (no hay cobro ni
gating real todavía para ningún plan) — Valoración y Cap Table están disponibles para cualquier
usuario autenticado, igual que el resto de los módulos construidos hasta ahora.

## Notas de diseño (simplificaciones documentadas)

- **Flujo de caja**: no hay módulo de financiamiento/deuda todavía (spec §14, v2.0), así que el
  flujo de caja = ventas − costo de ventas − gastos operativos − impuestos. No se modela
  depreciación real (queda en 0 en el estado de resultados) hasta que exista un cronograma de
  activos.
- **Tasa de impuesto**: es un campo editable en Perfil (`Company.taxRatePct`), marcado como
  supuesto — no viene de la especificación original pero es necesario para calcular Utilidad
  Neta (spec §8) sin inventar el dato silenciosamente (spec §0.3).
- **Un negocio por usuario**: el modelo de datos soporta multi-empresa (`Company.userId`), pero
  la app resuelve siempre la primera empresa del usuario. Multi-empresa real es plan BUSINESS
  (spec §20/§25, v2.0).
- **Curva de demanda**: requiere al menos 2 puntos históricos (precio, cantidad) con precios
  distintos para ajustar la regresión; si no hay suficientes datos, los precios "óptimos"
  simplemente no se muestran — nunca se inventa una curva.
- **Matriz de riesgos**: basada en reglas determinísticas (flujo negativo, ventas bajo punto de
  equilibrio, margen bajo, concentración de producto, payback largo) — no generada por IA, para
  no arriesgar una cifra o riesgo inventado (spec §0.3).
- **Costos de importación**: se toma el registro de importación *más reciente* por producto
  como el "activo" para el cálculo del costo unitario — el modelo permite guardar varios lotes
  históricos, pero el engine usa el último. El tipo de cambio usado es el `OFICIAL` si existe
  más de uno cargado para la misma moneda de origen.
- **Chat EMPRENDE AI y narrativa por escenario**: conversación persistida por empresa
  (`AIConversation`/`AIMessage`). El modelo no tiene acceso a tools ni a la base de datos; todo
  lo que puede citar viene en el snapshot que arma cada capa antes de llamar al modelo. La
  narrativa por escenario se valida contra un esquema Zod (spec §17.4) antes de mostrarse; si el
  modelo no responde JSON válido, se muestra "sin narrativa disponible" en vez de publicar texto
  no verificado.
- **Reportes**: dos tipos (Ejecutivo / Financiero-Rentabilidad), con escenarios opcionales. No
  incluyen todavía la narrativa IA ni la matriz de riesgos en el PDF/Excel exportado (sí están
  disponibles interactivamente en Escenarios y Sensibilidad) — integrarlos al PDF es un
  siguiente paso natural, no incluido en esta iteración para mantener la exportación rápida y
  sin costo de IA por descarga.
- **DCF**: la Utilidad/EBIT mensual del Financial Engine se anualiza (×12) y se proyecta con una
  tasa de crecimiento editable; depreciación, CAPEX y Δ capital de trabajo se asumen en 0 (no
  hay un cronograma de activos ni un balance modelado todavía) — el engine sí los soporta
  (`computeFreeCashFlow`), listo para cuando existan esos módulos.
- **Cap Table**: preferentes no-participantes (reciben su preferencia de liquidación y no
  comparten además el remanente) — el modelo más simple y común; SAFE/nota convertible
  (mencionado en spec §16.3 como soporte opcional) no está implementado todavía.
- **Investor Readiness Score**: usa las señales disponibles hoy (completitud de datos, margen,
  flujo de caja, concentración de producto, riesgos activos). La spec §16.5 también menciona
  consistencia de datos históricos multi-mes y documentación cargada — se sumarán como señales
  cuando existan esos módulos (no hay carga de documentos ni historial mensual todavía).
