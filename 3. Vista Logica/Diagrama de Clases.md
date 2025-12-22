<h1>Diagrama de Clases</h1>

<h3>DIAGRAMA DE CLASES – SISTEMA DE BOLSA DE EMPLEO CAIL</h3>

<h2>Definición de Diagrama de Clases</h2>

Un diagrama de clases es un tipo de diagrama estático en la Programación Orientada a Objetos (POO) que modela la estructura de un sistema mostrando:

1. **Clases**: Representan las entidades o conceptos del sistema.
2. **Atributos**: Definen las características o propiedades de cada clase.
3. **Métodos**: Especifican los comportamientos o acciones que puede realizar la clase.
4. **Relaciones**: Muestran las conexiones entre las clases, como asociaciones, composiciones o herencias.

Es ampliamente utilizado en la fase de diseño de software para definir cómo interactúan las diferentes partes del sistema.
<h2>Estructura de Diagrama de Clases</h2>

1. **Clases:**
Representadas como rectángulos divididos en tres secciones:
    - Nombre de la clase (parte superior).
    - Atributos (parte media).
    - Métodos (parte inferior).
      
2. **Relaciones entre clases:**
    - Asociaciones: Indican conexiones entre clases.
    - Composición: Una clase contiene a otra como parte esencial.
    - Agregación: Una clase contiene a otra, pero no de manera esencial.
    - Herencia: Una clase hereda propiedades y métodos de otra.
      
3. **Visibilidad de atributos y métodos:**
   -  Público: Accesible desde cualquier lugar.
   -  Privado: Accesible solo dentro de la clase.
   -  Protegido: Accesible dentro de la clase y sus subclases.
     
4. **Cardinalidad:** Define la cantidad de objetos relacionados, como **1:1, 1:N o N:M.**

<h2>Diagrama de Clases</h2>
<p>
<img width="13875" height="3077" alt="Casos de uso - CAIL" src="https://github.com/user-attachments/assets/78913fdb-6e72-4ad4-bdfe-f7846ae27287" />
</p>


<h2>Diccionario de Clases</h2>

<h2>Clasificación de Clases</h2>

**Clases Principales:** Empresa, Empleado, Administrador, Vacante y Matching

**Clases de Proceso:** ProcesoDeContratacion, Comision y Propuesta

**Clases de Información:** HistorialLaboral, Competencias, NivelLaboral, EvaluacionDesempeno y InformePonderacion

**Clases de Gestión:** Notificacion, Conflicto y GestionDeAnalisis

**Clases Externas:** SistemaExterno (Interfaz), RegistroCivil y SRI

**Enumeraciones:** EstadoConflicto, Nivel, Habilidades, Estado, Actividad, EstadoMatch y EstadoProceso

<h2>Especificación de Clases Principales</h2>

**Clase Empresa**

Información General

| Aspecto | Detalle |
|:-------:|-------------|
| Nombre | Empresa|
| Tipo |  Clase abstracta (tiene subclases: EmpresaEmisora, EmpresaReceptora)|
| Paquete/Módulo | core.entities |
| Descripción |  Representa una empresa afiliada a CAIL que puede actuar como emisora (ofrece empleados) o receptora (busca empleados)|

<h3>Atributos</h3>

 | Nombre | Tipo | Visibilidad | Descripción | Restricciones |
|:-------:|:-------------:|:-------:|:-------:|-------|
| ruc | String| private|  private Registro Único de Contribuyentes| Único, 13 dígitos, requerido|
| razonSocial | String| private|Nombre legal de la empresa | Requerido, max 200 caracteres |
| direccion | String | private| Dirección física de la empresa | Requerido |
| telefono | String| private|Teléfono de contacto | Formato: 10 dígitos|
| email | String| private|Correo electrónico corporativo | Formato válido, único| 
| sectorIndustrial | String| private| Sector económico al que pertenece Catálogo predefinido|
| credenciales | String | private| Credenciales de acceso al sistema | Hasheadas, encriptadas|
| actividad | Boolean | private| Estado de actividad de la empresa | true=activa, false=inactiva|
|fechaRegistro | Date | private | Fecha de registro en el sistema | Auto-generada|

<h3>Métodos</h3>

 |Nombre | Parámetros | Retorno | Visibilidad | Descripción |
|:-------:|:-------------:|:-------:|:-------:|-------|
|registrar()| - | Boolean | public | Registra una nueva empresa en el sistema. Valida los datos proporionados|
|validarRUC()| -| Boolean |public |Consulta al SRI para validar que el RUC sea válido y esté activo|
|publicarEmpleado()| empleado: Empleado| Boolean| public| Publica un empleado disponible para recolocación (solo EmpresaEmisora)|
|publicarVacante()| vacante: Vacante |Boolean |public| Publica una vacante disponible (solo EmpresaReceptora)|
|confirmarInforme()| informe: InformePonderacion| Boolean |public |Confirma y acepta un informe de ponderación de empleado.|
|buscarCandidatos()| filtros: Map List<Empleado>| public| Busca empleados que coincidan con criterios específicos|
|confirmarAcuerdo()| matching: Matching| Boolean| public| Confirma un acuerdo de recolocación entre empresas|
|adjuntarDocumentacion()| documentos: List<File> Boolean |public| Adjunta documentación legal requerida para validación|
|pagarComision()| comision: Comision| Boolean| public| Realiza el pago de una comisión generada|

<h3>Relación</h3>

 |Tipo de Relación | Clase Relacionada  | Cardinalidad | Descripción |
|:-------:|:-------------:|:-------:|:-------:|
|Composición| HistorialLaboral| 1..*| Una empresa posee múltiples historiales laborales|
|Asociación |Empleado |1..* |Una empresa tiene múltiples empleados|
|Asociación |Vacante |1..*| Una empresa puede publicar múltiples vacantes|
|Asociación | Notificacion| 0..*| Una empresa puede recibir múltiples notificaciones|
|Asociación | Matching | 0..*| Una empresa participa en múltiples matchings|
|Asociación | Comision| 1..*| Una empresa paga múltiples comisiones|




