import { RegisterForm } from '@/components/auth/RegisterForm'
import { getSafeNextPath } from '@/lib/auth/redirect'

type PageProps = {
  searchParams: Promise<{
    next?: string | string[]
    email?: string | string[]
  }>
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams
  const nextPath = getSafeNextPath(typeof params.next === 'string' ? params.next : null)
  const initialEmail = typeof params.email === 'string' ? params.email : ''

  return <RegisterForm initialEmail={initialEmail} nextPath={nextPath} />
}
