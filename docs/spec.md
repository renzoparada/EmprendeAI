# EMPRENDE AI — Especificación Funcional y Técnica Completa (v2.0)
### CFO Virtual + Business Planner + Analista de Negocios con IA

---

## 0. VISIÓN DEL PRODUCTO

EMPRENDE AI es una plataforma SaaS que permite a emprendedores, profesionales independientes, PyMEs y startups **planificar, modelar, proyectar, controlar, valorar y optimizar** financieramente su negocio, con ayuda de Inteligencia Artificial.

**No es una calculadora financiera.** Es un copiloto financiero y estratégico que convierte datos simples en decisiones concretas.

**Posicionamiento:** *"El copiloto financiero y estratégico de tu negocio."*

Ejemplo del estándar de comunicación esperado — nunca mostrar solo:
> Margen: 22%

Sino:
> "Tu margen actual es 22%. Está por debajo de tu objetivo del 30%. Las principales causas son: (1) Producto B tiene margen de 12%, (2) Costos variables aumentaron 8%, (3) Tu precio promedio está 5% por debajo del escenario óptimo. RECOMENDACIÓN: aumentar el precio del Producto B entre 6% y 9%. Impacto estimado: +Bs 12.500 de utilidad mensual."

### 0.1 Principio fundamental de toda la plataforma

```
DATOS → CÁLCULO → ANÁLISIS → SIMULACIÓN → RECOMENDACIÓN → ACCIÓN → SEGUIMIENTO
```

### 0.2 Preguntas que el usuario debe poder responder al usar la plataforma

1. ¿Cuánto estoy ganando?
2. ¿Cuánto debería ganar?
3. ¿Cuál es mi producto más rentable?
4. ¿Cuál debería ser mi precio?
5. ¿Cuánto tengo que vender?
6. ¿Cuánto dinero necesito?
7. ¿Cuándo recupero mi inversión?
8. ¿Qué pasa si cambio mis precios?
9. ¿Qué pasa si aumento mis ventas?
10. ¿Qué debo hacer para alcanzar mi meta?
11. **¿Cuánto vale mi empresa?** *(nuevo)*
12. **¿Qué % debo ceder si busco inversión?** *(nuevo)*
13. **Cómo me afecta el tipo de cambio si importo o tengo inversionistas extranjeros?** *(nuevo)*

### 0.3 Regla de separación de responsabilidades (clave para arquitectura)

- La **lógica financiera** vive en motores determinísticos (Financial Engine, Valuation Engine, Currency Engine). Nunca dependen de la IA.
- La **IA interpreta y explica** los resultados producidos por los motores. Nunca calcula ni inventa cifras.
- Cuando falten datos, la IA debe decir explícitamente: *"Necesito estos datos para realizar el cálculo"* — nunca asumir valores silenciosamente.
- Toda cifra mostrada debe distinguir su naturaleza: **dato real / supuesto / proyección / estimación**.

---

## 1. ONBOARDING

### Paso 1 — Tipo de usuario
Emprendedor · Profesional independiente · Startup · PyME · Empresa establecida · Franquicia · Inversionista

### Paso 2 — Tipo de negocio
Restaurante · Hotel · Turismo · Comercio · E-commerce · Servicios · Consultoría · Educación · Inmobiliario · Manufactura · Tecnología · Salud · Belleza · Transporte · Agricultura · Otro

### Paso 3 — Información básica
Nombre del negocio · País · Ciudad · **Moneda funcional** (ver Parte 6) · Sector · Fecha de inicio · N° de empleados · Estado actual del negocio

### Paso 4 — Estado operativo
¿Tu negocio ya está funcionando? → **Sí** (solicitar datos históricos) / **No** / **Etapa de idea** (crear modelo basado en supuestos, marcados como tales)

> El tipo de negocio y su etapa determinan qué métodos de valoración (Parte 5) y qué plantillas de costos/precios se activan por defecto.

---

## 2. DASHBOARD EJECUTIVO

Indicadores principales, cada uno con: **valor actual, valor proyectado, variación, tendencia, estado (🟢🟡🔴), explicación IA**, y modal "¿Qué significa? / ¿Por qué importa? / ¿Cómo se calcula? / ¿Está bien o mal? / ¿Qué puedo hacer?":

