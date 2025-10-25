module.exports = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'openweathermap.org', pathname: '/img/wn/**' },
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
        ],
    },
}