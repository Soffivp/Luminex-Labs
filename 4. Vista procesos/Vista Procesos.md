<h1>Diagramas de Secuencia</h1>

<h3>DIAGRAMA DE SECUENCIA – SISTEMA DE BOLSA DE EMPLEO CAIL</h3>

<h2>Definición de Diagrama de Secuencia</h2>

Los diagramas de secuencia son una herramienta de modelado en la Ingeniería de Software que forma parte del Lenguaje Unificado 
de Modelado (UML). Se utilizan para describir cómo los objetos de un sistema interactúan entre sí a través del tiempo,
mostrando el flujo de mensajes o llamadas entre ellos. Estos diagramas son especialmente útiles para representar 
procesos y casos de uso en sistemas orientados a objetos.

<h2>Estructura de Diagrama de Secuencia</h2>

1. **Actores y Objetos**: Representan las entidades que participan en la interacción. Los actores se representan como figuras humanas, y los objetos como rectángulos.
2. **Líneas de vida**: Indican la existencia de un actor u objeto durante el proceso. Son líneas verticales que comienzan debajo de cada actor u objeto.
3. **Mensajes**: Representan la comunicación entre actores y objetos mediante flechas horizontales.
4. **Bloques de ejecución**: Rectángulos sobre las líneas de vida que representan la ejecución de un proceso o método.
5. **Tiempo**: Se representa de forma implícita en la dirección descendente del diagrama.

<h2>Diagramas de Secuencia</h2>
<h3>Registro de Empresas</h3>

<img width="870" height="440" alt="image" src="https://github.com/user-attachments/assets/003e43d4-3d9e-4f1a-90ef-c31f57762749" />

**Explicación:**
Este diagrama describe cómo se agrega nuevas empresas en el sistema y ademas valida que los datos agregados sean correctos, es decir si cumplen con las restricciones y si estan agregados en el sistema del SRI.
Los pasos clave incluyen:

  - Verificar datos ingresados.
  - Vallidar RUC.
  - Enviar datos registrados.

<h3>Registro de Empleados</h3>
<img width="1888" height="1110" alt="image" src="https://github.com/user-attachments/assets/35d4d815-2ed3-4f3e-87bc-e8e3148f2562" />

**Explicación:**
Este diagrama describe proceso de registro y evaluación de empleados senior en el sistema CAIL. La Empresa Emisora proporciona el historial laboral, competencias, certificaciones y logros del empleado. El sistema valida su identidad mediante el Registro Civil y calcula un puntaje global de efectividad laboral (0-100) evaluando cinco criterios ponderados: logros (20%), certificaciones (15%), actitud (25%), antigüedad (25%) y titulación (15%). Con base en este análisis, se genera un Informe de Ponderación que determina el nivel laboral del empleado (Junior/Mid-Level/Senior).
El flujo incluye:

  - Registrar el empleado.
  - Generar informe evaluacion del empleado.
  - Clasifica el estado del empleado.

<h3>Evaluar Desempeño Y Registrar Nivel Laboral</h3>
<img width="748" height="518" alt="image" src="https://github.com/user-attachments/assets/425af53b-6f37-4b9d-9ffb-5e4b180af24c" />

**Explicación:**
Este diagrama detalla el proceso automatizado de evaluación y clasificación de empleados.
El flujo incluye:

  - EvaluaciónDesempeño que analiza secuencialmente cinco dimensiones del perfil profesional.
  - Clasifica al empleado en la categoría correspondiente.

<h3> Consolidar Resultados, Asignar Puntaje y Confirmar</h3>
<img width="1103" height="611" alt="image" src="https://github.com/user-attachments/assets/b6fae495-5ea3-4e99-9952-527243c009dd" />

**Explicación:**
Este diagrama muestra el proceso de generación, validación y aceptación del Informe de Ponderación.
El flujo incluye:

  - El sistema valida que el puntaje esté dentro del rango permitido y que cumpla con el mínimo requerido para su publicación.
  - El informe se envía automáticamente por email tanto al empleado como a la Empresa Emisora.
  - La empresa confirma su aceptación del informe.

<h3>Gestión de Coincidencias</h3>
<img width="812" height="668" alt="image" src="https://github.com/user-attachments/assets/d430153d-274e-4171-94f2-25855f180d41" />