Ventas actuales · Ventas proyectadas · Ingresos · Costos · Utilidad bruta · Utilidad neta · Margen · ROI · Punto de equilibrio · Flujo de caja · Capital necesario · **Exposición cambiaria** *(nuevo)* · **Rango de valoración** *(nuevo)* · **Semáforo de solidez del negocio** *(nuevo)*

Gráficos interactivos. Panel lateral de chat con EMPRENDE AI disponible en todo momento (ver Parte 10).

---

## 3. MODELO DEL NEGOCIO ("Mi Negocio")

Definir: Productos · Servicios · Categorías · Clientes · Canales de venta · Sucursales · Vendedores · Unidades de negocio.

Cada producto/servicio: Nombre · Categoría · Precio · Costo variable · **Origen del costo (local/importado)** *(nuevo, ver Parte 6)* · Margen · Unidades vendidas · Comisión · Impuestos · Descuentos · Costos asociados.

**Cálculo automático:** Margen unitario · Margen % · Contribución marginal · Rentabilidad por producto.

---

## 4. ESTRUCTURA DE COSTOS

**Costos fijos:** Alquiler, Sueldos, Servicios, Software, Seguros, Administración, Marketing, Otros.
**Costos variables:** Materia prima, Comisiones, Empaque, Transporte, Costos de producción, Costos por transacción, Otros.

Cada costo permite: periodicidad (mensual/anual), crecimiento esperado, inflación, variaciones, y clasificación automática (Fijo / Variable / Semivariable / Directo / Indirecto).

**Submódulo Costos de Importación** *(nuevo — ver fórmula 6.3)*: para insumos marcados como importados, cálculo automático de flete, seguro, aranceles, nacionalización y comisión bancaria, con conversión a moneda funcional.

---

## 5. INVERSIÓN INICIAL

Registrar: Equipamiento · Infraestructura · Tecnología · Mobiliario · Vehículos · Licencias · Marketing inicial · Capital de trabajo · Gastos preoperativos · Otros.

**Calcula:** Inversión total · Capital de trabajo · Capital necesario para operar · Período de recuperación · ROI · VAN · TIR · Payback.

---

## 6. PRECIFICACIÓN INTELIGENTE

Calcula: Precio mínimo · Precio de equilibrio · Precio objetivo · Precio óptimo · Precio psicológico · Precio competitivo — considerando costos, margen objetivo, demanda, volumen, competencia, elasticidad, capacidad instalada.

Gráficos: Precio vs. Demanda · Precio vs. Ingresos · Precio vs. Utilidad · Precio vs. Margen. Determina automáticamente el precio que maximiza ingresos, utilidad o margen. Permite comparar escenarios.

### Curva de Demanda
A partir de datos históricos (precio, cantidad vendida): construye la curva, calcula **elasticidad precio de la demanda** (fórmula en Parte 8) y clasifica: elástica / inelástica / unitaria. La IA explica el impacto de cambios de precio en ventas y utilidad.

---

## 7. PROYECCIÓN DE VENTAS Y EMBUDO COMERCIAL

**Proyección de ventas:** variables (clientes, leads, conversión, ticket promedio, frecuencia, unidades, precio); modelos (histórico, promedio móvil, tendencia, % crecimiento, estacionalidad, escenarios, modelo IA); horizontes (mensual, trimestral, semestral, anual, 5 años).

**Sales Forecast (embudo):** Leads → Contactos → Prospectos → Reuniones → Cotizaciones → Negociaciones → Ventas → Ticket promedio. Calcula conversión por etapa, CAC, LTV, costo por lead, costo por adquisición y ventas esperadas.

---

## 8. PUNTO DE EQUILIBRIO, FLUJO DE CAJA Y ESTADO DE RESULTADOS

**Punto de equilibrio:** unidades y monto monetario (fórmula en Parte 9). Visualización de zona de pérdida / equilibrio / ganancia.

**Flujo de caja mensual:** Ingresos (ventas, financiamiento, inversiones, otros) − Egresos (costos, sueldos, impuestos, marketing, deuda, inversiones, otros) = Saldo inicial → Flujo neto → Saldo final. Alertas automáticas si el flujo es negativo o el capital de trabajo es insuficiente.

**Estado de resultados:** Ventas → Costo de ventas → Utilidad bruta → Gastos operativos → EBITDA → Depreciación → EBIT → Intereses → Impuestos → Utilidad neta. Vistas mensual / trimestral / anual.

---

## 9. ESCENARIOS, SIMULACIÓN Y SENSIBILIDAD

