# Medly — Árbol del Proyecto

```
medly/
│
├── package.json               # Raíz con npm workspaces: [servidor, cliente]
├── tsconfig.json              # Project references → servidor/ + cliente/
├── .gitignore
├── .env.example               # Ejemplo de variables compartidas
├── docker-compose.yml         # PostgreSQL 16 + Adminer + pgAdmin + API
├── README.md
├── FILETREE.md                # ← Este archivo
├── SPECS.md                   # Especificaciones técnicas
│
├── cliente/                   # ── App Móvil (Expo + React Native) ──
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json          # extends expo/tsconfig.base
│   ├── .env.example
│   │
│   ├── app/                   # Expo Router (file-based routing)
│   │   ├── _layout.tsx        # Layout raíz
│   │   ├── index.tsx          # Redirect → /(auth)/iniciar-sesion
│   │   ├── +not-found.tsx
│   │   │
│   │   ├── (auth)/            # Grupo de autenticación
│   │   │   ├── _layout.tsx    # Stack navigator (beige bg, sin header)
│   │   │   ├── iniciar-sesion.tsx
│   │   │   └── registro.tsx
│   │   │
│   │   └── (privado)/         # Grupo privado (requiere JWT)
│   │       ├── _layout.tsx    # Bottom Tabs: Inicio, Agenda, Perfil
│   │       ├── inicio.tsx
│   │       ├── agenda.tsx
│   │       ├── perfil/
│   │       │   └── index.tsx
│   │       ├── citas/
│   │       │   ├── agendar.tsx # Wizard 4 pasos + Stripe Checkout
│   │       │   └── [id].tsx   # Detalle de cita
│   │       └── sucursales/
│   │           └── index.tsx
│   │
│   ├── componentes/
│   │   └── comunes/
│   │       ├── Boton.tsx      # Botón reutilizable con tema
│   │       ├── Entrada.tsx    # Input field con tema
│   │       └── IndicadorPasos.tsx
│   │
│   ├── stores/
│   │   └── auth.store.ts      # Zustand: auth state, SecureStore
│   │
│   ├── tipos/
│   │   └── usuario.tipos.ts   # TypeScript interfaces (vacío)
│   │
│   ├── lib/
│   │   ├── apiCliente.ts      # Axios instance + JWT interceptor
│   │   └── medlyApi.ts        # Funciones para cada endpoint API
│   │
│   └── constants/
│       ├── api.ts             # URL dinámica del API (LAN / localhost)
│       └── theme.ts           # Paleta de colores + tema MD3
│
└── servidor/                  # ── API REST (NestJS 11 + TypeORM) ──
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── nest-cli.json          # deleteOutDir: true
    ├── data-source.ts         # TypeORM DataSource CLI
    ├── Dockerfile
    ├── .dockerignore
    ├── .env.example
    │
    ├── scripts/
    │   └── seed.ts            # Poblado inicial de datos
    │
    ├── test/
    │   └── app.e2e-spec.ts
    │
    └── src/
        ├── main.ts            # Entry point
        ├── app.module.ts      # Módulo raíz (importa todos los demás)
        ├── app.controller.ts
        ├── app.controller.spec.ts
        ├── app.service.ts
        │
        ├── common/
        │   └── enums.ts       # EstadoCita, EstadoSlot, TipoPago, EstadoPago
        │
        ├── config/
        │   └── env.validation.ts  # Joi schema para variables de entorno
        │
        ├── auth/              # Autenticación JWT
        │   ├── auth.module.ts
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   ├── jwt-payload.interface.ts
        │   ├── dto/
        │   │   └── login.dto.ts
        │   ├── decorators/
        │   │   └── current-user.decorator.ts
        │   ├── guards/
        │   │   └── jwt-auth.guard.ts
        │   └── strategies/
        │       └── jwt.strategy.ts
        │
        ├── usuarios/          # Pacientes y cuentas
        │   ├── usuarios.module.ts
        │   ├── usuarios.controller.ts
        │   ├── usuarios.service.ts
        │   ├── dto/
        │   │   ├── registro.dto.ts
        │   │   └── actualizar-perfil.dto.ts
        │   └── entities/
        │       ├── paciente.entity.ts
        │       └── cuenta-usuario.entity.ts
        │
        ├── especialidades/    # Especialidades médicas
        │   ├── especialidades.module.ts
        │   ├── especialidades.controller.ts
        │   ├── especialidades.service.ts
        │   └── entities/
        │       └── especialidad.entity.ts
        │
        ├── sucursales/        # Sucursales / consultorios
        │   ├── sucursales.module.ts
        │   ├── sucursales.controller.ts
        │   ├── sucursales.service.ts
        │   └── entities/
        │       └── sucursal.entity.ts
        │
        ├── medicos/           # Médicos (catálogo)
        │   ├── medicos.module.ts
        │   ├── medicos.controller.ts
        │   ├── medicos.service.ts
        │   └── entities/
        │       ├── medico.entity.ts
        │       └── medico-sucursal.entity.ts  # Relación M:N
        │
        ├── horarios/          # Slots de agenda disponibles
        │   ├── horarios.module.ts
        │   ├── horarios.controller.ts
        │   ├── horarios.service.ts
        │   └── entities/
        │       └── slot-agenda.entity.ts
        │
        ├── citas/             # Gestión de citas
        │   ├── citas.module.ts
        │   ├── citas.controller.ts
        │   ├── citas.service.ts
        │   ├── dto/
        │   │   └── crear-cita.dto.ts
        │   └── entities/
        │       └── cita.entity.ts
        │
        ├── pagos/             # Pagos con Stripe
        │   ├── pagos.module.ts
        │   ├── pagos.controller.ts
        │   ├── pagos.service.ts
        │   ├── dto/
        │   │   └── checkout-session.dto.ts
        │   └── entities/
        │       └── pago.entity.ts
        │
        └── migrations/        # TypeORM migrations
            └── 1738700000000-InitialMedly.ts
```

## Convenciones

- **Idioma**: Código fuente en español (módulos, variables, comentarios)
- **Arquitectura**: NestJS modular (cada feature: module + controller + service + entities + dto)
- **Base de datos**: Naming snake_case para tablas y columnas en DB; camelCase en TypeScript
- **API**: Rutas RESTful en plural (`/citas`, `/medicos`, `/pagos`)
- **Auth**: JWT en header `Authorization: Bearer <token>`, almacenado en `expo-secure-store`
