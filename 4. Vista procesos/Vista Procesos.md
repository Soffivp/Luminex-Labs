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
<img width="588" height="426" alt="3" src="https://github.com/user-attachments/assets/755c3aa9-8cc6-4eed-b26b-055821c05d5c" />



**Explicación:**
Este diagrama describe cómo se agrega nuevas empresas en el sistema y ademas valida que los datos agregados sean correctos, es decir si cumplen con las restricciones y si estan agregados en el sistema del SRI.
Los pasos clave incluyen:

  - Verificar datos ingresados.
  - Vallidar RUC.
  - Enviar datos registrados.

<h3>Registro de Empleados</h3>

<img width="624" height="413" alt="Imagen7" src="https://github.com/user-attachments/assets/4e5ee117-ec93-4bff-b41d-646102dc514c" />


**Explicación:**
Este diagrama describe proceso de registro y evaluación de empleados senior en el sistema CAIL. La Empresa Emisora proporciona el historial laboral, competencias, certificaciones y logros del empleado. El sistema valida su identidad mediante el Registro Civil y calcula un puntaje global de efectividad laboral (0-100) evaluando cinco criterios ponderados: logros (20%), certificaciones (15%), actitud (25%), antigüedad (25%) y titulación (15%). Con base en este análisis, se genera un Informe de Ponderación que determina el nivel laboral del empleado (Junior/Mid-Level/Senior).
El flujo incluye:

  - Registrar el empleado.
  - Generar informe evaluacion del empleado.
  - Clasifica el estado del empleado.

<h3> Consolidar Resultados, Asignar Puntaje y Confirmar</h3>
<img width="828" height="470" alt="5" src="https://github.com/user-attachments/assets/16c43810-96cc-4751-b0b9-c8ea8d73f802" />


**Explicación:**
Este diagrama muestra el proceso de generación, validación y aceptación del Informe de Ponderación.
El flujo incluye:

  - El sistema valida que el puntaje esté dentro del rango permitido y que cumpla con el mínimo requerido para su publicación.
  - El informe se envía automáticamente por email tanto al empleado como a la Empresa Emisora.
  - La empresa confirma su aceptación del informe.

<h3>Gestión de Coincidencias</h3>
<img width="644" height="440" alt="4" src="https://github.com/user-attachments/assets/e3c90cf9-ab7a-468e-bd04-3277648a945c" />

**Explicación:**
Este diagrama representa el proceso de búsqueda y filtrado de candidatos por parte de Empresas Receptoras.
El flujo incluye:

  - La empresa genera una vacante específica.
  - El Matching compara las competencias con los empleados disponibles.
  - El sistema ordena los resultados presentando únicamente empleados con coincidencia mínima.
    
<h3>Cobertura de Vacantes</h3>
<img width="644" height="440" alt="4" src="https://github.com/user-attachments/assets/e3c90cf9-ab7a-468e-bd04-3277648a945c" />



**Explicación:**
Este diagrama ilustra el proceso de selección y proposición formal de candidatos para vacantes abiertas.
El flujo incluye:

  - La Empresa Receptora revisa los candidatos y selecciona los empleados interés.
  - Al confirmar su selección, el sistema crea una Propuesta formal que establece un plazo de negociación de 15 días hábiles.
  - Los empleados seleccionados pasan automáticamente a estado "En Negociación", bloqueándolos temporalmente para otras ofertas.
  - El sistema notifica a la Empresa Emisora sobre el interés mostrado en sus empleados y alerta al Administrador para 
seguimiento del proceso.


<h3>Cumplimiento del Proceso Laboral</h3>
<img width="627" height="310" alt="2" src="https://github.com/user-attachments/assets/4696f7c1-a8f0-4a2d-91ed-b14060539464" />

**Explicación:**
Este diagrama detalla el proceso de validación y formalización de contrataciones exitosas.
El flujo incluye:

  - El Administrador supervisa propuestas "En Revisión", verificando que los términos acordados sean confirmados formalmente tanto por la Empresa Emisora como por la Empresa Receptora.
  - Ambas empresas deben adjuntar documentación legal completa (contrato firmado, anexos laborales, certificaciones).
  - El Administrador valida exhaustivamente toda la documentación, rechazándola si no cumple requisitos mínimos.
  - Una vez aprobada, el sistema confirma la colocación exitosa y genera un expediente digital.
  - El empleado pasa a estado "Contratado", se calculan las comisiones y las partes reciben notificación formal de confirmación.

<h3>Monetización y Analítica de Resultados</h3>
<img width="1313" height="828" alt="1" src="https://github.com/user-attachments/assets/b1472a2c-d615-4641-a49d-02cee5fdc37d" />

**Explicación:**
Este diagrama representa el proceso de cálculo de comisiones y generación de análisis del sistema.
El flujo incluye:

  - Al confirmarse una colocación exitosa, el componente Comisión recopila datos financieros.
  - El Administrador revisa y aprueba formalmente las comisiones calculadas, generando un registro de pago pendiente. 
  - El sistema notifica a la Empresa Receptora sobre los montos a pagar.
  - Paralelamente, el componente GestiónDeAnálisis genera reportes consolidados.
  - El Administrador consulta estos análisis para tomar decisiones estratégicas y mejorar continuamente el servicio CAIL.


