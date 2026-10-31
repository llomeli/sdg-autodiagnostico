# Modelo de madurez de gobierno del dato

## Resumen ejecutivo

El **Modelo de madurez de gobierno del dato** es un instrumento breve de autodiagnóstico para empresas mexicanas. Su propósito es identificar, de manera inicial y de alto nivel, qué tan desarrolladas están algunas prácticas relacionadas con la gestión, protección, integración, calidad y uso de los datos.

La herramienta está diseñada como un **lead magnet comercial**. Permite obtener información de contexto, reconocer necesidades potenciales y abrir una conversación posterior con un prospecto. No pretende sustituir una evaluación consultiva, una auditoría, una certificación, una revisión legal ni un diagnóstico técnico detallado.

La versión digital conserva la escala numérica del Excel de referencia: **Nivel 0 a Nivel 5**, además de la opción **N/A — No aplica**. El Excel fuente define el Nivel 0 como la ausencia de evidencia de cumplimiento y el Nivel 5 como una práctica realizada completamente y plenamente optimizada. La aplicación calcula una lectura inicial general y resultados agregados por dominio.

> El resultado debe interpretarse como una señal inicial de madurez percibida, basada en respuestas autodeclaradas. No constituye una conclusión definitiva sobre la situación de la organización.

## Contenido de la versión final

El cuestionario se organiza en **11 dominios de gestión de datos**, alineados con las áreas que aparecen en el cuestionario SDG/DMBOK proporcionado:

| Dominio | Preguntas finales | Enfoque principal |
|---|---:|---|
| Gobierno de datos | 5 | Responsabilidades, alineación con negocio, reglas, priorización, entregables y seguimiento. |
| Arquitectura de datos | 3 | Necesidades de datos, visión de arquitectura, sistemas, fuentes y flujos principales. |
| Modelado y diseño | 3 | Responsables, requisitos, modelos, estructuras y revisión ante cambios. |
| Seguridad de datos | 5 | Responsabilidades, accesos, privacidad, confidencialidad, controles y requisitos de seguridad. |
| Almacenamiento y operación | 4 | Administración, disponibilidad, respaldo, conservación, rendimiento, continuidad y recuperación. |
| Integración e interoperabilidad | 4 | Responsables, mapeos, transformaciones, errores, monitoreo y trazabilidad de integraciones. |
| Datos maestros y referencia | 4 | Responsables, dominios prioritarios, modelos, catálogos, duplicados, cambios y calidad. |
| BI y analítica | 4 | Capacidades, requisitos, arquitectura, reportes, fuentes, responsables, uso y desempeño. |
| Metadatos | 4 | Responsables, recolección, definiciones, calidad, seguridad, estándares, glosarios y linaje. |
| Calidad de datos | 6 | Responsabilidades, confianza, datos críticos, reglas, análisis, remediación, métricas y herramientas. |
| Gestión del cambio | 4 | Responsabilidad, cultura, comunicación, capacitación, adopción, mejora continua y aprendizaje. |
| **Total** | **46** | **11 dominios de gestión de datos.** |

Además de las 46 preguntas que integran la evaluación, el formulario solicita información de contexto que **no forma parte del puntaje de madurez**. Esta información incluye empresa, sector, tamaño, ubicación, sistemas relevantes, contacto principal, puesto, correo electrónico, teléfono, rol en la decisión, interlocutores adicionales, principal preocupación de datos, impacto, urgencia y proyectos próximos.

Estos campos tienen una finalidad de **calificación comercial y contextualización de la conversación**. No se utilizan para construir una metodología de madurez adicional.

## Origen de las preguntas

La fuente principal fue el archivo proporcionado por el equipo: **SDG_Questionnaire_AssessmentDataGovernance.xlsx**. La revisión del archivo confirmó que contiene 11 hojas de evaluación por dominio, sus hojas de resultados, hojas de consolidación y un catálogo de niveles 0 a 5.

El cuestionario fuente contiene **121 preguntas distribuidas en los mismos 11 dominios**. La versión digital final no reproduce las 121 preguntas. Es una selección y adaptación reducida de **46 preguntas núcleo**, equivalente a aproximadamente el 38% del inventario original.

