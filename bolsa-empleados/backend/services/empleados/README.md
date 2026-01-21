# 👤 Empleados Service

Microservicio de gestión de empleados para la Bolsa de Empleados CAIL.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/empleados` | Listar todos (filtros: empresaRUC, estadoPublicacion) |
| GET | `/empleados/:cedula` | Obtener por cédula |
| POST | `/empleados` | Crear nuevo empleado |
| PATCH | `/empleados/:cedula` | Actualizar datos |
| DELETE | `/empleados/:cedula` | Eliminar |
| PATCH | `/empleados/:cedula/historia-laboral` | Actualizar historia laboral |
| PATCH | `/empleados/:cedula/competencias` | Actualizar competencias |
| POST | `/empleados/:cedula/habilidades` | Agregar habilidad |
| POST | `/empleados/:cedula/certificaciones` | Agregar certificación |
| PATCH | `/empleados/:cedula/password` | Cambiar contraseña |
| GET | `/empleados/empresa/:ruc` | Empleados por empresa |
| GET | `/empleados/disponibles` | Empleados disponibles |
| GET | `/empleados/habilidad/:habilidad` | Buscar por habilidad |
| GET | `/health` | Health check |

## Esquema de Empleado

```json
{
  "cedula": "1104582960",
  "nombres": "Andrés Calderón Suarez",
  "fechaNacimiento": "1985-08-01",
  "direccion": "Loja, Ecuador",
  "email": "caldrez@gmail.com",
  "telefono": "092475586",
  "estadoPublicacion": "Disponible",
  "empresaRUC": "4444444444001",
  "historiaLaboral": {
    "cargoActual": "Supervisor de desarrollo",
    "aniosAntiguedad": 18,
    "funcionesRealizadas": "Jefe de proyecto",
    "documentacionSoporte": ["https://ejemplo.com/contrato.pdf"]
  },
  "competencias": {
    "habilidades": ["Comunicación", "Análisis"],
    "nivelExperiencia": "Avanzado",
    "certificaciones": ["C++", "CISSP"],
    "logros": ["Alianzas extranjeras"]
  }
}
```

## Desarrollo Local

```bash
npm install
cp .env.example .env
npm run dev
```

## Docker

```bash
docker build -t empleados-service .
docker run -p 3002:8080 --env-file .env empleados-service

# O con docker-compose
docker-compose up --build
```

## Tests

```bash
npm test
```

## Puerto por defecto: 3002
