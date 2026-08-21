# EMPRENDE AI

**CFO Virtual + Business Planner + Analista de Negocios con IA**
*"El copiloto financiero y estratégico de tu negocio."*

Este repositorio contiene **MVP + v1.1 + v1.2 + v2.0** del roadmap (ver
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
- **v2.0**: Valuation Engine (WACC/CAPM, DCF, Múltiplos, Capitalización de utilidades, Berkus,
  Scorecard, VC Method) con selección automática de métodos por etapa y rango min-probable-max;
  Cap Table + Simulador de Ronda de Inversión + Simulador de Salida/Waterfall; Investor
  Readiness Score; VAN/TIR; **Multinegocio** (varias empresas por cuenta, con límite real por
  plan); **Panel Admin** (usuarios, empresas, uso de IA/tokens); **plan CONSULTOR** habilitado;
  **Sales Forecast/embudo comercial** (CAC, LTV, conversión por etapa); **Mis Metas** (plan
  inverso: cuánto vender/prospectar para alcanzar una meta, con plan de acción por IA);
  **Dashboard para Inversores** como pantalla dedicada; y **Business Plan con IA** (secciones
  cualitativas redactadas con ayuda de IA + secciones financieras renderizadas en vivo desde los
  motores). Ver "Alcance de v2.0" más abajo para los recortes de esta fase.

No queda ningún módulo del roadmap MVP→v2.0 marcado como "Pronto" en la navegación — lo que
falta (Pagos/Suscripciones reales y acceso cross-account del plan CONSULTOR) está documentado
explícitamente en "Alcance de v2.0" y no en la navegación, porque construirlo a medias habría
significado fabricar datos o abrir un agujero de seguridad, no un simple recorte de alcance.

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

**Multinegocio**: un `User` puede tener varias `Company`. La "empresa activa" se guarda en una
cookie httpOnly (`emprendeai_active_company`, ver `resolveActiveCompany` en `guard.ts`) — la
cookie es solo una preferencia de navegación, nunca la fuente de verdad: siempre se valida que
la empresa pertenezca al usuario autenticado (`where: { id, userId }`) antes de usarla, y si no
pertenece o no existe, cae de vuelta a la primera empresa del usuario. El límite de empresas por
plan (`MAX_COMPANIES_PER_PLAN` en `lib/plans.ts`) se aplica en `completeOnboarding` — la única
regla de plan con enforcement real hoy.

**Panel Admin**: `User.role` (`USER` | `ADMIN`) gatea `/admin` vía `requireAdmin()` (siempre
relee el rol desde la base de datos, nunca confía en el cliente). Vive fuera del grupo de rutas
`(app)` porque no requiere que el admin tenga una empresa propia.

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
npm run db:seed        # crea demo@emprendeai.com / demo1234 (con datos de ejemplo)
                        # y admin@emprendeai.com / admin1234 (Panel Admin, sin empresa propia)

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
prisma/seed.ts                Datos demo (usuario + admin)
src/app/(auth)/...            Login / registro
src/app/onboarding/           Wizard de 4 pasos (spec §1) — primera empresa
src/app/(app)/...             Shell autenticado: dashboard, mi-negocio, costos, inversion,
                               escenarios, precios, sensibilidad, multimoneda, valoracion,
                               socios, reportes, negocios (Multinegocio), perfil
src/app/admin/                Panel Admin (spec §25) — fuera de (app), su propio layout/guard
src/lib/engine/               Motores determinísticos (financial, pricing, sensitivity, risk,
                               currency, valuation, captable, investor-readiness, solidity,
                               scenarios, projection) + tests
src/lib/ai/                   Contexto de solo lectura, prompts, narrativa por escenario y
                               cliente Anthropic
src/lib/actions/              Server Actions (una por módulo de negocio, + admin-actions.ts,
                               company-actions.ts para Multinegocio)
src/lib/reports/              Agregación de datos + generadores PDF/Excel
src/lib/mappers.ts            Prisma → Engines (incluye integración de costos de importación)
src/lib/plans.ts              Catálogo de planes SaaS + límites de empresas (spec §25/§20)
src/components/ui/            Primitivos de UI (Button, Card, Dialog, Table, ...)
src/components/shared/        KpiCard (con modal "¿Qué significa?/...") y DeleteButton
src/components/chat/          Panel lateral desplegable del chat EMPRENDE AI (spec §23.8)
src/components/admin/         UI del Panel Admin
```

## Roadmap (spec §30)

- [x] **MVP** — Onboarding, Mi Negocio, Costos, Inversión, Financial Engine, Dashboard,
      Escenarios, Auth, planes FREE/STARTER.
- [x] **v1.1** — Precificación inteligente + curva de demanda, Chat EMPRENDE AI, Reportes
      básicos (PDF/Excel).
- [x] **v1.2** — Sensibilidad + matriz de riesgos, Multimoneda + Currency Engine + costos de
      importación, narrativa IA por escenario (JSON estructurado, spec §17.4).
- [x] **v2.0** — Valuation Engine (DCF, múltiplos, capitalización de utilidades, Berkus,
      Scorecard, VC Method), Cap Table + Simulador de Ronda + Waterfall de salida, Investor
      Readiness Score, VAN/TIR, Multinegocio (cambio de empresa activa + límite por plan),
      Panel Admin (usuarios/empresas/uso de IA), plan CONSULTOR habilitado, Sales
      Forecast/embudo comercial (CAC/LTV/conversión, spec §7), Mis Metas (plan inverso + acción
      por IA, spec §11), Dashboard para Inversores (spec §19), Business Plan con IA (spec §18).
- [ ] **Pendiente, fuera de todas las fases** — Pagos/Suscripciones reales (requiere pasarela de
      pago integrada) y acceso cross-account del plan CONSULTOR a cuentas de clientes (requiere
      rediseñar el modelo de permisos). Ver "Alcance de v2.0" para el detalle de por qué.

## Alcance de v2.0 — qué quedó fuera y por qué

**Multinegocio, Panel Admin y plan CONSULTOR ya están implementados** (spec §30 ítem 14), pero
con un recorte de alcance deliberado y documentado:

- **Panel Admin** cubre usuarios (con cambio de plan manual), empresas y uso de IA/tokens — las
  tres cosas que se pueden mostrar con datos reales. **No incluye Pagos ni Suscripciones**: no
  hay ninguna pasarela de pago integrada (Stripe u otra), así que construir esas pantallas
  habría significado fabricar datos de facturación falsos — algo que va directamente en contra
  del principio central de la plataforma (spec §0.3: nunca inventar una cifra). Cuando se
  integre un proveedor de pagos real, esas pantallas se agregan sobre datos reales.
- **Multinegocio** es real: cambio de empresa activa (cookie validada contra la DB en cada
  request, nunca confiada a ciegas), creación de nuevas empresas, y el único límite de plan con
  enforcement real de toda la plataforma (`MAX_COMPANIES_PER_PLAN`). Lo que falta es
  **consolidación** entre empresas (reportes agregados multi-empresa, sucursales/unidades de
  negocio dentro de una misma empresa) — spec §20 lo menciona, pero es un módulo de reporting
  aparte, no incluido aquí.
- **Plan CONSULTOR** hoy significa, en la práctica, "Multinegocio sin límite bajo la misma
  cuenta" — igual que BUSINESS. **Lo que NO está implementado** es que un consultor acceda a la
  cuenta de un cliente que inició sesión por su cuenta (colaboración cross-account con roles de
  permiso). Eso requeriría rediseñar `requireCompany()` y, en teoría, cada una de las ~40 Server
  Actions que asumen propiedad estricta (`company.userId === session.user.id`) para soportar
  "es dueño O tiene acceso otorgado" — un cambio ancho en código de seguridad crítico que no se
  hizo de forma apurada por el riesgo real de introducir un agujero de multi-tenancy. Queda como
  el siguiente paso natural, con diseño explícito de permisos (viewer/editor por empresa).

`lib/plans.ts` ahora marca los 5 planes como `available: true` — todas las features que
enumeran ya existen en la plataforma (Chat IA, Reportes, Valoración, Cap Table no estaban
realmente gateadas por plan de todos modos). El único enforcement real de plan sigue siendo el
límite de empresas.

## Notas de diseño (simplificaciones documentadas)

- **Flujo de caja**: no hay módulo de financiamiento/deuda todavía (spec §14, v2.0), así que el
  flujo de caja = ventas − costo de ventas − gastos operativos − impuestos. No se modela
  depreciación real (queda en 0 en el estado de resultados) hasta que exista un cronograma de
  activos.
- **Tasa de impuesto**: es un campo editable en Perfil (`Company.taxRatePct`), marcado como
  supuesto — no viene de la especificación original pero es necesario para calcular Utilidad
  Neta (spec §8) sin inventar el dato silenciosamente (spec §0.3).
- **Multinegocio**: implementado (ver sección "Alcance de v2.0"). No incluye consolidación de
  reportes entre empresas ni sucursales/unidades de negocio dentro de una misma empresa.
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
- **Sales Forecast / embudo comercial (`/ventas`)**: el Funnel Engine calcula conversión por
  etapa, costo por lead, CAC y LTV a partir de un único snapshot editable del embudo (no hay
  todavía carga histórica mes a mes) — LTV/CAC ≥3 se marca como saludable, siguiendo el estándar
  de la industria citado en la spec §7.
- **Mis Metas (`/metas`)**: el Goal Planner Engine resuelve hacia atrás (ventas → unidades →
  clientes → leads → vendedores necesarios) reusando el mismo margen de contribución del
  Financial Engine — no un cálculo paralelo. El plan de acción de IA solo redacta texto sobre
  ese resultado ya calculado (mismo patrón de JSON validado con Zod que la narrativa por
  escenario, spec §17.4) — si la IA no responde JSON válido, no se publica nada.
- **Dashboard para Inversores (`/inversionistas`)**: reutiliza los mismos engines/componentes que
  Inversión Inicial, Valoración y Socios (VAN/TIR, rango de valoración, Investor Readiness Score,
  Cap Table) en una sola pantalla pensada para compartir con un inversionista — no duplica
  ningún cálculo, solo los ensambla. La proyección a 5 años usa un crecimiento anual supuesto de
  5% (editable en el simulador VAN/TIR de la misma página), marcado explícitamente como supuesto.
- **Business Plan con IA (`/plan-de-negocio`)**: las 13 secciones cualitativas (Resumen
  Ejecutivo, Problema, Solución, Mercado, Cliente Objetivo, Modelo de Negocio, Competencia,
  Marketing, Ventas, Operaciones, Equipo, Estrategia, Producto) son texto editable por el
  usuario, con un botón "Ayúdame a redactar con IA" que genera un borrador de arranque citando
  solo datos reales ya cargados — nunca inventa nombres de competidores, integrantes del equipo
  ni tamaños de mercado; cuando falta ese dato, el borrador deja un marcador explícito para que
  el usuario lo complete. Las secciones financieras (Inversión, Proyección, Riesgos) NO se
  guardan como texto: se recalculan en vivo desde el Financial/Risk Engine cada vez que se abre
  la página, para que nunca queden desactualizadas respecto a los datos reales del negocio.
