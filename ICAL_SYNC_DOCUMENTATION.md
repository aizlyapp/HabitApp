# iCal Sync Service - Documentación

## 📋 Resumen

Servicio de sincronización iCal para Roomy que permite integrar reservas externas de plataformas como Airbnb, Booking, VRBO, etc. El sistema mantiene automáticamente actualizada la disponibilidad de las habitaciones consultando tanto reservas locales como externas.

---

## 🗄️ Base de Datos

### Tablas Creadas

#### `external_reservations`
Almacena las reservas sincronizadas desde fuentes externas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único interno |
| `property_id` | UUID | Referencia a la habitación (`rooms.id`) |
| `user_id` | UUID | Referencia al usuario propietario |
| `external_uid` | TEXT | ID único del evento en la fuente iCal |
| `source` | TEXT | Fuente: 'Airbnb', 'Booking', 'VRBO', 'Custom' |
| `start_date` | DATE | Fecha de entrada |
| `end_date` | DATE | Fecha de salida |
| `guest_name` | TEXT | Nombre del huésped (opcional) |
| `guest_email` | TEXT | Email del huésped (opcional) |
| `guest_phone` | TEXT | Teléfono del huésped (opcional) |
| `total_amount` | NUMERIC | Monto total (opcional) |
| `status` | TEXT | 'confirmed' o 'cancelled' |
| `sync_token` | TEXT | Token de secuencia para detectar cambios |
| `raw_ical_data` | JSONB | Datos completos del evento iCal (backup) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- `idx_external_reservations_dates` en `(user_id, start_date, end_date)`
- `idx_external_reservations_property` en `(property_id)`
- `idx_external_reservations_source` en `(source)`

**Constraint único:** `UNIQUE(property_id, external_uid, source)`

#### `property_sync_config`
Configuración de sincronización por propiedad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `property_id` | UUID | Referencia a la habitación |
| `user_id` | UUID | Referencia al usuario |
| `ical_url` | TEXT | URL del feed iCal |
| `source` | TEXT | Fuente de la reserva |
| `auto_sync` | BOOLEAN | Si debe sincronizar automáticamente |
| `sync_interval_minutes` | INTEGER | Intervalo de sync (default: 15) |
| `last_sync_at` | TIMESTAMPTZ | Última sincronización |
| `last_sync_status` | TEXT | 'success', 'error', 'pending' |
| `last_sync_error` | TEXT | Mensaje de error si falló |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización |

**Constraint único:** `UNIQUE(property_id, user_id)`

---

## 🔧 Servicios

### `CalendarSyncService` (`/lib/services/calendar-sync.service.ts`)

Servicio principal que maneja toda la lógica de sincronización iCal.

#### Métodos Principales

##### `syncPropertyICal(userId, propertyId, icalUrl, source)`
Sincroniza una propiedad individual. Realiza:
1. Descarga el contenido iCal desde la URL
2. Parsea los eventos
3. **INSERT** nuevos eventos que no existen en BD
4. **UPDATE** eventos que cambiaron (fechas, estado, secuencia)
5. **DELETE** eventos que ya no están en el iCal
6. Actualiza el timestamp de última sincronización

**Retorna:** `SyncResult` con estadísticas:
```typescript
{
  success: boolean;
  propertyId: string;
  source: 'Airbnb' | 'Booking' | 'VRBO' | 'Custom';
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  error?: string;
  syncedAt: string;
}
```

##### `syncAllProperties()`
Sincroniza todas las propiedades con `auto_sync = true`.
Procesa cada propiedad de forma independiente (falla una, siguen las demás).

**Retorna:** `BulkSyncResult`
```typescript
{
  totalProperties: number;
  successfulSyncs: number;
  failedSyncs: number;
  results: SyncResult[];
  startedAt: string;
  completedAt: string;
}
```

##### `fetchICalFromUrl(url, timeoutMs?)`
Descarga contenido iCal desde una URL con timeout de 30 segundos.