**Tres escenarios automáticos:** Pesimista / Base / Optimista, editables en ventas, precio, costos, conversión, clientes, inversión, inflación, crecimiento, **tipo de cambio** *(nuevo)*. Comparación de ingresos, costos, utilidad, ROI, flujo de caja, payback.

**Simulador What-If:** "¿Qué pasa si aumento el precio 10%? ¿Vendo 20% menos? Mis costos suben 15%? Contrato 2 vendedores? Invierto Bs 100.000 más? Aumento marketing? **Sube el tipo de cambio 15%?**" — impacto inmediato.

**Análisis de sensibilidad:** matrices/mapas de calor sobre precio, ventas, costos, conversión, ticket promedio, **tipo de cambio** — impacto en utilidad, ROI, flujo de caja.

---

## 10. IA CONSULTORA ("EMPRENDE AI")

Asistente conversacional, disponible como panel lateral en toda la plataforma. Responde preguntas como: "¿Estoy cobrando demasiado? ¿Cuál debería ser mi precio? ¿Cuánto debo vender para ganar Bs 50.000? ¿Qué producto me genera más utilidad? ¿Dónde estoy perdiendo dinero? ¿Cuánto vale mi empresa? ¿Qué % debo ceder por una inversión de USD 50.000?"

Reglas:
- Responde **exclusivamente con datos del negocio del usuario**, consultando siempre los motores determinísticos.
- Sigue el patrón DATOS → ANÁLISIS → CONCLUSIÓN → RECOMENDACIÓN → ACCIÓN.
- Nunca inventa cifras; si faltan datos, los solicita explícitamente.
- Diferencia siempre dato real / supuesto / proyección / estimación.

---

## 11. PLANIFICADOR DE OBJETIVOS ("Mis Metas")

Usuario define una meta (ej. "Quiero ganar Bs 100.000 al mes"). La plataforma calcula automáticamente: ventas necesarias, clientes necesarios, ticket promedio necesario, unidades necesarias, leads necesarios, conversión necesaria, vendedores necesarios — y genera un plan de acción.

---

## 12. KPIs Y ALERTAS INTELIGENTES

**Biblioteca de KPIs:**
- Financieros: Ventas, Margen, EBITDA, Utilidad, ROI, ROIC, ROE, Cash Flow, CAC, LTV
- Comerciales: Leads, Conversión, Ticket promedio, Ventas por vendedor, Frecuencia de compra
- Operativos: Productividad, Costo unitario, Capacidad, Utilización
- Marketing: CPL, CAC, ROAS, Conversión

**Alertas automáticas** (ejemplos): costos +18% · margen −7% · flujo de caja negativo en 2 meses · punto de equilibrio aumentó · producto más/menos rentable detectado. Cada alerta incluye explicación IA y recomendación de acción.

---

## 13. BENCHMARKING

Compara margen, ticket, CAC, conversión, ROI, crecimiento contra: promedio histórico del propio negocio, objetivos del usuario, y benchmarks sectoriales **solo cuando existan datos confiables** — nunca inventar benchmarks.

---

## 14. MARKETING Y FINANCIAMIENTO

**Marketing:** presupuesto, campañas, leads, conversiones, ventas → CAC, CPL, ROAS, ROI Marketing, conversión. IA recomienda distribución de presupuesto basada en datos históricos.

**Financiamiento:** simula préstamo, socios, inversionistas, capital propio, crowdfunding. Variables: monto, interés, plazo, cuotas, período de gracia. Calcula cuota, intereses, costo financiero, flujo de deuda, impacto sobre ROI.

---

## 15. MULTIMONEDA Y ESCENARIOS INTERNACIONALES

*(Módulo ampliado — clave para importación e inversionistas extranjeros)*

### 15.1 Configuración
Monedas soportadas: BOB, USD, EUR, BRL, MXN, COP, PEN, CLP, ARS. Por negocio se define: **moneda funcional**, **moneda(s) de costo/importación**, **moneda(s) de inversión**. Tipo de cambio: oficial, paralelo, y proyectado (campos separados). Fuente manual o automática (solo con fuente confiable configurable — nunca inventada).

### 15.2 Costos de importación
Ver fórmula 6.3. Impacta directamente el margen por producto, mostrado bajo distintos tipos de cambio.

