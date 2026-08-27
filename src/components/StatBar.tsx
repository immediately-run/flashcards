import type { DeckStats } from '../lib/session';

interface Props {
  stats: DeckStats;
}

function StatBar({ stats }: Props) {
  const items: Array<[string, number]> = [
    ['total', stats.total],
    ['due today', stats.dueToday],
    ['learned', stats.learned],
    ['new', stats.fresh],
  ];
  return (
    <div className="stats">
      {items.map(([label, n]) => (
        <div key={label} className="stat">
          <span className="n">{n}</span>
          <span className="l mono">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default StatBar;
