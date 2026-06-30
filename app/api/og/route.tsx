import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '1100px',
            height: '1100px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        {/* ROOMY in giant font */}
        <div
          style={{
            fontSize: 300,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '20px',
            lineHeight: 1,
          }}
        >
          ROOMY
        </div>
        {/* R badge in corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#0a0a0a',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>R</span>
          </div>
          <span style={{ fontSize: 20, color: '#a1a1aa', letterSpacing: '2px' }}>PMS para hostels</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
