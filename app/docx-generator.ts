import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import {
  biosafeFooter,
  biosafeLogoParagraph,
  loadBiosafeLogo,
  type DocxImageData,
} from "./docx-branding";

import {
  classifyRisk,
  getRisk,
  gheCatalog,
  normativeReferences,
  scenarioCatalog,
  type ActionDefinition,
  type Probability,
  type RiskDefinition,
  type Severity,
} from "./pgr-data";
import { buildNr01Annex } from "./nr01-docx";
import type { Nr01Report } from "./nr01";
import type { PgrState } from "./pgr-types";
import { getIncludedActions, getSelectedRoles } from "./pgr-selectors";

const COLORS = {
  navy: "163B55",
  navySoft: "E9F0F4",
  ink: "17212B",
  muted: "5A6872",
  line: "D9E0E5",
  pale: "F5F7F8",
  white: "FFFFFF",
  green: "DDEFE4",
  yellow: "FFF0BF",
  red: "F8D6D6",
};

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.line },
};

const cellMargins = { top: 105, bottom: 105, left: 125, right: 125 };

function text(value: unknown, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function formatDate(value: string) {
  if (!value) return "Não informada";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function bodyParagraph(value: string, options: { boldLead?: string; italic?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const { boldLead, italic, align } = options;
  const children: TextRun[] = [];
  if (boldLead && value.startsWith(boldLead)) {
    children.push(new TextRun({ text: boldLead, bold: true }));
    children.push(new TextRun({ text: value.slice(boldLead.length), italics: italic }));
  } else {
    children.push(new TextRun({ text: value, italics: italic }));
  }
  return new Paragraph({
    children,
    alignment: align,
    spacing: { after: 150, line: 360 },
  });
}

function bullet(value: string) {
  return new Paragraph({
    children: [new TextRun(value)],
    bullet: { level: 0 },
    spacing: { after: 90, line: 360 },
  });
}

function heading(value: string) {
  return new Paragraph({
    text: value,
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 260, after: 140 },
  });
}

function subheading(value: string) {
  return new Paragraph({
    text: value,
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 210, after: 110 },
  });
}

function tableCell(
  value: string | Paragraph[],
  options: { header?: boolean; fill?: string; width?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean } = {},
) {
  const { header, fill, width, align = AlignmentType.LEFT, bold } = options;
  const children = Array.isArray(value)
    ? value
    : [
        new Paragraph({
          children: [new TextRun({ text: value, bold: header || bold, color: header ? COLORS.white : COLORS.ink, size: 24, font: "Arial" })],
          alignment: align,
          spacing: { after: 0, line: 360 },
        }),
      ];
  return new TableCell({
    children,
    borders: tableBorders,
    margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header
      ? { fill: COLORS.navy, color: "auto", type: ShadingType.CLEAR }
      : fill
        ? { fill, color: "auto", type: ShadingType.CLEAR }
        : undefined,
  });
}

function dataTable(headers: string[], rows: string[][], widths?: number[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((header, index) => tableCell(header, { header: true, width: widths?.[index] })),
      }),
      ...rows.map(
        (row, rowIndex) =>
          new TableRow({
            cantSplit: true,
            children: row.map((cell, cellIndex) =>
              tableCell(cell, {
                width: widths?.[cellIndex],
                fill: rowIndex % 2 ? COLORS.pale : COLORS.white,
                align: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
              }),
            ),
          }),
      ),
    ],
  });
}

function borderlessCell(
  value: string,
  bold = false,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
) {
  const none = { style: BorderStyle.NONE, size: 0, color: COLORS.white };
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: value, bold, color: COLORS.ink, font: "Arial", size: 18 })],
        alignment: align,
        spacing: { after: 0 },
      }),
    ],
    borders: { top: none, bottom: none, left: none, right: none },
    margins: { top: 40, bottom: 40, left: 0, right: 0 },
    verticalAlign: VerticalAlign.CENTER,
  });
}

function sectionGap() {
  return new Paragraph({ spacing: { after: 90 } });
}

function riskKey(roleId: string, riskId: string) {
  return `${roleId}:${riskId}`;
}

function riskIsIncluded(state: PgrState, roleId: string, risk: RiskDefinition) {
  const override = state.riskOverrides[riskKey(roleId, risk.id)];
  if (typeof override === "boolean") return override;
  return !risk.condition || Boolean(state.scenarios[risk.condition]);
}

function riskAssessment(state: PgrState, roleId: string, risk: RiskDefinition) {
  return state.riskAssessments[riskKey(roleId, risk.id)] ?? {
    severity: risk.severity,
    probability: risk.probability,
  };
}

function actionValue(state: PgrState, action: ActionDefinition) {
  const setting = state.actions[action.id];
  return {
    deadline: setting?.deadline || action.deadline,
    responsible: setting?.responsible || action.responsible,
  };
}

function selectedScenarioLabels(state: PgrState) {
  return scenarioCatalog.filter((item) => state.scenarios[item.id]).map((item) => item.label);
}

