import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || siteConfig.name;
  const subtitle = searchParams.get('subtitle') || siteConfig.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#fbfaf7',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 32,
            color: '#14130f',
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          bbs
          <span style={{ color: '#a8451f' }}>/</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 500,
              color: '#14130f',
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              marginBottom: 24,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#595650',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#8a8780',
          }}
        >
          <span>{siteConfig.name}.com</span>
          <span>a quiet corner on the internet</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
