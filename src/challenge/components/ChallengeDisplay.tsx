import { LoadedChallenge } from '@/challenges';

interface ChallengeDisplayProps {
  challenge: LoadedChallenge;
  currentIndex: number;
  totalChallenges: number;
  completedIndexes: Set<number>;
}

export function ChallengeDisplay({
  challenge,
  currentIndex,
  totalChallenges,
  completedIndexes,
}: ChallengeDisplayProps) {
  return (
    <div className="challenge-info">
      {/* Progress dots */}
      <div className="challenge-progress">
        {Array.from({ length: totalChallenges }, (_, i) => {
          let className = 'progress-dot';
          if (completedIndexes.has(i)) {
            className += ' completed';
          } else if (i === currentIndex) {
            className += ' current';
          }
          return <div key={i} className={className} />;
        })}
      </div>

      {/* Challenge name and description */}
      <div className="challenge-description">
        <strong>Challenge {currentIndex + 1}:</strong> {challenge.description}
      </div>

      {/* Difficulty badge */}
      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor:
              challenge.difficulty === 'easy'
                ? '#9ece6a'
                : challenge.difficulty === 'medium'
                  ? '#e0af68'
                  : '#f7768e',
            color: '#1a1b26',
          }}
        >
          {challenge.difficulty}
        </span>
        <span
          style={{
            marginLeft: '8px',
            fontSize: '12px',
            color: '#565f89',
          }}
        >
          {challenge.category}
        </span>
      </div>

      {/* Hint */}
      {challenge.hints && challenge.hints.length > 0 && (
        <div className="challenge-hint">
          <span className="hint-icon">💡</span>
          <span>{challenge.hints[0]}</span>
        </div>
      )}
    </div>
  );
}
