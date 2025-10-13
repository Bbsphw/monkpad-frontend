export type Slice = { name: string; value: number; color?: string };

export function compressSlicesWithMembers(
  input: Slice[],
  thresholdPct = 10,
  othersName = 'อื่นๆ'
): { display: Slice[]; othersMembers: string[] } {
  if (input.length <= 2) return { display: [...input], othersMembers: [] };

  const total = input.reduce((s, r) => s + r.value, 0);
  const withPct = input.map((s) => ({ ...s, pct: (s.value / total) * 100 }));
  const asc = [...withPct].sort((a, b) => a.pct - b.pct);

  // ถ้าคู่เล็กสุด 2 ตัวรวมกัน > threshold → ไม่ต้องมี "อื่นๆ"
  if (asc.length >= 2 && asc[0].pct + asc[1].pct > thresholdPct) {
    return { display: [...input].sort((a, b) => b.value - a.value), othersMembers: [] };
  }

  let sumPct = 0;
  let sumValue = 0;
  const picked = new Set<string>();

  for (let i = 0; i < asc.length; i++) {
    const next = asc[i];
    if (sumPct + next.pct > thresholdPct) break;
    sumPct += next.pct;
    sumValue += next.value;
    picked.add(next.name);
  }

  if (picked.size === 0) {
    return { display: [...input].sort((a, b) => b.value - a.value), othersMembers: [] };
  }

  const kept = input.filter((s) => !picked.has(s.name));
  const display = [...kept, { name: othersName, value: sumValue }].sort((a, b) => b.value - a.value);

  return { display, othersMembers: Array.from(picked) };
}
