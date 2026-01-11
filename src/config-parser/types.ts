export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export type TokenType =
  | 'KEYWORD'
  | 'SPECIAL_KEY'
  | 'STRING'
  | 'COMMENT'
  | 'NEWLINE'
  | 'WHITESPACE'
  | 'EOF';

export interface ParsedKeymap {
  mode: 'normal' | 'insert' | 'visual' | 'command' | 'operator-pending' | 'all';
  lhs: string;
  rhs: string;
  isRecursive: boolean;
  silent: boolean;
  line: number;
}

export interface ParseResult {
  keymaps: ParsedKeymap[];
  leader: string;
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
}
