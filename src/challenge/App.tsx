import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from './components/Timer';
import { ChallengeDisplay } from './components/ChallengeDisplay';
import { ResultOverlay } from './components/ResultOverlay';
import { KeyLogger } from './components/KeyLogger';
import { VimEditor, VimEditorHandle } from './components/VimEditor';
import { getRandomChallenges, LoadedChallenge } from '@/challenges';
import { getConfig, unlockTwitter, recordAttempt } from '@/storage';
import { DEFAULT_CONFIG } from '@/storage/schema';

type SessionState = 'loading' | 'playing' | 'success' | 'failure';

export function App() {
  const [state, setState] = useState<SessionState>('loading');
  const [challenges, setChallenges] = useState<LoadedChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(new Set());
  const [timeLimitMs, setTimeLimitMs] = useState(60000);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [vimMode, setVimMode] = useState('normal');

  const editorRef = useRef<VimEditorHandle | null>(null);

  // Load config and get challenges
  useEffect(() => {
    async function init() {
      const config = await getConfig().catch(() => DEFAULT_CONFIG);

      const loadedChallenges = getRandomChallenges(config.challengeCount, {
        categories: config.enabledCategories,
        difficulty: config.difficulty,
      });

      setChallenges(loadedChallenges);
      setTimeLimitMs(config.timeLimitSeconds * 1000);
      setStartTime(Date.now());
      setState('playing');
    }

    init();
  }, []);

  // Global key listener for validation
  useEffect(() => {
    let timeoutId: number;

    const handleKey = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        // Inline validation to avoid stale closures
        if (!editorRef.current) return;

        const currentChallenge = challenges[currentIndex];
        if (!currentChallenge) return;
        if (state !== 'playing') return;

        const content = editorRef.current.getContent();
        const cursor = editorRef.current.getCursor();

        let passed = false;

        if (currentChallenge.type === 'motion') {
          if (currentChallenge.cursorEnd) {
            passed =
              cursor.line === currentChallenge.cursorEnd.line &&
              cursor.col === currentChallenge.cursorEnd.col;
          }
        } else {
          const expected = normalizeContent(currentChallenge.expectedContent || '');
          const actual = normalizeContent(content);
          passed = expected === actual;
        }

        if (passed) {
          setCompletedIndexes(prev => new Set([...prev, currentIndex]));

          if (currentIndex < challenges.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextChallenge = challenges[nextIndex];

            setCurrentIndex(nextIndex);
            editorRef.current?.setContent(nextChallenge.initialContent);
            editorRef.current?.setCursor(
              nextChallenge.cursorStart.line,
              nextChallenge.cursorStart.col
            );
            editorRef.current?.focus();
          } else {
            // All done!
            setState('success');
            const completionTime = Date.now() - startTime;
            setElapsedTime(completionTime);
            unlockTwitter();
            recordAttempt(true, completionTime);
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'CHALLENGE_COMPLETE' }, '*');
            }
          }
        }
      }, 100);
    };

    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      clearTimeout(timeoutId);
    };
  }, [challenges, currentIndex, state, startTime]);

  const handleEditorReady = useCallback((handle: VimEditorHandle) => {
    editorRef.current = handle;
    handle.focus();
  }, []);

  // Set cursor when challenges load
  useEffect(() => {
    if (challenges.length > 0 && editorRef.current) {
      const firstChallenge = challenges[0];
      editorRef.current.setCursor(firstChallenge.cursorStart.line, firstChallenge.cursorStart.col);
    }
  }, [challenges]);

  const handleTimeUp = useCallback(() => {
    setState('failure');
    recordAttempt(false, Date.now() - startTime);
  }, [startTime]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleClose = useCallback(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'CHALLENGE_COMPLETE' }, '*');
    } else {
      window.close();
    }
  }, []);

  if (state === 'loading' || challenges.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading challenges...
      </div>
    );
  }

  const currentChallenge = challenges[currentIndex];

  return (
    <div className="challenge-container">
      <header className="header">
        <h1>Neovim Challenge</h1>
        <Timer
          timeLimitMs={timeLimitMs}
          startTime={startTime}
          onTimeUp={handleTimeUp}
          isPaused={state !== 'playing'}
        />
      </header>

      {currentChallenge && (
        <ChallengeDisplay
          challenge={currentChallenge}
          currentIndex={currentIndex}
          totalChallenges={challenges.length}
          completedIndexes={completedIndexes}
        />
      )}

      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="terminal-title">nvim</span>
        </div>
        <div className="terminal-wrapper">
          <VimEditor
            initialContent={currentChallenge.initialContent}
            onReady={handleEditorReady}
            onModeChange={setVimMode}
          />
        </div>
      </div>

      <div className="status-bar">
        <span className={`mode-indicator ${vimMode}`}>
          {vimMode.toUpperCase()}
        </span>
        <span className="cursor-position">
          {editorRef.current
            ? `${editorRef.current.getCursor().line + 1}:${editorRef.current.getCursor().col + 1}`
            : '1:1'}
        </span>
      </div>

      <KeyLogger />

      {state === 'success' && (
        <ResultOverlay
          type="success"
          timeTaken={elapsedTime}
          challengesCompleted={challenges.length}
          onClose={handleClose}
          onRetry={handleRetry}
        />
      )}

      {state === 'failure' && (
        <ResultOverlay
          type="failure"
          timeTaken={timeLimitMs}
          challengesCompleted={completedIndexes.size}
          onClose={handleClose}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

function normalizeContent(content: string): string {
  return content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}
