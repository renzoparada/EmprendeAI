# EMPRENDE AI

**CFO Virtual + Business Planner + Analista de Negocios con IA**
*"El copiloto financiero y estratégico de tu negocio."*

Este repositorio contiene el **MVP** (Fase 1 del roadmap, ver [`docs/spec.md`](./docs/spec.md) §30):
Onboarding, Mi Negocio, Estructura de Costos, Inversión Inicial, un Financial Engine
determinístico (márgenes, punto de equilibrio, estado de resultados, flujo de caja), un
Dashboard con KPIs y semáforo de solidez, y un módulo de Escenarios (Pesimista/Base/Optimista)
editables. Autenticación y planes FREE/STARTER incluidos.

Los módulos de fases posteriores (Precificación, Multimoneda, Sensibilidad, Valoración/Cap
Table, Reportes, Chat IA, Mis Metas) aparecen en la navegación marcados como "Pronto" — están
diseñados en la especificación pero no implementados todavía.

## Stack

- **Next.js 16** (App Router) + TypeScript, Server Actions para todas las mutaciones.
- **PostgreSQL** + **Prisma 6** ORM.
- **Auth.js (NextAuth v5)**, proveedor Credentials (email + contraseña con bcrypt).
- **Tailwind CSS** + componentes propios sobre Radix UI (`src/components/ui`).
- **Recharts** para gráficos.
- **Vitest** para tests unitarios del Financial Engine.

## Arquitectura: separación de motores (spec §27)

```
src/lib/engine/financial.ts   ← Financial Engine: funciones puras, sin I/O.
src/lib/engine/scenarios.ts   ← aplica deltas de escenario sobre los inputs del engine.
src/lib/mappers.ts            ← traduce registros de Prisma → inputs del engine.
```

El Financial Engine **nunca** toca la base de datos ni llama a un LLM: recibe números,
devuelve números, y cada fórchmula está documentada con JSDoc citando la sección de la
especificación (§21) que implementa. Esto es intencional — spec §0.3/§27: *"la lógica
financiera vive en motores determinísticos... la IA interpreta y explica, nunca calcula"*.
El MVP no incluye todavía la capa de IA (llega en v1.1); cuando se conecte, solo podrá leer
los resultados de estos motores para redactar texto, nunca recalcularlos.

El Valuation Engine y el Currency Engine (spec §16, §15) se agregan en v1.2/v2.0 siguiendo el
mismo patrón.

## Modelo de datos

Ver `prisma/schema.prisma` — subconjunto de la spec §26 necesario para el MVP. Multi-tenancy
estricta: toda tabla de negocio cuelga de `Company`, y toda Server Action resuelve la empresa a
partir de la sesión autenticada (`src/lib/actions/guard.ts`) — nunca de un id recibido del
cliente.

## Requisitos

- Node.js 20+
- Docker (para Postgres local) o una base PostgreSQL propia

## Setup local

```bash
cp .env.example .env
# Edita .env si usas una base de datos distinta a la de docker-compose.

docker compose up -d postgres
npm install
npx prisma migrate dev --name init
npm run db:seed        # crea demo@emprendeai.com / demo1234 con datos de ejemplo

npm run dev             # http://localhost:3000
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios del Financial Engine (Vitest) |
| `npm run db:seed` | Carga datos demo |
| `npx prisma studio` | Explorador visual de la base de datos |

## Estructura del proyecto

```
prisma/schema.prisma          Modelo de datos
prisma/seed.ts                Datos demo
src/app/(auth)/...            Login / registro
src/app/onboarding/           Wizard de 4 pasos (spec §1)
src/app/(app)/...             Shell autenticado: dashboard, mi-negocio, costos,
                               inversion, escenarios, perfil
src/lib/engine/               Financial Engine (determinístico) + tests
src/lib/actions/              Server Actions (una por módulo de negocio)
src/lib/mappers.ts            Prisma → Engine
src/lib/plans.ts              Catálogo de planes SaaS (spec §25)
src/components/ui/            Primitivos de UI (Button, Card, Dialog, Table, ...)
src/components/shared/        KpiCard (con modal "¿Qué significa?/...") y DeleteButton
```

## Roadmap (spec §30)

- [x] **MVP** — Onboarding, Mi Negocio, Costos, Inversión, Financial Engine, Dashboard,
      Escenarios, Auth, planes FREE/STARTER.
- [ ] **v1.1** — Precificación inteligente + curva de demanda, Chat EMPRENDE AI (capa de IA
      sobre el Financial Engine), reportes PDF/Excel básicos.
- [ ] **v1.2** — Sensibilidad + matriz de riesgos, Multimoneda + Currency Engine + costos de
      importación, narrativa IA por escenario (JSON estructurado, spec §17.4).
- [ ] **v2.0** — Valuation Engine (DCF, múltiplos, Berkus, Scorecard, VC Method), Cap Table +
      Simulador de rondas + Waterfall, Investor Readiness Score, Dashboard para Inversores,
      Multinegocio, Panel Admin, plan CONSULTOR.

## Notas de diseño del MVP (simplificaciones documentadas)

- **Flujo de caja**: no hay módulo de financiamiento/deuda todavía (spec §14, v1.2+), así que
  el flujo de caja del MVP = ventas − costo de ventas − gastos operativos − impuestos. No se
  modela depreciación real (queda en 0 en el estado de resultados) hasta que exista un
  cronograma de activos.
- **Tasa de impuesto**: es un campo editable en Perfil (`Company.taxRatePct`), marcado como
  supuesto — no viene de la especificación original pero es necesario para calcular Utilidad
  Neta (spec §8) sin inventar el dato silenciosamente (spec §0.3).
- **Un negocio por usuario**: el modelo de datos soporta multi-empresa (`Company.userId`), pero
  el MVP resuelve siempre la primera empresa del usuario. Multi-empresa real es plan BUSINESS
  (spec §20/§25, v2.0).
