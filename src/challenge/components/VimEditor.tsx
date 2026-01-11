import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { vim, getCM } from '@replit/codemirror-vim';
import { javascript } from '@codemirror/lang-javascript';

// Tokyo Night theme colors
const tokyoNightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1a1b26',
    color: '#c0caf5',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
    caretColor: '#c0caf5',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#c0caf5',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: '#1a1b26',
    color: '#565f89',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: '#7aa2f7',
  },
  '.cm-activeLine': {
    backgroundColor: '#24283b',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#33467c !important',
  },
  '.cm-focused .cm-selectionBackground': {
    backgroundColor: '#33467c !important',
  },
  '.cm-fat-cursor': {
    backgroundColor: '#c0caf5 !important',
    color: '#1a1b26 !important',
  },
  '.cm-vim-panel': {
    backgroundColor: '#24283b',
    color: '#c0caf5',
    padding: '4px 8px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
  },
  '.cm-vim-panel input': {
    backgroundColor: '#1a1b26',
    color: '#c0caf5',
    border: '1px solid #3b4261',
    outline: 'none',
  },
  // Syntax highlighting
  '.cm-keyword': { color: '#bb9af7' },
  '.cm-string': { color: '#9ece6a' },
  '.cm-number': { color: '#ff9e64' },
  '.cm-comment': { color: '#565f89' },
  '.cm-variableName': { color: '#c0caf5' },
  '.cm-function': { color: '#7aa2f7' },
  '.cm-operator': { color: '#89ddff' },
  '.cm-punctuation': { color: '#c0caf5' },
}, { dark: true });

export interface VimEditorHandle {
  getContent: () => string;
  setContent: (content: string) => void;
  getCursor: () => { line: number; col: number };
  setCursor: (line: number, col: number) => void;
  getMode: () => string;
  focus: () => void;
}

interface VimEditorProps {
  initialContent: string;
  onReady?: (handle: VimEditorHandle) => void;
  onChange?: (content: string) => void;
  onModeChange?: (mode: string) => void;
  onKeyPress?: (key: string) => void;
}

export function VimEditor({
  initialContent,
  onReady,
  onChange,
  onModeChange,
  onKeyPress,
}: VimEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const modeRef = useRef<string>('normal');

  // Create editor handle
  const createHandle = useCallback((): VimEditorHandle => ({
    getContent: () => viewRef.current?.state.doc.toString() ?? '',
    setContent: (content: string) => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: content,
          },
        });
      }
    },
    getCursor: () => {
      if (!viewRef.current) return { line: 0, col: 0 };
      const pos = viewRef.current.state.selection.main.head;
      const line = viewRef.current.state.doc.lineAt(pos);
      return {
        line: line.number - 1, // 0-indexed
        col: pos - line.from,
      };
    },
    setCursor: (line: number, col: number) => {
      if (!viewRef.current) return;
      const doc = viewRef.current.state.doc;
      const lineInfo = doc.line(Math.min(line + 1, doc.lines)); // 1-indexed
      const pos = Math.min(lineInfo.from + col, lineInfo.to);
      viewRef.current.dispatch({
        selection: { anchor: pos, head: pos },
      });
    },
    getMode: () => modeRef.current,
    focus: () => viewRef.current?.focus(),
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Track mode changes
    const modeChangeHandler = (_cm: unknown, mode: { mode: string }) => {
      const newMode = mode?.mode ?? 'normal';
      modeRef.current = newMode;
      onModeChange?.(newMode);
    };

    // Create extensions
    const extensions = [
      vim(),
      tokyoNightTheme,
      javascript(),
      keymap.of(defaultKeymap),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange?.(update.state.doc.toString());
        }
      }),
      // Capture key presses for logging
      EditorView.domEventHandlers({
        keydown: (event) => {
          if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) {
            onKeyPress?.(event.key);
          }
          return false; // Let vim handle it
        },
      }),
    ];

    const state = EditorState.create({
      doc: initialContent,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Set up vim mode change listener
    const cm = getCM(view);
    if (cm) {
      cm.on('vim-mode-change', modeChangeHandler);
    }

    // Focus and notify ready
    view.focus();
    onReady?.(createHandle());

    return () => {
      if (cm) {
        cm.off('vim-mode-change', modeChangeHandler);
      }
      view.destroy();
    };
  }, []); // Only run once on mount

  return (
    <div
      ref={containerRef}
      className="vim-editor-container"
      style={{ height: '100%', overflow: 'hidden' }}
    />
  );
}
