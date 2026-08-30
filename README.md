# Poker Nights

> Registro de partidas de poker caseras: introduces las fichas finales de cada jugador y la app cuadra el balance y convierte a euros automáticamente.

[![Stack](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

---

## Qué es

Poker Nights es una app web mobile-first para llevar el histórico de partidas con amigos. Configuras el valor de la ficha y las fichas iniciales por jugador, anotas con cuántas fichas acaba cada uno y la app valida que el balance cuadre antes de guardar. El histórico se queda en Supabase y puedes consultarlo, compartirlo y ver rankings sin volver a abrir una hoja de cálculo.

## Flujo principal

| Paso | Qué pasa |
|---|---|
| **Nueva partida** | Defines valor por ficha (ej. `0.05 €`) y fichas iniciales por jugador (ej. `100`) |
| **Jugadores** | Añades a los participantes con sus fichas finales |
| **Cálculo automático** | La app convierte fichas a euros y calcula ganancias/pérdidas de cada uno |
| **Validación** | No se guarda hasta que el total de fichas finales cuadre con el reparto inicial |
| **Histórico** | Todas las partidas quedan listadas con estadísticas globales y detalle por partida |
| **Compartir** | Resultado de una partida compartible con un enlace |

## Features destacadas

- **Mobile-first** pensada para abrirla en el móvil al terminar la partida en menos de un minuto
- **Validación de balance** que evita guardar partidas con fichas descuadradas
- **Conversión ficha → euro** automática a partir del valor unitario
- **Histórico completo** con estadísticas agregadas en la home
- **Ranking de jugadores** con vistas mensuales y anuales
- **Edición y recorte de imágenes** con `react-easy-crop` para avatares
- **Gráficos** con `recharts` para visualizar evolución y comparativas
- **Validación de formularios** con `zod` en cliente y servidor
- **Tema oscuro tipo mesa de poker** con Tailwind CSS v4
- **Compartir partida** mediante enlace directo a la vista de detalle

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI:** Tailwind CSS v4, `lucide-react` para iconografía, `recharts` para gráficos
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Validación:** `zod`
- **Tooling:** Biome (lint + format), Vitest (tests)
- **Deploy:** Vercel

## Estructura

```
src/
├── app/           rutas Next.js (App Router)
├── components/    componentes UI reutilizables
├── lib/           cliente Supabase, helpers y database.types.ts
└── types/         tipos compartidos del dominio
supabase/
├── config.toml    configuración del proyecto Supabase
└── migrations/    migraciones SQL versionadas
biome.json         configuración de lint y formato
vitest.config.ts   configuración de tests
```

## Empezar en local

```bash
git clone https://github.com/joelromangit/poker-app.git
cd poker-app
npm install
npm run dev
```

### Opción A — Supabase local

```bash
# Instalar la CLI (una vez)
npm install -g supabase
# o:  brew install supabase/tap/supabase

# Levantar Postgres + Studio + Storage en local
supabase start
```

Puertos por defecto:

| Servicio | URL |
|---|---|
| API | `http://localhost:54321` |
| DB | `localhost:54322` |
| Studio | `http://localhost:54323` |

### Opción B — Supabase Cloud

Crea un proyecto en [supabase.com](https://supabase.com) y aplica las migraciones de `supabase/migrations/`.

### Variables de entorno

Crea un `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=<tu-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

## Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm start` | Servir el build |
| `npm run lint` | Biome check sobre todo el proyecto |
| `npm run lint:fix` | Lint y autofix con Biome |
| `npm run format` | Formato con Biome |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests con Vitest |
| `npm run test:ui` | UI interactiva de Vitest |
| `npm run db:generate` | Regenera `database.types.ts` desde el esquema de Supabase |

## Desplegar en Vercel

1. Sube el repo a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como variables de entorno
4. Deploy automático en cada push a `master`

## Convenciones

- Mobile-first; el escritorio es un extra
- Español para UI, inglés para código
- Tipos de Supabase generados, no escritos a mano
- Sin emojis en código

## Autor

[**Joel Roman**](https://github.com/joelromangit)
