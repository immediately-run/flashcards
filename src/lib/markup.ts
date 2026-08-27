// Tiny, safe inline markup: `**bold**`, `*em*` and line breaks. The parser
// produces a tree that RichText renders as React elements — user text never
// reaches innerHTML, so there is nothing to escape and nothing to inject.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] };

/** A paragraph is a list of lines; each line is a list of inline nodes. */
export type Markup = Inline[][];

function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) out.push({ kind: 'text', text: buf });
    buf = '';
  };
  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const j = s.indexOf('**', i + 2);
      if (j > i + 2) {
        flush();
        out.push({ kind: 'strong', children: parseInline(s.slice(i + 2, j)) });
        i = j + 2;
        continue;
      }
    }
    if (s[i] === '*') {
      const j = s.indexOf('*', i + 1);
      if (j > i + 1 && s[i + 1] !== ' ') {
        flush();
        out.push({ kind: 'em', children: parseInline(s.slice(i + 1, j)) });
        i = j + 1;
        continue;
      }
    }
    buf += s[i];
    i += 1;
  }
  flush();
  return out;
}

export function parseMarkup(src: string): Markup {
  return src.replace(/\r\n?/g, '\n').split('\n').map(parseInline);
}

/** Plain-text preview of markup (for list rows and exports). */
export function stripMarkup(src: string): string {
  return src.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1');
}
