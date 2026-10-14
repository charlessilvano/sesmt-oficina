export type ScenarioId =
  | "elevadores"
  | "cabinePintura"
  | "soldagem"
  | "valaOleo"
  | "compressor"
  | "lavagemCsao"
  | "borracharia"
  | "baterias"
  | "manobraVeiculos"
  | "abrigoResiduos"
  | "produtosQuimicos"
  | "eletricidade"
  | "trabalhoAltura"
  | "incendioEmergencia"
  | "atividadesNaoRotineiras";

export type Severity = 1 | 3 | 6 | 9;
export type Probability = 0 | 1 | 2 | 4 | 6 | 8;

export interface RiskDefinition {
  id: string;
  type: string;
  source: string;
  damages: string;
  severity: Severity;
  probability: Probability;
  treatment: string;
  condition?: ScenarioId;
}

export interface RoleDefinition {
  id: string;
  name: string;
  /** Código CBO oficial (MTE), quando conferido. */
  cbo?: string;
  ghe: string;
  gheName: string;
  description: string;
  riskIds: string[];
  epis: string[];
}

export interface CondoDefinition {
  id: string;
  name: string;
  cnpj?: string;
  expectedTotal: number | null;
  suggestedRoleIds: string[];
  fixedCounts?: Record<string, number>;
  note?: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  description: string;
  section: string;
  suggestedForGhes?: string[];
}

export interface ActionDefinition {
  id: string;
  action: string;
  ghe: string;
  priority: "Alta" | "Média" | "Contínua";
  deadline: string;
  responsible: string;
  condition?: ScenarioId;
}

export const gheCatalog = [
  { id: "GHE 01", name: "Manutenção Eletromecânica, Rodantes e Pátio Operacional" },
  { id: "GHE 02", name: "Reparação de Carroçaria, Funilaria, Soldagem e Pintura" },
  { id: "GHE 03", name: "Apoio Operacional, Estética, Lubrificação e Conservação" },
  { id: "GHE 04", name: "Gestão, Recepção Técnica, Suprimentos e Administrativo" },
] as const;

