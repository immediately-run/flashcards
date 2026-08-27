import { Fragment, useMemo } from 'react';
import { parseMarkup, type Inline } from '../lib/markup';

interface Props {
  text: string;
  className?: string;
}

function renderInline(nodes: Inline[]): React.ReactNode[] {
  return nodes.map((n, i) => {
    if (n.kind === 'text') return <Fragment key={i}>{n.text}</Fragment>;
    if (n.kind === 'strong') return <strong key={i}>{renderInline(n.children)}</strong>;
    return <em key={i}>{renderInline(n.children)}</em>;
  });
}

/** Renders `**bold**`, `*em*` and line breaks as React elements — never raw HTML. */
function RichText({ text, className }: Props) {
  const lines = useMemo(() => parseMarkup(text), [text]);
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line)}
        </Fragment>
      ))}
    </span>
  );
}

export default RichText;
