import { redirect } from 'next/navigation'

// Recovery moved to /forgot-password, which asks the security question
// instead of consuming an emailed token. This route is kept so any old
// bookmark or stale reset link lands somewhere useful rather than 404.
export default function ResetPasswordPage() {
  redirect('/forgot-password')
}
