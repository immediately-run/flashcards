import { useState } from 'react';

interface Props {
  onCreate: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}

function NewDeckForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name.trim(), description.trim());
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <h3>New deck.</h3>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spanish verbs" autoFocus required />
      </label>
      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </label>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
          Create deck
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default NewDeckForm;
