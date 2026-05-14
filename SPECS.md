# Medly — Especificaciones Técnicas

> Plataforma de gestión de citas médicas

## 1. Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Expo (React Native) + Expo Router |
| UI Kit | React Native Paper (Material Design 3) |
| Estado | Zustand |
| Backend | NestJS 11 + TypeScript |
| ORM | TypeORM 0.3 |
| DB | PostgreSQL 16 |
| Pagos | Stripe (Checkout Sessions) |
| Auth | JWT (access + refresh) |
| Deploy | Azure App Service (Linux) |

## 2. Arquitectura

Monorepo con npm workspaces:

```
medly/              ← Raíz (package.json con workspaces)
├── cliente/        ← App móvil Expo
└── servidor/       ← API NestJS + TypeORM
```

- **API**: Puerto 3000, Swagger en `/api`
- **Frontend**: Expo, Puerto 8081
- **Base de datos**: PostgreSQL, Puerto 5432

## 3. Modelo de Datos

### 3.1 Entidades

#### paciente
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| pacienteID | SERIAL | PK |
| nombre | VARCHAR(50) | NOT NULL |
| apellido_pat | VARCHAR(15) | NOT NULL |
| apellido_mat | VARCHAR(15) | NULLABLE |
| correoElectronico | VARCHAR(150) | UNIQUE, NOT NULL |
| telefono | VARCHAR(15) | NOT NULL |
| fechaNacimiento | DATE | NOT NULL |
| genero | VARCHAR(10) | NOT NULL |

#### cuenta_usuario
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| cuentaID | SERIAL | PK |
| password | VARCHAR(255) | NOT NULL (hash bcrypt) |
| esInvitado | BOOLEAN | DEFAULT false |
| fechaExpiracion | TIMESTAMP | NULLABLE |
| pacienteID | INT | FK → paciente, UNIQUE, CASCADE |

#### especialidad
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| especialidadID | SERIAL | PK |
| nombre | VARCHAR(80) | UNIQUE, NOT NULL |
| icono | VARCHAR(40) | NULLABLE |

#### sucursal
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| sucursalID | SERIAL | PK |
| nombre | VARCHAR(120) | UNIQUE, NOT NULL |
| direccion | VARCHAR(255) | NOT NULL |
| telefono | VARCHAR(20) | NOT NULL |
| capacidadConsultorios | INT | DEFAULT 1 |

#### medico
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| medicoID | SERIAL | PK |
| nombre | VARCHAR(80) | NOT NULL |
| apellidoPat | VARCHAR(40) | NOT NULL |
| apellidoMat | VARCHAR(40) | NULLABLE |
| cedula | VARCHAR(20) | NULLABLE |
| precioConsulta | DECIMAL(10,2) | NOT NULL |
| promedioCalificacion | DECIMAL(3,2) | DEFAULT 0 |
| totalResenas | INT | DEFAULT 0 |
| especialidadID | INT | FK → especialidad, RESTRICT |

#### medico_sucursal (relación M:N)
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| medicoID | INT | PK compuesta, FK → medico, CASCADE |
| sucursalID | INT | PK compuesta, FK → sucursal, CASCADE |

#### slot_agenda
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| slotID | SERIAL | PK |
| medicoID | INT | FK → medico, CASCADE |
| sucursalID | INT | FK → sucursal, CASCADE |
| inicio | TIMESTAMPTZ | NOT NULL |
| fin | TIMESTAMPTZ | NOT NULL |
| estado | ENUM('LIBRE','RESERVADO','OCUPADO') | DEFAULT 'LIBRE' |

Índices: `(medicoID, inicio)`, `(estado)`

#### cita
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| citaID | SERIAL | PK |
| pacienteID | INT | FK → paciente, CASCADE |
| medicoID | INT | FK → medico, RESTRICT |
| sucursalID | INT | FK → sucursal, RESTRICT |
| slotID | INT | FK → slot_agenda, UNIQUE, RESTRICT |
| inicio | TIMESTAMPTZ | NOT NULL |
| fin | TIMESTAMPTZ | NOT NULL |
| estado | ENUM('PENDIENTE_PAGO','CONFIRMADA','CANCELADA','COMPLETADA') | DEFAULT 'PENDIENTE_PAGO' |
| montoTotal | DECIMAL(10,2) | NOT NULL |
| montoAnticipo | DECIMAL(10,2) | NOT NULL |