### 15.3 Riesgo cambiario
Simulador "¿qué pasa si el tipo de cambio sube/baja X%?" con impacto inmediato en costo variable, margen, punto de equilibrio, utilidad y flujo de caja. Detección automática de **descalce de monedas** (ingresos en una moneda, costos en otra) con recomendación de cobertura.

### 15.4 Inversionistas extranjeros
Aportes de capital registrados en su moneda de origen, con conversión automática a moneda funcional al momento del aporte. Retorno esperado y resultado de salida (exit) mostrados también en la moneda del inversionista.

### 15.5 Reportes multimoneda
Todo reporte visualizable en cualquier moneda configurada, con tasa y fecha de referencia siempre visibles. Indicador de **Exposición Cambiaria** (% de costos/ingresos en moneda distinta a la funcional) en el Dashboard.

---

## 16. VALORACIÓN DE EMPRESAS Y CAP TABLE

*(Módulo nuevo — "Valora tu Empresa")*

### 16.1 Métodos según etapa

**Negocios con ingresos activos:**
- Flujo de Caja Descontado (DCF)
- Múltiplos comparables (EV/EBITDA, EV/Ventas, P/E)
- Valor en libros ajustado
- Capitalización de utilidades

**Startups pre-ingresos:**
- Método Berkus
- Scorecard Method (Bill Payne)
- Venture Capital Method
- Múltiplo de ARR/MRR (SaaS)

La plataforma selecciona automáticamente los 2-3 métodos más relevantes según la etapa (definida en Onboarding), y siempre muestra un **rango** (mínimo–probable–máximo), nunca una única cifra.

### 16.2 Cap Table ("Socios y Participación")
Socios/accionistas, % o acciones, clases de acciones, pool de opciones (ESOP), historial de rondas (fecha, monto, pre/post-money, % cedido), dilución acumulada por socio.

### 16.3 Simulador de Ronda de Inversión
Monto a levantar + valoración pre-money (sugerida, editable) → calcula valoración post-money, % a ceder, nueva estructura de cap table, dilución por socio. Soporta simulación con SAFE / nota convertible (valuation cap, descuento).

### 16.4 Simulador de Salida (Exit) / Waterfall
Precio hipotético de venta → reparto por socio considerando preferencias de liquidación y deuda pendiente, en orden de prelación.

### 16.5 Investor Readiness Score
Puntaje 0-100 calculado desde señales objetivas (consistencia de datos históricos, márgenes vs. objetivo, flujo de caja, concentración de clientes, documentación cargada). IA explica cómo mejorarlo.

### 16.6 Reporte de Valoración para Inversionistas
Exportable en PDF: rango de valoración, cap table, proyección 5 años, uso de fondos propuesto, Investor Readiness Score. Disponible en la moneda del inversionista.

---

## 17. ANÁLISIS DE RIESGOS Y ESCENARIOS EN REPORTES

### 17.1 Componente estándar "Riesgos y Escenarios"
Incluido en reportes relevantes:
- Resumen comparativo de escenarios (Pesimista/Base/Optimista) con probabilidad si el usuario la definió
- Top 5 variables de mayor impacto (desde sensibilidad)
- Matriz de riesgos (riesgo, probabilidad, impacto, nivel, mitigación) — filtrada al negocio, no genérica
- Exposición cambiaria (si aplica)
- Semáforo de solidez del reporte (🟢🟡🔴 según % de dato real vs. supuesto)

### 17.2 Análisis narrativo por escenario (texto IA)
Además de la tabla comparativa, cada escenario incluye un párrafo generado por IA con estructura: (1) supuestos que lo definen, (2) resultado vs. escenario base, (3) probabilidad (o "no ponderado"), (4) acción recomendada si se materializa. Longitud: 3-5 líneas en Reporte Ejecutivo, más extenso en Reporte Financiero/Inversión. Idioma y moneda según configuración del usuario.

### 17.3 Dónde aplica
Reporte Ejecutivo (versión resumida) · Reporte Financiero/Rentabilidad (versión completa) · Reporte de Inversión/Dashboard Inversionistas (versión completa + cambiaria) · Business Plan con IA (usa este mismo componente para su sección de Riesgos).

### 17.4 Formato de salida estructurado (JSON)

La IA nunca escribe directamente sobre el documento final. Devuelve un JSON que el motor de reportes valida y renderiza:

```json
{
  "report_id": "string",
  "company_id": "string",
  "generated_at": "ISO 8601 datetime",
  "currency": "BOB | USD | EUR | ...",
  "language": "es | en | pt",
  "scenarios": [
    {
      "scenario_type": "pesimista | base | optimista",
      "is_manual_override": false,
      "override_date": null,
      "assumptions": [
        { "variable": "ventas", "change_pct": -20, "unit": "%" },
        { "variable": "tipo_cambio", "change_pct": 10, "unit": "%" }
      ],
      "results": {
        "ingresos": 280000,
        "costos": 210000,
        "utilidad_neta": 6800,
        "utilidad_neta_vs_base_pct": -72.8,
        "flujo_caja_mes_negativo_desde": 3,
        "roi_pct": 4.1,
        "payback_meses": 22
      },
      "probability": { "defined_by_user": false, "value_pct": null },
      "narrative": {
        "summary": "string (3-5 líneas)",
        "extended": "string (párrafo completo)",
        "recommended_action": "string",
        "trigger_condition": "string"
      },
      "data_confidence": "real | proyectado | supuesto | mixto"
    }
  ],
  "sensitivity_ranking": [
    { "variable": "tipo_cambio", "impact_pct_on_utilidad": 15 },
    { "variable": "precio", "impact_pct_on_utilidad": 11 }
  ],
  "solidity_indicator": "verde | amarillo | rojo"
}
```

**Reglas:** el motor financiero calcula primero `results`, `assumptions` y `sensitivity_ranking` (contexto de solo lectura para la IA). La IA solo redacta `narrative.*`. Si faltan datos, devuelve `"narrative": null` + `"missing_data": [...]`. El motor de reportes valida el JSON contra este esquema antes de renderizar; un JSON inválido no se publica.

---

## 18. PLAN DE NEGOCIO CON IA

Módulo "Construye tu Business Plan": Resumen ejecutivo, Problema, Solución, Producto, Mercado, Cliente objetivo, Modelo de negocio, Competencia, Marketing, Ventas, Operaciones, Equipo, Inversión, Proyección financiera, **Riesgos (usa el componente de la Parte 17)**, Estrategia. Todo conectado al modelo financiero real, no generado de forma aislada.

---

## 19. DASHBOARD PARA INVERSORES

Vista especial: Capital invertido, Capital requerido, Ventas, Crecimiento, EBITDA, Utilidad, ROI, TIR, VAN, Payback, Proyección 5 años, **Cap Table actual, rango de valoración, Investor Readiness Score** *(nuevo)*, gráficos profesionales.

---

## 20. SIMULACIÓN DE NEGOCIOS, MULTINEGOCIO Y BENCHMARKING TEMPORAL

**Business Simulator:** simula 12, 24, 36, 60 meses sobre clientes, precio, ventas, costos, marketing, personal, inversión, financiamiento, inflación, **tipo de cambio**.

**Multinegocio:** un usuario administra múltiples empresas y las consolida; también sucursales, unidades de negocio, productos, canales.

---

## 21. FÓRMULAS DEL MOTOR FINANCIERO

*(Documentación formal — implementación determinística obligatoria)*

### 21.1 Rentabilidad y márgenes
```
Margen bruto (%)      = (Ventas − Costo de Ventas) / Ventas × 100
Margen neto (%)       = Utilidad Neta / Ventas × 100
Margen unitario       = Precio − Costo Variable Unitario
Margen unitario (%)   = Margen unitario / Precio × 100
Contribución marginal = Margen unitario × Unidades vendidas
```

### 21.2 Punto de equilibrio
```
PE (unidades)   = Costos Fijos / (Precio − Costo Variable Unitario)
PE (monetario)  = Costos Fijos / [Margen de Contribución (%)]
```

### 21.3 Rentabilidad sobre inversión
```
ROI (%)  = (Utilidad Neta / Inversión Total) × 100
ROE (%)  = (Utilidad Neta / Patrimonio Neto) × 100
ROIC (%) = NOPAT / Capital Invertido × 100
           NOPAT = EBIT × (1 − Tasa de Impuesto)
           Capital Invertido = Deuda + Patrimonio − Efectivo
Payback (meses) = Inversión Inicial / Flujo de Caja Promedio Mensual
```

### 21.4 VAN y TIR
```
VAN = Σ [FCt / (1 + r)^t] − Inversión Inicial     (t = 1..n)
TIR = tasa r que hace VAN = 0 (resolución numérica)
```

