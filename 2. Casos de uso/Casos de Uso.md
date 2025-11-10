<h1>Especificacion de Casos de Uso</h1>
<p>
<img width="13875" height="3077" alt="Casos de uso - CAIL" src="https://github.com/user-attachments/assets/cfab8210-88d0-4948-abb2-85a3d9f6c9c6" />
</p>
<h3>CASOS DE USO – SISTEMA DE BOLSA DE EMPLEO CAIL</h3>

**Version 2.0**

**Fecha:** 05 de noviembre del 2025  

<h3>Actores del Sitema</h3>

| Actor | Descripción |
|:-------:|-------------|
| Administrador | Personal de CAIL que supervisa registros, valida procesos y gestiona el sistema |
| Empresa | Organización emisora (registra empleados) o receptora (publica vacantes) |
| Empleado | Trabajador disponible para recolocación laboral |
| CAIL | Repositorio central de datos de la bolsa de empleo |
| SRI | Servicio de Rentas Internas - valida RUC de empresas |
| Registro Civil | Valida cédulas de identidad de empleados |
| IESS | Instituto Ecuatoriano de Seguridad Social - valida afiliaciones |

<h3>Justificación de Casos de Uso</h3>

<h3>Módulo 1: Registro y Gestión de Perfiles</h3>


| Campo | Descripción |
|-------|-------------|
| **ID** | CU-001 |
| **Nombre** | Registro de Empresa |
| **Actores Principales** | Administrador |
| **Actores Secundarios** | SRI, CAIL |
| **Propósito** | Registrar una nueva empresa afiliada a la CAIL para que pueda participar como emisora y/o receptora de empleados. |
| **Precondiciones** | • El administrador está autorizado para registrar empresas.<br>• La empresa no está previamente registrada.<br>• Se cuenta con la documentación legal de la empresa |
| **Postcondiciones** | • La empresa queda registrada y activa<br>• La empresa recibe credenciales de acceso<br>• El administrador es notificado del registro exitoso |
| **Flujo Principal** | 1. El administrador registra una nueva empresa<br>2. El administrador ingresa el RUC de la empresa en CAIL<br>3. CAIL solicita validación del RUC al SRI<br>4. SRI valida y retorna datos básicos de la empresa<br>5. El administrador registra los datos generales de la empresa (razón social, dirección, teléfono, email, sector industrial).<br>6. El administrador confirma el registro de la empresa<br>7. CAIL asigna credenciales de acceso para la empresa<br>8. Empresa recibe credenciales proporcionadas por CAIL<br>9. CAIL confirma el registro exitoso al administrador |
| **Reglas de Negocio** | • RN-001: El RUC debe ser válido y estar activo en el SRI<br>• RN-002: Una empresa solo puede registrarse una vez<br>• RN-004: El email de la empresa debe ser único |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-002 |
| **Nombre** | Registro de Empleados |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | Registro Civil, CAIL |
| **Propósito** | Registrar un empleado en la bolsa de empleo para su potencial reubicación en otra empresa |
| **Precondiciones** | • La empresa está registrada y activa en CAIL<br>• El empleado cumple con la antigüedad mínima requerida<br>• La empresa ha decidido publicar al empleado |
| **Postcondiciones** | • El empleado queda registrado con estado "En Revisión"<br>• El empleado y la empresa reciben el informe de ponderación<br>• El administrador es notificado para supervisión<br>• El empleado queda disponible para fichaje (si es aceptado) |
| **Flujo Principal** | 1. La empresa decide publicar a un empleado<br>2. La empresa ingresa la cédula del empleado<br>3. CAIL solicita validación de identidad al Registro Civil<br>4. Registro Civil valida la identidad del empleado<br>5. Registro Civil proporciona los datos personales del empleado (nombres, fecha nacimiento, dirección, email, teléfono)<br>6. La empresa proporciona el historial laboral del empleado (cargo actual, fecha ingreso, años de antigüedad, funciones realizadas)<br>7. La empresa proporciona las competencias del empleado (habilidades técnicas, nivel de experiencia, certificaciones, logros)<br>8. La empresa adjunta documentación de soporte (contratos, certificados)<br>9. CAIL evalúa el desempeño histórico del empleado<br>10. CAIL registra el informe de ponderación<br>11. El empleado y la empresa reciben el informe proporcionado por CAIL<br>12. La empresa acepta la publicación del empleado<br>13. CAIL asigna la disponibilidad de empleado<br>14. CAIL notifica al administrador sobre el nuevo empleado disponible |
| **Reglas de Negocio** | • RN-005: El empleado debe tener al menos 8 años de antigüedad para calificar<br>• RN-006: Un empleado solo puede estar activo en varias publicaciones a la vez<br>• RN-007: La empresa debe aceptar el informe de ponderación antes de publicar<br>• RN-008: El correo del empleado debe ser único |

