# Producto y modelo de evaluación

## Propósito y propuesta de valor

**Modelo de madurez de gobierno del dato. Un modelo de autodiagnóstico para empresas mexicanas.** Es un lead magnet digital gratuito para ofrecer a una organización una primera lectura breve de algunas prácticas de gestión de datos, mientras permite a SDG Group captar datos de contacto, entender el contexto y abrir una conversación comercial informada.

El objetivo operativo no es certificar ni calificar formalmente a la empresa, sino producir una señal orientativa: qué prácticas parecen existir, dónde percibe el prospecto dificultades y quién puede participar en un siguiente diálogo. Las respuestas son autodeclaradas y no necesariamente están verificadas con evidencia.

## Qué hace la experiencia

1. **Perfil y contexto:** empresa, sector, tamaño, ubicación, sistemas clave; contacto principal e interlocutores; preocupación, impacto, urgencia, proyecto próximo y consentimiento.
2. **Diagnóstico:** 46 preguntas agrupadas por dominio. Cada pregunta permite elegir Nivel 0–5 o N/A y, de forma opcional, añadir prioridad, responsable/rol, proceso/sistema y comentario.
3. **Revisión y envío:** presenta promedio general y por dominio antes de enviar. La acción final guarda los datos de contacto y respuestas. Tras confirmación se presenta un resultado de alto nivel y el mensaje de que el equipo dará seguimiento; no hay botón para volver a editar.
4. **Panel interno:** acceso administrativo para revisar prospectos, detalle de respuestas, prioridad e información del contacto; estatus de prospecto nuevo, en revisión, contactado, calificado o archivado.

## Dominios y cantidad de preguntas

| Dominio de la experiencia | Preguntas | Cobertura de alto nivel |
|---|---:|---|
| Gobierno de datos | 5 | Responsabilidades, vínculo con negocio, reglas, priorización y seguimiento. |
| Arquitectura de datos | 3 | Necesidades, ruta y documentación de sistemas, fuentes y flujos. |
| Modelado y diseño | 3 | Requisitos, modelos/estructuras y revisión de cambios. |
| Seguridad de datos | 5 | Responsables, accesos, privacidad, controles y requisitos. |
| Almacenamiento y operación | 4 | Administración, respaldo, disponibilidad, rendimiento y recuperación. |
| Integración e interoperabilidad | 4 | Responsabilidades, mapeos, errores, monitoreo y trazabilidad. |
| Datos maestros y referencia | 4 | Responsables, dominios prioritarios, catálogos, duplicados y calidad. |
| BI y analítica | 4 | Capacidades, requisitos, fuentes, reportes, uso y desempeño. |
| Metadatos | 4 | Roles, definiciones, catálogos, estándares, seguridad y linaje. |
| Calidad de datos | 6 | Responsabilidad, confianza, reglas, análisis, remediación y medición. |
| Gestión del cambio | 4 | Adopción, comunicación, capacitación y mejora. |
| **Total** | **46** | Captura de madurez; no incluye campos comerciales/contextuales. |

## Escala

La escala que muestra el formulario fue tomada de la referencia Excel SDG/DMBOK: **Nivel 0 a Nivel 5**, además de **N/A — No aplica**. La referencia describe Nivel 0 como ausencia de evidencia y Nivel 5 como práctica realizada completamente y plenamente optimizada. Los números se muestran tal cual para no sustituir la escala del archivo. N/A no contribuye al promedio. El promedio y la etiqueta de nivel son orientativos; no equivalen a un benchmark de industria.

## Origen de preguntas y reducción

El cuestionario fuente fue `SDG_Questionnaire_AssessmentDataGovernance.xlsx`, incluido en `reference/`. La revisión consignada en materiales del proyecto identificó **121 preguntas** a través de **11 dominios**, junto con pestañas de resultado y catálogos. La versión digital utiliza **46 preguntas adaptadas** —aproximadamente 38% del inventario numerado— y conserva la separación por dominios.

No son una reproducción literal: se tradujeron, resumieron, combinaron o reformularon para una experiencia breve y comprensible para pymes. DAMA/DMBOK es el marco de referencia conceptual para la organización por áreas, no una afirmación de certificación ni una validación de DAMA del producto.

Criterios aplicados:

- Mantener cobertura de los 11 dominios para no sesgar la lectura a tecnología, seguridad o gobierno solamente.
- Priorizar señales sobre roles/responsabilidades, cultura, prácticas, entregables, métricas y herramientas; son temas transversales del archivo de referencia.
- Cubrir personas, procesos y tecnología con preguntas que una empresa pequeña pueda responder sin conocer nomenclatura especializada.
- Agrupar contenidos repetidos o muy técnicos y reducir el tiempo de respuesta a alrededor de 20 minutos.
- Conservar ejemplos cotidianos (ERP, CRM, hojas de cálculo, reportes, respaldos, accesos, clientes/productos/proveedores).
- Favorecer respuestas que abren una conversación útil (responsable ausente, reglas, calidad, integración frágil, reporte no confiable o continuidad).
- Separar captura comercial (contacto, impacto, urgencia, proyecto) del puntaje de madurez.
- Evitar exponer instrucciones consultivas, plan completo de remediación, ponderaciones, benchmark, plantillas, arquitectura objetivo y aceleradores propietarios.

## Límites y salvaguardas

**Sí ofrece:** una lectura inicial general y agregada por dominio, señales para conversar, captura de contexto comercial con consentimiento.

**No ofrece:** auditoría, certificación, opinión legal, diagnóstico formal de cumplimiento, validación de evidencia, evaluación exhaustiva DMBOK, benchmark, ponderación propietaria, hoja de ruta específica, diseño técnico o plan detallado de remediación.

El workbook `Autodiagnostico_Madurez_Gobierno_Datos_Pymes_Mexico_v2.xlsx` se incluye como material de trabajo interno y puede contener hojas ocultas de trazabilidad o uso consultivo. **No distribuir ese archivo al prospecto** sin una revisión explícita de todas sus hojas/propiedades. La experiencia pública utiliza el catálogo del código `client/src/lib/assessment.ts`.

## Mensaje comercial sugerido

“Completa un autodiagnóstico breve para obtener una lectura inicial de tus prácticas de gobierno del dato. El resultado es orientativo, no una auditoría; te ayuda a decidir qué conversación conviene tener después.”
