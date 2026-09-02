export type DiffKind = 'context' | 'del' | 'add';
export type DiffLine = { kind: DiffKind; text: string };

export function unifiedDiff(current: string[], proposed: string[]): DiffLine[] {
  const n = current.length;
  const m = proposed.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        current[i] === proposed[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (current[i] === proposed[j]) {
      out.push({ kind: 'context', text: current[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: 'del', text: current[i] });
      i += 1;
    } else {
      out.push({ kind: 'add', text: proposed[j] });
      j += 1;
    }
  }
  while (i < n) {
    out.push({ kind: 'del', text: current[i] });
    i += 1;
  }
  while (j < m) {
    out.push({ kind: 'add', text: proposed[j] });
    j += 1;
  }
  return out;
}

/** Side-by-side panes from a unified diff: current keeps dels, proposed keeps adds. */
export function splitDiff(diff: DiffLine[]): {
  current: DiffLine[];
  proposed: DiffLine[];
} {
  const current: DiffLine[] = [];
  const proposed: DiffLine[] = [];
  for (const line of diff) {
    if (line.kind === 'del') current.push(line);
    else if (line.kind === 'add') proposed.push(line);
    else {
      current.push(line);
      proposed.push(line);
    }
  }
  return { current, proposed };
}