<h3>Módulo 2: Clasificación De Efectividad Laboral</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-003 |
| **Nombre** | Evaluar Desempeño Histórico |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Secundario (Include) |
| **Propósito** | Calcular la efectividad laboral del empleado basándose en criterios predefinidos. |
| **Precondiciones** | • Los datos del empleado han sido proporcionados completamente<br>• Existen parámetros de ponderación definidos |
| **Postcondiciones** | • Se obtiene un puntaje de efectividad laboral<br>• Se genera un informe detallado de ponderación<br>• El informe queda registrado |
| **Flujo Principal** | 1. CAIL recibe los datos completos del empleado<br>2. CAIL evalúa los logros empresariales registrados (premios, reconocimientos, proyectos exitosos)<br>3. CAIL evalúa las certificaciones obtenidas (cantidad, relevancia, vigencia)<br>4. CAIL evalúa la actitud laboral (evaluaciones previas, sanciones, llamados de atención)<br>5. CAIL evalúa la antigüedad en la empresa (años completos de servicio)<br>6. CAIL evalúa el nivel de titulación académica (bachiller, técnico, tecnólogo, tercer nivel, cuarto nivel)<br>7. CAIL aplica los pesos ponderados a cada criterio<br>8. CAIL asigna el puntaje global de efectividad (escala 0-100)<br>9. CAIL determina el nivel laboral del empleado<br>10. CAIL devuelve el informe de ponderación<br>11. CAIL almacena la evaluación en el historial del empleado |
| **Reglas de Negocio** | • RN-009: Logros empresariales: peso 20%<br>• RN-010: Certificaciones: peso 15%<br>• RN-011: Actitud laboral: peso 25%<br>• RN-012: Antigüedad: peso 25%<br>• RN-013: Titulación: peso 15%<br>• RN-014: Puntaje mínimo para publicación: 50 puntos |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-004 |
| **Nombre** | Registrar Nivel Laboral |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | Ninguno |
| **Tipo** | Secundario (Include) |
| **Propósito** | Clasificar al empleado según su nivel de experiencia para facilitar el matching. |
| **Precondiciones** | • Se ha calculado el puntaje de efectividad laboral<br>• Existen rangos de clasificación definidos |
| **Postcondiciones** | • El empleado tiene asignado un nivel laboral<br>• El nivel queda registrado en su perfil |
| **Flujo Principal** | 1. CAIL recibe el puntaje de efectividad laboral del empleado<br>2. CAIL determina los años de experiencia del empleado<br>3. Si tiene 0-3 años de experiencia, CAIL asigna nivel "Junior"<br>4. Si tiene 4-8 años de experiencia, CAIL asigna nivel "Mid-Level"<br>5. Si tiene más de 8 años de experiencia, CAIL asigna nivel "Senior"<br>6. CAIL devuelve el nivel estimado del empleado<br>7. CAIL registra el nivel laboral en el informe de ponderación |
| **Reglas de Negocio** | • RN-015: Junior: 0-3 años de experiencia<br>• RN-016: Mid-Level: 4-8 años de experiencia<br>• RN-017: Senior: más de 8 años de experiencia |

