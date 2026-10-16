// Colores por carpeta, calcados del filtro de Obsidian.
const COLOR_NUM: Record<string, string> = {
  "00": "#d9e48c",
  "01": "#f4903a",
  "02": "#8fcbe0",
  "03": "#f09a9a",
  "04": "#8fe0cc",
  "05": "#8f94e8",
  "06": "#c58fe8",
  "07": "#7fd47f",
  "08": "#f0d08a",
  "09": "#a5e07f",
  "10": "#8fe0cc",
  "11": "#8fcbe0",
  "12": "#8f94e8",
  "13": "#f08fc6",
  "14": "#c58fe8",
  "99": "#ef8f8f",
};

export function colorCarpeta(c: string): string {
  const m = /^(\d\d) /.exec(c);
  if (m && COLOR_NUM[m[1]]) return COLOR_NUM[m[1]];
  if (c.includes("Plantillas")) return "#c6e07f";
  if (c.includes("Inbox")) return "#f0d08a";
  return "#8e95a3";
}
