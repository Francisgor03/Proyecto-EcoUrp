export const WASTE_IDS = ["plastic", "paper", "glass", "organic"] as const;

export type WasteTypeId = (typeof WASTE_IDS)[number];

export interface WasteTypeDefinition {
  id: WasteTypeId;
  label: string;
  shortLabel: string;
  colorHex: string;
  colorNumber: number;
  educationalReason: string;
}

export interface WrongBinFeedback {
  itemType: WasteTypeId;
  binType: WasteTypeId;
  title: string;
  residuo: string;
  tachoElegido: string;
  tachoCorrecto: string;
  body: string;
}

const WASTE_DEFINITIONS: Record<WasteTypeId, WasteTypeDefinition> = {
  plastic: {
    id: "plastic",
    label: "Plastico",
    shortLabel: "PLA",
    colorHex: "#facc15",
    colorNumber: 0xfacc15,
    educationalReason:
      "Los plasticos deben separarse para evitar microplasticos y permitir un reciclaje mecanico de calidad.",
  },
  paper: {
    id: "paper",
    label: "Papel",
    shortLabel: "PAP",
    colorHex: "#3b82f6",
    colorNumber: 0x3b82f6,
    educationalReason:
      "El papel humedo o sucio pierde fibras y no puede reprocesarse en nuevos productos de papel.",
  },
  glass: {
    id: "glass",
    label: "Vidrio",
    shortLabel: "VID",
    colorHex: "#22c55e",
    colorNumber: 0x22c55e,
    educationalReason:
      "El vidrio es reciclable de forma casi infinita, pero necesita un flujo limpio para mantener pureza.",
  },
  organic: {
    id: "organic",
    label: "Organico",
    shortLabel: "ORG",
    colorHex: "#a16207",
    colorNumber: 0xa16207,
    educationalReason:
      "Los residuos organicos deben compostarse o biodigerirse, sin mezcla de envases inorganicos.",
  },
};

const CROSS_CONTAMINATION_REASON: Record<WasteTypeId, Partial<Record<WasteTypeId, string>>> = {
  plastic: {
    paper:
      "El plastico en el flujo de papel contamina fibras limpias y reduce el rendimiento del reciclaje.",
    glass:
      "Mezclar plastico con vidrio exige mas separacion mecanica y baja la calidad del material recuperado.",
    organic:
      "El plastico no se descompone en compost y puede terminar como contaminante persistente en suelo.",
  },
  paper: {
    plastic:
      "El papel mezclado con plasticos y restos de envases suele ser rechazado por plantas de reciclaje.",
    glass:
      "El papel con fragmentos de vidrio se vuelve riesgoso para clasificacion y maquinaria industrial.",
    organic:
      "El papel solo debe ir a organico cuando esta compostable y sin tintas o laminados no biodegradables.",
  },
  glass: {
    plastic:
      "El vidrio con plasticos adheridos requiere limpieza extra y disminuye la eficiencia del proceso.",
    paper:
      "Fragmentos de vidrio en papel pueden dañar equipos y representan riesgo para personas operadoras.",
    organic:
      "El vidrio en organico no aporta nutrientes y puede generar cortes durante manejo de compost.",
  },
  organic: {
    plastic:
      "Los restos organicos ensucian envases plasticos y dificultan su valorizacion posterior.",
    paper:
      "La humedad y grasas organicas degradan fibras de papel que podrian haberse reciclado.",
    glass:
      "Residuos organicos adheridos al vidrio requieren lavados adicionales y encarecen la recuperacion.",
  },
};

export const WASTE_TYPES = WASTE_IDS.map((id) => WASTE_DEFINITIONS[id]);

export function getWasteType(type: WasteTypeId): WasteTypeDefinition {
  return WASTE_DEFINITIONS[type];
}

export function getWasteTypeByIndex(index: number): WasteTypeDefinition {
  const safeIndex = Math.min(Math.max(0, index), WASTE_IDS.length - 1);
  return WASTE_DEFINITIONS[WASTE_IDS[safeIndex]];
}

export function buildWrongBinFeedback(itemType: WasteTypeId, binType: WasteTypeId): WrongBinFeedback {
  const waste = getWasteType(itemType);
  const selectedBin = getWasteType(binType);
  const selectedReason = CROSS_CONTAMINATION_REASON[itemType]?.[binType];

  const body = [
    selectedReason ??
      `Mezclar ${waste.label.toLowerCase()} con el tacho de ${selectedBin.label.toLowerCase()} contamina el flujo de reciclaje.`,
    waste.educationalReason,
  ]
    .join(" ")
    .trim();

  return {
    itemType,
    binType,
    title: "Tacho incorrecto",
    residuo: waste.label,
    tachoElegido: selectedBin.label,
    tachoCorrecto: waste.label,
    body,
  };
}
