export type PieceColorId =
  | "red"
  | "yellow"
  | "cyan"
  | "magenta"
  | "emerald"
  | "violet"
  | "blue"
  | "orange";

export interface ColorOption {
  id: PieceColorId;
  name: string;
  hex: string;
  chipClass: string;
  accentTextClass: string;
  dotBgClass: string;
  glowClass: string;
}

export const PIECE_COLORS: Record<PieceColorId, ColorOption> = {
  red: {
    id: "red",
    name: "Crimson Red",
    hex: "#ef4444",
    chipClass: "chip-red",
    accentTextClass: "text-red-400",
    dotBgClass: "bg-red-500",
    glowClass: "shadow-[0_0_12px_rgba(239,68,68,0.5)]",
  },
  yellow: {
    id: "yellow",
    name: "Amber Gold",
    hex: "#facc15",
    chipClass: "chip-yellow",
    accentTextClass: "text-yellow-400",
    dotBgClass: "bg-yellow-400",
    glowClass: "shadow-[0_0_12px_rgba(250,204,21,0.5)]",
  },
  cyan: {
    id: "cyan",
    name: "Neon Cyan",
    hex: "#22d3ee",
    chipClass: "chip-cyan",
    accentTextClass: "text-cyan-400",
    dotBgClass: "bg-cyan-400",
    glowClass: "shadow-[0_0_12px_rgba(34,211,238,0.5)]",
  },
  magenta: {
    id: "magenta",
    name: "Hot Magenta",
    hex: "#f472b6",
    chipClass: "chip-magenta",
    accentTextClass: "text-pink-400",
    dotBgClass: "bg-pink-400",
    glowClass: "shadow-[0_0_12px_rgba(244,114,182,0.5)]",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green",
    hex: "#34d399",
    chipClass: "chip-emerald",
    accentTextClass: "text-emerald-400",
    dotBgClass: "bg-emerald-400",
    glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.5)]",
  },
  violet: {
    id: "violet",
    name: "Royal Violet",
    hex: "#a78bfa",
    chipClass: "chip-violet",
    accentTextClass: "text-purple-400",
    dotBgClass: "bg-purple-400",
    glowClass: "shadow-[0_0_12px_rgba(167,139,250,0.5)]",
  },
  blue: {
    id: "blue",
    name: "Cobalt Blue",
    hex: "#60a5fa",
    chipClass: "chip-blue",
    accentTextClass: "text-blue-400",
    dotBgClass: "bg-blue-400",
    glowClass: "shadow-[0_0_12px_rgba(96,165,250,0.5)]",
  },
  orange: {
    id: "orange",
    name: "Solar Orange",
    hex: "#fb923c",
    chipClass: "chip-orange",
    accentTextClass: "text-orange-400",
    dotBgClass: "bg-orange-400",
    glowClass: "shadow-[0_0_12px_rgba(251,146,60,0.5)]",
  },
};

export const COLOR_LIST = Object.values(PIECE_COLORS);

export interface ColorPreset {
  id: string;
  name: string;
  player1: PieceColorId;
  player2: PieceColorId;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "classic", name: "Classic Lab", player1: "red", player2: "yellow" },
  { id: "cyberpunk", name: "Cyberpunk", player1: "cyan", player2: "magenta" },
  { id: "matrix", name: "Neon Matrix", player1: "emerald", player2: "violet" },
  { id: "solar", name: "Solar Eclipse", player1: "orange", player2: "blue" },
];

const P1_STORAGE_KEY = "connect4_p1_piece_color";
const P2_STORAGE_KEY = "connect4_p2_piece_color";

export const getStoredPieceColors = (): { player1: PieceColorId; player2: PieceColorId } => {
  if (typeof window === "undefined") {
    return { player1: "red", player2: "yellow" };
  }
  try {
    const p1 = localStorage.getItem(P1_STORAGE_KEY) as PieceColorId | null;
    const p2 = localStorage.getItem(P2_STORAGE_KEY) as PieceColorId | null;
    const validP1 = p1 && PIECE_COLORS[p1] ? p1 : "red";
    const validP2 = p2 && PIECE_COLORS[p2] ? p2 : "yellow";
    return { player1: validP1, player2: validP2 };
  } catch {
    return { player1: "red", player2: "yellow" };
  }
};

export const saveStoredPieceColors = (player1: PieceColorId, player2: PieceColorId): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(P1_STORAGE_KEY, player1);
    localStorage.setItem(P2_STORAGE_KEY, player2);
  } catch {
    // ignore
  }
};