### 21.5 WACC / CAPM (tasa de descuento)
```
WACC = (E/V × Ke) + (D/V × Kd × (1 − T))
CAPM: Ke = Rf + β × (Rm − Rf)
```
*Si no hay datos confiables de mercado, permitir tasa manual justificada, marcada como "supuesto del usuario".*

### 21.6 DCF (valoración de empresa)
```
Valor de la Empresa = Σ [FCLt / (1+WACC)^t] + Valor Terminal / (1+WACC)^n
Valor Terminal = FCLn × (1+g) / (WACC − g)
FCL = EBIT × (1−T) + Depreciación − CAPEX − Δ Capital de Trabajo
```

### 21.7 Múltiplos
```
Valor Empresa = EBITDA × Múltiplo EV/EBITDA
Valor Empresa = Ventas × Múltiplo EV/Ventas
Valor Patrimonio = Utilidad Neta × Múltiplo P/E
```

### 21.8 Startups (Berkus, Scorecard, VC Method)
```
Berkus:    Valor = Σ (Idea + Prototipo + Equipo + Relaciones estratégicas + Ventas iniciales)
                    [cada factor con tope monetario definido]

Scorecard: Valor = Valoración promedio comparables × Σ(peso factor × puntaje relativo)

VC Method: Valoración Post-Money = Valor de Salida Proyectado / Múltiplo de Retorno Exigido
           Valoración Pre-Money  = Valoración Post-Money − Monto a Invertir
           % a ceder             = Monto a Invertir / Valoración Post-Money
```

### 21.9 Dilución y Cap Table
```
% Participación tras ronda = Acciones del socio / Acciones totales post-ronda
Acciones nuevas emitidas   = Monto invertido / Precio por acción
Precio por acción          = Valoración Pre-Money / Acciones existentes pre-ronda
Dilución del socio (%)     = % antes − % después
```

### 21.10 Waterfall de salida
```
Orden de prelación:
1. Pago de deuda pendiente
2. Preferencia de liquidación de preferentes (monto invertido × múltiplo pactado)
3. Reparto del remanente entre comunes según % participación
```

### 21.11 Elasticidad precio de la demanda
```
E = (% Δ Cantidad Demandada) / (% Δ Precio)
E < −1        → Demanda elástica
E = −1        → Elasticidad unitaria
−1 < E < 0    → Demanda inelástica
```

### 21.12 CAC y LTV
```
CAC = Gasto total Marketing y Ventas / N° clientes nuevos
LTV = Ticket promedio × Frecuencia de compra anual × Vida útil del cliente (años)
Relación LTV/CAC saludable: ≥ 3
```

### 21.13 Conversión de moneda
```
Monto destino = Monto origen × Tipo de Cambio (origen→destino)

Costo total importación (moneda funcional) =
  (Costo FOB + Flete + Seguro) × (1 + % Arancel) × Tipo de Cambio
  + Gastos de nacionalización + Comisión bancaria
```

---

## 22. FUNDAMENTO TEÓRICO (sección "Metodología" de la plataforma)

Página de referencia accesible desde cada indicador vía "¿Cómo se calcula?" — explicación simple, sin fórmulas en la vista principal:

- **Costo-Volumen-Utilidad (Punto de Equilibrio):** contabilidad gerencial clásica; separa costos fijos y variables.
- **Valor del dinero en el tiempo (VAN, TIR, DCF):** un dólar hoy vale más que uno mañana; los flujos futuros se descuentan según el riesgo del negocio (línea de valoración corporativa moderna, popularizada académicamente por autores como Aswath Damodaran).
- **CAPM y WACC:** estándar de finanzas corporativas para estimar el retorno exigido según riesgo del negocio y su deuda.
- **Berkus y Scorecard:** metodologías para valorar startups sin historial suficiente para un DCF confiable; usadas en rondas ángel/semilla.
- **Venture Capital Method:** asociado académicamente a Bill Sahlman (Harvard Business School); valora hoy en función del valor proyectado de salida.
- **Elasticidad precio:** microeconomía clásica sobre sensibilidad de la demanda al precio.
- **CAC y LTV:** métricas estándar de negocios digitales/SaaS.

**Regla:** todo resultado numérico enlaza a esta sección vía tooltip "Ver metodología".

---

## 23. FLUJO DE PANTALLAS (UX)

