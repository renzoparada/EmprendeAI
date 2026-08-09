/** Labels en español para los enums del modelo de datos — spec §1. */

export const USER_TYPE_LABELS: Record<string, string> = {
  EMPRENDEDOR: "Emprendedor",
  PROFESIONAL_INDEPENDIENTE: "Profesional independiente",
  STARTUP: "Startup",
  PYME: "PyME",
  EMPRESA_ESTABLECIDA: "Empresa establecida",
  FRANQUICIA: "Franquicia",
  INVERSIONISTA: "Inversionista",
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANTE: "Restaurante",
  HOTEL: "Hotel",
  TURISMO: "Turismo",
  COMERCIO: "Comercio",
  ECOMMERCE: "E-commerce",
  SERVICIOS: "Servicios",
  CONSULTORIA: "Consultoría",
  EDUCACION: "Educación",
  INMOBILIARIO: "Inmobiliario",
  MANUFACTURA: "Manufactura",
  TECNOLOGIA: "Tecnología",
  SALUD: "Salud",
  BELLEZA: "Belleza",
  TRANSPORTE: "Transporte",
  AGRICULTURA: "Agricultura",
  OTRO: "Otro",
};

export const OPERATING_STAGE_LABELS: Record<string, string> = {
  OPERANDO: "Sí, ya está funcionando",
  NO_OPERANDO: "No, todavía no",
  ETAPA_IDEA: "Etapa de idea",
};

export const CURRENCY_OPTIONS = ["BOB", "USD", "EUR", "BRL", "MXN", "COP", "PEN", "CLP", "ARS"];

export const FIXED_COST_CATEGORY_LABELS: Record<string, string> = {
  ALQUILER: "Alquiler",
  SUELDOS: "Sueldos",
  SERVICIOS: "Servicios",
  SOFTWARE: "Software",
  SEGUROS: "Seguros",
  ADMINISTRACION: "Administración",
  MARKETING: "Marketing",
  OTROS: "Otros",
};

export const VARIABLE_COST_CATEGORY_LABELS: Record<string, string> = {
  MATERIA_PRIMA: "Materia prima",
  COMISIONES: "Comisiones",
  EMPAQUE: "Empaque",
  TRANSPORTE: "Transporte",
  PRODUCCION: "Costos de producción",
  TRANSACCION: "Costos por transacción",
  OTROS: "Otros",
};

export const INVESTMENT_CATEGORY_LABELS: Record<string, string> = {
  EQUIPAMIENTO: "Equipamiento",
  INFRAESTRUCTURA: "Infraestructura",
  TECNOLOGIA: "Tecnología",
  MOBILIARIO: "Mobiliario",
  VEHICULOS: "Vehículos",
  LICENCIAS: "Licencias",
  MARKETING_INICIAL: "Marketing inicial",
  CAPITAL_DE_TRABAJO: "Capital de trabajo",
  GASTOS_PREOPERATIVOS: "Gastos preoperativos",
  OTROS: "Otros",
};

export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  PESIMISTA: "Pesimista",
  BASE: "Base",
  OPTIMISTA: "Optimista",
};
