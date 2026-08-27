import RichText from './RichText';

interface Props {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}

function FlipCard({ front, back, flipped, onFlip }: Props) {
  return (
    <button
      type="button"
      className={`flip ${flipped ? 'is-flipped' : ''}`}
      onClick={onFlip}
      aria-label={flipped ? 'Showing answer' : 'Show answer'}
    >
      <div className="flip-inner">
        <div className="face face-front">
          <span className="face-label mono">question</span>
          <RichText className="face-text" text={front} />
          <span className="face-hint">tap or press space to reveal</span>
        </div>
        <div className="face face-back">
          <span className="face-label mono">answer</span>
          <RichText className="face-text" text={back} />
        </div>
      </div>
    </button>
  );
}

export default FlipCard;
