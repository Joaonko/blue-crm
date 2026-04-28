export type ProposalFunctionality = {
  title: string
  items: string[]
}

export type ProposalPhase = {
  title: string
  description: string
}

export type ProposalResponsibility = {
  title: string
  items: string[]
}

export type ProposalData = {
  title: string
  clientName: string
  clientContactName: string
  clientEmail: string
  projectTitle: string
  city: string
  issueDate: string
  objective: string
  businessContext: string
  useCase: string
  functionalities: ProposalFunctionality[]
  phases: ProposalPhase[]
  deliverables: string[]
  outOfScope: string[]
  responsibilities: ProposalResponsibility[]
  investmentTitle: string
  investmentAmount: number
  paymentSummary: string
  deliveryDeadline: string
  paymentMethod: string
  paymentTerms: string
  taxes: string
  validityDays: number
  acceptanceReference: string
}

export type ProposalOpportunity = {
  id: string
  title: string
  value: number
  description: string | null
  payment_type: 'cash' | 'installment' | null
  installments: number | null
  client: {
    id: string
    name: string
    contact_name: string
    contact_email: string
  } | null
  product: {
    id: string
    name: string
  } | null
}

export const DEFAULT_FUNCTIONALITIES: ProposalFunctionality[] = [
  {
    title: 'Painel Administrativo',
    items: [
      'Gestão de usuários, permissões e acessos',
      'Dashboard executivo com indicadores principais',
      'Cadastro e acompanhamento dos clientes atendidos',
    ],
  },
  {
    title: 'Painel do Cliente',
    items: [
      'Área segura para operação do sistema',
      'Fluxos principais organizados por perfil de usuário',
      'Consultas, filtros e visualização das informações relevantes',
    ],
  },
  {
    title: 'Recursos Técnicos',
    items: [
      'Sistema web responsivo para desktop e tablet',
      'Banco de dados estruturado e seguro',
      'Logs básicos e organização por permissões',
    ],
  },
]

export const DEFAULT_PHASES: ProposalPhase[] = [
  {
    title: 'Fase 1 - Configuração',
    description: 'Configuração do ambiente, modelagem do banco de dados e estruturação inicial da arquitetura.',
  },
  {
    title: 'Fase 2 - Funcionalidades Core',
    description: 'Desenvolvimento dos fluxos principais do sistema, incluindo cadastros, regras de negócio e integrações internas.',
  },
  {
    title: 'Fase 3 - Interface e UX',
    description: 'Criação das interfaces visuais, organização das telas e ajustes para uma experiência clara e fluida.',
  },
  {
    title: 'Fase 4 - Homologação e Implantação',
    description: 'Testes com usuários-chave, ajustes finais e implantação em produção.',
  },
]

export const DEFAULT_DELIVERABLES = [
  'Plataforma web funcional',
  'Sistema de autenticação e controle de acesso',
  'Banco de dados estruturado',
  'Interface responsiva',
  'Documentação técnica básica',
  'Treinamento com usuários-chave',
]

export const DEFAULT_OUT_OF_SCOPE = [
  'Infraestrutura, hospedagem e custos mensais de serviços externos',
  'Integrações não descritas nesta proposta',
  'Suporte contínuo pós-implantação',
  'Customizações não previstas no escopo aprovado',
]

