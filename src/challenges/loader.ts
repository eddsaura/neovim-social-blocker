import { ChallengeCategory } from '@/storage/schema';

export interface LoadedChallenge {
  id: string;
  name: string;
  description: string;
  type: 'motion' | 'editing' | 'visual';
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  initialContent: string;
  cursorStart: { line: number; col: number };
  expectedContent?: string;
  cursorEnd?: { line: number; col: number };
  hints: string[];
  tags?: string[];
}

interface ChallengeJson {
  id: string;
  name: string;
  description: string;
  type: 'motion' | 'editing' | 'visual';
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  initial: string;
  expected?: string;
  hints: string[];
  tags?: string[];
}

// Load all JSON challenge files
const challengeFiles = import.meta.glob<ChallengeJson>(
  './*.json',
  { eager: true, import: 'default' }
);

const CURSOR_MARKER = '|';

/**
 * Extract cursor position from string with | marker
 */
function parseContentWithCursor(str: string): {
  content: string;
  cursor: { line: number; col: number };
} {
  const lines = str.split('\n');
  let cursor = { line: 0, col: 0 };

  for (let i = 0; i < lines.length; i++) {
    const col = lines[i].indexOf(CURSOR_MARKER);
    if (col !== -1) {
      cursor = { line: i, col };
      lines[i] = lines[i].slice(0, col) + lines[i].slice(col + 1);
      break;
    }
  }

  return { content: lines.join('\n'), cursor };
}

// Parse and cache challenges
let allChallenges: LoadedChallenge[] | null = null;

function loadChallenges(): LoadedChallenge[] {
  const challenges: LoadedChallenge[] = [];

  for (const [path, json] of Object.entries(challengeFiles)) {
    try {
      const { content: initialContent, cursor: cursorStart } = parseContentWithCursor(json.initial);

      let expectedContent: string | undefined;
      let cursorEnd: { line: number; col: number } | undefined;

      if (json.expected) {
        const parsed = parseContentWithCursor(json.expected);
        expectedContent = parsed.content;
        cursorEnd = parsed.cursor;
      }

      challenges.push({
        id: json.id,
        name: json.name,
        description: json.description,
        type: json.type,
        category: json.category,
        difficulty: json.difficulty,
        initialContent,
        cursorStart,
        expectedContent,
        cursorEnd,
        hints: json.hints,
        tags: json.tags,
      });
    } catch (err) {
      console.error(`Failed to parse challenge: ${path}`, err);
    }
  }

  return challenges;
}

export function getAllChallenges(): LoadedChallenge[] {
  if (!allChallenges) {
    allChallenges = loadChallenges();
  }
  return allChallenges;
}

export function getChallengeById(id: string): LoadedChallenge | undefined {
  return getAllChallenges().find(c => c.id === id);
}

export function getChallengesByCategory(category: ChallengeCategory): LoadedChallenge[] {
  return getAllChallenges().filter(c => c.category === category);
}

export function getRandomChallenges(
  count: number,
  options?: {
    categories?: ChallengeCategory[];
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    tags?: string[];
  }
): LoadedChallenge[] {
  let pool = getAllChallenges();

  if (options?.categories?.length) {
    pool = pool.filter(c => options.categories!.includes(c.category));
  }

  if (options?.difficulty && options.difficulty !== 'mixed') {
    pool = pool.filter(c => c.difficulty === options.difficulty);
  }

  if (options?.tags?.length) {
    pool = pool.filter(c => c.tags?.some(t => options.tags!.includes(t)));
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
