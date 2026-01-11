import { Lexer } from './lexer';
import { Token, ParsedKeymap, ParseResult, ParseError } from './types';

export class ConfigParser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private leader: string = '\\';
  private errors: ParseError[] = [];

  parse(input: string): ParseResult {
    const lexer = new Lexer(input);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.errors = [];

    const keymaps: ParsedKeymap[] = [];

    while (!this.isAtEnd()) {
      const token = this.current();

      if (token.type === 'KEYWORD') {
        try {
          if (token.value === 'let') {
            this.parseLetStatement();
          } else if (this.isMapKeyword(token.value)) {
            const keymap = this.parseMapCommand();
            if (keymap) {
              keymaps.push(keymap);
            }
          } else {
            this.advance();
          }
        } catch (error) {
          this.errors.push({
            line: token.line,
            column: token.column,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          this.skipToNextLine();
        }
      } else {
        this.advance();
      }
    }

    return {
      keymaps,
      leader: this.leader,
      errors: this.errors,
    };
  }

  private isMapKeyword(value: string): boolean {
    return [
      'map', 'nmap', 'vmap', 'imap', 'cmap', 'omap', 'xmap', 'smap',
      'noremap', 'nnoremap', 'vnoremap', 'inoremap', 'cnoremap',
      'onoremap', 'xnoremap', 'snoremap',
    ].includes(value);
  }

  private parseLetStatement(): void {
    this.advance(); // consume 'let'
    this.skipWhitespace();

    const varToken = this.current();
    if (varToken.type !== 'STRING') return;

    // Check for mapleader
    if (varToken.value === 'mapleader' || varToken.value === 'g:mapleader') {
      this.advance();
      this.skipWhitespace();

      // Expect '='
      if (this.current().value !== '=') return;
      this.advance();
      this.skipWhitespace();

      // Get leader value
      const valueToken = this.current();
      if (valueToken.type === 'STRING') {
        // Remove quotes
        let leader = valueToken.value;
        if ((leader.startsWith('"') && leader.endsWith('"')) ||
            (leader.startsWith("'") && leader.endsWith("'"))) {
          leader = leader.slice(1, -1);
        }
        this.leader = leader;
      }
    }

    this.skipToNextLine();
  }

  private parseMapCommand(): ParsedKeymap | null {
    const keyword = this.current().value;
    const line = this.current().line;
    this.advance();

    const mode = this.extractMode(keyword);
    const isRecursive = !keyword.includes('noremap');
    let silent = false;

    this.skipWhitespace();

    // Check for <silent>
    if (this.current().type === 'SPECIAL_KEY' &&
        this.current().value.toLowerCase() === '<silent>') {
      silent = true;
      this.advance();
      this.skipWhitespace();
    }

    // Read LHS (key sequence)
    let lhs = '';
    while (!this.isAtEnd() &&
           this.current().type !== 'WHITESPACE' &&
           this.current().type !== 'NEWLINE') {
      lhs += this.normalizeKey(this.current().value);
      this.advance();
    }

    if (!lhs) return null;

    this.skipWhitespace();

    // Read RHS (action)
    let rhs = '';
    while (!this.isAtEnd() && this.current().type !== 'NEWLINE') {
      if (this.current().type === 'SPECIAL_KEY') {
        rhs += this.normalizeKey(this.current().value);
      } else if (this.current().type !== 'WHITESPACE' || rhs.length > 0) {
        rhs += this.current().value;
      }
      this.advance();
    }

    // Replace <leader> with actual leader key
    lhs = lhs.replace(/<leader>/gi, this.leader);
    rhs = rhs.replace(/<leader>/gi, this.leader);

    return {
      mode,
      lhs,
      rhs: rhs.trim(),
      isRecursive,
      silent,
      line,
    };
  }

  private extractMode(keyword: string): ParsedKeymap['mode'] {
    const prefix = keyword.replace(/n?o?remap$/, '').replace(/map$/, '');

    switch (prefix) {
      case 'n':
        return 'normal';
      case 'i':
        return 'insert';
      case 'v':
        return 'visual';
      case 'x':
        return 'visual';
      case 'c':
        return 'command';
      case 'o':
        return 'operator-pending';
      case 's':
        return 'visual';
      default:
        return 'all';
    }
  }

  private normalizeKey(key: string): string {
    return key
      .replace(/<CR>/gi, '<CR>')
      .replace(/<Enter>/gi, '<CR>')
      .replace(/<Return>/gi, '<CR>')
      .replace(/<Esc>/gi, '<Esc>')
      .replace(/<Escape>/gi, '<Esc>')
      .replace(/<BS>/gi, '<BS>')
      .replace(/<Backspace>/gi, '<BS>')
      .replace(/<Tab>/gi, '<Tab>')
      .replace(/<Space>/gi, ' ')
      .replace(/<Bar>/gi, '|')
      .replace(/<Bslash>/gi, '\\')
      .replace(/<lt>/gi, '<')
      .replace(/<C-(\w)>/gi, (_, char) => '<C-' + char.toLowerCase() + '>');
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', line: 0, column: 0 };
  }

  private advance(): void {
    if (!this.isAtEnd()) {
      this.pos++;
    }
  }

  private isAtEnd(): boolean {
    return this.current().type === 'EOF';
  }

  private skipWhitespace(): void {
    while (this.current().type === 'WHITESPACE') {
      this.advance();
    }
  }

  private skipToNextLine(): void {
    while (!this.isAtEnd() && this.current().type !== 'NEWLINE') {
      this.advance();
    }
    if (this.current().type === 'NEWLINE') {
      this.advance();
    }
  }
}

// Convert parsed keymaps to KeymapDefinition format used by storage
export function toKeymapDefinitions(result: ParseResult) {
  return result.keymaps.map((km) => ({
    mode: km.mode,
    lhs: km.lhs,
    rhs: km.rhs,
    isRecursive: km.isRecursive,
  }));
}