### 23.1 Navegación general
```
LOGIN/REGISTRO → ONBOARDING WIZARD (Parte 1) → APP PRINCIPAL

Sidebar: Dashboard · Mi Negocio · Finanzas · Proyecciones · Precios ·
Flujo de Caja · Multimoneda · Escenarios · Sensibilidad · Valoración ·
Socios/Cap Table · Reportes · Mis Metas · EMPRENDE AI (chat) · Configuración
```

### 23.2 Dashboard Principal
Cards de KPIs con valor actual/proyectado, tendencia, semáforo — cada uno clickeable a modal explicativo. Gráfico de ventas reales vs. proyectadas. Panel de semáforo de solidez + alertas activas. Input de chat con IA siempre visible.

### 23.3 Escenarios
Tres columnas (Pesimista/Base/Optimista) con utilidad y probabilidad, tabla comparativa completa, y debajo el análisis narrativo IA del escenario seleccionado con acción recomendada. Enlace a sensibilidad.

### 23.4 Valoración
Rango de valoración (mínimo–probable–máximo) con slider visual, toggle de métodos usados (cada uno con "Ver metodología"), Investor Readiness Score, accesos a Simular ronda / Simular venta / Cap Table / Exportar reporte.

### 23.5 Simulador de Ronda de Inversión
Inputs de monto y valoración pre-money → resultado de post-money, % a ceder, comparación visual de cap table antes/después (gráficos de torta), opción SAFE/nota convertible.

### 23.6 Multimoneda / Exposición Cambiaria
Indicador de exposición %, simulador con slider de variación del tipo de cambio e impacto en margen/utilidad, mapa de calor tipo de cambio × utilidad, recomendación IA sobre descalce de monedas.

### 23.7 Reportes
Selector de tipo de reporte, moneda, idioma, y checkboxes de qué incluir (escenarios, riesgos, sensibilidad, exposición cambiaria). Vista previa con semáforo de solidez, tabla resumen y análisis narrativo por escenario. Exportar PDF/Excel.

### 23.8 Chat EMPRENDE AI
Panel lateral desplegable disponible en toda la plataforma, no pantalla completa — no interrumpe el flujo de trabajo.

### 23.9 Principios transversales de UX
- Progressive disclosure: cifra simple primero, fórmula/metodología a un clic.
- Semáforos y flechas de tendencia con significado consistente en toda la app.
- Ninguna cifra sin contexto comparativo (vs. objetivo / escenario base / período anterior).
- Edición en línea de supuestos (tipo de cambio, tasa de descuento, probabilidad) sin salir de la pantalla.
- Mobile-first en Dashboard y chat IA; pantallas de alta densidad de datos (Cap Table, Waterfall, DCF) priorizan desktop con resumen legible en mobile.

---

## 24. EXPERIENCIA DE USUARIO — PRINCIPIOS GENERALES

Sin lenguaje financiero complejo sin explicar. Cada indicador responde: ¿Qué significa? ¿Por qué importa? ¿Cómo se calcula? ¿Está bien o mal? ¿Qué puedo hacer? Uso de cards, gráficos, semáforos, tooltips, dashboards, wizards, progress bars. Diseño moderno SaaS (inspiración: Stripe, Notion, HubSpot, QuickBooks, Power BI) con identidad visual propia.

---

## 25. PERFIL, SUSCRIPCIONES Y PANEL ADMIN

**Perfil de usuario:** Registro, Login, Recuperación de contraseña, Perfil, Empresa, Configuración, Moneda, Idioma (Español, Inglés, Portugués).

**Planes SaaS:**
- **FREE:** funciones básicas.
- **STARTER:** proyecciones, finanzas, dashboard.
- **PRO:** IA, simulaciones, Business Plan, reportes, **valoración básica (1 método) + Investor Readiness Score**.
- **BUSINESS:** multiempresa, usuarios, sucursales, reportes avanzados, **todos los métodos de valoración, Cap Table completo, Simulador de rondas, Reporte para inversionistas**.
- **CONSULTOR:** un consultor administra múltiples clientes / múltiples valoraciones en paralelo.

**Panel Administrador:** usuarios, empresas, planes, suscripciones, pagos, uso de IA/tokens, reportes, configuraciones, soporte.

---

## 26. MODELO DE DATOS

Entidades principales y sus relaciones clave (diseño relacional escalable):

