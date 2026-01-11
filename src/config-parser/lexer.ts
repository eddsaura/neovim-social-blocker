import { Token, TokenType } from './types';

const MAP_KEYWORDS = [
  'map', 'nmap', 'vmap', 'imap', 'cmap', 'omap', 'xmap', 'smap',
  'noremap', 'nnoremap', 'vnoremap', 'inoremap', 'cnoremap',
  'onoremap', 'xnoremap', 'snoremap',
  'unmap', 'nunmap', 'vunmap', 'iunmap', 'cunmap',
];

const SETTING_KEYWORDS = ['let', 'set'];

export class Lexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      // Handle comments (lines starting with ")
      if (char === '"' && this.isLineStart()) {
        this.skipComment();
        continue;
      }

      // Handle newlines
      if (char === '\n') {
        tokens.push(this.makeToken('NEWLINE', '\n'));
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }

      // Handle whitespace
      if (/\s/.test(char)) {
        const ws = this.readWhile((c) => /\s/.test(c) && c !== '\n');
        tokens.push(this.makeToken('WHITESPACE', ws));
        continue;
      }

      // Handle special keys <...>
      if (char === '<') {
        const specialKey = this.readSpecialKey();
        if (specialKey) {
          tokens.push(this.makeToken('SPECIAL_KEY', specialKey));
          continue;
        }
      }

      // Read word
      const word = this.readWhile((c) => /\S/.test(c));
      const isKeyword = [...MAP_KEYWORDS, ...SETTING_KEYWORDS].includes(word);

      tokens.push(this.makeToken(isKeyword ? 'KEYWORD' : 'STRING', word));
    }

    tokens.push(this.makeToken('EOF', ''));
    return tokens;
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private isLineStart(): boolean {
    if (this.column === 1) return true;

    // Check if only whitespace before current position on this line
    let i = this.pos - 1;
    while (i >= 0 && this.input[i] !== '\n') {
      if (!/\s/.test(this.input[i])) return false;
      i--;
    }
    return true;
  }

  private skipComment(): void {
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.advance();
    }
  }

  private readWhile(predicate: (char: string) => boolean): string {
    let result = '';
    while (this.pos < this.input.length && predicate(this.input[this.pos])) {
      result += this.input[this.pos];
      this.advance();
    }
    return result;
  }

  private readSpecialKey(): string | null {
    const match = this.input.slice(this.pos).match(/^<[^>]+>/i);
    if (match) {
      const key = match[0];
      for (let i = 0; i < key.length; i++) {
        this.advance();
      }
      return key;
    }
    return null;
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    };
  }
}