<h3>Módulo 3: Generación De Informes De Ponderación</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-005 |
| **Nombre** | Consolidar Resultados |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Agrupar todos los datos evaluados del empleado en un formato estructurado. |
| **Precondiciones** | • Se ha completado la evaluación de desempeño histórico<br>• Se ha determinado el nivel laboral<br>• Todos los criterios han sido evaluados |
| **Postcondiciones** | • Se genera un documento consolidado con todos los resultados<br>• Los datos quedan estructurados para el informe final |
| **Flujo Principal** | 1. CAIL recopila/reune todos los puntajes parciales de evaluación<br>2. CAIL agrupa/junta los logros empresariales con su puntaje<br>3. CAIL agrupa las certificaciones con su puntaje<br>4. CAIL agrupa la evaluación de actitud con su puntaje<br>5. CAIL agrupa la antigüedad con su puntaje<br>6. CAIL agrupa la titulación con su puntaje<br>7. CAIL incluye el nivel laboral asignado<br>8. CAIL devuelve toda la información en formato de resumen |
| **Reglas de Negocio** | NA |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-006 |
| **Nombre** | Asignar Puntaje Global de Efectividad |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Calcular y asignar el puntaje final ponderado que representa la efectividad laboral del empleado. |
| **Precondiciones** | • Los resultados han sido consolidados<br>• Los pesos ponderados están definidos |
| **Postcondiciones** | • El empleado tiene asignado un puntaje global (0-100)<br>• El puntaje queda registrado en su perfil<br>• Se genera el informe de ponderación final |
| **Flujo Principal** | 1. CAIL recibe los datos consolidados del empleado<br>2. CAIL pondera a los empleados.<br>3. CAIL revisa el puntaje final del empleado<br>4. CAIL valida que el puntaje del empleado esté en el rango 0-100<br>5. CAIL registra el puntaje global en el perfil del empleado<br>6. CAIL registra el informe de la ponderación del empleado:<br>&nbsp;&nbsp;&nbsp;• Datos del empleado<br>&nbsp;&nbsp;&nbsp;• Desglose de cada criterio evaluado<br>&nbsp;&nbsp;&nbsp;• Justificación de puntajes<br>&nbsp;&nbsp;&nbsp;• Puntaje global final<br>&nbsp;&nbsp;&nbsp;• Nivel laboral asignado<br>&nbsp;&nbsp;&nbsp;• Fecha de evaluación<br>7. CAIL envía el informe por email al empleado y a la empresa emisora |
| **Reglas de Negocio** | • RN-018: El puntaje global debe estar entre 0 y 100<br>• RN-019: El informe debe incluir justificación legal de cada criterio<br>• RN-020: El informe es inmutable una vez generado |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-007 |
| **Nombre** | Confirmar o Rechazar Resultados |
| **Actores Principales** | Empresa, Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Permitir que la empresa valide el informe de ponderación antes de publicar al empleado. |
| **Precondiciones** | • El informe de ponderación ha sido generado<br>• El empleado ha recibido el informe<br>• La empresa ha revisado el informe |
| **Postcondiciones** | • El empleado pasa a estado "Disponible" o "Rechazado"<br>• El administrador es notificado de la decisión<br>• Si acepta, el empleado queda visible para matching |
| **Flujo Principal** | 1. La empresa recibe el informe de ponderación del empleado<br>2. La empresa revisa el informe y los puntajes asignados<br>3. La empresa decide aceptar la publicación del empleado una vez se llega a un acuerdo<br>4. La empresa confirma la aceptación ante CAIL<br>5. CAIL asigna la disponibilidad del empleado<br>6. CAIL recomienda al empleado<br>7. CAIL notifica al administrador sobre el nuevo empleado disponible<br>8. CAIL notifica la confirmación del informe a empleado<br>9. CAIL confirma la operación a la empresa |
| **Reglas de Negocio** | • RN-021: Si la empresa rechaza, el empleado no se publica y se archiva<br>• RN-022: La empresa tiene 5 días hábiles para confirmar o rechazar<br>• RN-023: Después de 5 días sin respuesta, se rechaza automáticamente |

