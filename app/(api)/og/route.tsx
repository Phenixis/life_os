import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'Life OS'
  const description = url.searchParams.get('description') || 'Your life, all in one place.'

  // Fetch the favicon image
  const faviconUrl = new URL('/favicon.png', url.origin)
  const faviconResponse = await fetch(faviconUrl.toString())
  const faviconArrayBuffer = await faviconResponse.arrayBuffer()
  const faviconBase64 = Buffer.from(faviconArrayBuffer).toString('base64')
  const faviconDataUrl = `data:image/png;base64,${faviconBase64}`

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
          backgroundColor: '#fff',
        }}
      >
        {/* Main content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 120px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <img
              src={faviconDataUrl}
              alt="Life OS Logo"
              width="80"
              height="80"
              style={{
                marginRight: '24px',
              }}
            />
            <h1
              style={{
                fontSize: title.length > 40 ? '56px' : '72px',
                fontWeight: 800,
                color: 'black',
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: '24px',
                maxWidth: '900px',
                background: 'linear-gradient(135deg, #fff 0%, #a0aec0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '32px',
              color: '#4a5568',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