| Dominio del Excel fuente | Preguntas en fuente | Preguntas finales |
|---|---:|---:|
| Data Governance | 11 | 5 |
| Data Architecture | 9 | 3 |
| Modeling and Design | 6 | 3 |
| Data Security | 10 | 5 |
| Storage and Operation | 10 | 4 |
| IID — Data Integration and Interoperability | 10 | 4 |
| Master Data | 12 | 4 |
| DWH and BI | 11 | 4 |
| Metadata | 11 | 4 |
| Data Quality | 19 | 6 |
| Change Management | 12 | 4 |
| **Total** | **121** | **46** |

Las preguntas finales **no se presentan como una copia literal** del Excel. Se tradujeron, simplificaron, combinaron o reformularon para hacerlas comprensibles para una pyme y contestables en una experiencia digital breve. En algunos casos, una pregunta final integra dos o más temas que en el Excel aparecían separados; en otros, se hicieron explícitos elementos operativos necesarios para que una empresa pequeña pueda responder sin conocer terminología especializada.

La referencia DAMA/DMBOK se utilizó como marco conceptual para conservar la separación por dominios y el lenguaje general de gestión de datos. No se incorporó al sitio una metodología completa de implementación, un modelo de remediación, ponderaciones, benchmarks, matrices de capacidad ni materiales internos de SDG.

## Criterios de selección y adaptación

La reducción de 121 a 46 preguntas se realizó con los siguientes criterios:

1. **Conservar la cobertura de los 11 dominios.** Cada área del Excel quedó representada en la versión final para evitar que el resultado se concentrara únicamente en gobierno, tecnología o seguridad.

2. **Priorizar capacidades esenciales.** Se conservaron preguntas sobre responsables, prácticas, entregables, métricas, herramientas, riesgos y relación con el negocio. Estos temas aparecen de forma recurrente en la estructura del Excel y permiten identificar señales de madurez sin revisar cada actividad especializada.

3. **Cubrir personas, procesos y tecnología.** El Excel organiza sus resultados alrededor de elementos como personas, procesos y tecnología, además de actividades, entregables, métricas y herramientas. La versión final mantiene esa lógica de cobertura, pero la expresa en preguntas más sencillas.

4. **Reducir duplicidades.** Se combinaron preguntas que medían prácticamente la misma capacidad, por ejemplo, documentación, reglas y definiciones; o bien métricas, reportes y herramientas de seguimiento.

5. **Ajustar el lenguaje a pymes mexicanas.** Se sustituyeron expresiones excesivamente técnicas por ejemplos reconocibles, como ERP, CRM, hojas de cálculo, reportes, respaldos, accesos, clientes, productos y proveedores.

6. **Priorizar respuestas accionables.** Se seleccionaron preguntas que pueden revelar una necesidad concreta de conversación, como falta de responsables, ausencia de reglas, problemas de calidad, integraciones frágiles, reportes poco confiables o falta de continuidad operativa.

7. **Mantener una experiencia breve.** El objetivo comercial es que el prospecto pueda terminar el cuestionario en aproximadamente 20 minutos. Por ese motivo no se incluyeron todas las preguntas sobre artefactos técnicos, subprocesos, métricas especializadas o herramientas concretas del Excel.

8. **Evitar revelar conocimiento propietario.** Se excluyeron instrucciones detalladas de implementación, criterios internos de remediación, secuencias de trabajo, ponderaciones propietarias, plantillas, benchmarks, aceleradores y recomendaciones específicas que forman parte del conocimiento consultivo de SDG.

9. **Separar diagnóstico de calificación comercial.** Las preguntas de madurez se mantienen separadas de los campos de contacto, urgencia, impacto y proyecto próximo. Así, el instrumento puede detectar necesidades comerciales sin presentar esos datos como una dimensión técnica adicional.

## Qué entrega y qué no entrega el instrumento

| El instrumento sí entrega | El instrumento no entrega |
|---|---|
| Una lectura inicial de alto nivel. | Una auditoría o certificación. |
| Un promedio general y lecturas agregadas por dominio. | Un diagnóstico exhaustivo de DMBOK. |
| Señales de fortalezas y posibles brechas. | Un plan de remediación detallado. |
| Contexto básico del prospecto y sus prioridades. | Ponderaciones o benchmarks propietarios de SDG. |
| Una base para iniciar una conversación comercial. | Arquitecturas, diseños, políticas o controles implementables. |
| Respuestas autodeclaradas almacenadas para seguimiento autorizado. | Una opinión legal, regulatoria o de cumplimiento. |

