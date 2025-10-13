// app/reports/_components/color-utils.ts

// พาเลตสี “นิยมใช้และสวยงาม”
export const PALETTE = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#22C55E', // green-500
  '#E11D48', // rose-600
  '#0EA5E9', // sky-500
  '#A855F7', // purple-500
  '#84CC16', // lime-500
  '#14B8A6', // teal-500
];

export const DEFAULT_OTHERS_COLOR = '#9CA3AF'; // gray-400

// แฮชชื่อให้เป็น index สีแบบคงที่ (deterministic)
function hashToIndex(name: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
}

export function colorForName(name: string): string {
  return PALETTE[hashToIndex(name, PALETTE.length)];
}

export type Slice = { name: string; value: number; color?: string };

export function applyColors<T extends Slice>(
  slices: T[],
  opts?: { othersName?: string; othersColor?: string }
): (T & { color: string })[] {
  const othersName = opts?.othersName ?? 'อื่นๆ';
  const othersColor = opts?.othersColor ?? DEFAULT_OTHERS_COLOR;

  return slices.map((s) => ({
    ...s,
    color:
      s.color ??
      (s.name === othersName ? othersColor : colorForName(s.name)),
  }));
}