export const riskCatalog: RiskDefinition[] = [
  {
    id: "ruido-continuo",
    type: "Físico",
    source: "Ruído contínuo ou intermitente: chaves de impacto pneumáticas, compressores, lixadeiras, esmerilhadoras, motores e lavadoras de alta pressão (NR-15 Anexo 1; NHO-01)",
    damages: "Perda auditiva induzida por ruído e desconforto",
    severity: 6,
    probability: 4,
    treatment: "Avaliação quantitativa do nível de exposição, manutenção de equipamentos, enclausuramento ou isolamento de fontes, protetor auricular e audiometria conforme NR-07",
  },
  {
    id: "vibracao-vmb",
    type: "Físico",
    source: "Vibração de mãos e braços: chaves pneumáticas, lixadeiras roto-orbitais, esmerilhadoras e politrizes (NR-09; NR-15 Anexo 8; NHO-10)",
    damages: "Distúrbios vasculares e osteomusculares de mãos e braços",
    severity: 3,
    probability: 4,
    treatment: "Ferramentas com baixa vibração, manutenção, rodízio de tarefas, luvas antivibração quando indicadas e avaliação quantitativa quando aplicável",
  },
  {
    id: "radiacao-solda",
    type: "Físico",
    source: "Radiação não ionizante (UV e IV) do arco elétrico em soldagem MIG/MAG, TIG, eletrodo revestido e corte oxiacetilênico (NR-15 Anexo 7)",
    damages: "Queimaduras da pele, fotoceratite e lesões oculares",
    severity: 6,
    probability: 4,
    treatment: "Biombos ou cortinas de soldagem, máscara com filtro adequado, vestimenta de raspa e avaliação qualitativa da operação",
    condition: "soldagem",
  },
  {
    id: "umidade-lavagem",
    type: "Físico",
    source: "Umidade excessiva em box de lavagem com água sob pressão (NR-15 Anexo 10)",
    damages: "Dermatites, desconforto térmico e quedas",
    severity: 3,
    probability: 4,
    treatment: "Conjunto impermeável, bota de PVC, drenagem do piso, piso antiderrapante e avaliação qualitativa da atividade",
    condition: "lavagemCsao",
  },
  {
    id: "oleos-graxas",
    type: "Químico",
    source: "Contato dérmico com óleo de motor usado, óleo de câmbio, fluido de freio e graxas (NR-15 Anexo 13 – hidrocarbonetos e outros compostos de carbono)",
    damages: "Dermatites de contato, foliculite e irritação",
    severity: 3,
    probability: 6,
    treatment: "FDS, luva nitrílica, creme protetor adequado (Portaria SIT 26/1994), higiene das mãos e funil/bandeja de drenagem",
  },
  {
    id: "solventes-tintas",
    type: "Químico",
    source: "Vapores orgânicos e solventes (tolueno, xileno, etilbenzeno, diluentes) e isocianatos na preparação e aplicação de tintas e vernizes (NR-15 Anexos 11 e 13)",
    damages: "Intoxicação, irritação respiratória, dermatites e sensibilização",
    severity: 6,
    probability: 4,
    treatment: "Cabine com exaustão, FDS, avaliação quantitativa, respirador com filtro para vapores orgânicos e pré-filtro, vestimenta e luva compatíveis",
    condition: "cabinePintura",
  },
  {
    id: "fumos-metalicos",
    type: "Químico",
    source: "Fumos metálicos de soldagem e corte (ferro, manganês, zinco, cobre) e esmerilhamento de chapas (NR-15 Anexo 11; NHO-08)",
    damages: "Febre dos fumos metálicos, irritação respiratória e doenças pulmonares",
    severity: 6,
    probability: 4,
    treatment: "Exaustão localizada, ventilação geral diluidora, respirador PFF2 ou superior e avaliação quantitativa quando aplicável",
    condition: "soldagem",
  },
  {
    id: "poeiras-lixamento",
    type: "Químico",
    source: "Poeiras de lixamento a seco de massa plástica/poliéster, primários e carrocerias (NR-09; NHO-08)",
    damages: "Irritação respiratória, sensibilização e doenças respiratórias",
    severity: 6,
    probability: 4,
    treatment: "Lixadeira com aspiração acoplada, lixamento úmido quando possível, respirador PFF2 e limpeza por aspiração (sem ar comprimido)",
  },
  {
    id: "gases-escape-co",
    type: "Químico",
    source: "Gases de escape (monóxido de carbono e outros) no funcionamento e teste de motores em galpão (NR-15 Anexo 11)",
    damages: "Intoxicação por monóxido de carbono, cefaleia e irritação respiratória",
    severity: 6,
    probability: 2,
    treatment: "Exaustor/mangueira de escape na ponteira do veículo, ventilação geral e proibição de manter motores em marcha lenta em ambiente fechado",
    condition: "manobraVeiculos",
  },
  {
    id: "acido-bateria",
    type: "Químico",
    source: "Ácido sulfúrico e chumbo em manuseio, teste e recarga de baterias chumbo-ácido (NR-15 Anexo 11)",
    damages: "Queimaduras químicas, lesões oculares, irritação respiratória e formação de gases inflamáveis",
    severity: 6,
    probability: 2,
    treatment: "Luva e óculos de ampla visão, avental, bacia de contenção, kit de lavagem ocular, área ventilada e sem fontes de ignição",
    condition: "baterias",
  },
  {
    id: "alcalinos-limpeza",
    type: "Químico",
    source: "Desengordurantes e shampoos alcalinos, saneantes e produtos de limpeza",
    damages: "Irritação e queimaduras de pele e olhos, dermatites",
    severity: 3,
    probability: 4,
    treatment: "FDS, diluição segura, identificação, luva e óculos compatíveis, armazenamento em bacia de contenção",
    condition: "lavagemCsao",
  },
  {
    id: "limpeza-quimico",
    type: "Químico",
    source: "Saneantes e produtos de limpeza de instalações",
    damages: "Irritação, dermatites e intoxicação",
    severity: 3,
    probability: 4,
    treatment: "FDS, identificação, diluição segura e EPI compatível",
    condition: "produtosQuimicos",
  },
  {
    id: "biologico-sanitario",
    type: "Biológico",
    source: "Higienização de instalações sanitárias coletivas e manejo de resíduos comuns",
    damages: "Infecções e outros agravos",
    severity: 6,
    probability: 2,
    treatment: "Procedimentos de higiene, luva impermeável, desinfecção e higiene das mãos; enquadramento na NR-15 depende de análise qualitativa",
  },
  {
    id: "residuos-perigosos",
    type: "Químico",
    source: "Manuseio e armazenamento temporário de óleo lubrificante usado, filtros, estopas e baterias contaminados (NR-25)",
    damages: "Dermatites, contaminação, incêndio e danos ambientais",
    severity: 3,
    probability: 4,
    treatment: "Abrigo identificado e coberto, bacia de contenção, coleta por empresa licenciada, luva compatível e inventário de resíduos",
    condition: "abrigoResiduos",
  },
  {
    id: "ergo-oficina",
    type: "Ergonômico",
    source: "Posturas com membros superiores elevados sob o veículo, flexão de tronco no cofre do motor, uso de força e levantamento de rodas e peças (NR-17)",
    damages: "DORT, lombalgia e fadiga",
    severity: 3,
    probability: 4,
    treatment: "Carro porta-ferramentas, macaco de transmissão, guincho, apoio para trabalho sob o veículo, pausas e AEP",
  },
  {
    id: "ergo-administrativo",
    type: "Ergonômico",
    source: "Postura, computador, mobiliário de recepção/escritório e demanda cognitiva (NR-17)",
    damages: "Desconforto, DORT e fadiga",
    severity: 3,
    probability: 4,
    treatment: "Adequar mobiliário, pausas e organização do trabalho; AEP",
  },
  {
    id: "psicossocial-producao",
    type: "Psicossocial",
    source: "Metas de produtividade, prazos de entrega, pressão por retrabalho e organização do trabalho na oficina",
    damages: "Estresse e adoecimento",
    severity: 3,
    probability: 4,
    treatment: "Avaliar carga, prazos, comunicação e organização do trabalho (NR-01)",
  },
  {
    id: "psicossocial-atendimento",
    type: "Psicossocial",
    source: "Atendimento a clientes, conflitos sobre orçamentos e prazos e demandas simultâneas",
    damages: "Estresse e desgaste emocional",
    severity: 3,
    probability: 4,
    treatment: "Protocolos de atendimento, apoio da gestão e comunicação clara de prazos (NR-01)",
  },
  {
    id: "acidentes-oficina",
    type: "Acidentes",
    source: "Pisos escorregadios por óleo/água, cortes, perfurações, quedas e contusões em circulação e áreas de trabalho",
    damages: "Quedas, cortes e contusões",
    severity: 6,
    probability: 4,
    treatment: "Limpeza imediata de derrames com material absorvente, organização, sinalização e calçado antiderrapante",
  },
  {
    id: "acidentes-ferramentas",
    type: "Acidentes",
    source: "Ferramentas manuais, pneumáticas e elétricas, projeção de partículas e esmagamento de membros",
    damages: "Cortes, esmagamentos, projeções oculares e traumas",
    severity: 6,
    probability: 4,
    treatment: "Inspeção pré-uso, ferramentas adequadas, proteção de máquinas (NR-12), óculos e luvas conforme a tarefa",
  },
  {
    id: "acidentes-elevador",
    type: "Acidentes",
    source: "Elevadores automotivos, macacos hidráulicos, cavaletes e prensas hidráulicas (NR-12)",
    damages: "Esmagamento, queda de veículo e óbito",
    severity: 9,
    probability: 2,
    treatment: "Trava mecânica, cavaletes certificados, inspeção periódica, capacidade identificada e procedimento de içamento",
    condition: "elevadores",
  },
  {
    id: "acidentes-compressor",
    type: "Acidentes",
    source: "Compressor de ar e vaso de pressão (NR-13); mangueiras e linhas de ar comprimido",
    damages: "Explosão, projeção de fragmentos e chicoteamento de mangueiras",
    severity: 9,
    probability: 1,
    treatment: "Prontuário e inspeções da NR-13, válvula de segurança, drenagem periódica, engates seguros e proibição de uso do ar para limpeza de pele/roupa",
    condition: "compressor",
  },
  {
    id: "acidentes-pneus",
    type: "Acidentes",
    source: "Montagem, vulcanização e calibragem de pneus; explosão de pneu/aro",
    damages: "Projeção de componentes, traumas e amputações",
    severity: 9,
    probability: 2,
    treatment: "Gaiola de contenção, calibragem com mangueira de engate remoto, inspeção de aros e procedimento de calibragem",
    condition: "borracharia",
  },
  {
    id: "acidentes-vala",
    type: "Acidentes",
    source: "Vala de inspeção, drenagem e troca de óleo lubrificante (quedas na vala, escorregamento e acúmulo de vapores)",
    damages: "Quedas, traumas e intoxicação por vapores",
    severity: 6,
    probability: 2,
    treatment: "Guarda-corpo ou tampa, iluminação, ventilação, drenagem e piso antiderrapante; avaliar NR-33 se houver confinamento",
    condition: "valaOleo",
  },
  {
    id: "acidentes-atropelamento",
    type: "Acidentes",
    source: "Manobras, testes de rodagem e circulação interna de veículos",
    damages: "Atropelamento, colisões e esmagamento",
    severity: 9,
    probability: 2,
    treatment: "Sinalização, segregação de pedestres, limite de velocidade, vestimenta de alta visibilidade e procedimento de manobra",
    condition: "manobraVeiculos",
  },
  {
    id: "incendio-inflamaveis",
    type: "Acidentes",
    source: "Combustíveis, tintas, solventes e outros inflamáveis; faíscas de soldagem e esmerilhamento (NR-20; NR-23)",
    damages: "Incêndio, explosão e queimaduras",
    severity: 9,
    probability: 2,
    treatment: "Armazenamento adequado, aterramento, controle de fontes de ignição, extintores ABC/BC, plano de emergência e brigada",
  },
  {
    id: "queimaduras-projecao",
    type: "Acidentes",
    source: "Respingos de solda, metal quente e fagulhas de corte e esmerilhamento",
    damages: "Queimaduras e lesões oculares",
    severity: 6,
    probability: 4,
    treatment: "Vestimenta de raspa, máscara, luva de raspa, remoção de combustíveis da área e permissão para trabalho a quente",
    condition: "soldagem",
  },
  {
    id: "eletrico-automotivo",
    type: "Elétrico",
    source: "Instalações elétricas da oficina, equipamentos de bancada, baterias e sistemas de alta tensão de veículos híbridos/elétricos (NR-10)",
    damages: "Choque, queimadura, arco elétrico e óbito",
    severity: 9,
    probability: 2,
    treatment: "Somente pessoal autorizado, desenergização e bloqueio, ferramentas isoladas e controles da NR-10",
    condition: "eletricidade",
  },
  {
    id: "movimentacao-materiais",
    type: "Acidentes",
    source: "Recebimento, armazenagem e movimentação manual ou mecânica de peças, baterias, lubrificantes e tintas (NR-11)",
    damages: "Quedas de materiais, esmagamento e lesões musculoesqueléticas",
    severity: 6,
    probability: 2,
    treatment: "Prateleiras ancoradas, limites de carga, carrinhos e paleteira, empilhamento seguro e armazenamento segregado de químicos",
  },
];