```
Users, Companies, Businesses, Products, Services, Customers,
Costs, Expenses, Investments, Sales, SalesForecasts,
FinancialModels, CashFlows, IncomeStatements, Scenarios,
Prices, DemandCurves, MarketingCampaigns, Loans, Goals, KPIs,
Alerts, Reports, AIConversations, Subscriptions, Payments,

-- Valoración y Cap Table
Shareholders, ShareClasses, CapTableEntries, FundingRounds,
ConvertibleInstruments, Valuations, ExitSimulations,
InvestorReadinessScores,

-- Multimoneda
Currencies, ExchangeRates, ImportCosts
```

Relaciones clave: `Companies 1—N Shareholders`, `Companies 1—N FundingRounds`, `FundingRounds 1—N CapTableEntries`, `Valuations N—1 Companies` (con referencia a los supuestos/inputs usados), `Products 1—N ImportCosts` (cuando aplique).

**Aislamiento de datos:** un usuario nunca debe poder acceder a los datos de otra empresa (multi-tenancy estricta).

---

## 27. ARQUITECTURA TÉCNICA

Plataforma SaaS escalable: Frontend moderno · Backend API · Base de datos relacional · Autenticación · Sistema de roles · Sistema de suscripciones.

### 27.1 Separación de motores (obligatoria)

```
┌────────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│  FINANCIAL ENGINE   │     │   VALUATION ENGINE    │     │  CURRENCY ENGINE   │
│  (determinístico)   │     │   (determinístico)    │     │  (determinístico)  │
│  Fórmulas 21.1–21.5 │     │   Fórmulas 21.6–21.10 │     │  Fórmula 21.13     │
└─────────┬───────────┘     └──────────┬────────────┘     └─────────┬──────────┘
          │                            │                            │
          └────────────────┬───────────┴────────────────────────────┘
                            ▼
                   ┌──────────────────┐
                   │   CAPA DE IA       │  ← solo interpreta y redacta
                   │  (interpretación,  │     (narrativas JSON, chat,
                   │   nunca cálculo)   │      recomendaciones)
                   └──────────────────┘
```

- Cada motor expone resultados numéricos documentados (fórmulas de la Parte 21) y su nivel de confianza del dato (real/proyectado/supuesto).
- La capa de IA consume estos resultados como contexto de solo lectura y genera texto (narrativas, chat, recomendaciones) validado contra el esquema JSON (Parte 17.4) antes de publicarse.
- Todas las fórmulas están documentadas y son auditables (Parte 21) — ningún cálculo vive "oculto" dentro de un prompt de IA.

---

## 28. SEGURIDAD

Autenticación segura · Roles y permisos · Cifrado · Backups · Auditoría · Protección de datos · Aislamiento estricto de información entre empresas.

---

## 29. EXPERIENCIA FINAL (flujo end-to-end)

```
REGISTRO → CREA TU NEGOCIO → INGRESA DATOS → LA PLATAFORMA CONSTRUYE
TU MODELO → ANALIZA → PROYECTA → SIMULA → VALORA → RECOMIENDA →
CREA PLAN DE ACCIÓN → MONITOREA
```

---

## 30. HOJA DE RUTA SUGERIDA PARA DESARROLLO (MVP → v2)

**MVP (mínimo viable, valida el core):**
1. Onboarding + Mi Negocio + Estructura de Costos
2. Financial Engine: márgenes, punto de equilibrio, flujo de caja, estado de resultados
3. Dashboard básico + 3 escenarios (sin narrativa IA aún)
4. Perfil, planes FREE/STARTER, autenticación

**v1.1 — IA y precificación:**
5. Precificación inteligente + curva de demanda
6. Chat EMPRENDE AI (capa de interpretación sobre Financial Engine)
7. Reportes básicos (PDF/Excel) sin componente de riesgo aún

**v1.2 — Riesgo y multimoneda:**
8. Análisis de sensibilidad + Matriz de riesgos
9. Módulo Multimoneda + Currency Engine + costos de importación
10. Narrativa IA por escenario (JSON estructurado, Parte 17.4) integrada a reportes

**v2.0 — Valoración e inversión (diferenciador Plan PRO/BUSINESS):**
11. Valuation Engine (DCF, múltiplos, Berkus, Scorecard, VC Method)
12. Cap Table + Simulador de rondas + Waterfall de salida
13. Investor Readiness Score + Dashboard para Inversores
14. Multinegocio, Panel Admin, Plan CONSULTOR

Cada fase debe entregar un producto usable de punta a punta (no módulos sueltos sin integrar), siguiendo siempre el principio de la sección 0.1.