Índices: `(pacienteID, inicio)`, `(medicoID, inicio)`, `(estado)`

#### pago
| Campo | Tipo | Restricciones |
|-------|------|--------------|
| pagoID | SERIAL | PK |
| citaID | INT | FK → cita, CASCADE |
| stripeCheckoutSessionId | VARCHAR(255) | NULLABLE |
| stripePaymentIntentId | VARCHAR(255) | NULLABLE |
| monto | DECIMAL(10,2) | NOT NULL |
| tipo | ENUM('ANTICIPO_50','REEMBOLSO') | NOT NULL |
| estado | ENUM('PENDIENTE','COMPLETADO','FALLIDO') | DEFAULT 'PENDIENTE' |

Índice: `(stripeCheckoutSessionId)`

### 3.2 Enumeraciones

```typescript
enum EstadoCita    { PENDIENTE_PAGO, CONFIRMADA, CANCELADA, COMPLETADA }
enum EstadoSlot    { LIBRE, RESERVADO, OCUPADO }
enum TipoPago      { ANTICIPO_50, REEMBOLSO }
enum EstadoPago    { PENDIENTE, COMPLETADO, FALLIDO }
```

## 4. API REST (NestJS)

### Auth (`/auth`)

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/auth/registro` | `{nombre, apellido_pat, apellido_mat?, correoElectronico, telefono, fechaNacimiento, genero, password}` | Registrar paciente |
| POST | `/auth/login` | `{correo, contrasena}` | Iniciar sesión, devuelve JWT |

### Usuarios (`/usuarios`)

| Método | Ruta | Body | Auth | Descripción |
|--------|------|------|------|-------------|
| GET | `/usuarios/perfil` | — | JWT | Obtener perfil del usuario autenticado |
| PATCH | `/usuarios/perfil` | `{nombre?, apellido_pat?, apellido_mat?, correoElectronico?, telefono?}` | JWT | Actualizar perfil |

### Especialidades (`/especialidades`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/especialidades` | Listar todas las especialidades |

### Sucursales (`/sucursales`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/sucursales` | Listar todas las sucursales |

### Médicos (`/medicos`)

| Método | Ruta | Query | Descripción |
|--------|------|-------|-------------|
| GET | `/medicos` | `?especialidadId&sucursalId&q` | Listar médicos (filtrable) |
| GET | `/medicos/:id/sucursales` | — | Sucursales donde atiende un médico |

### Horarios (`/horarios`)

| Método | Ruta | Query | Descripción |
|--------|------|-------|-------------|
| GET | `/horarios/disponibles` | `?medicoId&sucursalId&desde&hasta` | Slots libres |

### Citas (`/citas`)

| Método | Ruta | Body | Auth | Descripción |
|--------|------|------|------|-------------|
| POST | `/citas` | `{slotID}` | JWT | Crear cita (PENDIENTE_PAGO) |
| GET | `/citas/mis-citas` | — | JWT | Listar citas del paciente |
| GET | `/citas/proxima` | — | JWT | Siguiente cita próxima |
| GET | `/citas/estadisticas` | — | JWT | Total, completadas, próximas |
| GET | `/citas/:id` | — | JWT | Detalle de cita |
| PATCH | `/citas/:id/cancelar` | — | JWT | Cancelar cita (con reembolso si aplica) |
| DELETE | `/citas/:id/reserva` | — | JWT | Abandonar reserva no pagada |

### Pagos (`/pagos`)

| Método | Ruta | Body | Auth | Descripción |
|--------|------|------|------|-------------|
| POST | `/pagos/checkout-session` | `{citaID}` | JWT | Crear sesión Stripe Checkout |

## 5. Flujos de Negocio

### 5.1 Registro
1. Cliente envía `POST /auth/registro` con datos del paciente
2. Backend crea `Paciente` + `CuentaUsuario` (password hasheado con bcryptjs)
3. Devuelve JWT (access + refresh)

