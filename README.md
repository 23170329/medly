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

### 1. Variables en Railway

En el dashboard de Railway, en el servicio **API**, configura las mismas variables que en `servidor/.env` (sobre todo `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, Stripe, `APP_PUBLIC_URL`).

### 2. Variables locales

```bash
cp .env.example .env
cp .env.example servidor/.env
cp cliente/.env.example cliente/.env
```

Rellena `DATABASE_URL` y las URLs con los valores de Railway. En `cliente/.env` usa `EXPO_PUBLIC_API_URL=https://….up.railway.app` (el cliente añade `/api/v1` automáticamente).

Tras cambios en login (CURP/teléfono), **sube el código a Git y redespliega** el servicio `servidor` en Railway (`npm run build` + migraciones). La app usa `POST /auth/ingreso` para CURP y teléfono; sin redespliegue solo funcionará el correo en `/auth/login`.

**Probar CURP en local:** `cd servidor && npm run start:dev`, en `cliente/.env` pon `EXPO_PUBLIC_API_URL=http://TU_IP:3000/api/v1`, luego `npx expo start -c`.

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
| Recepción | `recepcion@medly.r` | `RecepMedly1!` |

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