<h3>Módulo 4: Colocación Laboral</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-008 |
| **Nombre** | Gestión de Coincidencias |
| **Actores Principales** | Empresa (Receptora) |
| **Actores Secundarios** | Ninguna |
| **Tipo** | Primario |
| **Propósito** | Buscar y filtrar empleados que coincidan con las vacantes o preferencias de la empresa receptora. |
| **Precondiciones** | • La empresa receptora está registrada y activa<br>• Existen vacantes registradas por la empresa<br>• Existen empleados disponibles en la bolsa |
| **Postcondiciones** | • La empresa obtiene una lista de empleados que coinciden con sus criterios<br>• La empresa puede revisar perfiles completos de candidatos sugeridos |
| **Flujo Principal** | 1. La empresa receptora solicita búsqueda de candidatos para una vacante<br>2. CAIL identifica la vacante solicitada<br>3. CAIL evalúa a una posible empresa interesada<br>4. CAIL ubica empleados dependiendo de sus competencias requeridas<br>5. CAIL hace recomendaciones a la empresa en base a la efectividad laboral<br>6. CAIL presenta lista de candidatos ordenados por nivel de coincidencia a la vacante<br>7. La empresa busca específicamente habilidades del empleado según necesite (experiencia, ubicación, nivel laboral)<br>8. La empresa revisa los perfiles completos de los empleados<br>9. CAIL registra las preferencias para análisis |
| **Reglas de Negocio** | • RN-024: Solo se muestran empleados con estado "Disponible para Fichaje"<br>• RN-025: Se ocultan datos sensibles del empleado hasta que haya interés mutuo<br>• RN-026: La empresa solo ve empleados que matchean al menos 60% con la vacante |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-009 |
| **Nombre** | Cobertura de Vacantes |
| **Actores Principales** | Empresa (Receptora) |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Gestionar el proceso de selección y confirmación de candidatos para vacantes abiertas. |
| **Precondiciones** | • La empresa receptora ha identificado candidatos de interés<br>• La vacante está activa y sin cubrir<br>• Los candidatos están en estado "Disponible" |
| **Postcondiciones** | • Los candidatos pasan a estado "En Negociación"<br>• La empresa emisora es notificada del interés<br>• El administrador recibe notificación para seguimiento |
| **Flujo Principal** | 1. La empresa receptora identifica una vacante a cubrir<br>2. La empresa receptora revisa los empleados sugeridos para esa vacante<br>3. La empresa receptora elige a los empleados de interés<br>4. La empresa receptora confirma los empleados propuestos<br>5. Los empleados se ubican como en negociación en CAIL<br>6. CAIL notifica a la empresa emisora sobre el interés mostrado<br>7. CAIL notifica al administrador para seguimiento del proceso<br>8. CAIL registra fecha y hora de la propuesta<br>9. CAIL hace recordatorios de seguimiento<br>10. CAIL confirma a la empresa receptora los próximos pasos del proceso |
| **Reglas de Negocio** | • RN-027: Una empresa puede proponer hasta 5 candidatos por vacante<br>• RN-028: El proceso de negociación externo tiene plazo de 15 días hábiles<br>• RN-029: Si no hay contratación en 15 días, se solicita recolocación<br>• RN-030: La CAIL cobra comisión sobre el salario del primer año de contrato |

