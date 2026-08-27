import { useMemo, useState } from 'react';
import { parseImport, type ImportedCard } from '../lib/importExport';

interface Props {
  onImport: (cards: ImportedCard[]) => Promise<void>;
  onClose: () => void;
}

function ImportPanel({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseImport(text), [text]);

  return (
    <div className="panel form">
      <h3>Import cards.</h3>
      <p className="hint">
        One card per line: <code>front</code> then <code>back</code>, separated by a tab or <code>;</code>. An optional
        third column holds comma-separated tags. Write <code>\n</code> for a line break inside a field.
      </p>
      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Spain; Madrid; europe\nWhat is 7 × 8?; 56; maths'}
        spellCheck={false}
      />
      <div className="row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={parsed.length === 0 || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onImport(parsed);
              setText('');
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          Import {parsed.length} {parsed.length === 1 ? 'card' : 'cards'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ImportPanel;
