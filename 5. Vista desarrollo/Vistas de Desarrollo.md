<h1>CI/CD y DevOps</h1>

<h3>VISTA DESARROLLO – SISTEMA DE BOLSA DE EMPLEO CAIL</h3>
<h2>¿Qué es CI/CD?</h2>

CI/CD, que significa Integración Continua y Entrega/Despliegue Continuo, es un conjunto de prácticas que automatizan las etapas de desarrollo, prueba y despliegue del software. Su objetivo principal es mejorar la velocidad, calidad y confiabilidad de las entregas de software.

**Integración Continua (CI)**  
  - Es el proceso de integrar regularmente el código de diferentes desarrolladores en un repositorio compartido.
  - Incluye la ejecución automática de pruebas para identificar errores rápidamente.

**Entrega Continua (CD - Continuous Delivery)**  
  - Extiende la CI al automatizar la preparación de entregas del software en cualquier momento.
  - Garantiza que el código esté siempre en un estado listo para producción.  
  - Requiere pruebas adicionales y validaciones antes del despliegue.

**Despliegue Continuo (CD - Continuous Deployment)**  
  - Va un paso más allá y automatiza también el proceso de despliegue en producción.  
  - Cada cambio que pasa las pruebas se despliega automáticamente.  
  - El enfoque CI/CD fomenta ciclos de desarrollo cortos, iterativos y más seguros.

<h2>¿Qué es DevOps?</h2>
DevOps es una cultura, metodología y conjunto de prácticas que busca integrar los equipos de desarrollo (Development) y operaciones (Operations) para mejorar la colaboración, automatización y entrega continua de software. DevOps no es solo una herramienta, sino una filosofía que combina personas, procesos y tecnologías
- Beneficios de DevOps:
    - Ciclos de entrega más rápidos.
    - Mayor estabilidad y calidad del software.
    - Mejor alineación entre objetivos técnicos y empresariales.
    - Foto del Pipeline

<h2>Foto del Pipeline</h2>
<img width="1920" height="1080" alt="Plan" src="https://github.com/user-attachments/assets/e1db52b0-f310-498b-9198-122e62c65c42" />

<h2>Tabla de descripción</h2>

| Fase DevOps | Plataformas | Descripción |
|:-------:|-------------|:-------:|
| Plan | GitHub | Se utilizará para gestionar el desarrollo colaborativo, organizar tareas mediante branchs. |
|  | Jiro | Se empleará para el seguimiento de tareas y actualizaciones del estado de los incidentes detectados.|
| Code | React | 	Será empleado para desarrollar la interfaz móvil, garantizando una experiencia de usuario eficiente. |
|  | Node.Js | Se utiliza Node.js para escribir el código del backend, aprovechando su capacidad para manejar múltiples conexiones simultáneas y su ecosistema de módulos para integrar funcionalidades necesarias en el proyecto. |
| Build  |GitHub Actions|Se utilizará para la automatización del testeo de cada parte del código |
| |Fastify|Su arquitectura modular facilita la integración de diferentes componentes del sistema. |
|Test | Jest  |Realiza pruebas unitarias e integradas para validar que las funciones, componentes y módulos se comporten correctamente antes de integrar cambios al repositorio. |
|Release|Fastify|Permite preparar la aplicación para su lanzamiento mediante la configuración de rutas y middleware, asegurando que todos los endpoints estén listos para ser utilizados en producción.|
|Deploy|Firebase Hosting|Permite implementar el backend sin preocuparse por la infraestructura subyacente, asegurando una alta disponibilidad y escalabilidad del sistema de gestión de inventario.|
| |Android Package Kit|Se genera automáticamente dentro del pipeline de CI/CD,contiene el codigo, recursos, librerías y configuraciones necesarias para ejecutar la aplicación.|
|Operate |Docker |Se encarga de ejecutar la aplicación en contenedores estables y aislados dentro del entorno de producción, además asegura que la aplicación backend se mantenga activa, segura y funcionando de manera uniforme durante su operación diaria.|
|Monitor|Discord|Se utilizará para la comunicación en tiempo real y notificaciones de eventos relevantes. |+

<h2>Cronograma de actividades de desarrollo BackEnd y FrontEnd</h2>

<h2>BackEnd</h2>

1. **Requerimientos y diseño**
    - Análisis de requisitos: Identificar las funcionalidades necesarias del sistema.
    - Diseño de la arquitectura: Seleccionar la estructura del backend (microservicios, monolito).
    - Definición de modelos de datos: Diseñar las bases de datos y las relaciones.
    - Definición de la API: Crear un contrato API (endpoints, métodos, formatos).
      
2. **Configuración inicial**
    - Configuración del entorno de desarrollo (IDE, dependencias, frameworks).
    - Creación de repositorios (Git, CI/CD pipelines).
    - Configuración del entorno de Cloud Functions.
    - Configuración de la base de datos (Firebase).
      
3. **Desarrollo**
   -  Implementación de modelos y esquemas de base de datos.
   -  Desarrollo de endpoints:
       -  Autenticación y autorización (registro, inicio de sesión).
       -  Operaciones CRUD (Create, Read, Update, Delete).
       -  Integraciones externas (APIs de terceros, servicios de pago).
   -  Implementación de lógica de negocio.
   -  Manejo de errores y validación de datos.
     
4. **Pruebas y validación**
    - Creación de pruebas unitarias para servicios.
    - Pruebas de integración con la base de datos.
    - Pruebas de rendimiento y escalabilidad.
    - Validación de seguridad.
      
5. **Implementación y despliegue**
    - Preparación de la base de datos.
    - Despliegue en producción.
    - Configuración de monitoreo y logs.

<h2>Frontend</h2>

1. **Requerimientos y diseño**
    - Análisis de requisitos: Definir la experiencia del usuario (UX).
    - Wireframes y prototipos: Crear bocetos visuales y prototipos interactivos.
    - Definición de arquitectura: Estructura de componentes, rutas y estados.
      
2. **Configuración inicial**
    - Configuración del entorno de desarrollo.
    - Instalación de dependencias y configuración de herramientas.
    - Configuración del diseño base.
      
3. **Desarrollo**
   -  Creación de componentes base.
   -  Implementación de rutas y navegación.
   -  Integración con APIs del backend.
   -  Desarrollo de lógica de estado.
   -  Estilizado y responsividad.
     
4. **Pruebas y validación**
    - Pruebas unitarias de componentes.
    - Pruebas funcionales y de interacción.
    - Validación de diseño responsivo y accesibilidad.
    - Pruebas de rendimiento en el navegador.
      
5. **Implementación y despliegue**
    - Construcción del proyecto para producción.
    - Despliegue en Google Play.
    - Validación en entornos reales.
    - Configuración de monitoreo.
  
     
