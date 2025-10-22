const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
})

module.exports = withPWA({
    experimental: {
        ppr: 'incremental',
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'openweathermap.org', pathname: '/img/wn/**' },
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
            // Add any other external image hosts you use
        ],
    },
})