<h3>Módulo 5: De Matching</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-010 |
| **Nombre** | Gestión de Matching |
| **Actores Principales** | Administrador, Empresa (Receptora) |
| **Actores Secundarios** | Ninguno |
| **Tipo** | Primario |
| **Propósito** | Supervisar y ejecutar el algoritmo de matching entre empleados disponibles y vacantes activas. |
| **Precondiciones** | • El administrador está autorizado para ejecutar matching<br>• Existen empleados en estado "Disponible"<br>• Existen vacantes activas sin cubrir |
| **Postcondiciones** | • Se generan sugerencias de matching para todas las vacantes activas<br>• Las empresas receptoras son notificadas sobre nuevas coincidencias<br>• Se actualiza el registro de matching |
| **Flujo Principal** | 1. El administrador empieza a buscar vacantes en CAIL<br>2. CAIL recopila todas las vacantes activas<br>3. CAIL recopila todos los empleados disponibles<br>4. CAIL compara competencias requeridas vs competencias del empleado<br>5. CAIL compara nivel laboral requerido vs nivel del empleado<br>6. CAIL revisa el porcentaje de coincidencia para cada par vacante-empleado<br>7. CAIL registra una lista de coincidencias con score mayor al 60%<br>8. CAIL ordena las coincidencias por score de mayor a menor<br>9. CAIL actualiza las recomendaciones en cada vacante<br>10. CAIL muestra a empresas receptoras sobre nuevos candidatos sugeridos<br>11. CAIL registra seguimiento de cada empleado<br>12. CAIL presenta reporte de coincidencias al administrador |
| **Reglas de Negocio** | • RN-031: El matching se ejecuta automáticamente cada 24 horas<br>• RN-032: El administrador puede ejecutar matching manual en cualquier momento<br>• RN-033: Score mínimo de matching: 60%<br>• RN-034: Se priorizan empleados con mayor puntaje de efectividad |

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-011 |
| **Nombre** | Resolución de Discrepancias |
| **Actores Principales** | Empresa (Emisora), Empresa (Receptora), Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Identificar y resolver conflictos en el proceso de matching y reasignar empleados cuando sea necesario. |
| **Precondiciones** | • El administrador está autorizado para resolver conflictos<br>• Existen empleados en proceso de negociación<br>• Se han detectado posibles conflictos |
| **Postcondiciones** | • Los conflictos quedan resueltos o escalados<br>• Los empleados pueden ser reasignados a otras vacantes<br>• Se genera reporte de resolución |
| **Flujo Principal** | 1. El administrador busca posibles desajustes en CAIL<br>2. CAIL identifica desajustes en perfiles (información inconsistente, puntajes anómalos).<br>3. CAIL identifica conflictos en negociaciones (múltiples ofertas, tiempos vencidos).<br>4. El administrador revisa la lista de conflictos pendientes<br>5. El administrador revisa un conflicto específico<br>6. CAIL presenta el detalle del conflicto y los actores involucrados<br>7. El administrador analiza la situación y determina acción correctiva<br>8. Si es necesario, el administrador reasigna el empleado a otra vacante<br>9. El administrador puede contactar a la empresa emisora para aclaraciones<br>10. El administrador puede contactar a la empresa receptora para confirmar interés<br>11. El administrador documenta la resolución del conflicto<br>12. CAIL actualiza los estados correspondientes<br>13. CAIL notifica a las partes involucradas sobre la resolución<br>14. CAIL marca el conflicto como "Resuelto" |
| **Reglas de Negocio** | • RN-035: Si un empleado no es contratado en 30 días, se solicita recolocación a empresa emisora<br>• RN-036: Si la empresa emisora rechaza recolocación, el empleado sale del sistema<br>• RN-037: El administrador puede anular una negociación si detecta irregularidades<br>• RN-038: Todos los conflictos deben resolverse en máximo 5 días hábiles |

