import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(req: NextRequest) {
  const { email, token, role } = await req.json()

  if (!email || !token) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  const resend = new Resend(resendApiKey)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [{ data: profile }, { data: memberData }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('organization_members')
      .select('organizations(name)')
      .eq('user_id', user.id)
      .eq('active', true)
      .single(),
  ])

  const inviterNameRaw = profile?.full_name ?? 'Alguém'
  const organizationsData = memberData?.organizations as unknown
  const organization = (Array.isArray(organizationsData) ? organizationsData[0] : organizationsData) as { name: string } | null
  const orgNameRaw = organization?.name ?? 'a organização'
  const roleNameRaw = roleLabels[role] ?? 'Membro'
  const inviterName = escapeHtml(inviterNameRaw)
  const orgName = escapeHtml(orgNameRaw)
  const roleName = escapeHtml(roleNameRaw)
  const inviteUrl = `${req.nextUrl.origin}/invite/${encodeURIComponent(token)}`
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'Blue CRM <onboarding@resend.dev>'

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A3A5C,#2E86C1);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Blue CRM</p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Convite para sua equipe</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A3A5C;">Você foi convidado! 🎉</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748B;line-height:1.6;">
              <strong style="color:#1A3A5C;">${inviterName}</strong> convidou você para entrar em
              <strong style="color:#1A3A5C;">${orgName}</strong> no Blue CRM como <strong style="color:#2E86C1;">${roleName}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:28px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;">Organização</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1A3A5C;">${orgName}</p>
                </td>
              </tr>
              <tr><td style="padding:12px 0;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;"></td></tr>
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;">Seu papel</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1A3A5C;">${roleName}</p>
                </td>
              </tr>
              <tr><td style="padding:12px 0;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;"></td></tr>
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;">Expira em</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1A3A5C;">7 dias</p>
                </td>
              </tr>
            </table>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="${inviteUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#1A3A5C,#2E86C1);color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;">
                Aceitar Convite
              </a>
            </div>

            <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6;">
              Ou copie e cole este link no navegador:<br>
              <a href="${inviteUrl}" style="color:#2E86C1;word-break:break-all;">${inviteUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:12px;color:#94A3B8;">
              Se você não esperava este convite, pode ignorar este e-mail com segurança.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: `${inviterNameRaw} te convidou para ${orgNameRaw} no Blue CRM`,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Falha ao enviar e-mail' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