const mechanicRisks = [
  "ruido-continuo",
  "vibracao-vmb",
  "oleos-graxas",
  "gases-escape-co",
  "acido-bateria",
  "residuos-perigosos",
  "ergo-oficina",
  "acidentes-oficina",
  "acidentes-ferramentas",
  "acidentes-elevador",
  "acidentes-compressor",
  "acidentes-vala",
  "acidentes-atropelamento",
  "incendio-inflamaveis",
  "psicossocial-producao",
];
const administrativeEpis = [
  "Sem EPI automático em atividade exclusivamente administrativa",
  "EPI obrigatório da área quando houver acesso à área produtiva",
];

export const roleCatalog: RoleDefinition[] = [
  {
    id: "chefe-oficina",
    name: "Encarregado / Chefe de Oficina",
    cbo: "9102-05",
    ghe: "GHE 01",
    gheName: gheCatalog[0].name,
    description:
      "Coordenar a distribuição de ordens de serviço nos boxes, realizar diagnósticos técnicos, testar veículos e supervisionar o cumprimento das normas de SST.",
    riskIds: [
      "ruido-continuo",
      "oleos-graxas",
      "gases-escape-co",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-atropelamento",
      "incendio-inflamaveis",
      "psicossocial-producao",
    ],
    epis: ["Calçado de segurança com biqueira", "Óculos de proteção incolor", "Protetor auricular", "Luva nitrílica ou multitato conforme a tarefa"],
  },
  {
    id: "mecanico-auto",
    name: "Mecânico Automotivo",
    cbo: "9144-05",
    ghe: "GHE 01",
    gheName: gheCatalog[0].name,
    description:
      "Executar manutenção preventiva e corretiva em motores, transmissão, freios, arrefecimento e suspensão, com uso de elevadores e ferramentas pneumáticas.",
    riskIds: mechanicRisks,
    epis: ["Botina de segurança", "Óculos de proteção", "Protetor auricular", "Luva nitrílica ou multitato", "Creme protetor para a pele (Grupo 3 – óleos e graxas)"],
  },
  {
    id: "auxiliar-mecanico",
    name: "Auxiliar de Mecânico",
    ghe: "GHE 01",
    gheName: gheCatalog[0].name,
    description:
      "Auxiliar na desmontagem de componentes, limpeza de peças, organização de ferramentas, operação de macacos hidráulicos e drenagem de fluidos.",
    riskIds: mechanicRisks,
    epis: ["Botina de segurança", "Óculos de proteção", "Protetor auricular", "Luva nitrílica", "Creme protetor dérmico (Grupo 3)"],
  },
  {
    id: "eletricista-auto",
    name: "Eletricista Automotivo",
    cbo: "9531-15",
    ghe: "GHE 01",
    gheName: gheCatalog[0].name,
    description:
      "Realizar reparos em chicotes elétricos, injeção eletrônica, alternadores, motores de partida, baterias e climatização veicular.",
    riskIds: [
      "oleos-graxas",
      "gases-escape-co",
      "acido-bateria",
      "eletrico-automotivo",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-ferramentas",
      "acidentes-atropelamento",
      "incendio-inflamaveis",
      "psicossocial-producao",
    ],
    epis: ["Botina de segurança isolante (sem metal)", "Óculos de proteção", "Luva multitato ou isolante conforme a tarefa", "Luva química para baterias"],
  },
  {
    id: "borracheiro-alinhador",
    name: "Borracheiro / Alinhador",
    cbo: "9921-15",
    ghe: "GHE 01",
    gheName: gheCatalog[0].name,
    description:
      "Executar desmontagem, reparo, montagem, calibragem em gaiola e balanceamento de rodas, além de alinhamento de direção e suspensão.",
    riskIds: [
      "ruido-continuo",
      "vibracao-vmb",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-ferramentas",
      "acidentes-compressor",
      "acidentes-pneus",
      "acidentes-atropelamento",
      "psicossocial-producao",
    ],
    epis: ["Botina de segurança com biqueira", "Protetor auricular", "Óculos de proteção", "Luva de vaqueta ou multitato"],
  },
  {
    id: "funileiro-soldador",
    name: "Funileiro / Soldador",
    cbo: "9913-05",
    ghe: "GHE 02",
    gheName: gheCatalog[1].name,
    description:
      "Realizar recuperação estrutural de carrocerias, corte abrasivo, esmerilhamento e soldagem MIG/MAG, TIG e oxiacetilênica.",
    riskIds: [
      "ruido-continuo",
      "vibracao-vmb",
      "radiacao-solda",
      "fumos-metalicos",
      "poeiras-lixamento",
      "queimaduras-projecao",
      "incendio-inflamaveis",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-ferramentas",
      "psicossocial-producao",
    ],
    epis: ["Botina com proteção de metatarso", "Máscara de soldagem", "Respirador PFF2 (fumos metálicos)", "Avental, mangote e perneira de raspa", "Luva de raspa cano longo", "Protetor auricular"],
  },
  {
    id: "pintor-auto",
    name: "Pintor Automotivo",
    cbo: "9913-15",
    ghe: "GHE 02",
    gheName: gheCatalog[1].name,
    description:
      "Preparar misturas de tintas, vernizes e catalisadores e aplicar com pistola em cabine de pintura pressurizada.",
    riskIds: [
      "solventes-tintas",
      "poeiras-lixamento",
      "incendio-inflamaveis",
      "residuos-perigosos",
      "ergo-oficina",
      "acidentes-oficina",
      "psicossocial-producao",
    ],
    epis: ["Respirador semifacial com filtro para vapores orgânicos e pré-filtro P2", "Óculos de ampla visão", "Macacão com capuz", "Luva nitrílica cano longo", "Botina antiestática"],
  },
  {
    id: "preparador-pintura",
    name: "Preparador de Pintura / Polidor",
    ghe: "GHE 02",
    gheName: gheCatalog[1].name,
    description:
      "Aplicar massa plástica/poliéster e primário, executar lixamento seco ou úmido com lixadeira roto-orbital, mascaramento e polimento técnico.",
    riskIds: [
      "ruido-continuo",
      "vibracao-vmb",
      "poeiras-lixamento",
      "solventes-tintas",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-ferramentas",
      "psicossocial-producao",
    ],
    epis: ["Respirador PFF2 (lixamento) ou filtro para vapores orgânicos", "Óculos de proteção", "Protetor auricular", "Luva nitrílica", "Botina de segurança"],
  },
  {
    id: "lavador-lubrificador",
    name: "Lavador / Lubrificador",
    cbo: "5199-35",
    ghe: "GHE 03",
    gheName: gheCatalog[2].name,
    description:
      "Lavar veículos com lavadora de pressão, aplicar desengordurantes, limpar chassis e realizar troca de óleo lubrificante.",
    riskIds: [
      "ruido-continuo",
      "umidade-lavagem",
      "alcalinos-limpeza",
      "oleos-graxas",
      "residuos-perigosos",
      "ergo-oficina",
      "acidentes-oficina",
      "acidentes-vala",
      "acidentes-atropelamento",
      "psicossocial-producao",
    ],
    epis: ["Bota de PVC cano longo", "Avental impermeável de PVC", "Luva de PVC ou nitrílica cano longo", "Óculos de ampla visão ou viseira facial", "Protetor auricular"],
  },
  {
    id: "auxiliar-limpeza",
    name: "Auxiliar de Serviços Gerais",
    cbo: "5143-20",
    ghe: "GHE 03",
    gheName: gheCatalog[2].name,
    description:
      "Higienizar instalações sanitárias, refeitório e recepção, e apoiar a contenção e a limpeza de derrames no piso com material absorvente.",
    riskIds: ["limpeza-quimico", "biologico-sanitario", "residuos-perigosos", "ergo-oficina", "acidentes-oficina", "psicossocial-producao"],
    epis: ["Bota de PVC", "Luva de látex ou nitrílica", "Óculos de proteção", "Avental impermeável"],
  },
  {
    id: "consultor-tecnico",
    name: "Consultor Técnico",
    ghe: "GHE 04",
    gheName: gheCatalog[3].name,
    description:
      "Receber clientes, realizar inspeção visual de entrada no pátio, abrir ordens de serviço, elaborar orçamentos e acompanhar a entrega de veículos.",
    riskIds: ["ruido-continuo", "gases-escape-co", "ergo-administrativo", "acidentes-oficina", "acidentes-atropelamento", "psicossocial-atendimento"],
    epis: ["Calçado fechado antiderrapante", "Óculos e protetor auricular ao acessar a área produtiva"],
  },
  {
    id: "almoxarife-pecas",
    name: "Almoxarife de Peças",
    cbo: "4141-05",
    ghe: "GHE 04",
    gheName: gheCatalog[3].name,
    description:
      "Receber, conferir, armazenar e distribuir peças, filtros, baterias, tintas e lubrificantes; manter o arquivo de FDS.",
    riskIds: ["movimentacao-materiais", "incendio-inflamaveis", "ergo-oficina", "ergo-administrativo", "acidentes-oficina", "psicossocial-atendimento"],
    epis: ["Botina de segurança com biqueira", "Luva pigmentada ou multitato"],
  },
  {
    id: "assistente-adm",
    name: "Assistente Administrativo",
    cbo: "4110-10",
    ghe: "GHE 04",
    gheName: gheCatalog[3].name,
    description:
      "Executar rotinas de faturamento, compras, controle financeiro, arquivo e atendimento em ambiente de escritório.",
    riskIds: ["ergo-administrativo", "psicossocial-atendimento", "acidentes-oficina"],
    epis: administrativeEpis,
  },
];

