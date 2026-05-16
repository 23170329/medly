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
| Deploy | Railway |

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

## 7. Despliegue en Railway

### 7.1 Prerrequisitos
- Cuenta en [Railway](https://railway.app) con GitHub
- Stripe account (producción o test)
- PostgreSQL database en Railway (crear desde dashboard)

### 7.2 Pasos para desplegar

1. **Crear proyecto** en Railway → Deploy from GitHub → `medly`
2. **Agregar PostgreSQL** desde el dashboard de Railway
3. **Configurar variables de entorno** en Railway:
   ```
   JWT_SECRET=<string_seguro>
   JWT_REFRESH_SECRET=<otro_string>
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=<url_deploy_frontend>
   APP_PUBLIC_URL=<url_railway_del_api>
   ```
   Railway asigna automáticamente `DATABASE_URL` y `PORT`.
4. **Ejecutar migrations**:
   ```bash
   npx railway run npm run migration:run
   ```
5. El `railway.json` y `Procfile` ya están configurados para iniciar con `node dist/src/main.js`.

### 7.3 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `production` (Railway asigna automáticamente) |
| `PORT` | Railway asigna automáticamente |
| `DATABASE_URL` | Railway asigna automáticamente (PostgreSQL) |
| `JWT_SECRET` | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | `15m` por defecto |
| `JWT_REFRESH_SECRET` | Secreto para refresh token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` por defecto |
| `STRIPE_SECRET_KEY` | API key secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `APP_PUBLIC_URL` | URL pública del API (redirects Stripe) |

### 7.4 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar TypeScript |
| `npm run start:prod` | Iniciar en producción |
| `npm run migration:run` | Ejecutar migrations TypeORM |
| `npm run seed` | Poblar DB con datos iniciales |

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
