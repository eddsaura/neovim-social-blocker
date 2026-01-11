import { useRef, useEffect, useState } from 'react';

interface KeyLoggerProps {
  hideDelay?: number;
}

export function KeyLogger({ hideDelay = 2000 }: KeyLoggerProps) {
  const [keys, setKeys] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      const key = e.key;

      setKeys(prev => [...prev.slice(-14), key]);
      setVisible(true);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setKeys([]);
      }, hideDelay);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      clearTimeout(timeoutRef.current);
    };
  }, [hideDelay]);

  if (!visible || keys.length === 0) return null;

  return (
    <div className="key-logger">
      <span className="key-logger-label">Keys:</span>
      <div className="key-logger-keys">
        {keys.map((key, i) => (
          <kbd key={i} className="key-logger-key">{formatKey(key)}</kbd>
        ))}
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  // Make special keys more readable
  const keyMap: Record<string, string> = {
    ' ': '␣',
    'Escape': 'Esc',
    'Enter': '↵',
    'Backspace': '⌫',
    'Tab': '⇥',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    '<Esc>': 'Esc',
    '<CR>': '↵',
    '<BS>': '⌫',
  };
  return keyMap[key] ?? key;
}