##### `parseICal(icalContent)`
Parsea contenido iCal y extrae eventos `VEVENT`.

---

## 🔍 Disponibilidad Real

### Función `checkRealAvailability()` (`/lib/data/repository.ts`)

Combina consultas de reservas locales y externas para determinar disponibilidad real.

**Query SQL:**
```sql
-- Reservas locales
SELECT id, check_in, check_out, guest_name, status
FROM reservations
WHERE room_id = $1
  AND user_id = $2
  AND status NOT IN ('cancelled', 'checked-out')
  AND check_in < $4  -- check_out
  AND check_out > $3 -- check_in

UNION ALL

-- Reservas externas
SELECT id, start_date, end_date, guest_name, status
FROM external_reservations
WHERE property_id = $1
  AND user_id = $2
  AND status != 'cancelled'
  AND start_date < $4
  AND end_date > $3
```

**Retorna:** `RealAvailabilityResult`
```typescript
{
  available: boolean;
  conflictingReservations: Array<{
    id: string;
    source: 'local' | 'external';
    start_date: string;
    end_date: string;
    guest_name?: string;
    status: string;
  }>;
}
```

**Uso:**
```typescript
import { checkRealAvailability } from '@/lib/data/repository';

const availability = await checkRealAvailability(
  userId,
  roomId,
  checkInDate,
  checkOutDate
);

if (!availability.available) {
  console.log('Conflictos:', availability.conflictingReservations);
}
```

---

## 🌐 API Endpoints

### 1. Sync Manual
**`POST /api/ical/sync`**

Sincroniza una propiedad específica.

**Request:**
```json
{
  "propertyId": "uuid",
  "icalUrl": "https://www.airbnb.com/calendar/ical/XXXXXX.ics",
  "source": "Airbnb"
}
```

**Response (200):**
```json
{
  "success": true,
  "propertyId": "uuid",
  "source": "Airbnb",
  "eventsAdded": 2,
  "eventsUpdated": 1,
  "eventsRemoved": 0,
  "syncedAt": "2026-07-01T10:00:00.000Z"
}
```

**Response (400):**
```json
{
  "error": "Faltan campos requeridos: propertyId, icalUrl, source"
}
```

### 2. Estado de Configuración
**`GET /api/ical/sync?propertyId=<uuid>`**

Obtiene la configuración de sincronización de una propiedad.

**Response (200):**
```json
{
  "configured": true,
  "config": {
    "id": "uuid",
    "property_id": "uuid",
    "ical_url": "https://...",
    "source": "Airbnb",
    "auto_sync": true,
    "last_sync_at": "2026-07-01T10:00:00.000Z",
    "last_sync_status": "success"
  }
}
```

**Response (404):**
```json
{
  "configured": false
}
```

### 3. Cron - Sincronización Automática
**`POST /api/cron/ical-sync`**

Sincroniza todas las propiedades con `auto_sync = true`.

**Seguridad:** Requiere header `Authorization: Bearer <CRON_SECRET>`

**Headers de Respuesta:**
```
X-Sync-Duration: 1234
X-Sync-Total: 5
X-Sync-Success: 4
X-Sync-Failed: 1
```

**Response (200):**
```json
{
  "totalProperties": 5,
  "successfulSyncs": 4,
  "failedSyncs": 1,
  "results": [...],
  "startedAt": "2026-07-01T10:00:00.000Z",
  "completedAt": "2026-07-01T10:00:05.000Z"
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Cron Security
CRON_SECRET=tu_secreto_aleatorio_aqui
```

### Vercel Cron Jobs

