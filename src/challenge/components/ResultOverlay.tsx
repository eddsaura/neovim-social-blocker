
interface ResultOverlayProps {
  type: 'success' | 'failure';
  timeTaken: number;
  challengesCompleted: number;
  onClose: () => void;
  onRetry: () => void;
}

export function ResultOverlay({
  type,
  timeTaken,
  challengesCompleted,
  onClose,
  onRetry,
}: ResultOverlayProps) {
  const isSuccess = type === 'success';
  const seconds = Math.round(timeTaken / 1000);

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-icon">{isSuccess ? '🎉' : '⏱️'}</div>

        <h2 className={`result-title ${type}`}>
          {isSuccess ? 'Challenge Complete!' : 'Time\'s Up!'}
        </h2>

        <p className="result-message">
          {isSuccess
            ? 'Blocked sites are now unlocked. Keep practicing those Vim skills!'
            : 'Don\'t give up! Practice makes perfect.'}
        </p>

        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-value">{seconds}s</div>
            <div className="stat-label">Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{challengesCompleted}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div>
          {isSuccess ? (
            <button className="result-button" onClick={onClose}>
              Continue
            </button>
          ) : (
            <>
              <button className="result-button" onClick={onRetry}>
                Try Again
              </button>
              <button className="result-button secondary" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
