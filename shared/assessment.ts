export type AssessmentQuestion = {
  id: string;
  text: string;
  hint: string;
};

export type AssessmentDomain = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  questions: AssessmentQuestion[];
};

export const domains: AssessmentDomain[] = [
  {
    id: "Gobierno de datos",
    title: "Gobierno de datos",
    shortTitle: "Gobierno",
    description: "Decisiones, políticas y responsabilidades para tratar los datos como un activo.",
    questions: [
      { id: "GOB-01", text: "¿Hay una persona, equipo o comité que coordine las decisiones y prácticas de gobierno de datos?", hint: "Ejemplo: patrocinador, responsable, comité o acuerdo operativo." },
      { id: "GOB-02", text: "¿La dirección ha relacionado los datos prioritarios con los objetivos del negocio?", hint: "Ejemplo: datos críticos para ventas, clientes, operación o finanzas." },
      { id: "GOB-03", text: "¿Existen reglas o definiciones aprobadas para crear, usar, compartir y entender los datos clave?", hint: "Ejemplo: políticas, estándares, glosario o acuerdos entre áreas." },
      { id: "GOB-04", text: "¿Hay una forma definida de recibir, priorizar y decidir solicitudes o proyectos relacionados con datos?", hint: "Ejemplo: criterios, responsable, reunión o bitácora." },
      { id: "GOB-05", text: "¿La organización genera algún entregable y mide algún avance de gobierno de datos?", hint: "Ejemplo: hoja de ruta, reglas, reportes, indicadores o tablero." },
    ],
  },
  {
    id: "Arquitectura de datos",
    title: "Arquitectura de datos",
    shortTitle: "Arquitectura",
    description: "Relación entre necesidades de negocio, sistemas, fuentes y flujos de información.",
    questions: [
      { id: "ARQ-01", text: "¿Se identifican las necesidades de datos del negocio y de TI, y existe alguien que las traduzca en requisitos?", hint: "Ejemplo: responsable, requisitos o lista de necesidades." },
      { id: "ARQ-02", text: "¿Existe una visión o ruta para organizar la arquitectura de datos y coordinarla con los cambios del negocio?", hint: "Ejemplo: principios, mapa de futuro o roadmap." },
      { id: "ARQ-03", text: "¿La empresa mantiene un inventario, diagrama o documentación sencilla de sus sistemas, fuentes y flujos principales?", hint: "Ejemplo: inventario, mapa de flujos o modelo." },
    ],
  },
  {
    id: "Modelado y diseño",
    title: "Modelado y diseño",
    shortTitle: "Modelado",
    description: "Requisitos, estructuras, entidades y reglas que hacen los datos comprensibles.",
    questions: [
      { id: "MOD-01", text: "¿Hay una persona o práctica para identificar requisitos de datos y mantener un plan de modelado?", hint: "Ejemplo: responsable, plan, criterios o calendario." },
      { id: "MOD-02", text: "¿Para los procesos críticos existen modelos, estructuras o diagramas que expliquen entidades, relaciones y reglas?", hint: "Ejemplo: modelo conceptual, lógico, físico o diagrama." },
      { id: "MOD-03", text: "¿Se revisan o validan los modelos cuando cambia el negocio, un sistema o una definición importante?", hint: "Ejemplo: control de cambios o validación." },
    ],
  },
  {
    id: "Seguridad de datos",
    title: "Seguridad de datos",
    shortTitle: "Seguridad",
    description: "Acceso, privacidad, confidencialidad y controles sobre información crítica.",
    questions: [
      { id: "SEG-01", text: "¿Está definido quién administra la seguridad, privacidad y confidencialidad de los datos?", hint: "Ejemplo: responsable interno, proveedor o función asignada." },
      { id: "SEG-02", text: "¿Existe un procedimiento para autorizar, revisar y retirar accesos a datos y sistemas?", hint: "Ejemplo: altas, bajas, matriz de accesos o revisión periódica." },
      { id: "SEG-03", text: "¿La empresa conoce las obligaciones aplicables sobre privacidad, protección y confidencialidad?", hint: "Ejemplo: aviso, riesgos identificados o asesoría." },
      { id: "SEG-04", text: "¿Hay políticas, controles y una forma de monitorear incidentes, protección o cumplimiento de seguridad?", hint: "Ejemplo: clasificación, incidentes, métricas o herramienta." },
      { id: "SEG-05", text: "¿Se identifican y documentan los requisitos de seguridad para sistemas o procesos críticos?", hint: "Ejemplo: requisitos, controles o evaluación de riesgo." },
    ],
  },
  {
    id: "Almacenamiento y operación",
    title: "Almacenamiento y operación",
    shortTitle: "Operación",
    description: "Disponibilidad, rendimiento, continuidad y recuperación de datos almacenados.",
    questions: [
      { id: "OPS-01", text: "¿Está definido quién administra las bases de datos, repositorios y operación de datos críticos?", hint: "Ejemplo: administrador, proveedor o responsable de nube." },
      { id: "OPS-02", text: "¿Se gestionan disponibilidad, respaldo, conservación y eliminación de datos durante su ciclo de vida?", hint: "Ejemplo: respaldos, retención o procedimiento." },
      { id: "OPS-03", text: "¿Se monitorean el rendimiento, la capacidad y la operación de los sistemas que almacenan datos?", hint: "Ejemplo: alertas, indicadores, bitácoras o herramientas." },
      { id: "OPS-04", text: "¿Existe un plan razonable para continuidad, recuperación y migración al cambiar o perder una plataforma?", hint: "Ejemplo: plan, pruebas de restauración o estrategia de migración." },
    ],
  },
  {
    id: "Integración e interoperabilidad",
    title: "Integración e interoperabilidad",
    shortTitle: "Integración",
    description: "Intercambio de datos entre sistemas con trazabilidad y consistencia.",
    questions: [
      { id: "INT-01", text: "¿Está definido quién diseña, mantiene y supervisa las integraciones entre sistemas?", hint: "Ejemplo: responsable, proveedor, desarrollador o dueño de interfaz." },
      { id: "INT-02", text: "¿Las integraciones principales tienen flujos, mapeos, reglas de transformación y solución definida entre origen y destino?", hint: "Ejemplo: diagrama, API, ETL, mapping o procedimiento." },
      { id: "INT-03", text: "¿Se detectan y atienden errores, retrasos, duplicados o fallas en el intercambio de datos?", hint: "Ejemplo: alertas, conciliaciones o bitácoras." },
      { id: "INT-04", text: "¿Se documentan el linaje, frecuencia, volumen o desempeño de las integraciones relevantes?", hint: "Ejemplo: linaje, perfilado, acuerdos o métricas." },
    ],
  },
  {
    id: "Datos maestros y referencia",
    title: "Datos maestros y referencia",
    shortTitle: "Maestros",
    description: "Consistencia de clientes, productos, proveedores, sucursales y catálogos compartidos.",
    questions: [
      { id: "MDM-01", text: "¿Hay responsables de negocio y técnicos para mantener la calidad y el uso consistente de datos maestros?", hint: "Ejemplo: dueño de datos, custodio o área responsable." },
      { id: "MDM-02", text: "¿Se han documentado los dominios maestros prioritarios y se revisa la calidad de sus fuentes?", hint: "Ejemplo: clientes, productos, proveedores, reglas o revisión." },
      { id: "MDM-03", text: "¿Existe una estructura o modelo para administrar los datos maestros y sus relaciones principales?", hint: "Ejemplo: modelo, arquitectura, catálogo o repositorio." },
      { id: "MDM-04", text: "¿Se controlan catálogos, duplicados, cambios, intercambio y calidad de los datos maestros?", hint: "Ejemplo: políticas, monitoreo, métricas, MDM, integración o calidad." },
    ],
  },
  {
    id: "BI y analítica",
    title: "BI y analítica",
    shortTitle: "BI y analítica",
    description: "Reportes, indicadores, productos analíticos y decisiones confiables.",
    questions: [
      { id: "BI-01", text: "¿La empresa cuenta con capacidades internas o externas para desarrollar, mantener y consumir reportes y análisis?", hint: "Ejemplo: personas, proveedor, habilidades o capacitación." },
      { id: "BI-02", text: "¿Se documentan, priorizan y mantienen requisitos y arquitectura de iniciativas de BI o analítica?", hint: "Ejemplo: portafolio, requisitos, arquitectura o prioridades." },
      { id: "BI-03", text: "¿Los reportes, tableros o productos analíticos tienen fuentes, reglas de transformación, responsables y mantenimiento?", hint: "Ejemplo: mapping, catálogo, dueño o calendario." },
      { id: "BI-04", text: "¿Se mide el uso, satisfacción, oportunidad o desempeño de los reportes y se cuenta con herramientas adecuadas?", hint: "Ejemplo: indicadores, encuestas, tiempos o BI de autoservicio." },
    ],
  },
  {
    id: "Metadatos",
    title: "Metadatos",
    shortTitle: "Metadatos",
    description: "Definiciones, origen, reglas y trazabilidad que explican qué significan los datos.",
    questions: [
      { id: "MET-01", text: "¿Hay responsables para capturar, mantener y utilizar metadatos de los datos críticos?", hint: "Ejemplo: dueño, custodio, administrador o usuario clave." },
      { id: "MET-02", text: "¿Existe una práctica para recopilar definiciones, requisitos y metadatos de distintas fuentes?", hint: "Ejemplo: glosario, catálogo, procedimiento o estrategia." },
      { id: "MET-03", text: "¿Se revisa la calidad, seguridad, acceso y administración de los repositorios o catálogos de metadatos?", hint: "Ejemplo: reglas, permisos, repositorio, revisión o linaje." },
      { id: "MET-04", text: "¿Se mantienen estándares, glosarios, linaje o métricas de cobertura mediante herramientas o repositorios?", hint: "Ejemplo: estándares, glosario, linaje, métricas o herramienta." },
    ],
  },
  {
    id: "Calidad de datos",
    title: "Calidad de datos",
    shortTitle: "Calidad",
    description: "Confianza, completitud, exactitud y remediación de datos para decisiones y operación.",
    questions: [
      { id: "CAL-01", text: "¿Hay una persona o práctica que coordine problemas de calidad y los priorice con usuarios y responsables?", hint: "Ejemplo: responsable, reunión, bitácora o priorización." },
      { id: "CAL-02", text: "¿La dirección y las áreas confían en los datos críticos y entienden su impacto en la estrategia?", hint: "Ejemplo: datos críticos, decisiones, impacto o nivel de confianza." },
      { id: "CAL-03", text: "¿Se han definido necesidades, políticas y reglas de calidad para datos usados en procesos prioritarios?", hint: "Ejemplo: política, reglas, dimensiones o tolerancias." },
      { id: "CAL-04", text: "¿Se analizan los datos, se documentan tipos de problema y se registran niveles de incumplimiento?", hint: "Ejemplo: perfilado, análisis o catálogo de errores." },
      { id: "CAL-05", text: "¿Se definen acciones preventivas y correctivas, y se mantienen actualizadas las reglas de calidad?", hint: "Ejemplo: plan de remediación, causa raíz o revisión de reglas." },
      { id: "CAL-06", text: "¿Se producen reportes o indicadores de calidad y se usan herramientas para perfilar o corregir datos?", hint: "Ejemplo: reporte, métrica, perfilado, reglas o ETL." },
    ],
  },
  {
    id: "Gestión del cambio",
    title: "Gestión del cambio",
    shortTitle: "Cambio",
    description: "Adopción, comunicación, capacitación y mejora continua de prácticas de datos.",
    questions: [
      { id: "CHG-01", text: "¿Hay una persona o área responsable de coordinar adopción y gestión del cambio en iniciativas de datos?", hint: "Ejemplo: responsable, proveedor o función asignada." },
      { id: "CHG-02", text: "¿La empresa comunica responsabilidades de datos y promueve hábitos de trabajo orientados a datos?", hint: "Ejemplo: plan de comunicación, reuniones o prácticas." },
      { id: "CHG-03", text: "¿Existen capacitaciones o materiales para gobierno, consumo, seguridad, privacidad, maestros y calidad?", hint: "Ejemplo: plan, sesiones, material o registro de asistencia." },
      { id: "CHG-04", text: "¿Se identifican iniciativas de mejora, se revisan avances y existe un espacio para aprender o consultar prácticas?", hint: "Ejemplo: plan, tablero, retrospectiva, portal o repositorio." },
    ],
  },
];

export const totalQuestions = domains.reduce((sum, domain) => sum + domain.questions.length, 0);

export function isValidOptionalWebsite(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function isValidOptionalEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export type AnswerStatus = {
  score: number | null;
  isNotApplicable: boolean;
};

export function getUnansweredQuestionIds(questionIds: string[], answers: Record<string, AnswerStatus>) {
  return questionIds.filter(questionId => {
    const answer = answers[questionId];
    return !answer || (answer.score === null && !answer.isNotApplicable);
  });
}

export const maturityLabels = [
  { value: 0, label: "Nivel 0" },
  { value: 1, label: "Nivel 1" },
  { value: 2, label: "Nivel 2" },
  { value: 3, label: "Nivel 3" },
  { value: 4, label: "Nivel 4" },
  { value: 5, label: "Nivel 5" },
];