export const DEFAULT_RESPONSIBILITIES: ProposalResponsibility[] = [
  {
    title: 'Infraestrutura em Nuvem',
    items: [
      'Contratar serviço de hospedagem compatível, quando necessário',
      'Disponibilizar acessos e informações técnicas solicitadas',
      'Arcar com custos mensais de infraestrutura e serviços externos',
    ],
  },
  {
    title: 'Validação e Conteúdo',
    items: [
      'Fornecer materiais, regras de negócio e dados necessários',
      'Validar entregas durante a homologação',
      'Indicar responsáveis para aprovações e decisões do projeto',
    ],
  },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatDateBR(date: string) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function createDefaultProposalData(): ProposalData {
  return {
    title: 'Proposta Comercial',
    clientName: '',
    clientContactName: '',
    clientEmail: '',
    projectTitle: 'Desenvolvimento de Sistema',
    city: 'Londrina',
    issueDate: todayISO(),
    objective: 'Desenvolvimento de plataforma web personalizada para organizar processos, centralizar informações e apoiar a operação do cliente com mais velocidade e clareza.',
    businessContext: 'O projeto nasce da necessidade de substituir processos manuais, reduzir retrabalho e criar uma operação mais previsível, escalável e fácil de acompanhar.',
    useCase: 'O usuário acessa a plataforma, executa os fluxos principais do negócio, acompanha informações em tempo real e gera os dados necessários para tomada de decisão.',
    functionalities: DEFAULT_FUNCTIONALITIES,
    phases: DEFAULT_PHASES,
    deliverables: DEFAULT_DELIVERABLES,
    outOfScope: DEFAULT_OUT_OF_SCOPE,
    responsibilities: DEFAULT_RESPONSIBILITIES,
    investmentTitle: 'DESENVOLVIMENTO COMPLETO',
    investmentAmount: 0,
    paymentSummary: 'Pagamento à vista ou parcelado conforme negociação comercial.',
    deliveryDeadline: '90 dias após vencimento da primeira parcela.',
    paymentMethod: 'Boleto ou transferência bancária',
    paymentTerms: 'À vista na assinatura ou entrada + parcelas com vencimento acordado entre as partes.',
    taxes: 'Inclusos nos valores apresentados',
    validityDays: 30,
    acceptanceReference: 'Proposta Comercial - Desenvolvimento sob Demanda',
  }
}

export function createProposalDataFromOpportunity(opportunity: ProposalOpportunity) {
  const defaults = createDefaultProposalData()
  const paymentSummary = opportunity.payment_type === 'cash'
    ? 'Pagamento à vista.'
    : opportunity.payment_type === 'installment' && opportunity.installments
      ? `Pagamento em até ${opportunity.installments} parcelas.`
      : defaults.paymentSummary

  return {
    ...defaults,
    title: `Proposta Comercial - ${opportunity.client?.name ?? opportunity.title}`,
    clientName: opportunity.client?.name ?? '',
    clientContactName: opportunity.client?.contact_name ?? '',
    clientEmail: opportunity.client?.contact_email ?? '',
    projectTitle: opportunity.product?.name ?? opportunity.title,
    objective: opportunity.description?.trim() || defaults.objective,
    investmentAmount: Number(opportunity.value ?? 0),
    paymentSummary,
    paymentTerms: paymentSummary,
    acceptanceReference: `Proposta Comercial - ${opportunity.title}`,
  }
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const list = value
    .map(item => normalizeString(item))
    .filter(Boolean)
  return list.length > 0 ? list : fallback
}

function normalizeFunctionalities(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_FUNCTIONALITIES
  const list = value
    .map(item => ({
      title: normalizeString((item as ProposalFunctionality)?.title),
      items: normalizeStringList((item as ProposalFunctionality)?.items, []),
    }))
    .filter(item => item.title || item.items.length > 0)
  return list.length > 0 ? list : DEFAULT_FUNCTIONALITIES
}

function normalizePhases(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_PHASES
  const list = value
    .map(item => ({
      title: normalizeString((item as ProposalPhase)?.title),
      description: normalizeString((item as ProposalPhase)?.description),
    }))
    .filter(item => item.title || item.description)
  return list.length > 0 ? list : DEFAULT_PHASES
}

function normalizeResponsibilities(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_RESPONSIBILITIES
  const list = value
    .map(item => ({
      title: normalizeString((item as ProposalResponsibility)?.title),
      items: normalizeStringList((item as ProposalResponsibility)?.items, []),
    }))
    .filter(item => item.title || item.items.length > 0)
  return list.length > 0 ? list : DEFAULT_RESPONSIBILITIES
}

export function normalizeProposalData(value: unknown): ProposalData {
  const defaults = createDefaultProposalData()
  const input = (value ?? {}) as Partial<ProposalData>

  return {
    title: normalizeString(input.title, defaults.title),
    clientName: normalizeString(input.clientName),
    clientContactName: normalizeString(input.clientContactName),
    clientEmail: normalizeString(input.clientEmail),
    projectTitle: normalizeString(input.projectTitle, defaults.projectTitle),
    city: normalizeString(input.city, defaults.city),
    issueDate: normalizeString(input.issueDate, defaults.issueDate),
    objective: normalizeString(input.objective, defaults.objective),
    businessContext: normalizeString(input.businessContext, defaults.businessContext),
    useCase: normalizeString(input.useCase, defaults.useCase),
    functionalities: normalizeFunctionalities(input.functionalities),
    phases: normalizePhases(input.phases),
    deliverables: normalizeStringList(input.deliverables, DEFAULT_DELIVERABLES),
    outOfScope: normalizeStringList(input.outOfScope, DEFAULT_OUT_OF_SCOPE),
    responsibilities: normalizeResponsibilities(input.responsibilities),
    investmentTitle: normalizeString(input.investmentTitle, defaults.investmentTitle),
    investmentAmount: normalizeNumber(input.investmentAmount, defaults.investmentAmount),
    paymentSummary: normalizeString(input.paymentSummary, defaults.paymentSummary),
    deliveryDeadline: normalizeString(input.deliveryDeadline, defaults.deliveryDeadline),
    paymentMethod: normalizeString(input.paymentMethod, defaults.paymentMethod),
    paymentTerms: normalizeString(input.paymentTerms, defaults.paymentTerms),
    taxes: normalizeString(input.taxes, defaults.taxes),
    validityDays: normalizeNumber(input.validityDays, defaults.validityDays),
    acceptanceReference: normalizeString(input.acceptanceReference, defaults.acceptanceReference),
  }
}

export function toProposalRenderData(value: ProposalData) {
  const data = normalizeProposalData(value)
  const issueYear = data.issueDate
    ? new Date(`${data.issueDate}T12:00:00`).getFullYear()
    : new Date().getFullYear()

  return {
    ...data,
    issueDateFormatted: formatDateBR(data.issueDate),
    issueYear,
    investmentAmountFormatted: formatCurrencyBRL(data.investmentAmount),
    validityText: `${data.validityDays} dias a partir da data de emissão`,
    clientDisplayName: data.clientName || 'Cliente',
    contactDisplayName: data.clientContactName || 'Responsável',
  }
}
