import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { ProposalData, toProposalRenderData } from './schema'

const styles = StyleSheet.create({
  page: {
    padding: 44,
    fontSize: 10.5,
    color: '#1F2937',
    fontFamily: 'Helvetica',
    lineHeight: 1.45,
  },
  cover: {
    minHeight: 720,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#243FD7',
    marginRight: 9,
  },
  brandText: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: '#111827',
  },
  brandCrm: {
    fontSize: 8,
    color: '#111827',
    marginLeft: 3,
    marginTop: 12,
  },
  coverTitle: {
    fontSize: 28,
    color: '#243FD7',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 24,
  },
  label: {
    color: '#6B7280',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  coverFooter: {
    color: '#6B7280',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 15,
    color: '#243FD7',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 11.5,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginTop: 6,
    marginBottom: 5,
  },
  paragraph: {
    marginBottom: 7,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    color: '#243FD7',
  },
  bulletText: {
    flex: 1,
  },
  investmentBox: {
    borderWidth: 1,
    borderColor: '#D7DDFE',
    backgroundColor: '#F6F8FF',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  investmentLabel: {
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 7,
  },
  investmentAmount: {
    color: '#243FD7',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  acceptanceBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    marginTop: 36,
  },
  signatureBox: {
    width: '48%',
    marginRight: '4%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    paddingTop: 6,
    fontSize: 9,
  },
  muted: {
    color: '#6B7280',
  },
})

type RenderData = ReturnType<typeof toProposalRenderData>

function Brand() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandDot} />
      <Text style={styles.brandText}>blue</Text>
      <Text style={styles.brandCrm}>CRM</Text>
    </View>
  )
}

function PageHeader({ data }: { data: RenderData }) {
  return (
    <View style={styles.header} fixed>
      <Brand />
      <Text style={styles.headerTitle}>{data.clientDisplayName} · {data.issueDateFormatted}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function ProposalPdfDocument({ data }: { data: RenderData }) {
  return (
    <Document
      author="Blue Ape"
      creator="Blue CRM"
      producer="Blue CRM"
      subject={data.projectTitle}
      title={data.title}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Brand />
          <View>
            <Text style={styles.coverTitle}>Proposta Comercial</Text>
            <Text style={styles.coverSubtitle}>{data.projectTitle}</Text>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.clientName}>{data.clientDisplayName}</Text>
          </View>
          <View>
            <Text style={styles.coverFooter}>Blue Ape · blueape.dev</Text>
            <Text style={styles.coverFooter}>{data.city}, {data.issueDateFormatted}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader data={data} />
        <Section title="1. Objetivo">
          <Paragraph>{data.objective}</Paragraph>
        </Section>
        <Section title="2. Contexto do Negócio">
          <Paragraph>{data.businessContext}</Paragraph>
        </Section>
        <Section title="3. Funcionalidades Previstas">
          {data.functionalities.map((group, index) => (
            <View key={`${group.title}-${index}`} wrap={false}>
              <Text style={styles.subheading}>{group.title}</Text>
              <BulletList items={group.items} />
            </View>
          ))}
        </Section>
        <Section title="4. Exemplo de Uso">
          <Paragraph>{data.useCase}</Paragraph>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader data={data} />
        <Section title="5. Fases do Projeto">
          {data.phases.map((phase, index) => (
            <View key={`${phase.title}-${index}`}>
              <Text style={styles.subheading}>{phase.title}</Text>
              <Paragraph>{phase.description}</Paragraph>
            </View>
          ))}
        </Section>
        <Section title="6. Entregáveis">
          <Paragraph>Ao final do projeto será entregue:</Paragraph>
          <BulletList items={data.deliverables} />
        </Section>
        <Section title="7. Itens Fora do Escopo">
          <Paragraph>Esta proposta contempla exclusivamente o descrito acima. Não estão incluídos:</Paragraph>
          <BulletList items={data.outOfScope} />
          <Paragraph>Demandas identificadas nessas categorias poderão ser analisadas e orçadas separadamente.</Paragraph>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader data={data} />
        <Section title="8. Responsabilidades do Cliente">
          {data.responsibilities.map((group, index) => (
            <View key={`${group.title}-${index}`}>
              <Text style={styles.subheading}>{group.title}</Text>
              <BulletList items={group.items} />
            </View>
          ))}
        </Section>
        <Section title="9. Investimento">
          <View style={styles.investmentBox}>
            <Text style={styles.investmentLabel}>{data.investmentTitle}</Text>
            <Text style={styles.investmentAmount}>{data.investmentAmountFormatted}</Text>
          </View>
          <Paragraph>{data.paymentSummary}</Paragraph>
          <Paragraph>*Prazo de entrega: {data.deliveryDeadline}</Paragraph>
          <Text style={styles.subheading}>Forma de pagamento</Text>
          <Paragraph>{data.paymentMethod}</Paragraph>
          <Text style={styles.subheading}>Prazo de pagamento</Text>
          <Paragraph>{data.paymentTerms}</Paragraph>
          <Text style={styles.subheading}>Impostos e taxas</Text>
          <Paragraph>{data.taxes}</Paragraph>
          <Text style={styles.subheading}>Validade desta proposta</Text>
          <Paragraph>{data.validityText}</Paragraph>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader data={data} />
        <Section title="10. Termo de Aceite">
          <Paragraph>À Blue Ape Tecnologia.</Paragraph>
          <Paragraph>Ref.: {data.acceptanceReference} — {data.clientDisplayName}</Paragraph>
          <Paragraph>
            {data.clientDisplayName}, através de seu representante legal abaixo identificado,
            manifesta sua concordância com os termos desta proposta comercial, autorizando o
            início dos serviços conforme a opção selecionada:
          </Paragraph>
          <View style={styles.acceptanceBox}>
            <Paragraph>( ) Opção 1 — Aceite imediato</Paragraph>
            <Paragraph>( ) Opção 2 — Aceite com ordem de compra</Paragraph>
            <Paragraph>( ) Opção 3 — Aceite condicionado</Paragraph>
          </View>
          <Paragraph>{data.city}, _____ de _________________ de {data.issueYear}.</Paragraph>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLine}>Responsável — {data.clientDisplayName}</Text>
              <Text style={styles.muted}>Nome: _______________________________</Text>
              <Text style={styles.muted}>Cargo: _______________________________</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLine}>João Pedro Niedziejko — Blue Ape</Text>
            </View>
          </View>
        </Section>
      </Page>
    </Document>
  )
}

export async function generateProposalPdf(data: ProposalData) {
  const rendered = await renderToBuffer(
    <ProposalPdfDocument data={toProposalRenderData(data)} />
  )

  return Buffer.isBuffer(rendered) ? rendered : Buffer.from(rendered)
}