El archivo `vercel.json` ya está configurado:
```json
{
  "crons": [
    {
      "path": "/api/cron/ical-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Esto ejecuta la sincronización cada 15 minutos automáticamente.

**Importante:** Configura `CRON_SECRET` en Vercel Dashboard → Settings → Environment Variables.

---

## 🚀 Uso

### 1. Migración de Base de Datos

Ejecuta la migración en Supabase:
```sql
-- En Supabase SQL Editor
-- Copia el contenido de:
-- HabitApp/supabase/migrations/20260701000000_005_create_external_reservations_and_sync_config.sql
```

### 2. Configurar Propiedad para Sincronización

```typescript
import { createSyncConfig } from '@/lib/data/config-repository';

const config = await createSyncConfig(userId, {
  property_id: 'uuid-de-la-habitacion',
  ical_url: 'https://www.airbnb.com/calendar/ical/XXXXXX.ics',
  source: 'Airbnb',
  auto_sync: true,
  sync_interval_minutes: 15,
});
```

### 3. Sincronización Manual

**Via API:**
```bash
curl -X POST https://tu-app.vercel.app/api/ical/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "propertyId": "uuid",
    "icalUrl": "https://www.airbnb.com/calendar/ical/XXXXXX.ics",
    "source": "Airbnb"
  }'
```

**Via Script:**
```bash
cd HabitApp

# Sincronizar una propiedad
npx tsx scripts/sync-ical.ts \
  --user-id=USER_UUID \
  --property-id=PROPERTY_UUID \
  --ical-url=https://www.airbnb.com/calendar/ical/XXXXXX.ics \
  --source=Airbnb

# Sincronizar todas las propiedades con auto_sync=true
npx tsx scripts/sync-ical.ts --all
```

### 4. Verificar Disponibilidad

```typescript
import { checkRealAvailability } from '@/lib/data/repository';
import { toDate } from '@/lib/data/validators';

// Fechas deseadas
const checkIn = toDate('2026-07-15');
const checkOut = toDate('2026-07-20');

const availability = await checkRealAvailability(
  userId,
  roomId,
  checkIn,
  checkOut
);

if (availability.available) {
  console.log('✓ Habitación disponible');
} else {
  console.log('✗ Conflictos encontrados:');
  availability.conflictingReservations.forEach(conflict => {
    console.log(`  - ${conflict.source}: ${conflict.start_date} → ${conflict.end_date}`);
  });
}
```

---

## 🔄 Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario configura URL iCal en property_sync_config       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Cada 15 min → Vercel Cron → POST /api/cron/ical-sync    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CalendarSyncService.syncAllProperties()                  │
│    - Lee todas las configs con auto_sync = true             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Por cada propiedad:                                      │
│    a. fetchICalFromUrl(url) → 30s timeout                  │
│    b. parseICal(content) → extrae VEVENTs                  │
│    c. Compara con BD existente                              │
│    d. INSERT nuevos eventos                                 │
│    e. UPDATE eventos cambiados                              │
│    f. DELETE eventos eliminados del iCal                    │
│    g. Actualiza last_sync_at y last_sync_status             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Al crear reserva → checkRealAvailability()               │
│    - Consulta reservations + external_reservations          │
│    - Valida solapamientos combinados                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Manejo de Errores

### Errores por Propiedad
- Cada propiedad se sincroniza de forma independiente
- Si una URL falla, las demás continúan
- Errores se registran en `last_sync_error` de `property_sync_config`

### Try/Catch Estratégico

```typescript
// En syncPropertyICal()
try {
  // Fetch iCal → puede fallar (timeout, HTTP 404, etc.)
  const icalContent = await this.fetchICalFromUrl(url);
  
  // Parse iCal → puede fallar (formato inválido)
  const parsedEvents = this.parseICal(icalContent);
  
  // Upsert/Delete → puede fallar (conexión BD, constraints)
  // Cada operación individual tiene try/catch
  
  // Actualizar estado
  await this.updateSyncStatus('success');
} catch (err) {
  await this.updateSyncStatus('error', err.message);
  // No lanza el error → continúa con siguiente propiedad
}
```

### Timeouts
- 30 segundos por request HTTP a URL iCal
- Configurable en `fetchICalFromUrl(url, timeoutMs)`

### Validación
- Verifica que contenido contenga `BEGIN:VEVENT`
- Valida fechas de evento (start < end)
- Normaliza estados: `CANCELLED/CANCELED → cancelled`

---

## 📊 monitoreo

### Ver última sincronización
```bash
curl https://tu-app.vercel.app/api/ical/sync?propertyId=UUID \
  -H "Authorization: Bearer <token>"
