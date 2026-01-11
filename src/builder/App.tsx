import { useState, useRef, useCallback } from 'react';
import { VimEditor, VimEditorHandle } from '@/challenge/components/VimEditor';
import type { ChallengeCategory } from '@/storage/schema';

interface ChallengeData {
  id: string;
  name: string;
  description: string;
  type: 'motion' | 'editing' | 'visual';
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  hints: string[];
  initial: string;
  expected: string;
}

const CATEGORIES: { value: ChallengeCategory; label: string }[] = [
  { value: 'basic-motion', label: 'Basic Motion' },
  { value: 'word-motion', label: 'Word Motion' },
  { value: 'line-motion', label: 'Line Motion' },
  { value: 'find-motion', label: 'Find Motion' },
  { value: 'delete', label: 'Delete' },
  { value: 'change', label: 'Change' },
  { value: 'yank-paste', label: 'Yank/Paste' },
  { value: 'visual-select', label: 'Visual Select' },
  { value: 'combined', label: 'Combined' },
];

const DEFAULT_CONTENT = `function example() {
  const message = "Hello, World!";
  console.log(message);
  return true;
}`;

export function BuilderApp() {
  const initialEditorRef = useRef<VimEditorHandle | null>(null);
  const expectedEditorRef = useRef<VimEditorHandle | null>(null);

  const [initialCursor, setInitialCursor] = useState({ line: 0, col: 0 });
  const [expectedCursor, setExpectedCursor] = useState({ line: 0, col: 0 });
  const [initialContent, setInitialContent] = useState(DEFAULT_CONTENT);
  const [expectedContent, setExpectedContent] = useState(DEFAULT_CONTENT);

  const [metadata, setMetadata] = useState<Omit<ChallengeData, 'initial' | 'expected'>>({
    id: '',
    name: '',
    description: '',
    type: 'motion',
    category: 'basic-motion',
    difficulty: 'easy',
    tags: [],
    hints: [],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [hintsInput, setHintsInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const captureInitialCursor = () => {
    if (initialEditorRef.current) {
      const cursor = initialEditorRef.current.getCursor();
      setInitialCursor(cursor);
      showToast(`Initial cursor set to line ${cursor.line}, col ${cursor.col}`);
    }
  };

  const captureExpectedCursor = () => {
    if (expectedEditorRef.current) {
      const cursor = expectedEditorRef.current.getCursor();
      setExpectedCursor(cursor);
      showToast(`Expected cursor set to line ${cursor.line}, col ${cursor.col}`);
    }
  };

  const insertCursorMarker = (content: string, cursor: { line: number; col: number }) => {
    const lines = content.split('\n');
    if (cursor.line < lines.length) {
      const line = lines[cursor.line];
      lines[cursor.line] = line.slice(0, cursor.col) + '|' + line.slice(cursor.col);
    }
    return lines.join('\n');
  };

  const generateJson = (): ChallengeData => {
    return {
      ...metadata,
      id: metadata.id || metadata.name.toLowerCase().replace(/\s+/g, '-'),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      hints: hintsInput.split('\n').map(h => h.trim()).filter(Boolean),
      initial: insertCursorMarker(initialContent, initialCursor),
      expected: insertCursorMarker(expectedContent, expectedCursor),
    };
  };

  const handleExport = () => {
    const json = generateJson();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${json.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Challenge exported!');
  };

  const handleCopyJson = () => {
    const json = generateJson();
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    showToast('JSON copied to clipboard!');
  };

  const formatJsonPreview = (json: ChallengeData) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <div className="builder-container">
      <header className="builder-header">
        <h1>Challenge Builder</h1>
        <div className="builder-header-actions">
          <button className="btn btn-secondary" onClick={handleCopyJson}>
            Copy JSON
          </button>
          <button className="btn btn-success" onClick={handleExport}>
            Export JSON
          </button>
        </div>
      </header>

      <div className="builder-main">
        {/* Initial State Editor */}
        <div className="editor-section">
          <h2>Initial State</h2>
          <div className="editor-wrapper">
            <VimEditor
              initialContent={DEFAULT_CONTENT}
              onReady={(handle) => { initialEditorRef.current = handle; }}
              onChange={setInitialContent}
            />
          </div>
          <div className="cursor-info">
            <span className="label">Cursor:</span>
            <span className="value">Line {initialCursor.line}, Col {initialCursor.col}</span>
            <button onClick={captureInitialCursor}>Capture Cursor</button>
          </div>
        </div>

        {/* Expected State Editor */}
        <div className="editor-section">
          <h2>Expected State (Solution)</h2>
          <div className="editor-wrapper">
            <VimEditor
              initialContent={DEFAULT_CONTENT}
              onReady={(handle) => { expectedEditorRef.current = handle; }}
              onChange={setExpectedContent}
            />
          </div>
          <div className="cursor-info">
            <span className="label">Cursor:</span>
            <span className="value">Line {expectedCursor.line}, Col {expectedCursor.col}</span>
            <button onClick={captureExpectedCursor}>Capture Cursor</button>
          </div>
        </div>
      </div>

      {/* Metadata Form */}
      <div className="metadata-section">
        <h2>Challenge Metadata</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Find Character"
              value={metadata.name}
              onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>ID (auto-generated if empty)</label>
            <input
              type="text"
              placeholder="find-character"
              value={metadata.id}
              onChange={(e) => setMetadata({ ...metadata, id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={metadata.type}
              onChange={(e) => setMetadata({ ...metadata, type: e.target.value as 'motion' | 'editing' | 'visual' })}
            >
              <option value="motion">Motion</option>
              <option value="editing">Editing</option>
              <option value="visual">Visual</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={metadata.category}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value as ChallengeCategory })}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select
              value={metadata.difficulty}
              onChange={(e) => setMetadata({ ...metadata, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="beginner, navigation, find"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <input
              type="text"
              placeholder="Jump to the opening parenthesis using 'f('"
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Hints (one per line)</label>
            <textarea
              placeholder="Use 'f(' to find the next '(' character&#10;Use ';' to repeat the last find motion"
              value={hintsInput}
              onChange={(e) => setHintsInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* JSON Preview */}
      <div className="preview-section">
        <h2>JSON Preview</h2>
        <pre className="json-preview">
          {formatJsonPreview(generateJson())}
        </pre>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
