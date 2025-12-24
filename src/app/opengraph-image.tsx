import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Poker Nights - Gestión de Partidas';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%)',
          position: 'relative',
        }}
      >
        {/* Patrón de fondo sutil */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)',
          }}
        />
        
        {/* Contenido principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Emoji de cartas */}
          <div style={{ fontSize: 120, marginBottom: 20 }}>🃏</div>
          
          {/* Título */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#f0f4f8',
              marginBottom: 16,
              letterSpacing: '-2px',
            }}
          >
            Poker Nights
          </div>
          
          {/* Subtítulo */}
          <div
            style={{
              fontSize: 32,
              color: '#8b9cb3',
              marginBottom: 40,
            }}
          >
            Gestión de Partidas
          </div>
          
          {/* Chips decorativos */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#ef4444',
                border: '4px dashed #fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#10b981',
                border: '4px dashed #6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#3b82f6',
                border: '4px dashed #93c5fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#fbbf24',
                border: '4px dashed #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </div>
        </div>
        
        {/* Borde elegante */}
        <div
          style={{
            position: 'absolute',
            inset: 20,
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 24,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