function selectedGhes(state: PgrState) {
  const ids = new Set(getSelectedRoles(state).map((role) => role.ghe));
  return gheCatalog.filter((ghe) => ids.has(ghe.id));
}

function addConditionalStatement(enabled: boolean, enabledText: string, disabledText: string) {
  return bodyParagraph(enabled ? enabledText : disabledText);
}

export function buildPgrDocument(state: PgrState, nr01Report?: Nr01Report, logoData?: DocxImageData) {
  const selectedRoles = getSelectedRoles(state);
  const totalWorkers = selectedRoles.reduce((sum, role) => sum + role.quantity, 0);
  const ghes = selectedGhes(state);
  const actions = getIncludedActions(state);
  const areas = state.selectedAreas.length ? state.selectedAreas.join(", ") : "Áreas a confirmar em visita técnica";
  const scenarioLabels = selectedScenarioLabels(state);

  const children: (Paragraph | Table)[] = [];

  children.push(
    biosafeLogoParagraph(logoData),
    new Paragraph({
      text: "Programa de Gerenciamento de Riscos",
      style: "Title",
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Serviços de manutenção, reparação mecânica, funilaria e pintura automotiva", bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [new TextRun({ text: text(state.condoName), bold: true, color: COLORS.navy, size: 30 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    dataTable(
      ["Identificação", "Informação"],
      [
        ["Estabelecimento", text(state.condoName)],
        ["CNPJ", text(state.cnpj)],
        ["Endereço", [text(state.address), text(state.cityState, "")].filter(Boolean).join(" – ") || "Não informado"],
        ["Empresa", text(state.contractingCompany, "Não informada")],
        ["Data de emissão", formatDate(state.issueDate)],
        ["Revisão prevista", formatDate(state.reviewDate)],
      ],
      [32, 68],
    ),
    new Paragraph({ spacing: { before: 180 } }),
    bodyParagraph(
      "Documento estruturado a partir da matriz-base fornecida. A emissão definitiva depende da confirmação das atividades, ambientes, exposições e controles em visita técnica e da validação do responsável técnico.",
      { italic: true, align: AlignmentType.CENTER },
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  children.push(
    heading("Nota técnica de utilização"),
    bodyParagraph(
      "Este PGR foi configurado para o estabelecimento identificado, preservando a lógica do documento-base: reconhecimento, avaliação e classificação, organização por grupos homogêneos de exposição, inventário de riscos, medidas de controle, matriz de EPI, treinamentos, inspeções e plano de ação.",
    ),
    bodyParagraph(
      "As funções e quantidades devem ser confirmadas com o RH. A caracterização dos ambientes e das tarefas efetivamente executadas deve ser validada em visita técnica antes da emissão final do PGR, do LTCAT ou de conclusões sobre insalubridade e periculosidade.",
    ),
    heading("1. Identificação e escopo"),
    dataTable(
      ["Campo", "Informação"],
      [
        ["Estabelecimento", text(state.condoName)],
        ["CNPJ", text(state.cnpj)],
        ["Endereço", text(state.address)],
        ["Cidade e UF", text(state.cityState)],
        ["Responsável local", text(state.localResponsible)],
        ["Empresa", text(state.contractingCompany, "Não informada")],
        ["Trabalhadores incluídos", String(totalWorkers)],
      ],
      [31, 69],
    ),
    sectionGap(),
    bodyParagraph(
      "O presente PGR abrange os trabalhadores selecionados que prestam serviços no estabelecimento, contemplando somente as funções, ambientes e exposições informados nesta configuração.",
    ),
    bodyParagraph(
      "As atividades rotineiras não são caracterizadas automaticamente como obras de construção civil. Intervenções de manutenção, reforma, instalação, trabalho em altura, eletricidade, uso de máquinas ou atividades especiais exigem análise específica e aplicação das NRs pertinentes.",
    ),
    heading("2. Objetivos do PGR"),
    bodyParagraph(
      "O Programa de Gerenciamento de Riscos tem por objetivo identificar perigos, avaliar e classificar riscos ocupacionais, definir medidas de prevenção e acompanhar a eficácia dos controles.",
    ),
    bullet("Identificar perigos e possíveis lesões ou agravos à saúde."),
    bullet("Avaliar e classificar os riscos segundo a metodologia definida."),
    bullet("Estabelecer medidas de prevenção conforme a hierarquia de controles."),
    bullet("Integrar o PGR ao PCMSO, treinamentos, inspeções e investigação de acidentes."),
    bullet("Atualizar o inventário diante de mudanças, novos riscos ou ocorrências."),
    heading("3. Referências normativas"),
    ...normativeReferences.map(bullet),
    bodyParagraph("As versões vigentes das normas e demais requisitos legais devem ser conferidas pelo responsável técnico na data da emissão."),
    heading("4. Responsabilidades"),
    subheading("4.1 Empregador e contratante"),
    bullet("Cumprir e fazer cumprir a legislação de SST e este PGR."),
    bullet("Disponibilizar recursos para implantação das medidas de prevenção."),
    bullet("Fornecer EPI adequado, gratuito e em condições de uso, com registro de entrega."),
    bullet("Comunicar mudanças de processo, ambiente, equipamento e função."),
    bullet("Investigar acidentes, incidentes e situações de risco."),
    subheading("4.2 Supervisores, encarregados e líderes"),
    bullet("Fiscalizar procedimentos, controles e uso dos EPIs definidos."),
    bullet("Interromper atividade diante de risco grave e iminente e comunicar o responsável."),
    bullet("Registrar desvios, incidentes, acidentes e mudanças nas condições de trabalho."),
    subheading("4.3 Trabalhadores"),
    bullet("Cumprir procedimentos, treinamentos e orientações de segurança."),
    bullet("Usar corretamente os EPIs e comunicar condições inseguras."),
    bullet("Não executar atividade para a qual não esteja capacitado ou autorizado."),
    subheading("4.4 Segurança e saúde no trabalho"),
    bullet("Manter o inventário de riscos e o plano de ação atualizados."),
    bullet("Realizar inspeções, acompanhar controles e integrar informações ao PCMSO."),
  );

  children.push(
    heading("5. Metodologia de reconhecimento e avaliação"),
    bodyParagraph(
      "O reconhecimento deve considerar atividade real, fonte geradora, agente, forma de exposição, frequência, duração, trabalhadores expostos, controles existentes e possíveis consequências. Para agentes físicos, químicos e biológicos, a análise preliminar define a necessidade de avaliação qualitativa ou quantitativa.",
    ),
    subheading("5.1 Classificação qualitativa pela matriz 6x4"),
    dataTable(
      ["Severidade", "Peso", "Descrição"],
      [
        ["Irrelevante", "1", "Sem lesão, doença ou efeito significativo"],
        ["Marginal", "3", "Lesão ou doença leve e reversível"],
        ["Crítica", "6", "Incapacidade ou dano irreversível"],
        ["Catastrófica", "9", "Morte ou evento de gravidade extrema"],
      ],
      [28, 14, 58],
    ),
    sectionGap(),
    dataTable(
      ["Probabilidade", "Peso", "Descrição"],
      [
        ["Impossível", "0", "Sem possibilidade identificada"],
        ["Raro", "1", "Até 10%"],
        ["Incomum", "2", "Entre 10% e 50%"],
        ["Ocasional", "4", "Entre 50% e 100%"],
        ["Frequente", "6", "Alta frequência"],
        ["Contínuo", "8", "Ocorrência recorrente ou muito provável"],
      ],
      [28, 14, 58],
    ),
    sectionGap(),
    dataTable(
      ["Pontuação", "Classificação", "Diretriz"],
      [
        ["0 a 8", "Baixo", "Manter controles e acompanhar"],
        ["9 a 24", "Médio", "Aperfeiçoar controles e monitorar"],
        ["Acima de 24", "Alto", "Tratar prioritariamente antes de manter a exposição"],
      ],
      [20, 25, 55],
    ),
    heading("6. Caracterização dos ambientes de trabalho"),
    bodyParagraph(
      text(
        state.environmentDescription,
        "O estabelecimento compreende as áreas selecionadas, que deverão ser verificadas quanto a ventilação, iluminação, circulação, condições do piso, acessos, sinalização, rotas de fuga, equipamentos de emergência, armazenamento e instalações elétricas.",
      ),
    ),
    bodyParagraph(`Áreas abrangidas: ${areas}.`, { boldLead: "Áreas abrangidas:" }),
    bodyParagraph(
      `Condições e atividades assinaladas: ${scenarioLabels.length ? scenarioLabels.join(", ") : "nenhuma condição adicional assinalada"}.`,
      { boldLead: "Condições e atividades assinaladas:" },
    ),
    heading("7. Organização dos GHEs"),
    ghes.length
      ? dataTable(
          ["GHE", "Denominação", "Funções incluídas"],
          ghes.map((ghe) => [
            ghe.id,
            ghe.name,
            selectedRoles.filter((role) => role.ghe === ghe.id).map((role) => role.name).join("; "),
          ]),
          [16, 28, 56],
        )
      : bodyParagraph("Nenhum GHE foi incluído. O quadro de funcionários deve ser preenchido antes da emissão."),
    sectionGap(),
    bodyParagraph("O agrupamento por GHE deve ser validado por similaridade real de atividades, ambientes e exposições."),
    heading("8. Inventário de riscos por função"),
    bodyParagraph(
      "O inventário a seguir foi composto a partir das funções, condições e riscos selecionados. As classificações são preliminares e devem ser ajustadas após reconhecimento em campo.",
    ),
  );

  selectedRoles.forEach((role, roleIndex) => {
    const risks = role.riskIds
      .map(getRisk)
      .filter((risk): risk is RiskDefinition => Boolean(risk))
      .filter((risk) => riskIsIncluded(state, role.id, risk));

    children.push(
      subheading(`8.${roleIndex + 1} ${role.name} – ${role.ghe}`),
      bodyParagraph(`Quantidade: ${role.quantity} trabalhador(es).`, { boldLead: "Quantidade:" }),
      bodyParagraph(`Descrição da atividade: ${role.description}`, { boldLead: "Descrição da atividade:" }),
      bodyParagraph(`EPI indicado: ${role.epis.join("; ")}.`, { boldLead: "EPI indicado:" }),
    );

    if (risks.length) {
      const rows = risks.map((risk) => {
        const assessment = riskAssessment(state, role.id, risk);
        const score = assessment.severity * assessment.probability;
        return [
          risk.type,
          risk.source,
          risk.damages,
          `${assessment.severity} x ${assessment.probability} = ${score} (${classifyRisk(score)})`,
          risk.treatment,
        ];
      });
      children.push(dataTable(["Tipo", "Fonte ou perigo", "Possíveis danos", "Avaliação", "Tratamento"], rows, [13, 23, 20, 19, 25]));
    } else {
      children.push(bodyParagraph("Nenhum risco foi incluído para esta função. Reavaliar a seleção antes da emissão."));
    }
    children.push(
      sectionGap(),
      bodyParagraph(
        "Nota: a classificação não substitui inspeção, avaliação ergonômica preliminar ou avaliação ambiental quando necessária.",
        { italic: true },
      ),
    );
  });

  if (!selectedRoles.length) {
    children.push(bodyParagraph("Nenhuma função com quantidade superior a zero foi incluída."));
  }

  const preventionRows: string[][] = [
    ["Todos", "Quedas e circulação", "Manter pisos, escadas e rotas seguras; corrigir irregularidades; sinalizar piso molhado; manter iluminação e desobstrução.", "Inspeções, sinalização e manutenção preventiva"],
    ["Todos", "Ergonomia", "Adequar mobiliário, posturas, pausas, métodos e organização do trabalho conforme a avaliação ergonômica.", "AEP e AET quando indicada"],
  ];
  if (state.scenarios.produtosQuimicos) preventionRows.push(["GHE 02, 03 e 04", "Produtos químicos", "Manter produtos identificados, armazenados e acompanhados de FDS; proibir misturas incompatíveis e reutilização de embalagens.", "Treinamento, ventilação e EPI compatível"]);
  if (state.scenarios.elevadores) preventionRows.push(["GHE 01", "Elevadores, macacos e cavaletes", "Usar trava mecânica, respeitar a capacidade, inspecionar periodicamente e proibir permanência sob carga sem apoio seguro.", "Checklist, manutenção e NR-12"]);
  if (state.scenarios.cabinePintura) preventionRows.push(["GHE 02", "Cabine de pintura e solventes", "Manter exaustão e filtros, controlar fontes de ignição na sala de mistura, armazenar inflamáveis em local adequado e usar proteção respiratória compatível.", "Avaliação quantitativa, FDS, NR-15 e NR-20"]);
  if (state.scenarios.soldagem) preventionRows.push(["GHE 02", "Soldagem, corte e esmerilhamento", "Usar exaustão localizada, biombos, permissão para trabalho a quente e remoção de materiais combustíveis.", "Máscara de soldagem, respirador, vestimenta de raspa e extintor"]);
  if (state.scenarios.valaOleo) preventionRows.push(["GHE 01 e 03", "Vala de inspeção e troca de óleo", "Proteger bordas, manter iluminação, ventilação e piso antiderrapante, e conter derrames com material absorvente.", "Inspeção da vala e kit de contenção"]);
  if (state.scenarios.compressor) preventionRows.push(["GHE 01", "Compressor e vaso de pressão", "Manter prontuário, inspeções, drenagem e dispositivos de segurança; proibir uso do ar comprimido para limpar o corpo.", "Inspeções da NR-13 e registro"]);
  if (state.scenarios.lavagemCsao) preventionRows.push(["GHE 03", "Box de lavagem e CSAO", "Garantir drenagem, piso antiderrapante, conjunto impermeável e manutenção da caixa separadora de água e óleo.", "EPIs impermeáveis e inspeção da CSAO"]);
  if (state.scenarios.borracharia) preventionRows.push(["GHE 01", "Borracharia e calibragem de pneus", "Calibrar em gaiola de contenção com mangueira de engate remoto e inspecionar aros e pneus antes da montagem.", "Gaiola, procedimento e checklist"]);
  if (state.scenarios.baterias) preventionRows.push(["GHE 01", "Baterias automotivas", "Manusear em área ventilada, sem fontes de ignição, com bacia de contenção e lava-olhos disponível.", "Luva química, óculos e avental"]);
  if (state.scenarios.manobraVeiculos) preventionRows.push(["GHE 01 e 04", "Circulação de veículos e gases de escape", "Segregar pedestres, sinalizar e orientar manobras; conectar exaustão à ponteira de escape durante testes.", "Alta visibilidade e inspeção de exaustores"]);
  if (state.scenarios.abrigoResiduos) preventionRows.push(["GHE 01 e 03", "Resíduos perigosos", "Armazenar óleo usado, filtros, baterias e estopas contaminadas em abrigo identificado e com contenção; destinar por empresa licenciada.", "Inventário de resíduos e NR-25"]);
  if (state.scenarios.eletricidade) preventionRows.push(["GHE 01", "Eletricidade", "Somente pessoal autorizado; priorizar desenergização, bloqueio e ferramentas isoladas, inclusive em veículos híbridos e elétricos.", "Controles e capacitação da NR-10"]);
  if (state.scenarios.trabalhoAltura) preventionRows.push(["GHEs aplicáveis", "Altura", "Eliminar a exposição quando possível, planejar a atividade e adotar proteção coletiva e individual.", "Análise de risco, PT e NR-35 quando aplicáveis"]);

  children.push(
    heading("9. Medidas de prevenção e controle"),
    bodyParagraph("A prioridade é eliminar ou reduzir o perigo, adotar proteção coletiva e medidas administrativas e, quando necessário, selecionar EPI compatível com o risco."),
    dataTable(["GHE ou área", "Perigo", "Medida de prevenção", "Controle e registro"], preventionRows, [16, 16, 43, 25]),
    heading("10. Matriz de EPI por função"),
    bodyParagraph("O EPI deve ser selecionado conforme o risco real, possuir CA quando exigido e ser acompanhado de orientação, registro de entrega, higienização, guarda e substituição."),
    selectedRoles.length
      ? dataTable(
          ["Função", "Quantidade", "EPI condicionado à avaliação"],
          selectedRoles.map((role) => [role.name, String(role.quantity), role.epis.join("; ")]),
          [31, 14, 55],
        )
      : bodyParagraph("Sem funções selecionadas para composição da matriz de EPI."),
    heading("11. Avaliação ergonômica"),
    bodyParagraph("Deverá ser realizada Avaliação Ergonômica Preliminar para as situações identificadas, integrando seus resultados ao inventário e ao plano de ação. A AET será realizada quando a AEP indicar necessidade de aprofundamento."),
    ...ghes.map((ghe) => bullet(`${ghe.id} – ${ghe.name}: avaliar postura, força, repetitividade, deslocamentos, ritmo, demanda cognitiva e organização conforme as atividades reais.`)),
    heading("12. Avaliações ambientais e critérios para LTCAT"),
    bodyParagraph("As medições devem ser definidas após análise preliminar. A estratégia é reconhecer a atividade, identificar o critério legal aplicável, realizar avaliação qualitativa quando suficiente e quantificar quando exigido ou tecnicamente necessário."),
  );

  const environmentalRows: string[][] = [];
  environmentalRows.push(["Ruído e vibração", "GHE 01, 02 e 03", "Avaliar ferramentas pneumáticas, compressores e lixadeiras; medir conforme NHO-01 e NHO-10 quando aplicável"]);
  if (state.scenarios.cabinePintura) environmentalRows.push(["Solventes e tintas", "GHE 02", "Analisar FDS e avaliar quantitativamente os agentes químicos aplicáveis"]);
  if (state.scenarios.soldagem) environmentalRows.push(["Fumos metálicos e radiação não ionizante", "GHE 02", "Avaliar fumos (NHO-08) e caracterizar qualitativamente a radiação da soldagem"]);
  if (state.scenarios.produtosQuimicos) environmentalRows.push(["Agentes químicos", "GHE 02, 03 e 04", "Analisar FDS, forma de uso e necessidade de avaliação específica"]);
  if (state.scenarios.lavagemCsao) environmentalRows.push(["Umidade e agentes alcalinos", "GHE 03", "Avaliação qualitativa da atividade, frequência e neutralização por EPI"]);
  if (state.scenarios.manobraVeiculos) environmentalRows.push(["Gases de escape", "GHE 01 e 04", "Avaliar ventilação, permanência e necessidade de medição"]);
  if (state.scenarios.baterias) environmentalRows.push(["Ácido sulfúrico e chumbo", "GHE 01", "Avaliação qualitativa do manuseio e dos controles"]);
  if (state.scenarios.eletricidade) environmentalRows.push(["Eletricidade", "GHE 01", "Avaliação qualitativa da atividade, instalações e controles"]);
  if (state.scenarios.trabalhoAltura) environmentalRows.push(["Queda de altura", "GHEs aplicáveis", "Caracterizar atividade e controles; não presumir pelo cargo"]);
  children.push(
    environmentalRows.length
      ? dataTable(["Agente ou situação", "GHE ou área", "Estratégia"], environmentalRows, [25, 27, 48])
      : bodyParagraph("Não foram assinaladas situações ambientais específicas. Confirmar essa conclusão em visita técnica."),
    heading("13. Insalubridade e periculosidade"),
    bodyParagraph("O PGR identifica e gerencia riscos, mas não substitui os laudos específicos. A caracterização depende das atividades reais e dos critérios das NR-15 e NR-16; não deve ser presumida apenas pelo cargo."),
    dataTable(
      ["Situação", "Diretriz preliminar"],
      [
        ["Ruído, vibração e fumos", "Avaliar quantitativamente; o enquadramento depende dos limites e dos critérios das NR-15"],
        ...(state.scenarios.cabinePintura ? [["Solventes e tintas", "Avaliar agentes, concentração, forma e tempo de exposição"]] : []),
        ...(state.scenarios.lavagemCsao ? [["Umidade e produtos alcalinos", "Avaliar qualitativamente as condições e os critérios aplicáveis da NR-15"]] : []),
        ...(state.scenarios.baterias ? [["Baterias automotivas", "Avaliar manuseio de ácido sulfúrico e chumbo"]] : []),
        ...(state.scenarios.abrigoResiduos ? [["Resíduos perigosos", "Avaliar manejo de óleos usados e produtos contaminados"]] : []),
        ...(state.scenarios.produtosQuimicos ? [["Produtos químicos", "Avaliar agentes, concentração, forma e tempo de exposição"]] : []),
        ...(state.scenarios.cabinePintura ? [["Inflamáveis e combustíveis", "Verificar armazenamento e manuseio quanto aos requisitos aplicáveis da NR-16 e da NR-20"]] : []),
        ...(state.scenarios.eletricidade ? [["Eletricidade", "Avaliar atividade, instalações, autorização e controles"]] : []),
        ...(state.scenarios.manobraVeiculos ? [["Gases de escape", "Avaliar ventilação, permanência e gases de combustão"]] : []),
        ["Demais funções", "Sem enquadramento automático; confirmar em campo"],
      ],
      [35, 65],
    ),
    heading("14. Trabalhos em altura"),
    addConditionalStatement(
      state.scenarios.trabalhoAltura,
      "Foi informada atividade com risco de queda de nível. Antes da execução, devem ser confirmados enquadramento, planejamento, análise de risco, proteção coletiva, sistema de proteção contra quedas, capacitação, autorização e procedimentos de emergência e resgate.",
      "Não foi informada atividade rotineira com risco de queda de nível. A ausência deve ser confirmada em campo e reavaliada antes de qualquer atividade não rotineira.",
    ),
    heading("15. Instalações elétricas"),
    addConditionalStatement(
      state.scenarios.eletricidade,
      "Foi informada intervenção em eletricidade. A atividade deve ser restrita a trabalhadores autorizados e capacitados, com aplicação das medidas de desenergização, bloqueio, verificação, ferramentas e EPIs pertinentes.",
      "Não foi informada intervenção rotineira em instalações elétricas. Mecânicos sem autorização, lavadores, trabalhadores da limpeza e pessoas não capacitadas não devem executar esse tipo de atividade.",
    ),
    heading("16. Produtos químicos e FDS"),
    addConditionalStatement(
      state.scenarios.produtosQuimicos,
      "Os produtos utilizados devem possuir FDS disponível, permanecer identificados e ser armazenados de forma segura. A seleção de luvas, óculos, aventais e proteção respiratória deve considerar o produto e a forma de exposição. É proibido misturar produtos sem orientação do fabricante ou reutilizar embalagens de alimentos.",
      "Não foi informado uso ocupacional de produtos químicos. Confirmar a informação e reavaliar esta seção antes da introdução de qualquer produto.",
    ),
    heading("17. Proteção contra incêndios e emergências"),
    addConditionalStatement(
      state.scenarios.incendioEmergencia,
      "A equipe deve conhecer rotas de fuga, comunicação, abandono e meios de emergência, mantendo saídas desobstruídas e integrando os procedimentos ao plano de emergência da oficina (incêndio em inflamáveis, derrames de óleo e produtos químicos, e acidentes com máquinas) e à legislação aplicável.",
      "A integração ao plano de emergência não foi marcada. Essa condição deve ser revista, pois todos os trabalhadores precisam receber orientações compatíveis com o estabelecimento.",
    ),
    heading("18. Atividades não rotineiras e terceiros"),
    addConditionalStatement(
      state.scenarios.atividadesNaoRotineiras,
      "Atividades extraordinárias, mudanças de processo, intervenções em áreas técnicas, altura, eletricidade, uso de novos produtos ou entrada de empresas terceirizadas devem ser precedidas de avaliação de riscos proporcional à complexidade, com APR, AR ou PT quando aplicável.",
      "Não foram assinaladas atividades não rotineiras. Mudanças futuras devem ser avaliadas antes da execução e incorporadas ao gerenciamento de riscos.",
    ),
    heading("19. Matriz de treinamentos"),
  );

  const trainingRows: string[][] = [
    ["Integração de SST e PGR", "Todos", "Admissão e mudanças relevantes"],
    ["NR-06 e EPI", "Trabalhadores que utilizam EPI", "Admissão e reciclagens conforme necessidade"],
    ["Ergonomia", "Todos os GHEs incluídos", "Integração e ações periódicas"],
  ];
  if (state.scenarios.produtosQuimicos) trainingRows.push(["Produtos químicos e FDS", "Limpeza e manutenção", "Admissão e introdução de novos produtos"]);
  if (state.scenarios.eletricidade) trainingRows.push(["NR-10", "Trabalhadores autorizados", "Conforme requisitos aplicáveis"]);
  if (state.scenarios.trabalhoAltura) trainingRows.push(["NR-35", "Trabalhadores autorizados", "Conforme requisitos aplicáveis"]);
  if (state.scenarios.elevadores) trainingRows.push(["Operação segura de elevadores e macacos (NR-12)", "GHE 01", "Admissão e reciclagens internas"]);
  if (state.scenarios.compressor) trainingRows.push(["Operação de compressor e vaso de pressão (NR-13)", "Operadores designados", "Conforme requisitos aplicáveis"]);
  if (state.scenarios.cabinePintura) trainingRows.push(["Inflamáveis e proteção respiratória (NR-20 e NR-06)", "GHE 02", "Admissão e reciclagens"]);
  if (state.scenarios.soldagem) trainingRows.push(["Trabalho a quente", "GHE 02", "Admissão e reciclagens"]);
  if (state.scenarios.incendioEmergencia) trainingRows.push(["Prevenção de incêndio e emergência", "Todos", "Conforme plano e legislação aplicável"]);
  if (ghes.some((ghe) => ghe.id !== "GHE 04")) trainingRows.push(["DDS", "Equipes operacionais", "Periodicidade definida pela gestão"]);

  const inspectionRows: string[][] = [
    ["EPIs", "Mensal e rotina", "Checklist e ficha de EPI"],
    ["Pisos, escadas e rotas", "Mensal", "Checklist de inspeção"],
    ["Ações do PGR", "Mensal ou trimestral", "Plano de ação atualizado"],
  ];
  if (state.scenarios.produtosQuimicos) inspectionRows.push(["Produtos químicos", "Mensal e a cada novo produto", "Inventário e FDS"]);
  inspectionRows.push(["Ferramentas e equipamentos", "Antes do uso e periodicamente", "Checklist"]);
  if (state.scenarios.elevadores) inspectionRows.push(["Elevadores, macacos e cavaletes", "Antes do uso e periodicamente", "Checklist e registro de manutenção"]);
  if (state.scenarios.compressor) inspectionRows.push(["Compressor e vaso de pressão", "Conforme NR-13", "Prontuário e relatório"]);
  if (state.scenarios.cabinePintura) inspectionRows.push(["Exaustão e filtros da cabine", "Mensal", "Checklist e relatório"]);
  if (state.scenarios.trabalhoAltura) inspectionRows.push(["Trabalho em altura", "Antes de cada serviço", "AR, PT e inspeção"]);
  if (state.scenarios.eletricidade) inspectionRows.push(["Instalações elétricas", "Conforme plano de manutenção", "Registro técnico"]);
  if (state.scenarios.incendioEmergencia) inspectionRows.push(["Extintores e rotas de fuga", "Conforme plano e legislação", "Checklist e relatório"]);

  children.push(
    dataTable(["Treinamento", "Público", "Periodicidade ou condição"], trainingRows, [34, 34, 32]),
    heading("20. Inspeções e monitoramento"),
    dataTable(["Item", "Periodicidade sugerida", "Registro"], inspectionRows, [36, 32, 32]),
    heading("21. Plano de ação"),
    actions.length
      ? dataTable(
          ["ID", "Ação", "GHE", "Prioridade", "Prazo", "Responsável"],
          actions.map((action, index) => {
            const values = actionValue(state, action);
            return [String(index + 1), action.action, action.ghe, action.priority, values.deadline, values.responsible];
          }),
          [7, 37, 14, 12, 12, 18],
        )
      : bodyParagraph("Nenhuma ação foi incluída. Revisar a configuração antes da emissão."),
    heading("22. Matriz de documentos e registros"),
    dataTable(
      ["Documento ou registro", "Aplicação", "Condição"],
      [
        ["PGR – Inventário e Plano de Ação", "Todos", "Atualização contínua e revisões"],
        ["PCMSO", "Todos", "Conforme NR-07"],
        ["LTCAT e PPP", "Quando houver necessidade previdenciária", "Conforme exposição e legislação"],
        ["Laudos de insalubridade ou periculosidade", "Quando houver hipótese de enquadramento", "Quando aplicável"],
        ["AEP e AET", "Ergonomia", "AEP e AET quando indicada"],
        ["Ficha de EPI", "Trabalhadores que recebem EPI", "A cada entrega ou substituição"],
        ...(state.scenarios.produtosQuimicos ? [["FDS", "Produtos químicos", "Atualizada para os produtos em uso"]] : []),
        ...(state.scenarios.atividadesNaoRotineiras ? [["APR, AR ou PT", "Atividades especiais", "Antes do serviço, quando aplicável"]] : []),
        ["Treinamentos", "Treinamentos obrigatórios e internos", "Conforme treinamento"],
        ["Inspeções", "Áreas, equipamentos e EPIs", "Conforme plano"],
        ["Investigação de acidentes", "Acidentes e incidentes", "A cada ocorrência"],
      ],
      [34, 34, 32],
    ),
    heading("23. Investigação de acidentes e incidentes"),
    bodyParagraph("Acidentes, quase acidentes, desvios críticos e situações de risco devem ser registrados e investigados, com análise de causas e definição de ações corretivas e preventivas. As conclusões devem retroalimentar o inventário e o plano de ação."),
    heading("24. Gestão de resultados"),
    bodyParagraph("A eficácia do PGR será acompanhada por indicadores de acidentes, incidentes, desvios, treinamentos, entrega e uso de EPI, inspeções, ações concluídas e reincidência de não conformidades."),
    heading("25. Conclusão"),
    bodyParagraph(`Este PGR organiza o gerenciamento dos riscos dos ${totalWorkers} trabalhador(es) incluídos no estabelecimento ${text(state.condoName)}. O documento contempla ${selectedRoles.length} função(ões) em ${ghes.length} GHE(s), com inventário, medidas preventivas, EPIs, treinamentos, inspeções e plano de ação.`),
    bodyParagraph("A emissão definitiva deve ser precedida de validação em campo, especialmente quanto às tarefas, ambientes, produtos, equipamentos, jornadas, frequência e duração das exposições e medidas existentes. A classificação apresentada é preliminar e deve ser validada pelo responsável técnico."),
    heading("26. Anexo – Resumo de cargos e quantidades"),
    selectedRoles.length
      ? dataTable(
          ["Cargo", "Quantidade", "GHE"],
          selectedRoles.map((role) => [role.name, String(role.quantity), role.ghe]),
          [58, 18, 24],
        )
      : bodyParagraph("Sem cargos selecionados."),
    heading("27. Observações e validações pendentes"),
    bodyParagraph(text(state.notes, "Sem observações adicionais registradas.")),
    bodyParagraph(
      state.expectedTotal !== null && state.expectedTotal !== totalWorkers
        ? `A base indica ${state.expectedTotal} trabalhador(es), enquanto esta configuração totaliza ${totalWorkers}. A divergência deve ser validada com o RH.`
        : "O total configurado está compatível com o total de referência informado, sem prejuízo da conferência nominal pelo RH.",
    ),
    new Paragraph({ spacing: { before: 620 } }),
    dataTable(
      ["Validação da empresa", "Responsável técnico"],
      [
        [
          `Nome: ${text(state.localResponsible)}\n\nAssinatura: ______________________________\n\nData: ____/____/________`,
          `Nome: ${text(state.technicalResponsible)}\n${text(state.professionalTitle, "Função: não informada")}\nRegistro: ${text(state.professionalRegistration)}\n\nAssinatura: ______________________________`,
        ],
      ],
      [50, 50],
    ),
  );

  if (nr01Report) children.push(...buildNr01Annex(nr01Report, state));

  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              borderlessCell("PGR | BIOSAFE", true),
              borderlessCell(text(state.condoName), false, AlignmentType.RIGHT),
            ],
          }),
        ],
      }),
    ],
  });

  return new Document({
    creator: text(state.technicalResponsible, "BIOSAFE"),
    title: `Programa de Gerenciamento de Riscos – ${text(state.condoName)}`,
    subject: "Programa de Gerenciamento de Riscos para oficina mecânica e centro automotivo",
    description: "PGR configurado a partir da matriz-base para oficinas mecânicas e centros automotivos.",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24, color: COLORS.ink },
          paragraph: { spacing: { line: 360 } },
        },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 40, bold: true, color: "000000" },
          paragraph: { spacing: { after: 220 }, alignment: AlignmentType.CENTER },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 28, bold: true, color: "000000" },
          paragraph: { spacing: { before: 260, after: 140 }, keepNext: true },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 26, bold: true, color: "000000" },
          paragraph: { spacing: { before: 210, after: 110 }, keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 920, right: 900, bottom: 1280, left: 900, header: 420, footer: 320 },
          },
        },
        headers: { default: header, first: new Header({ children: [] }) },
        footers: { default: biosafeFooter("PGR | Revisão 00"), first: biosafeFooter("PGR | Revisão 00") },
        children,
      },
    ],
  });
}

export function makePgrFilename(state: PgrState) {
  const base = text(state.condoName, "oficina")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `PGR-${base || "oficina"}.docx`;
}

export async function downloadPgrDocx(state: PgrState, nr01Report?: Nr01Report) {
  const logoData = await loadBiosafeLogo();
  const blob = await Packer.toBlob(buildPgrDocument(state, nr01Report, logoData));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = makePgrFilename(state);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export type { Probability, Severity };
