// Plain-text deck exchange. One card per line, columns separated by a tab or `;`:
//   front<TAB>back<TAB>tag1, tag2
// Line breaks inside a field are written as the two characters `\n`.

export interface ImportedCard {
  front: string;
  back: string;
  tags: string[];
}

const unescapeField = (s: string) => s.replace(/\\n/g, '\n').trim();
const escapeField = (s: string) => s.replace(/\r?\n/g, '\\n');

export function parseImport(text: string): ImportedCard[] {
  const out: ImportedCard[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.includes('\t') ? line.split('\t') : line.split(';');
    if (cols.length < 2) continue;
    const front = unescapeField(cols[0]);
    const back = unescapeField(cols[1]);
    if (!front || !back) continue;
    const tags = cols
      .slice(2)
      .join(',')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    out.push({ front, back, tags });
  }
  return out;
}

export function formatExport(cards: ImportedCard[]): string {
  return cards
    .map((c) => [escapeField(c.front), escapeField(c.back), c.tags.join(', ')].join('\t'))
    .join('\n');
}

export function parseTags(s: string): string[] {
  return Array.from(new Set(s.split(',').map((t) => t.trim()).filter(Boolean)));
}
