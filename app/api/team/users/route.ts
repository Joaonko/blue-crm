import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const allowedRoles = new Set(['admin', 'manager', 'member'])

export async function POST(req: NextRequest) {
  const { fullName, email, password, role } = await req.json()

  const normalizedName = String(fullName ?? '').trim()
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const normalizedPassword = String(password ?? '')
  const normalizedRole = String(role ?? '')

  if (!normalizedName || !normalizedEmail || !normalizedPassword || !allowedRoles.has(normalizedRole)) {
    return NextResponse.json({ error: 'Preencha nome, e-mail, senha e papel corretamente.' }, { status: 400 })
  }

  if (normalizedPassword.length < 6) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!currentMember) {
    return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 404 })
  }

  if (!['owner', 'admin'].includes(currentMember.role)) {
    return NextResponse.json({ error: 'Você não tem permissão para criar usuários.' }, { status: 403 })
  }

  let adminClient

  try {
    adminClient = createAdminClient()
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar cliente administrador.' },
      { status: 500 }
    )
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: normalizedName,
    },
  })

  if (createUserError || !createdUserData.user) {
    const message = createUserError?.message?.includes('already been registered')
      || createUserError?.message?.includes('User already registered')
      ? 'Já existe uma conta com este e-mail.'
      : createUserError?.message ?? 'Não foi possível criar o usuário.'

    return NextResponse.json({ error: message }, { status: 400 })
  }

  const createdUser = createdUserData.user

  const { error: memberError } = await adminClient
    .from('organization_members')
    .insert({
      organization_id: currentMember.organization_id,
      user_id: createdUser.id,
      role: normalizedRole,
      active: true,
      invited_by: user.id,
    })

  if (memberError) {
    await adminClient.auth.admin.deleteUser(createdUser.id)

    const message = memberError.message.includes('organization_members_organization_id_user_id_key')
      ? 'Este usuário já faz parte da organização.'
      : 'Não foi possível vincular o usuário à organização.'

    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: createdUser.id,
      email: normalizedEmail,
      fullName: normalizedName,
      role: normalizedRole,
    },
  })
}