<h3>Módulo 6: Cumplimiento Del Proceso Laboral</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-012 |
| **Nombre** | Cumplimiento del Proceso Laboral |
| **Actores Principales** | Administrador |
| **Actores Secundarios** | Empresa (Emisora), Empresa (Receptora) |
| **Tipo** | Primario |
| **Propósito** | Monitorear y validar el proceso completo de contratación desde la negociación hasta la colocación efectiva. |
| **Precondiciones** | • Existe una propuesta en estado "En Negociación"<br>• Las empresas han llegado a un acuerdo preliminar<br>• El administrador está autorizado para supervisar |
| **Postcondiciones** | • La contratación queda validada y documentada<br>• Se genera expediente completo del proceso<br>• El empleado pasa a estado "Contratado"<br>• Se activan los procesos de monetización |
| **Flujo Principal** | 1. El administrador inicia revisión del proceso de negociación<br>2. CAIL presenta los detalles de la propuesta activa<br>3. El administrador revisa los términos de contratación acordados con empresa (salario, cargo, beneficios, fecha inicio)<br>4. La empresa emisora confirma los términos del acuerdo<br>5. La empresa receptora confirma los términos del acuerdo<br>6. CAIL registra la confirmación de acuerdo entre ambas partes<br>7. El administrador solicita documentación de soporte<br>8. Las empresas adjuntan contratos y anexos requeridos<br>9. El administrador valida la documentación legal<br>10. CAIL verifica que los documentos cumplan requisitos mínimos<br>11. El administrador confirma la colocación exitosa<br>12. CAIL verifica las condiciones laborales finales (tipo contrato, duración, salario)<br>13. CAIL genera el expediente completo del proceso incluyendo:<br>&nbsp;&nbsp;&nbsp;a. Datos del empleado<br>&nbsp;&nbsp;&nbsp;b. Datos de empresas involucradas<br>&nbsp;&nbsp;&nbsp;c. Términos del acuerdo<br>&nbsp;&nbsp;&nbsp;d. Documentación adjunta<br>&nbsp;&nbsp;&nbsp;e. Timeline del proceso<br>&nbsp;&nbsp;&nbsp;f. Firmas digitales<br>14. CAIL genera reportes de seguimiento<br>15. CAIL genera comprobantes para las partes<br>16. CAIL comunica a empleado y empresas<br>17. CAIL registra al empleado como "Contratado"<br>18. CAIL activa el cálculo de comisiones<br>19. CAIL notifica confirmación final a todas las partes |
| **Reglas de Negocio** | • RN-041: Todo acuerdo debe ser confirmado por ambas empresas<br>• RN-042: La documentación debe incluir mínimo: contrato firmado y anexos laborales<br>• RN-043: El administrador tiene hasta 3 días hábiles para validar documentación<br>• RN-044: Si la documentación es rechazada, el proceso vuelve a negociación<br>• RN-045: El expediente es inmutable una vez generado<br>• RN-046: Todas las comunicaciones deben quedar registradas |

<h3>Módulo 7: Monetización Y Analítica De Resultados</h3>

| Campo | Descripción |
|-------|-------------|
| **ID** | CU-013 |
| **Nombre** | Monetización y Analítica de Resultados |
| **Actores Principales** | Administrador |
| **Actores Secundarios** | CAIL |
| **Tipo** | Primario |
| **Propósito** | Calcular comisiones, registrar pagos y generar análisis de desempeño del sistema. |
| **Precondiciones** | • Una colocación ha sido confirmada exitosamente<br>• Los datos de contratación están completos<br>• El sistema de comisiones está configurado |
| **Postcondiciones** | • Se calculan y registran todas las comisiones aplicables<br>• Se generan pagos pendientes<br>• Se actualizan métricas y reportes analíticos<br>• Se notifica a empresas sobre comisiones |
| **Flujo Principal** | 1. CAIL detecta una colocación exitosa confirmada<br>2. CAIL recopila datos financieros de la contratación:<br>&nbsp;&nbsp;&nbsp;a. Salario anual del empleado<br>&nbsp;&nbsp;&nbsp;b. Tipo de contrato<br>&nbsp;&nbsp;&nbsp;c. Duración del contrato<br>&nbsp;&nbsp;&nbsp;d. Empresa receptora<br>3. CAIL devuelve comisión por colocación exitosa (tarifa base)<br>4. CAIL devuelve comisión por sueldo del empleado (% del salario primer año)<br>5. CAIL devuelve comisión por tipo de contrato (indefinido vs plazo fijo)<br>6. CAIL devuelve comisión por retención<br>7. CAIL devuelve todas las comisiones aplicables según la empresa<br>8. CAIL devuelve el registro de pago pendiente a empresa<br>9. CAIL notifica a la empresa receptora sobre las comisiones<br>10. El administrador revisa el cálculo de comisiones<br>11. El administrador aprueba o ajusta las comisiones<br>12. CAIL registra la comisión en el sistema financiero<br>13. CAIL genera reporte final de la colocación<br>14. CAIL devuelve tasas de éxito.<br>15. CAIL devuelve la analítica a la empresa y administrador<br>16. El administrador analiza las tasas y métricas<br>17. CAIL genera reportes comparativos mensuales/anuales<br>18. CAIL identifica tendencias y patrones<br>19. CAIL presenta recomendaciones de mejora |
| **Reglas de Negocio** | NA |




