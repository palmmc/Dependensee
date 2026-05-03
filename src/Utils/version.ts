function getStabilityScore(v: string): number {
  const low = v.toLowerCase();
  if (low.includes('rc')) return 1;
  if (low.includes('pre')) return 2;
  if (low.includes('beta')) return 3;
  if (low.includes('alpha')) return 4;
  if (low.includes('snapshot')) return 5;
  return 0;
}

export function getBestVersion(versions: string[], matchFirst: boolean, filter?: (v: string) => boolean): string {
  let filtered = filter ? versions.filter(filter) : [...versions];
  if (filtered.length === 0) return 'Not found';

  const stabilityScores = filtered.map(v => ({ v, score: getStabilityScore(v) }));
  const minScore = Math.min(...stabilityScores.map(s => s.score));
  filtered = stabilityScores.filter(s => s.score === minScore).map(s => s.v);

  filtered.sort((a, b) => {
    const aStartsNum = /^\d/.test(a);
    const bStartsNum = /^\d/.test(b);

    if (aStartsNum && !bStartsNum) return -1;
    if (!aStartsNum && bStartsNum) return 1;

    return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
  });

  return matchFirst ? filtered[filtered.length - 1] : filtered[0];
}


export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function isWithinRange(mc: string, min: string, max?: string): boolean {
  if (!mc || !/^\d+\.\d+(\.\d+)?$/.test(mc)) return true;

  if (compareVersions(mc, min) < 0) return false;
  if (max && compareVersions(mc, max) > 0) return false;
  return true;
}