```

### Logs en Vercel
```bash
vercel logs tu-app.vercel.app --since 1h | grep "iCal sync"
```

### Métricas
Los headers de respuesta del cron incluyen:
- `X-Sync-Duration`: Duración en ms
- `X-Sync-Total`: Total de propiedades
- `X-Sync-Success`: Exitosas
- `X-Sync-Failed`: Fallidas

---

## 🧪 Testing

### Modo Test (Script)
```bash
cd HabitApp

# Edita scripts/sync-ical.ts y actualiza:
const userId = 'TU_USER_ID';
const propertyId = 'TU_PROPERTY_ID';
const icalUrl = 'https://www.airbnb.com/calendar/ical/TU_URL.ics';

# Ejecuta
npx tsx scripts/sync-ical.ts --test
```

### Simular Cron Localmente
```bash
# Con CRON_SECRET configurado
curl -X POST http://localhost:3000/api/cron/ical-sync \
  -H "Authorization: Bearer tu_cron_secret"
```

---

## 📝 Notas Importantes

1. **Fuentes Soportadas:** Airbnb, Booking, VRBO, Custom (cualquier URL iCal)
2. **Unicidad:** No se permiten duplicados (misma propiedad + external_uid + fuente)
3. **Eliminación:** Si un evento desaparece del iCal, se elimina de BD
4. **Status:** Solo se consideran ocupadas las reservas `status != 'cancelled'`
5. **Performance:** Índices en fechas y propiedad para queries rápidas
6. **Seguridad:** RLS habilitado, policies públicas (single-tenant como el resto de Roomy)
7. **Auto-sync:** Por defecto activado cada 15 minutos
8. **No toca UI:** Todo es backend, no modifica componentes ni estilos

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'node-ical'"
```bash
cd HabitApp
npm install node-ical
```

### Error: "Timeout fetching iCal"
- Verifica que la URL iCal sea accesible públicamente
- Prueba en navegador: `https://tu-url.ics`
- Aumenta el timeout: `fetchICalFromUrl(url, 60000)`

### Error: "Invalid iCal format"
- La URL debe retornar contenido `.ics` válido
- Debe contener bloques `BEGIN:VEVENT`

### Sincronización no se ejecuta
- Verifica `CRON_SECRET` en Vercel
- Revisa logs: `vercel logs`
- Verifica que `auto_sync = true` en `property_sync_config`

### Reservas duplicadas
- Verifica el constraint único: `UNIQUE(property_id, external_uid, source)`
- Si hay duplicados, la inserción falla silenciosamente

---

## 🎯 Próximos Pasos

1. [ ] Ejecutar migración SQL en Supabase
2. [ ] Configurar `CRON_SECRET` en Vercel
3. [ ] Configurar al menos una propiedad con `auto_sync = true`
4. [ ] Probar sincronización manual
5. [ ] Verificar que el cron ejecute correctamente
6. [ ] Integrar `checkRealAvailability()` en el flujo de creación de reservas
7. [ ] Agregar notificaciones de errores de sync (email/Slack)
8. [ ] Implementar webhook de Airbnb/Booking (opcional, más eficiente que polling)

---

## 📚 Recursos

- **iCal RFC:** https://icalendar.org/iCalendar-RFC-5545/
- **node-ical:** https://github.com/peterbraden/node-ical
- **Vercel Cron:** https://vercel.com/docs/cron-jobs
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

**Versión:** 1.0.0  
**Fecha:** Julio 2026  
**Autor:** Ingeniero Senior de Software - Roomy PMS