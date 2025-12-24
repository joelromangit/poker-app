import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '38px',
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12 2C10.5 2 9 3 8 4.5C5 8.5 2 12 2 15.5C2 19 5 22 8.5 22C10 22 11.5 21 12 19.5C12.5 21 14 22 15.5 22C19 22 22 19 22 15.5C22 12 19 8.5 16 4.5C15 3 13.5 2 12 2Z" />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}

