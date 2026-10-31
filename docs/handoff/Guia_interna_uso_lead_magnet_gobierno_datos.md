# Guía interna de uso del lead magnet de gobierno de datos

## Corrección de trazabilidad

Esta versión corrige la documentación anterior. El archivo fuente proporcionado para el ejercicio sí contiene información y fue utilizado como base de reconstrucción. La inspección técnica confirmó un libro de Excel de **1,074,647 bytes**, con **31 pestañas en total**, **30 visibles**, una pestaña de catálogos oculta, **11 dominios de gestión de datos**, sus pestañas de resultados y hojas complementarias de consolidación y capacidades.

El cuestionario fuente contiene **121 preguntas numeradas**. Las preguntas están organizadas por dominio y se responden con una escala de madurez de 0 a 5 desde distintos roles, entre ellos CDO, CIO, CDGO, CISO, Data Owners y Data Stewards. Las hojas de resultados del archivo original calculan promedios por dominio y agrupan la evaluación en seis elementos de capacidad: **Roles y responsabilidades, Organización y cultura, Actividades, Entregables, Métricas y Herramientas**.

El nuevo workbook v2 conserva esa lógica como base. Selecciona y adapta **46 preguntas** para una primera conversación con pymes mexicanas. Cada pregunta nueva mantiene una referencia interna a las preguntas fuente que la originan. Esa matriz está incluida en una pestaña oculta para control interno y no se muestra en la versión pública del lead magnet.

## Propósito

El workbook **Autodiagnóstico de madurez de gobierno de datos para pymes mexicanas** está diseñado como una herramienta gratuita de captura y cualificación comercial. Su función es abrir una conversación sobre problemas de datos, impacto de negocio, responsables y posibles primeros pasos. No emite una certificación ni sustituye una auditoría.

La adaptación mantiene los 11 dominios que aparecen en el Excel fuente: Gobierno de datos; Arquitectura de datos; Modelado y diseño; Seguridad de datos; Almacenamiento y operación; Integración e interoperabilidad; Datos maestros y referencia; BI y analítica; Metadatos; Calidad de datos; y Gestión del cambio.

## Qué cambió frente al archivo fuente

El archivo fuente es una herramienta amplia de evaluación organizacional. Incluye preguntas para diferentes roles, hojas de resultados por dominio, métricas de capacidad, consolidado y catálogos. Para convertirlo en un lead magnet, se realizaron cuatro ajustes controlados.

Primero, se conservaron los 11 dominios y los seis elementos de capacidad de la fuente. Segundo, se seleccionaron las preguntas con mayor valor para una conversación inicial: responsabilidades, cultura, prácticas, entregables, métricas y herramientas. Tercero, se fusionaron preguntas repetidas o muy especializadas para reducir la carga de respuesta y traducirlas a situaciones observables en una pyme. Cuarto, se incorporaron campos comerciales y de interlocutores que no estaban integrados como ficha de prospecto: nombre, posición, correo, teléfono, rol, influencia, urgencia, proyecto y consentimiento.

El nivel objetivo 3 y el nivel máximo 5 que aparecen en varias hojas de resultados del archivo fuente no se presentan como una calificación comercial automática en el workbook v2. Se conserva la escala 0–5, pero se deja la interpretación al contexto, la evidencia y el impacto de negocio. Esto evita presentar como incumplimiento una brecha que puede ser razonable para el tamaño o sector de una pyme.

## Contenido del workbook v2

| Componente | Propósito |
|---|---|
| Portada | Explicar propósito, escala, uso y límites. |
| Prospecto | Capturar organización, contacto principal, interlocutores, responsables, disparadores y consentimiento. |
| Resumen | Mostrar promedios por dominio, nivel general orientativo, respuestas y prioridades altas. |
| 11 dominios DAMA adaptados | Recabar 46 respuestas seleccionadas del cuestionario fuente real. |
| Recomendaciones | Apoyar la conversación inicial de remediación sin revelar la metodología completa. |
| Notas de uso | Explicar alcance, adaptación y uso responsable para la persona que responde. |
| Matriz interna oculta | Conservar trazabilidad dominio por dominio entre preguntas adaptadas y preguntas fuente. |

## Escala de madurez

La escala conserva la lógica del cuestionario original. El valor 0 representa ausencia de evidencia; el valor 1, una práctica reactiva; el valor 2, una práctica en desarrollo; el valor 3, una práctica definida; el valor 4, una práctica gestionada; y el valor 5, una práctica optimizada. **N/A** no entra en el promedio.

El nivel general se presenta como Sin evidencia, Reactivo, En desarrollo, Definido, Gestionado u Optimizado. La lectura debe acompañarse de evidencia, impacto, criticidad del proceso y capacidad de ejecución.