export const condoCatalog: CondoDefinition[] = [
  { id: "personalizado", name: "Oficina / Centro Automotivo Personalizado", expectedTotal: null, suggestedRoleIds: [], note: "Preencha a identificação e monte o quadro de funcionários." },
];

export const scenarioCatalog: ScenarioDefinition[] = [
  { id: "elevadores", label: "Elevadores automotivos, macacos hidráulicos e cavaletes", description: "Há veículos erguidos por elevador, macaco ou cavalete, com trabalho sob o veículo.", section: "Elevadores automotivos e NR-12", suggestedForGhes: ["GHE 01"] },
  { id: "cabinePintura", label: "Cabine de pintura e sala de mistura de tintas", description: "Há preparação de tintas, solventes e aplicação de pintura a pistola.", section: "Cabine de pintura, solventes e inflamáveis (NR-15 / NR-20)", suggestedForGhes: ["GHE 02"] },
  { id: "soldagem", label: "Bancada de soldagem, corte e esmerilhamento", description: "Há soldagem MIG/MAG/TIG, corte oxiacetilênico ou esmerilhamento de chapas.", section: "Soldagem, fumos metálicos e trabalho a quente", suggestedForGhes: ["GHE 02"] },
  { id: "valaOleo", label: "Vala de inspeção e troca de óleo lubrificante", description: "Há trabalho em vala de inspeção, drenagem e troca de óleo.", section: "Vala de inspeção e drenagem de fluidos", suggestedForGhes: ["GHE 01", "GHE 03"] },
  { id: "compressor", label: "Central de ar comprimido (compressor / vaso de pressão)", description: "Há compressor de ar, reservatório e rede de ar comprimido.", section: "Compressor e vasos de pressão (NR-13)", suggestedForGhes: ["GHE 01"] },
  { id: "lavagemCsao", label: "Box de lavagem e caixa separadora de água e óleo (CSAO)", description: "Há lavagem de veículos, uso de desengordurantes e sistema de tratamento de efluentes.", section: "Umidade, produtos alcalinos e CSAO", suggestedForGhes: ["GHE 03"] },
  { id: "borracharia", label: "Desmontagem, vulcanização e calibragem de pneus", description: "Há montagem e desmontagem de pneus e calibragem de pneus e rodas.", section: "Borracharia e calibragem de pneus", suggestedForGhes: ["GHE 01"] },
  { id: "baterias", label: "Manuseio, teste e recarga de baterias automotivas", description: "Há manuseio, teste ou recarga de baterias chumbo-ácido ou de tração.", section: "Baterias automotivas", suggestedForGhes: ["GHE 01"] },
  { id: "manobraVeiculos", label: "Manobra, teste de rodagem e circulação interna de veículos", description: "Veículos circulam, são manobrados ou têm o motor ligado no galpão e no pátio.", section: "Circulação de veículos e gases de escape", suggestedForGhes: ["GHE 01", "GHE 04"] },
  { id: "abrigoResiduos", label: "Abrigo temporário de resíduos perigosos", description: "Há armazenamento de óleo usado, filtros, baterias e estopas contaminadas.", section: "Resíduos perigosos e NR-25", suggestedForGhes: ["GHE 01", "GHE 03"] },
  { id: "produtosQuimicos", label: "Produtos químicos, combustíveis e saneantes (FDS)", description: "Há uso ou armazenamento de produtos químicos, combustíveis e saneantes.", section: "Produtos químicos e FDS", suggestedForGhes: ["GHE 02", "GHE 03", "GHE 04"] },
  { id: "eletricidade", label: "Intervenção em eletricidade", description: "Há intervenção em instalações ou sistemas elétricos por trabalhador autorizado.", section: "NR-10 e instalações elétricas", suggestedForGhes: ["GHE 01"] },
  { id: "trabalhoAltura", label: "Trabalho em altura", description: "Há atividade com risco de queda de nível que exige controles específicos.", section: "NR-35 e trabalho em altura" },
  { id: "incendioEmergencia", label: "Incêndio e emergência", description: "Integrar a equipe às rotas de fuga, meios de comunicação e plano de emergência da oficina.", section: "Proteção contra incêndio e emergências" },
  { id: "atividadesNaoRotineiras", label: "Atividades não rotineiras e terceiros", description: "Há manutenção extraordinária, mudanças ou contratação de terceiros para atividades especiais.", section: "APR, AR e PT quando aplicáveis" },
];

