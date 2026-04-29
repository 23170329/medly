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
- Docker Desktop
- Expo Go (en celular)

## Inicio rápido

### 1. Base de datos

```bash
docker compose up -d
```

### 2. Backend

```bash
cd servidor
cp .env.example .env   # rellena las variables
npm install
npm run start:dev
```

Servidor disponible en `http://localhost:3000`
Swagger en `http://localhost:3000/api`

### 3. Frontend

```bash
cd cliente
cp .env.example .env   # pon tu IP local en EXPO_PUBLIC_API_URL
npm install
npx expo start
```

Escanea el QR con Expo Go (misma red WiFi).

## Comandos útiles

| Comando                | Descripción                  |
| ---------------------- | ---------------------------- |
| `docker compose up -d` | Levanta PostgreSQL + Adminer |
| `docker compose down`  | Detiene los contenedores     |
| `npm run start:dev`    | Backend en modo watch        |
| `npx expo start`       | Frontend con hot reload      |
