import { useState } from 'react';

interface Props {
  text: string;
  onClose: () => void;
}

function ExportPanel({ text, onClose }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNote('Copied to clipboard.');
    } catch {
      setNote('Clipboard unavailable here — select the text and copy it.');
    }
  };
  return (
    <div className="panel form">
      <h3>Export deck.</h3>
      <p className="hint">Tab-separated, one card per line. Paste it into another deck's import box to copy cards across.</p>
      <textarea rows={8} readOnly value={text} onFocus={(e) => e.currentTarget.select()} spellCheck={false} />
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => void copy()}>
          Copy
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        {note && <span className="hint">{note}</span>}
      </div>
    </div>
  );
}

export default ExportPanel;