export const environmentAreas = [
  "Recepção técnica e sala de espera de clientes",
  "Pátio de manobra e estacionamento de veículos",
  "Galpão principal – boxes de mecânica e elevadores automotivos",
  "Setor de funilaria, chapeação e soldagem",
  "Setor de preparação e cabine de pintura",
  "Setor de borracharia, alinhamento e balanceamento",
  "Box de lavagem e estética automotiva (com CSAO)",
  "Sala técnica do compressor de ar (NR-13)",
  "Almoxarifado de peças, tintas e lubrificantes",
  "Abrigo de resíduos perigosos (óleo usado e baterias)",
  "Instalações sanitárias, vestiários e refeitório (NR-24)",
  "Escritório administrativo e financeiro",
];

export const actionCatalog: ActionDefinition[] = [
  { id: "validar-quadro", action: "Validar cargos e quantitativos com o RH", ghe: "Todos", priority: "Alta", deadline: "Imediato", responsible: "RH/SST" },
  { id: "visita-tecnica", action: "Realizar visita técnica e confirmar ambientes e tarefas", ghe: "Todos", priority: "Alta", deadline: "30 dias", responsible: "SST" },
  { id: "revisar-epi", action: "Revisar matriz de EPI, CAs e registros de entrega", ghe: "Todos", priority: "Alta", deadline: "15 dias", responsible: "SST/Compras" },
  { id: "realizar-aep", action: "Realizar AEP e registrar os resultados no inventário", ghe: "GHEs aplicáveis", priority: "Média", deadline: "60 dias", responsible: "SST" },
  { id: "integrar-pcmso", action: "Integrar o PGR ao PCMSO", ghe: "Todos", priority: "Alta", deadline: "30 dias", responsible: "SST/Médico do Trabalho" },
  { id: "atualizar-pgr", action: "Atualizar o PGR após mudanças, acidentes ou novas exposições", ghe: "Todos", priority: "Contínua", deadline: "Contínuo", responsible: "SST" },
  { id: "avaliar-ruido", action: "Realizar avaliação quantitativa de ruído e vibração nos boxes e setores", ghe: "GHE 01/02/03", priority: "Alta", deadline: "60 dias", responsible: "Responsável técnico" },
  { id: "nr12-elevadores", action: "Verificar travas, capacidade, inspeções e procedimentos dos elevadores, macacos e cavaletes", ghe: "GHE 01", priority: "Alta", deadline: "30 dias", responsible: "SST/Manutenção", condition: "elevadores" },
  { id: "cabine-pintura", action: "Verificar exaustão da cabine, avaliação de solventes, proteção respiratória e controle de ignição na área de mistura", ghe: "GHE 02", priority: "Alta", deadline: "30 dias", responsible: "SST/Responsável técnico", condition: "cabinePintura" },
  { id: "trabalho-quente", action: "Implantar permissão para trabalho a quente e exaustão localizada na soldagem", ghe: "GHE 02", priority: "Alta", deadline: "30 dias", responsible: "SST/Gestão", condition: "soldagem" },
  { id: "vala-inspecao", action: "Verificar proteção, iluminação, ventilação e drenagem da vala de inspeção", ghe: "GHE 01/03", priority: "Média", deadline: "30 dias", responsible: "SST/Manutenção", condition: "valaOleo" },
  { id: "nr13-compressor", action: "Verificar prontuário, inspeções e dispositivos de segurança do compressor e do vaso de pressão (NR-13)", ghe: "GHE 01", priority: "Alta", deadline: "30 dias", responsible: "Responsável técnico", condition: "compressor" },
  { id: "csao-lavagem", action: "Verificar drenagem, piso antiderrapante, EPIs impermeáveis e manutenção da CSAO", ghe: "GHE 03", priority: "Média", deadline: "30 dias", responsible: "Gestão/SST", condition: "lavagemCsao" },
  { id: "borracharia-gaiola", action: "Verificar gaiola de contenção, procedimento de calibragem e inspeção de aros", ghe: "GHE 01", priority: "Alta", deadline: "30 dias", responsible: "SST", condition: "borracharia" },
  { id: "baterias-recarga", action: "Definir área ventilada, bacia de contenção, lava-olhos e procedimento de recarga de baterias", ghe: "GHE 01", priority: "Média", deadline: "30 dias", responsible: "SST/Manutenção", condition: "baterias" },
  { id: "plano-veiculos", action: "Revisar segregação de pedestres, sinalização, exaustão de gases de escape e orientação de manobras", ghe: "GHE 01/04", priority: "Alta", deadline: "30 dias", responsible: "Gestão/SST", condition: "manobraVeiculos" },
  { id: "residuos-perigosos", action: "Implantar abrigo identificado, inventário e destinação de resíduos por empresa licenciada (NR-25)", ghe: "GHE 01/03", priority: "Média", deadline: "60 dias", responsible: "Gestão/SST", condition: "abrigoResiduos" },
  { id: "inventario-fds", action: "Implantar inventário de produtos e manter as FDS disponíveis", ghe: "GHE 02/03/04", priority: "Alta", deadline: "15 dias", responsible: "Gestão/SST", condition: "produtosQuimicos" },
  { id: "nr10-eletrica", action: "Verificar autorização, capacitação e controles para atividades elétricas, inclusive veículos híbridos e elétricos", ghe: "GHE 01", priority: "Alta", deadline: "30 dias", responsible: "SST/Manutenção", condition: "eletricidade" },
  { id: "nr35-altura", action: "Verificar capacitação, análise de risco e proteção contra quedas", ghe: "GHEs aplicáveis", priority: "Alta", deadline: "30 dias", responsible: "SST", condition: "trabalhoAltura" },
  { id: "emergencia", action: "Compatibilizar procedimentos com o plano de emergência da oficina (incêndio em inflamáveis, derrames e acidentes com máquinas)", ghe: "Todos", priority: "Média", deadline: "60 dias", responsible: "Gestão/SST", condition: "incendioEmergencia" },
  { id: "nao-rotineiras", action: "Definir fluxo de APR, AR e PT para serviços não rotineiros", ghe: "Todos", priority: "Média", deadline: "60 dias", responsible: "SST/Gestão", condition: "atividadesNaoRotineiras" },
];

