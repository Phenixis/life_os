const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
})

module.exports = withPWA({
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'openweathermap.org', pathname: '/img/wn/**' },
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
        ],
    },
})