# 💰 Monetización Service

Microservicio de gestión de comisiones para la Bolsa de Empleados CAIL.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/comisiones` | Listar todas (filtros: empresaRUC, estadoComision, idAdministrador) |
| GET | `/comisiones/:id` | Obtener por ID |
| POST | `/comisiones` | Crear nueva comisión |
| PATCH | `/comisiones/:id` | Actualizar |
| DELETE | `/comisiones/:id` | Eliminar (solo pendientes) |
| PATCH | `/comisiones/:id/estado` | Cambiar estado |
| POST | `/comisiones/:id/pagar` | Marcar como pagada |
| POST | `/comisiones/:id/procesos` | Agregar proceso |
| GET | `/comisiones/empresa/:ruc` | Por empresa |
| GET | `/comisiones/pendientes` | Comisiones pendientes |
| GET | `/comisiones/administrador/:idAdmin` | Por administrador |
| GET | `/comisiones/resumen/empresa/:ruc` | Resumen por empresa |
| GET | `/health` | Health check |

## Esquema

```json
{
  "comisionColocacion": 250,
  "comisionSueldo": 150,
  "comisionContrato": 0,
  "comisionRetencion": 0,
  "montoTotal": 400,
  "estadoComision": "Pendiente",
  "idProceso": ["proc_001"],
  "empresaRUC": "4444444444001",
  "idAdministrador": "admin_001"
}
```

## Estados de comisión
- `Pendiente` - Comisión creada, pendiente de aprobación
- `Aprobada` - Aprobada, pendiente de pago
- `Pagada` - Comisión pagada
- `Cancelada` - Comisión cancelada
- `EnDisputa` - En proceso de revisión

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

## Puerto: 3004