## Correo sugerido para el equipo de gobierno

**Asunto:** Propósito y alcance del modelo de autodiagnóstico de gobierno del dato

Estimado equipo,

Como parte de la preparación de una iniciativa comercial de SDG, se desarrolló un **Modelo de madurez de gobierno del dato: un modelo de autodiagnóstico para empresas mexicanas**.

El objetivo de este instrumento es ofrecer a potenciales clientes una primera lectura, breve y de alto nivel, sobre algunas prácticas relacionadas con el gobierno y la gestión de datos. El cuestionario se organiza en 11 dominios: gobierno, arquitectura, modelado y diseño, seguridad, almacenamiento y operación, integración e interoperabilidad, datos maestros y referencia, BI y analítica, metadatos, calidad de datos y gestión del cambio.

La versión final contiene 46 preguntas. Estas preguntas se obtuvieron a partir del cuestionario **SDG_Questionnaire_AssessmentDataGovernance.xlsx**, que contiene 121 preguntas en total. Para convertirlo en un recurso comercial breve, se seleccionaron, combinaron y reformularon preguntas sobre las capacidades más relevantes para una pyme. El lenguaje se adaptó al contexto de empresas mexicanas y se incorporaron ejemplos para facilitar la respuesta.

Es importante señalar que el instrumento **no pretende revelar la metodología, el conocimiento propietario ni los aceleradores de SDG**. El sitio no expone criterios internos de remediación, ponderaciones propietarias, benchmarks, plantillas, secuencias de implementación, modelos detallados de gobierno, diseños técnicos ni materiales consultivos. Sólo presenta una escala numérica de Nivel 0 a Nivel 5, tomada del Excel de referencia, y una lectura agregada para fines de orientación comercial.

El modelo tampoco se presenta como auditoría, certificación, diagnóstico técnico exhaustivo, opinión legal o evaluación formal de cumplimiento. Las respuestas son autodeclaradas y sirven para identificar señales iniciales, prioridades de negocio y posibles temas de conversación.

La finalidad principal es comercial: captar contactos interesados, entender de forma preliminar sus necesidades, identificar posibles oportunidades de apoyo y facilitar que un integrante del equipo se ponga en contacto con el prospecto. Los datos de contacto y las respuestas se almacenan para dar seguimiento conforme al consentimiento y al Aviso de Privacidad que deberá configurarse antes de publicar el formulario.

Desde esta perspectiva, el cuestionario debe entenderse como un **instrumento de prospección y conversación**, no como un producto metodológico completo. La información de mayor valor —interpretación detallada, priorización, diseño de remediación, acompañamiento, activos consultivos y conocimiento de implementación— permanece reservada para las etapas posteriores de conversación y servicio.

Agradeceremos sus comentarios sobre la redacción, el nivel de exposición y cualquier tema que deba excluirse o ajustarse antes de publicar la versión comercial.

Saludos,

**[Nombre]**  
**[Cargo]**  
**SDG Group**

## Referencias

[1]: /home/ubuntu/upload/SDG_Questionnaire_AssessmentDataGovernance.xlsx "Cuestionario SDG de evaluación de gobierno y gestión de datos proporcionado por el equipo"

[2]: https://dama.org/learning-resources/dama-data-management-body-of-knowledge-dmbok/ "DAMA Data Management Body of Knowledge (DAMA-DMBOK)"

[3]: /home/ubuntu/sdg-data-governance-lead-magnet/client/src/lib/assessment.ts "Catálogo final de dominios y preguntas de la versión digital"

[4]: /home/ubuntu/sdg-data-governance-lead-magnet/server/assessment.catalog.test.ts "Pruebas del catálogo final y de la escala de evaluación"

---

**Nota de control:** La cifra de 46 preguntas corresponde al catálogo final implementado en la aplicación. Los campos de perfil, contacto, interlocutores, prioridad y consentimiento se consideran captura contextual y comercial; no se suman al total de preguntas de madurez.