export const normativeReferences = [
  "NR-01 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais – GRO/PGR",
  "NR-04 – Serviços Especializados em Segurança e em Medicina do Trabalho, quando aplicável",
  "NR-05 – Comissão Interna de Prevenção de Acidentes e de Assédio – CIPA, quando aplicável",
  "NR-06 – Equipamento de Proteção Individual – EPI",
  "NR-07 – Programa de Controle Médico de Saúde Ocupacional – PCMSO",
  "NR-08 – Edificações",
  "NR-09 – Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos",
  "NR-10 – Segurança em Instalações e Serviços em Eletricidade",
  "NR-11 – Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
  "NR-12 – Segurança no Trabalho em Máquinas e Equipamentos",
  "NR-13 – Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento",
  "NR-15 – Atividades e Operações Insalubres",
  "NR-16 – Atividades e Operações Perigosas",
  "NR-17 – Ergonomia",
  "NR-20 – Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
  "NR-23 – Proteção Contra Incêndios",
  "NR-24 – Condições Sanitárias e de Conforto nos Locais de Trabalho",
  "NR-25 – Resíduos Industriais",
  "NR-26 – Sinalização de Segurança",
  "NR-33 – Segurança e Saúde nos Trabalhos em Espaços Confinados, quando aplicável",
  "NR-35 – Trabalho em Altura, quando aplicável",
  "NHO-01 – Avaliação da Exposição Ocupacional ao Ruído (Fundacentro)",
  "NHO-08 – Coleta de Material Particulado Sólido Suspenso no Ar de Ambientes de Trabalho (Fundacentro)",
  "NHO-10 – Avaliação da Exposição Ocupacional a Vibrações em Mãos e Braços (Fundacentro)",
];

export const getRisk = (riskId: string) => riskCatalog.find((risk) => risk.id === riskId);
export const getRole = (roleId: string) => roleCatalog.find((role) => role.id === roleId);

export function classifyRisk(score: number) {
  if (score > 24) return "Alto";
  if (score >= 9) return "Médio";
  return "Baixo";
}

export function getSuggestedScenarios(roleIds: string[]): Record<ScenarioId, boolean> {
  const ghes = new Set(roleIds.map((id) => getRole(id)?.ghe).filter(Boolean));
  return Object.fromEntries(
    scenarioCatalog.map((scenario) => [
      scenario.id,
      scenario.id === "incendioEmergencia" ||
        scenario.id === "atividadesNaoRotineiras" ||
        Boolean(scenario.suggestedForGhes?.some((ghe) => ghes.has(ghe))),
    ]),
  ) as Record<ScenarioId, boolean>;
}