### 5.2 Login
1. Cliente envía `POST /auth/login` con correo y contraseña
2. Backend valida contra `CuentaUsuario.password` (bcrypt)
3. Devuelve JWT (access + refresh)
4. Frontend almacena tokens en `expo-secure-store`

### 5.3 Agendar Cita (Wizard de 4 pasos)
1. **Paso 1** — Seleccionar especialidad (GET /especialidades)
2. **Paso 2** — Seleccionar médico (GET /medicos?especialidadId) y sucursal (GET /medicos/:id/sucursales)
3. **Paso 3** — Seleccionar slot disponible (GET /horarios/disponibles)
4. **Paso 4** — Resumen y pago:
   - `POST /citas` → Cita creada en estado `PENDIENTE_PAGO`
   - `POST /pagos/checkout-session` → URL de Stripe Checkout
   - Abre URL con `expo-web-browser`
   - Polling cada 2.5s hasta que Stripe confirme el pago
5. **Confirmación** → Cita cambia a `CONFIRMADA`

### 5.4 Cancelación de Cita
- Si la cancelación ocurre **≤ 24 horas** antes de la cita → **Sin reembolso**
- Si es **> 24 horas** → Reembolso procesado vía Stripe
- La cita pasa a estado `CANCELADA`

### 5.5 Pagos (Stripe)
- **Anticipo del 50%** del precio de consulta
- Se cobra al agendar la cita vía Stripe Checkout Session
- El restante se paga en consulta (fuera de la app)
- Tipos de pago: `ANTICIPO_50`, `REEMBOLSO`

## 6. Frontend — Estructura de Pantallas

### 6.1 Navegación

```
Root (_layout.tsx)
├── index.tsx → Redirect a (auth)/iniciar-sesion
├── (auth)/
│   ├── _layout.tsx (Stack, sin header)
│   ├── iniciar-sesion.tsx
│   └── registro.tsx
├── (privado)/
│   ├── _layout.tsx (Tabs: Inicio, Agenda, Perfil)
│   ├── inicio.tsx
│   ├── agenda.tsx
│   ├── perfil/index.tsx
│   ├── citas/
│   │   ├── agendar.tsx (Wizard 4 pasos)
│   │   └── [id].tsx (Detalle de cita)
│   └── sucursales/index.tsx
└── +not-found.tsx
```

### 6.2 Roles de Usuario
| Rol | Descripción |
|-----|-------------|
| PACIENTE | Agendar, ver, cancelar citas |
| MEDICO | Gestionar agenda (futuro) |
| RECEPCIONISTA | Registrar citas para pacientes (futuro) |
| ADMIN | Administración del sistema (futuro) |

Actualmente implementado: **PACIENTE** con JWT.

### 6.3 Tema Visual (Paleta de Colores)
```typescript
navy   = "#2F4156"  // Primary
teal   = "#567C8D"  // Secondary
skyblue= "#C8D9E6"  // Surface variant / gris claro
beige  = "#F5EFEB"  // Background
```

## 7. Despliegue en Azure App Service (Linux)

Despliegue manual del backend (NestJS) en Azure App Service con runtime Node.js 20 nativo, sin Docker.

### 7.1 Prerrequisitos

- Cuenta de Azure con suscripción activa
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) instalada (`az login`)
- Node.js 20+ local
- Git

### 7.2 Paso 1 — Crear Base de Datos

