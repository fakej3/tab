/**
 * A small recursive-descent arithmetic evaluator — deliberately not
 * `eval`/`Function`, since this runs on every keystroke of user input.
 * Supports + - * / % ^ (), decimals, and unary minus.
 */
export function evaluateExpression(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || !/[0-9]/.test(trimmed) || !/^[0-9+\-*/^%().\s]+$/.test(trimmed)) return null;
  // Require at least one operator — a bare number like "2026" shouldn't hijack search.
  if (!/[+\-*/^%]/.test(trimmed.replace(/^-/, ''))) return null;

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const result = parser.parseExpression();
    if (!parser.isAtEnd()) return null;
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function formatCalculatorResult(value: number): string {
  const rounded = Math.round(value * 1e10) / 1e10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

type Token = { type: 'num'; value: number } | { type: 'op'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (/\s/.test(ch)) {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i];
        i += 1;
      }
      tokens.push({ type: 'num', value: Number(num) });
    } else if ('+-*/^%()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
    } else {
      throw new Error(`Unexpected character: ${ch}`);
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  isAtEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos];
    if (!token) throw new Error('Unexpected end of expression');
    this.pos += 1;
    return token;
  }

  parseExpression(): number {
    let value = this.parseTerm();
    while (this.peek()?.type === 'op' && (this.peek()?.value === '+' || this.peek()?.value === '-')) {
      const op = this.consume().value;
      const rhs = this.parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.peek()?.type === 'op' && ['*', '/', '%'].includes(this.peek()?.value as string)) {
      const op = this.consume().value;
      const rhs = this.parseFactor();
      if (op === '*') value *= rhs;
      else if (op === '/') value /= rhs;
      else value %= rhs;
    }
    return value;
  }

  private parseFactor(): number {
    let value = this.parseUnary();
    while (this.peek()?.type === 'op' && this.peek()?.value === '^') {
      this.consume();
      const rhs = this.parseUnary();
      value = Math.pow(value, rhs);
    }
    return value;
  }

  private parseUnary(): number {
    if (this.peek()?.type === 'op' && this.peek()?.value === '-') {
      this.consume();
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.consume();
    if (token.type === 'num') return token.value;
    if (token.type === 'op' && token.value === '(') {
      const value = this.parseExpression();
      const close = this.consume();
      if (close.value !== ')') throw new Error('Expected )');
      return value;
    }
    throw new Error('Expected number or (');
  }
}
