export interface TagColorStyle {
  background: string;
  border: string;
  color: string;
}

export const TAG_COLOR_PALETTE: TagColorStyle[] = [
  { background: "#fecaca", border: "#dc2626", color: "#7f1d1d" }, // Do
  { background: "#fde68a", border: "#d97706", color: "#78350f" }, // Vang
  { background: "#bfdbfe", border: "#2563eb", color: "#1e3a8a" }, // Xanh duong
  { background: "#ddd6fe", border: "#7c3aed", color: "#581c87" }, // Tim
  { background: "#bbf7d0", border: "#16a34a", color: "#14532d" }, // Xanh la
  { background: "#fbcfe8", border: "#db2777", color: "#831843" }, // Hong
  { background: "#a5f3fc", border: "#0891b2", color: "#164e63" }, // Cyan
  { background: "#fdba74", border: "#ea580c", color: "#7c2d12" }, // Cam
  { background: "#c7d2fe", border: "#4f46e5", color: "#312e81" }, // Indigo
  { background: "#d1d5db", border: "#4b5563", color: "#111827" }, // Xam
  { background: "#d9f99d", border: "#65a30d", color: "#365314" }, // Lime
  { background: "#e9d5ff", border: "#a855f7", color: "#6b21a8" }, // Violet
];

export const getSequentialTagColorStyle = (index: number): TagColorStyle => {
  const normalizedIndex = Math.abs(index) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[normalizedIndex];
};
