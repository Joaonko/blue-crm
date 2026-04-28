import fs from 'fs/promises'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { ProposalData, toProposalRenderData } from './schema'

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'templates', 'proposal-template-blueape.docx')

function proposalDocumentXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="243FD7"/><w:sz w:val="38"/></w:rPr><w:t>PROPOSTA COMERCIAL</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="30"/></w:rPr><w:t>{projectTitle}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr>
      <w:r><w:rPr><w:color w:val="4B5563"/><w:sz w:val="22"/></w:rPr><w:t>Cliente</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="560"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>{clientDisplayName}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="220"/></w:pPr>
      <w:r><w:rPr><w:color w:val="4B5563"/><w:sz w:val="20"/></w:rPr><w:t>Blue Ape · blueape.dev</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="720"/></w:pPr>
      <w:r><w:rPr><w:color w:val="4B5563"/><w:sz w:val="20"/></w:rPr><w:t>{city}, {issueDateFormatted}</w:t></w:r>
    </w:p>

    ${heading('1. Objetivo')}
    ${paragraph('{objective}')}

    ${heading('2. Contexto do Negócio')}
    ${paragraph('{businessContext}')}

    ${heading('3. Funcionalidades Previstas')}
    ${loopStart('functionalities')}
    ${subheading('{title}')}
    ${loopStart('items')}
    ${bullet('{.}')}
    ${loopEnd('items')}
    ${loopEnd('functionalities')}

    ${heading('4. Exemplo de Uso')}
    ${paragraph('{useCase}')}

    ${heading('5. Fases do Projeto')}
    ${loopStart('phases')}
    ${subheading('{title}')}
    ${paragraph('{description}')}
    ${loopEnd('phases')}

    ${heading('6. Entregáveis')}
    ${paragraph('Ao final do projeto será entregue:')}
    ${loopStart('deliverables')}
    ${bullet('{.}')}
    ${loopEnd('deliverables')}

    ${heading('7. Itens Fora do Escopo')}
    ${paragraph('Esta proposta contempla exclusivamente o descrito acima. Não estão incluídos:')}
    ${loopStart('outOfScope')}
    ${bullet('{.}')}
    ${loopEnd('outOfScope')}
    ${paragraph('Demandas identificadas nessas categorias poderão ser analisadas e orçadas separadamente.')}

    ${heading('8. Responsabilidades do Cliente')}
    ${loopStart('responsibilities')}
    ${subheading('{title}')}
    ${loopStart('items')}
    ${bullet('{.}')}
    ${loopEnd('items')}
    ${loopEnd('responsibilities')}

    ${heading('9. Investimento')}
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="180" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="22"/></w:rPr><w:t>{investmentTitle}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="243FD7"/><w:sz w:val="34"/></w:rPr><w:t>{investmentAmountFormatted}</w:t></w:r>
    </w:p>
    ${paragraph('{paymentSummary}')}
    ${paragraph('*Prazo de entrega: {deliveryDeadline}')}
    ${subheading('Forma de pagamento')}
    ${paragraph('{paymentMethod}')}
    ${subheading('Prazo de pagamento')}
    ${paragraph('{paymentTerms}')}
    ${subheading('Impostos e taxas')}
    ${paragraph('{taxes}')}
    ${subheading('Validade desta proposta')}
    ${paragraph('{validityText}')}

    ${heading('10. Termo de Aceite')}
    ${paragraph('À Blue Ape Tecnologia.')}
    ${paragraph('Ref.: {acceptanceReference} — {clientDisplayName}')}
    ${paragraph('{clientDisplayName}, através de seu representante legal abaixo identificado, manifesta sua concordância com os termos desta proposta comercial, autorizando o início dos serviços conforme a opção selecionada:')}
    ${paragraph('( ) Opção 1 — Aceite imediato')}
    ${paragraph('( ) Opção 2 — Aceite com ordem de compra')}
    ${paragraph('( ) Opção 3 — Aceite condicionado')}
    ${paragraph('{city}, _____ de _________________ de {issueYear}.')}
    ${paragraph('')}
    ${paragraph('________________________________________')}
    ${paragraph('Responsável — {clientDisplayName}')}
    ${paragraph('Nome: _______________________________')}
    ${paragraph('Cargo: _______________________________')}
    ${paragraph('')}
    ${paragraph('________________________________________')}
    ${paragraph('João Pedro Niedziejko — Blue Ape')}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

function paragraph(text: string) {
  return `<w:p>
    <w:pPr><w:spacing w:after="180" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="21"/><w:color w:val="1F2937"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>
  </w:p>`
}

function bullet(text: string) {
  return `<w:p>
    <w:pPr><w:spacing w:after="80"/><w:ind w:left="360" w:hanging="180"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="21"/><w:color w:val="1F2937"/></w:rPr><w:t xml:space="preserve">• ${text}</w:t></w:r>
  </w:p>`
}

function heading(text: string) {
  return `<w:p>
    <w:pPr><w:spacing w:before="260" w:after="120"/><w:keepNext/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="243FD7"/><w:sz w:val="26"/></w:rPr><w:t>${text}</w:t></w:r>
  </w:p>`
}

function subheading(text: string) {
  return `<w:p>
    <w:pPr><w:spacing w:before="120" w:after="80"/><w:keepNext/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>
  </w:p>`
}

function loopStart(name: string) {
  return `<w:p><w:r><w:t>{#${name}}</w:t></w:r></w:p>`
}

function loopEnd(name: string) {
  return `<w:p><w:r><w:t>{/${name}}</w:t></w:r></w:p>`
}

export async function generateProposalDocx(data: ProposalData) {
  const template = await fs.readFile(TEMPLATE_PATH)
  const zip = new PizZip(template)
  zip.file('word/document.xml', proposalDocumentXml())

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render(toProposalRenderData(data))

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer
}
