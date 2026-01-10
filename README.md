# 🃏 Poker Nights

Una aplicación elegante para llevar el registro de tus partidas de poker con amigos. Calcula automáticamente las ganancias y pérdidas en euros basándose en el valor de las fichas.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)

## ✨ Características

- 📱 **Diseño responsive** - Funciona perfectamente en móvil y escritorio
- 🎨 **Tema elegante** - Inspirado en las mesas de poker
- 💰 **Cálculo automático** - Convierte fichas a euros automáticamente
- ✅ **Validación de balance** - Verifica que las fichas cuadren
- 📊 **Estadísticas** - Ve el historial completo de partidas
- 🔗 **Compartir** - Comparte los resultados fácilmente

## 📋 Tabla de Contenidos

- [🚀 Configuración](#configuración)
  - [Desarrollo local](#1-instalar-supabase-cli-para-desarrollo-local)
  - [Producción](#️-configuración-con-supabase-cloud-producción)
- [🌐 Desplegar en Vercel](#-desplegar-en-vercel)
- [📝 Uso](#-uso)
- [🛠️ Tecnologías](#️-tecnologías)
- [❓ Preguntas Frecuentes](#-preguntas-frecuentes)

## 🚀 Configuración

### 1. Instalar Supabase CLI (para desarrollo local)

```bash
# Usando npm
npm install -g supabase

# O usando Homebrew (macOS)
brew install supabase/tap/supabase
```

### 2. Iniciar Supabase local

```bash
# Iniciar todos los servicios de Supabase localmente
supabase start

# Ver estado de los servicios
supabase status

# Detener los servicios cuando termines
supabase stop
```

**Ports disponibles:**
- API: http://localhost:54321
- DB: localhost:54322
- Studio: http://localhost:54323
- Storage: http://localhost:54323/storage

### 4. Configurar variables de entorno para desarrollo local

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Desarrollo local (valores por defecto de Supabase local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvayIsInJvbGUiOiJhbGciLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTc4MDAwMDAwMH0.placeholder
```

### 5. Instalar y ejecutar la aplicación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 🌐 Desplegar en Vercel

1. Sube el repositorio a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Añade las variables de entorno en la configuración del proyecto
4. ¡Deploy automático!

## 📝 Uso

### Nueva partida

1. Pulsa "Nueva Partida"
2. Configura el valor de cada ficha (ej: 0.05€)
3. Indica las fichas iniciales por jugador (ej: 100)
4. Añade los jugadores con sus fichas finales
5. La app calcula automáticamente las ganancias/pérdidas
6. Guarda cuando el balance cuadre

### Ver historial

- La página principal muestra todas las partidas
- Estadísticas generales en la parte superior
- Pulsa en una partida para ver los detalles

## 🛠️ Tecnologías

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS v4** - Estilos utilitarios
- **Supabase** - Base de datos PostgreSQL
- **Lucide Icons** - Iconos SVG

## 📄 Licencia

MIT
