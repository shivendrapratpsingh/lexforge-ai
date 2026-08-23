import { COMPANY } from '@/lib/company'

// Only the pages a stranger can actually read. A sitemap listing routes
// that redirect to /login tells a search engine the site is mostly
// closed, which is the opposite of the point.
export default function sitemap() {
  const base = COMPANY.site
  const now = new Date()
  return [
    { url: base,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/for-colleges`,lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/register`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/contact`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/refund`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
