import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const title = url.searchParams.get('title') || 'Life OS'
    const description = url.searchParams.get('description') || 'Your life, all in one place.'

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
                    backgroundColor: '#000',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
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
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '24px',
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 11l3 3L22 4"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <span
                            style={{
                                fontSize: '48px',
                                fontWeight: 700,
                                color: 'white',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Life OS
                        </span>
                    </div>

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: title.length > 40 ? '56px' : '72px',
                            fontWeight: 800,
                            color: 'white',
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

                    {/* Description */}
                    <p
                        style={{
                            fontSize: '32px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            maxWidth: '800px',
                            lineHeight: 1.4,
                        }}
                    >
                        {description}
                    </p>

                    {/* Decorative elements */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            right: '60px',
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#667eea',
                                opacity: 0.6,
                            }}
                        />
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#764ba2',
                                opacity: 0.6,
                            }}
                        />
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#f093fb',
                                opacity: 0.6,
                            }}
                        />
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    )
}
  