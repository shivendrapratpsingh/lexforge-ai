// Mobile (React Native) auth support.
//
// The web app uses next-auth's cookie-based JWT session, which React Native's
// fetch can't manage the way a browser does (no automatic cookie jar). Rather
// than teach every route a second auth mechanism, we mint a token here that is
// byte-for-byte the same kind of encrypted JWT next-auth already puts in the
// session cookie (same secret + same "salt" = cookie name). middleware.js then
// takes the mobile client's `Authorization: Bearer <token>` header and injects
// it as that session cookie before the request reaches any route handler, so
// every existing `auth()` call in app/api/** works unmodified for mobile too.
import { encode } from '@auth/core/jwt'
import { authConfig } from '../auth.config'

const MOBILE_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export function sessionCookieName() {
  const url = process.env.NEXTAUTH_URL || ''
  const secure = url.startsWith('https://')
  return secure ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

export async function signMobileToken(user) {
  return encode({
    secret: authConfig.secret,
    salt: sessionCookieName(),
    maxAge: MOBILE_TOKEN_MAX_AGE,
    token: {
      sub: user.id,
      id: user.id,
      name: user.name || null,
      email: user.email,
      tier: user.tier || 'free',
      suspended: !!user.suspended,
    },
  })
}
