# Medly

Plataforma de gestión de citas médicas — monorepo con NestJS + Expo.

## Estructura

```
medly/
├── servidor/ # API REST (NestJS + PostgreSQL)
└── cliente/ # App móvil (React Native + Expo Router)
```

## Requisitos previos

- Node.js 20+
- Expo Go (en celular) o emulador

## Desarrollo con Railway (recomendado)

API y base de datos en [Railway](https://railway.app). En tu PC solo corres la app Expo.

### 1. Variables requeridas en Railway

En el dashboard de Railway, servicio **API** (el conectado al repo), agrega estas variables:

| Variable | Descripción | Generación |
|---|---|---|
| `DATA_ENCRYPTION_KEY` | Clave AES-256-GCM para cifrado de datos clínicos | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `STRIPE_SECRET_KEY` | Tu Stripe secret key (`sk_test_...` o `sk_live_...`) | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) | Stripe Dashboard |
| `APP_PUBLIC_URL` | URL pública del API | `https://tu-api.up.railway.app` |
| `EXPO_PUBLIC_API_URL` | Misma URL para el frontend | `https://tu-api.up.railway.app` |
| `FRONTEND_URL` | URL del frontend (Expo) | `https://tu-frontend.up.railway.app` o `http://localhost:8081` |
| `PORT` | Puerto del servidor | `3000` |

> Railway asigna `DATABASE_URL` automáticamente al crear el servicio PostgreSQL — no la agregues manualmente.

### 2. Variables locales

```bash
cp .env.example .env
cp .env.example servidor/.env
cp cliente/.env.example cliente/.env
```

En `servidor/.env` completa las URLs locales. En Railway los valores se toman del dashboard, no del `.env`.

### 3. App móvil

```bash
cd cliente
npm install
npx expo start -c
```

Escanea el QR con Expo Go. La app habla con el API en Railway; no necesitas `npm run start:dev` ni Docker.

### Comandos opcionales (migraciones / seed contra Railway)

```bash
cd servidor
npm install
npm run migration:run
npm run seed
```

Usan `DATABASE_URL` de `servidor/.env`.

**Login médico / recepción (no uses Registro de paciente):**

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Médico | `doctor@medly.d` | `DoctorMedly1!` |
| Médico | `adriana@medly.d` | `12345678a` |
| Recepción Norte | `recepcion@medly.r` | `RecepMedly1!` |
| Recepción Sur | `recepcion.sur@medly.r` | `RecepMedly1!` |

Si el login devuelve 401 en Railway, casi siempre falta ejecutar `npm run seed` contra la misma `DATABASE_URL` del despliegue.

### Comprobar el API

Abre en el navegador: `https://tu-dominio.up.railway.app/api/v1/docs` (Swagger).

---

## Desarrollo local (Docker + API en tu PC)

Si prefieres Postgres y API en la máquina:

```bash
docker compose up -d
cd servidor && cp .env.example .env   # modo local en .env.example
npm install && npm run start:dev
cd ../cliente && cp .env.example .env   # EXPO_PUBLIC_API_URL=http://TU_IP:3000
npx expo start
```

## Comandos útiles

| Comando | Descripción |
| -------- | ------------- |
| `npx expo start -c` | App móvil (modo Railway) |
| `npm run migration:run` | Migraciones contra la BD configurada en `.env` |
| `docker compose up -d` | Solo modo local (Postgres + Adminer) |
