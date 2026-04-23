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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue to-blue-vivid flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-white font-bold text-lg">Blue CRM</span>
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
