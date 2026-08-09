# EMPRENDE AI

**CFO Virtual + Business Planner + Analista de Negocios con IA**
*"El copiloto financiero y estratégico de tu negocio."*

Este repositorio contiene el **MVP + v1.1** del roadmap (ver [`docs/spec.md`](./docs/spec.md) §30):

- **MVP**: Onboarding, Mi Negocio, Estructura de Costos, Inversión Inicial, un Financial Engine
  determinístico (márgenes, punto de equilibrio, estado de resultados, flujo de caja), un
  Dashboard con KPIs y semáforo de solidez, Escenarios (Pesimista/Base/Optimista) editables,
  autenticación y planes FREE/STARTER.
- **v1.1**: Precificación Inteligente + Curva de Demanda (con Pricing Engine determinístico), y
  el Chat EMPRENDE AI (capa de IA sobre el Financial/Pricing Engine, vía Anthropic API).

Los módulos de fases posteriores (Sensibilidad, Multimoneda, Valoración/Cap Table, Reportes,
Mis Metas) aparecen en la navegación marcados como "Pronto" — están diseñados en la
especificación pero no implementados todavía.

## Stack

- **Next.js 16** (App Router) + TypeScript, Server Actions para todas las mutaciones.
- **PostgreSQL** + **Prisma 6** ORM.
- **Auth.js (NextAuth v5)**, proveedor Credentials (email + contraseña con bcrypt).
- **Tailwind CSS** + componentes propios sobre Radix UI (`src/components/ui`).
- **Recharts** para gráficos.
- **Anthropic SDK** (`@anthropic-ai/sdk`) para el chat EMPRENDE AI.
- **Vitest** para tests unitarios de los motores determinísticos.

## Arquitectura: separación de motores (spec §27)

```
src/lib/engine/financial.ts   ← Financial Engine: funciones puras, sin I/O.
src/lib/engine/pricing.ts     ← Pricing Engine: curva de demanda, elasticidad, precios (§6, 21.11).
src/lib/engine/scenarios.ts   ← aplica deltas de escenario sobre los inputs del engine.
src/lib/mappers.ts            ← traduce registros de Prisma → inputs del engine.
src/lib/ai/                   ← capa de IA: SOLO lee resultados de los engines, nunca calcula.
```

Los engines **nunca** tocan la base de datos ni llaman a un LLM: reciben números, devuelven
números, y cada fórmula está documentada con JSDoc citando la sección de la especificación
(§21) que implementa. Esto es intencional — spec §0.3/§27: *"la lógica financiera vive en
motores determinísticos... la IA interpreta y explica, nunca calcula"*.

El chat EMPRENDE AI (`src/lib/ai/`) sigue esa misma regla al pie de la letra:
`buildAIContext` corre los engines y arma un snapshot de solo lectura; `buildSystemPrompt`
inyecta ese snapshot como la única fuente de datos permitida en el system prompt; el modelo
nunca recibe acceso a la base de datos ni a herramientas de cálculo — solo puede citar lo que
ya está en el snapshot, y debe pedir el dato si falta (spec §10).

El Valuation Engine y el Currency Engine (spec §16, §15) se agregan en v1.2/v2.0 siguiendo el
mismo patrón.

## Modelo de datos

Ver `prisma/schema.prisma` — subconjunto de la spec §26 necesario para MVP + v1.1.
Multi-tenancy estricta: toda tabla de negocio cuelga de `Company`, y toda Server Action
resuelve la empresa a partir de la sesión autenticada (`src/lib/actions/guard.ts`) — nunca de
un id recibido del cliente.

## Requisitos

- Node.js 20+
- Docker (para Postgres local) o una base PostgreSQL propia
- Opcional: una API key de Anthropic para que el chat EMPRENDE AI responda de verdad (si no la
  configuras, el panel de chat se muestra igual pero avisa que falta configurarla).

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
src/app/(app)/...             Shell autenticado: dashboard, mi-negocio, costos,
                               inversion, escenarios, precios, perfil
src/lib/engine/               Financial Engine + Pricing Engine (determinísticos) + tests
src/lib/ai/                   Contexto de solo lectura, system prompt y cliente Anthropic
src/lib/actions/              Server Actions (una por módulo de negocio)
src/lib/mappers.ts            Prisma → Engine
src/lib/plans.ts              Catálogo de planes SaaS (spec §25)
src/components/ui/            Primitivos de UI (Button, Card, Dialog, Table, ...)
src/components/shared/        KpiCard (con modal "¿Qué significa?/...") y DeleteButton
src/components/chat/          Panel lateral desplegable del chat EMPRENDE AI (spec §23.8)
```

## Roadmap (spec §30)

- [x] **MVP** — Onboarding, Mi Negocio, Costos, Inversión, Financial Engine, Dashboard,
      Escenarios, Auth, planes FREE/STARTER.
- [x] **v1.1** — Precificación inteligente + curva de demanda, Chat EMPRENDE AI. *(Reportes
      PDF/Excel básicos, listados en la spec para esta fase, quedan pendientes.)*
- [ ] **v1.2** — Sensibilidad + matriz de riesgos, Multimoneda + Currency Engine + costos de
      importación, narrativa IA por escenario (JSON estructurado, spec §17.4).
- [ ] **v2.0** — Valuation Engine (DCF, múltiplos, Berkus, Scorecard, VC Method), Cap Table +
      Simulador de rondas + Waterfall, Investor Readiness Score, Dashboard para Inversores,
      Multinegocio, Panel Admin, plan CONSULTOR.

## Notas de diseño (simplificaciones documentadas)

- **Flujo de caja**: no hay módulo de financiamiento/deuda todavía (spec §14, v1.2+), así que
  el flujo de caja del MVP = ventas − costo de ventas − gastos operativos − impuestos. No se
  modela depreciación real (queda en 0 en el estado de resultados) hasta que exista un
  cronograma de activos.
- **Tasa de impuesto**: es un campo editable en Perfil (`Company.taxRatePct`), marcado como
  supuesto — no viene de la especificación original pero es necesario para calcular Utilidad
  Neta (spec §8) sin inventar el dato silenciosamente (spec §0.3).
- **Un negocio por usuario**: el modelo de datos soporta multi-empresa (`Company.userId`), pero
  la app resuelve siempre la primera empresa del usuario. Multi-empresa real es plan BUSINESS
  (spec §20/§25, v2.0).
- **Curva de demanda**: requiere al menos 2 puntos históricos (precio, cantidad) con precios
  distintos para ajustar la regresión; si no hay suficientes datos, los precios "óptimos"
  (que dependen de la curva) simplemente no se muestran — nunca se inventa una curva.
- **Chat EMPRENDE AI**: una conversación por empresa (histórico persistido en
  `AIConversation`/`AIMessage`). El modelo no tiene acceso a tools ni a la base de datos; todo
  lo que puede citar viene en el snapshot que arma `buildAIContext` antes de cada llamada.
- **Reportes PDF/Excel**: mencionados en la spec para v1.1 (§30, ítem 7) pero no incluidos en
  esta iteración — quedan como siguiente paso dentro de v1.1.
