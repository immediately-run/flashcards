import ThemeSwitch from './ThemeSwitch';

interface Props {
  onHome: () => void;
  who: string;
}

function TopBar({ onHome, who }: Props) {
  return (
    <header className="topbar">
      <button type="button" className="logo" onClick={onHome} aria-label="Flashcards home">
        <span className="mark" />
        <span>Flashcards</span>
      </button>
      <div className="topbar-right">
        <span className="who mono" title="Signed in as">
          {who}
        </span>
        <ThemeSwitch />
      </div>
    </header>
  );
}

export default TopBar;
