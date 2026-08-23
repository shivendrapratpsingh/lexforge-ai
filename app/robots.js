import { COMPANY } from '@/lib/company'

// Search engines are told what to index and, more importantly, what not
// to. Everything behind a login is noise in an index: a crawler cannot
// see it, and a result that lands a stranger on a sign-in page is a
// result that teaches Google the site is not useful.
export default function robots() {
  const base = COMPANY.site
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', '/admin/', '/dashboard', '/drafts', '/new-draft',
        '/clients', '/court-dates', '/tools', '/research', '/case-law',
        '/acts', '/study', '/future-lawyer', '/account', '/college',
        '/onboarding', '/upgrade',
      ],
    }],
    sitemap: `${base}/sitemap.xml`,
  }
}
