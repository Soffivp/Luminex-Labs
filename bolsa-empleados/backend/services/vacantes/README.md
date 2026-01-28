# 📋 Vacantes Service

Microservicio de gestión de vacantes para la Bolsa de Empleados CAIL.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/vacantes` | Listar todas (filtros: empresaRUC, estadoVacante, ubicacion) |
| GET | `/vacantes/:id` | Obtener por ID |
| POST | `/vacantes` | Crear nueva vacante |
| PATCH | `/vacantes/:id` | Actualizar |
| DELETE | `/vacantes/:id` | Eliminar |
| PATCH | `/vacantes/:id/estado` | Cambiar estado |
| POST | `/vacantes/:id/competencias` | Agregar competencia |
| POST | `/vacantes/:id/postular` | Registrar postulación |
| GET | `/vacantes/empresa/:ruc` | Por empresa |
| GET | `/vacantes/activas` | Vacantes activas |
| GET | `/vacantes/competencia/:competencia` | Por competencia |
| GET | `/vacantes/ubicacion/:ubicacion` | Por ubicación |
| GET | `/health` | Health check |

## Esquema

```json
{
  "tituloCargo": "Jefe de Produccion",
  "descripcionFunciones": "Coordinar area de produccion",
  "requisitosEducacion": "Titulo universitario",
  "aniosExperiencia": "5",
  "competenciasRequeridas": ["Lean manufacturing", "Gestion de equipos"],
  "nivelLaboralRequerido": "Senior",
  "ubicacion": "Loja",
  "tipoContrato": "Indefinido",
  "estadoVacante": "Activa",
  "empresaRUC": "4444444444001"
}
```

## Estados de vacante
- `Activa` - Recibiendo postulaciones
- `Pausada` - Temporalmente no recibe postulaciones
- `Cerrada` - Proceso finalizado
- `Cancelada` - Vacante cancelada

## Desarrollo

```bash
npm install
cp .env.example .env
npm run dev
```

## Docker

```bash
docker-compose up --build
```

## Puerto: 3003
