# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ESDOMED Services** — Portal operativo interno para el servicio de Estadística y Documentos Médicos (ESDOMED) de un hospital. Conecta médicos con el personal de ESDOMED para tres flujos de trabajo:

1. **Traslados** — Médicos solicitan traslado de servicio/cama; ESDOMED revisa en el SIS del hospital (manualmente, fuera del sistema) y confirma/rechaza en esta app.
2. **Fallecidos** — Médicos notifican pacientes fallecidos vía formulario; ESDOMED confirma de recibido.
3. **Impresiones** — Médicos suben PDFs para imprimir; ESDOMED marca como impreso indicando quién lo hizo.

No hay integración técnica con el SIS del hospital; esa verificación es manual por parte del personal de ESDOMED.

## Stack

- **Next.js 14** (App Router, `src/` directory)
- **TypeScript**
- **Tailwind CSS**
- **Firebase**: Auth, Firestore, Storage

## Commands

```bash
npm run dev       # Servidor de desarrollo en localhost:3000
npm run build     # Build de producción
npm run lint      # ESLint
```

## Environment Variables

Copiar `.env.local` y rellenar con los valores del proyecto Firebase `esdomed-services`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Architecture

### Routing & Role-based Access

Hay dos roles: `medico` y `esdomed`, almacenados en la colección `usuarios` de Firestore.

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | público | Redirige según rol |
| `/login` | público | Autenticación |
| `/medico/*` | `medico` | Crear solicitudes |
| `/dashboard/*` | `esdomed` | Gestionar solicitudes |

Las rutas protegidas deben verificar `profile.role` desde `useAuth()` y redirigir si no corresponde.

### Auth Flow

`AuthContext` (`src/contexts/AuthContext.tsx`) maneja todo el estado de autenticación. Al hacer login, además del `User` de Firebase Auth, carga el documento `usuarios/{uid}` de Firestore que contiene el rol y datos del usuario. Usar siempre `useAuth()` para acceder a `user`, `profile`, `loading`.

### Firestore Collections

```
usuarios/{uid}
  - nombre, email, role: "medico"|"esdomed", servicio (solo médicos)

traslados/{id}
  - ver SolicitudTraslado en src/types/index.ts

notificaciones_fallecidos/{id}
  - ver NotificacionFallecido en src/types/index.ts

solicitudes_impresion/{id}
  - ver SolicitudImpresion en src/types/index.ts
```

Todos los tipos están definidos en `src/types/index.ts`.

### Firebase Initialization

`src/lib/firebase.ts` exporta `auth`, `db`, `storage`. Usa `getApps()` para evitar re-inicialización en hot reload. Importar siempre desde ahí, nunca llamar `initializeApp` directamente.

### Creating Users

Los usuarios no se registran solos — los crea el administrador directamente en Firebase Auth y luego se crea su documento en `usuarios/{uid}` con el rol correspondiente. No hay flujo de registro público.
