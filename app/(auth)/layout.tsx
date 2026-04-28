import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[#0C1A2E]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue/20 to-transparent pointer-events-none" />
        <div>
          <div className="inline-flex rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <Image
              src="/brand-logo.png"
              alt="Blue CRM"
              width={179}
              height={60}
              className="h-auto w-[170px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              priority
            />
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gerencie seu pipeline<br />
            <span className="text-blue">com inteligência.</span>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Acompanhe oportunidades, clientes e sua equipe em uma plataforma moderna e eficiente.
          </p>
        </div>
        <div className="flex gap-6">
          {['Kanban', 'Métricas', 'Equipe'].map(tag => (
            <div key={tag} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue" />
              <span className="text-white/40 text-xs">{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F0F4F8]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