**Explicación:**
Este diagrama representa el proceso de búsqueda y filtrado de candidatos por parte de Empresas Receptoras.
El flujo incluye:

  - La empresa genera una vacante específica.
  - El Matching compara las competencias con los empleados disponibles.
  - El sistema ordena los resultados presentando únicamente empleados con coincidencia mínima.
    
<h3>Cobertura de Vacantes</h3>
<img width="812" height="668" alt="image" src="https://github.com/user-attachments/assets/ff91e8cc-049e-4891-9d3e-03d700f7d6f3" />


**Explicación:**
Este diagrama ilustra el proceso de selección y proposición formal de candidatos para vacantes abiertas.
El flujo incluye:

  - La Empresa Receptora revisa los candidatos y selecciona los empleados interés.
  - Al confirmar su selección, el sistema crea una Propuesta formal que establece un plazo de negociación de 15 días hábiles.
  - Los empleados seleccionados pasan automáticamente a estado "En Negociación", bloqueándolos temporalmente para otras ofertas.
  - El sistema notifica a la Empresa Emisora sobre el interés mostrado en sus empleados y alerta al Administrador para 
seguimiento del proceso.

<h3>Gestión de Matching</h3>
<img width="1171" height="774" alt="image" src="https://github.com/user-attachments/assets/6ce2e8b2-c674-4840-868b-a81dddc1896b" />

**Explicación:**
Este diagrama describe el proceso automatizado y supervisado de emparejamiento entre empleados disponibles y vacantes activas.
El flujo incluye:

  - El Administrador ejecuta el matching, y el sistema recopila todas las vacantes activas y empleados disponibles.
  - Para cada par vacante-empleado, el componente Matching realiza un análisis comparativo y calcula un score de coincidencia para cada combinación.
  - El sistema actualiza las recomendaciones en 
 cada vacante y notifica a las Empresas Receptoras sobre nuevos candidatos sugeridos.

<h3>Resolución de Discrepancias</h3>
<img width="1428" height="791" alt="image" src="https://github.com/user-attachments/assets/b182f7fe-3c44-4e58-bac7-2fcd212a1307" />

**Explicación:**
Este diagrama representa el proceso de identificación y resolución de conflictos en el sistema CAIL.
El flujo incluye:

  - El Administrador consulta el módulo Conflicto que identifica automáticamente desajustes.
  - El Administrador revisa cada conflicto, analiza el contexto completo y determina la acción correctiva apropiada.
  - Se puede reasignar el empleado a otra vacante recalculando matchings alternativos, o contactar directamente a las Empresas Emisora y Receptora para aclaraciones.
  - El Administrador documenta la resolución detalladamente, el sistema actualiza todos los estados afectados y notifica a las partes involucradas sobre las acciones tomadas. 

<h3>Cumplimiento del Proceso Laboral</h3>
<img width="1424" height="977" alt="image" src="https://github.com/user-attachments/assets/e8bef936-9bf5-43a3-bc90-bba6cf27c498" />

**Explicación:**
Este diagrama detalla el proceso de validación y formalización de contrataciones exitosas.
El flujo incluye:

  - El Administrador supervisa propuestas "En Revisión", verificando que los términos acordados sean confirmados formalmente tanto por la Empresa Emisora como por la Empresa Receptora.
  - Ambas empresas deben adjuntar documentación legal completa (contrato firmado, anexos laborales, certificaciones).
  - El Administrador valida exhaustivamente toda la documentación, rechazándola si no cumple requisitos mínimos.
  - Una vez aprobada, el sistema confirma la colocación exitosa y genera un expediente digital.
  - El empleado pasa a estado "Contratado", se calculan las comisiones y las partes reciben notificación formal de confirmación.

<h3>Monetización y Analítica de Resultados</h3>
<img width="1343" height="825" alt="image" src="https://github.com/user-attachments/assets/dbccd465-6809-425d-a913-ab0be49de6e2" />

**Explicación:**
Este diagrama representa el proceso de cálculo de comisiones y generación de análisis del sistema.
El flujo incluye:

  - Al confirmarse una colocación exitosa, el componente Comisión recopila datos financieros.
  - El Administrador revisa y aprueba formalmente las comisiones calculadas, generando un registro de pago pendiente. 
  - El sistema notifica a la Empresa Receptora sobre los montos a pagar.
  - Paralelamente, el componente GestiónDeAnálisis genera reportes consolidados.
  - El Administrador consulta estos análisis para tomar decisiones estratégicas y mejorar continuamente el servicio CAIL.