1. En [Azure Portal](https://portal.azure.com) → **Azure Database for PostgreSQL**
2. Elegir **Flexible Server**
3. Configurar:
   - **Suscripción y Grupo de Recursos** — crear uno nuevo (ej. `rg-medly`)
   - **Nombre del servidor** — ej. `medly-postgres`
   - **Región** — la misma donde estará el App Service
   - **Versión PostgreSQL** — 16
   - **Usuario administrador** — `medlyadmin`
   - **SKU** — `Standard_B1ms` (burstable, suficiente para empezar)
4. En **Redes** → Permitir acceso desde servicios de Azure
5. Crear el servidor
6. Ir a **Bases de datos** → Crear base de datos `medly`
7. Obtener el **connection string** en formato `postgresql://usuario:password@host:5432/medly`

### 7.3 Paso 2 — Crear App Service (Linux)

1. En Azure Portal → **App Services** → **Crear**
2. Configurar:
   - **Suscripción y Grupo de Recursos** — el mismo de la BD (`rg-medly`)
   - **Nombre** — ej. `medly-api`
   - **Publicar** — `Código`
   - **Runtime stack** — `Node.js 20`
   - **Sistema operativo** — `Linux`
   - **Región** — misma que la BD
   - **Plan App Service** — `B1` (Básico) o `F1` (Gratis)
3. Revisar y crear

### 7.4 Paso 3 — Configurar Variables de Entorno

En Azure Portal → App Service `medly-api` → **Settings** → **Environment variables**:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Connection string de Azure PostgreSQL Flexible Server |
| `JWT_SECRET` | Secreto seguro para firmar JWT |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | Otro secreto seguro para refresh token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `APP_PUBLIC_URL` | URL pública del API (`https://medly-api.azurewebsites.net`) |

> **Nota**: Azure App Service asigna el `PORT` internamente; la app lo lee con `process.env.PORT ?? 3000`.

### 7.5 Paso 4 — Compilar el proyecto

```bash
cd servidor
npm install
npm run build
```

### 7.6 Paso 5 — Desplegar el código

**Opción A — Zip deploy desde Azure Portal:**

1. Comprimir la carpeta `servidor/` (incluyendo `dist/`, `node_modules/`, `package.json`)
2. En Azure Portal → App Service `medly-api` → **Deployment Center** → **Zip Deploy**
3. Subir el archivo `.zip`

**Opción B — Azure CLI:**

```bash
cd servidor
az webapp up \
  --name medly-api \
  --resource-group rg-medly \
  --runtime "NODE:20-lts" \
  --os-type linux
```

### 7.7 Paso 6 — Ejecutar Migrations

Ejecutar migrations contra la BD de Azure desde tu máquina local:

```bash
# Exporta la DATABASE_URL de Azure PostgreSQL en tu terminal:
export DATABASE_URL="postgresql://usuario:password@medly-postgres.postgres.database.azure.com:5432/medly"

# O en Windows PowerShell:
# $env:DATABASE_URL = "postgresql://..."

cd servidor
npm run migration:run
```

> Alternativa: Conectar la BD desde **Azure Cloud Shell** o abrir el puerto en Firewall de Azure PostgreSQL y conectarte con `psql`.

### 7.8 Paso 7 — Verificar

- Ir a `https://medly-api.azurewebsites.net/api` → Debería mostrar Swagger
- Si algo falla, revisar **App Service** → **Monitor** → **Log stream** para ver errores en tiempo real

### 7.9 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar TypeScript |
| `npm run start:prod` | Iniciar en producción |
| `npm run migration:run` | Ejecutar migrations TypeORM |
| `npm run seed` | Poblar DB con datos iniciales |
| `az webapp log tail --name medly-api --resource-group rg-medly` | Ver logs en tiempo real |

### 7.10 Notas importantes

- Los archivos `railway.json` y `Procfile` fueron eliminados al migrar de Railway a Azure.
- El archivo `Dockerfile` en `servidor/` existe pero **no se usa** con App Service (Linux) nativo. Se conserva por si en el futuro se desea migrar a Azure Container Apps.
- `servidor/.env` está actualmente trackeado en git. Para evitar exponer credenciales, ejecuta:
  ```bash
  git rm --cached servidor/.env
  echo ".env" >> servidor/.gitignore
  ```

## 8. Dependencias Principales

### Servidor (NestJS)
```
@nestjs/common, core, config, jwt, passport, swagger, typeorm
typeorm, pg, bcryptjs, class-validator, class-transformer
stripe, passport, passport-jwt, joi
```
### Cliente (Expo)
```
expo, expo-router, expo-secure-store, expo-web-browser
react-native-paper, @react-navigation/native
zustand, axios, @stripe/stripe-react-native
```