## Flujo recomendado para el prospecto

Comparte el archivo después de una conversación breve, una página de aterrizaje o una campaña segmentada. Solicita primero los datos de la organización y del contacto principal. Después pide que participe al menos una persona de dirección o gerencia y, cuando sea posible, un responsable de proceso o sistemas.

Pide que la persona responda pensando en la situación actual. Si no conoce una respuesta, debe usar **N/A** y registrar qué evidencia sería necesaria para validarla. Esto evita respuestas especulativas y genera temas concretos para la conversación de seguimiento.

## Criterios de cualificación comercial

Un prospecto puede considerarse prioritario cuando existe una combinación de puntuación baja, prioridad alta, impacto explícito y patrocinio interno. Revisa especialmente las respuestas que afectan continuidad operativa, clientes, ingresos, seguridad, privacidad, reportes directivos o cumplimiento.

| Señal | Pregunta de seguimiento |
|---|---|
| Respuesta 0 o 1 | ¿Qué ocurre hoy cuando este problema se presenta? |
| Prioridad Alta | ¿Qué riesgo o impacto hace que sea urgente? |
| Responsable vacío | ¿Quién puede tomar o coordinar la decisión? |
| Evidencia no disponible | ¿Qué sistema, archivo, política o indicador habría que revisar? |
| Proyecto próximo | ¿Qué fecha objetivo o cambio de negocio vuelve relevante el tema? |
| Varias áreas involucradas | ¿Qué patrocinador puede reunirlas para una primera sesión? |

## Cómo no exponer toda la metodología

La versión pública muestra preguntas, escala, resultados básicos y primeros pasos generales. No muestra la matriz interna de trazabilidad entre preguntas, criterios detallados de auditoría, reglas internas de severidad, plantillas de implementación, arquitectura objetivo, estimaciones de esfuerzo ni metodología propia de remediación.

La pestaña **Matriz interna** permanece oculta en el workbook v2. Conserva una versión interna adicional con reglas de priorización, guion de entrevista, criterios de severidad, patrones de solución, plantillas y casos de éxito. La versión pública debe dar suficiente valor para que el prospecto entienda su situación, pero dejar claro que la remediación requiere análisis contextual.

## Preparación de campaña

La landing page debe explicar que el recurso es un autodiagnóstico breve basado en prácticas de gestión de datos y adaptado a pymes. El formulario o archivo debe solicitar sólo la información necesaria para entregar el recurso y continuar la conversación. Una llamada a la acción adecuada puede ser: **“Recibe una lectura inicial de tus focos de atención y una conversación exploratoria de 30 minutos.”**

En el CRM, guarda al menos los siguientes campos: empresa, sector, tamaño, estado, ciudad, nombre completo, posición, correo, teléfono o WhatsApp, área, rol en la decisión, prioridad percibida, proyecto próximo, resultado general, dominios con menor promedio, consentimiento, fuente de campaña y fecha de contacto.

## Privacidad y operación en México

Antes de publicar el recurso, reemplaza los marcadores `[NOMBRE DE TU EMPRESA]` y `[URL]` del workbook con tu identidad legal, Aviso de Privacidad y mecanismo real de consentimiento. La Cámara de Diputados publica el texto vigente de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y señala que la última reforma consultada fue publicada en el Diario Oficial de la Federación el 14 de noviembre de 2025 [2].

No solicites datos personales sensibles en este instrumento. Define la finalidad de la captura, los medios de contacto, la conservación, la revocación del consentimiento y la transferencia a herramientas de marketing o CRM con asesoría legal mexicana. Si el archivo se enviará por correo o se cargará a una plataforma, define quién tendrá acceso y cómo se eliminarán las copias que ya no sean necesarias.

## Control de calidad de la reconstrucción

Se verificó que el archivo fuente actual existe, tiene contenido, contiene 121 preguntas numeradas y conserva las 11 áreas utilizadas en la adaptación. Se revisó la estructura de hojas, las preguntas por dominio, las hojas de resultados y los seis elementos de capacidad. El workbook v2 se construyó desde ese contenido, con una matriz de trazabilidad oculta y campos adicionales para captación comercial.

También se validó la existencia de 46 preguntas adaptadas, las fórmulas de promedio, los desplegables, la navegación interna y la actualización del resumen mediante respuestas de prueba. El archivo original se conserva sin modificaciones.

## Referencias

[1]: https://dama.org/learning-resources/dama-data-management-body-of-knowledge-dmbok/ "DAMA International: DAMA Data Management Body of Knowledge"

[2]: https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp.htm "Cámara de Diputados: Ley Federal de Protección de Datos Personales en Posesión de los Particulares"
