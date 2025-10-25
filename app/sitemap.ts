export default async function sitemap() {
  const routes = ['', '/privacy', '/terms', '/contact'].map((route) => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes]
}
