import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || `${site.name} — ${site.tagline}`;
  const subtitle = searchParams.get('subtitle') || '';
  const tag = searchParams.get('tag') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A2B4A 0%, #0D1B33 100%)',
          padding: 80,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gold accent */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,165,92,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,165,92,0.15) 0%, transparent 70%)',
          }}
        />
        {/* Gold line accent */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            bottom: 120,
            width: 120,
            height: 4,
            borderRadius: 2,
            background: '#C5A572',
          }}
        />
        {/* Tag line */}
        {tag && (
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#C5A572',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            {tag}
          </div>
        )}
        {/* Main title */}
        <div
          style={{
            display: 'flex',
            fontSize: 58,
            color: '#FFFFFF',
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 1000,
            textWrap: 'balance',
          }}
        >
          {title}
        </div>
        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 20,
              maxWidth: 900,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
        {/* Brand footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#C5A572',
              color: '#1A2B4A',
              fontSize: 22,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            PA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 700 }}>
              Pineda y Asociados
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {site.address.city}, {site.address.department} · Honduras
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
