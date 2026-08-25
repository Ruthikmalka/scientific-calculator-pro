/**
 * Math Engine for Scientific Calculator
 * Supports:
 * - Tokenization & Implicit multiplication (e.g., 2π -> 2 * π, 3(4) -> 3 * 4, 2sin(30) -> 2 * sin(30))
 * - Shunting-Yard Algorithm to convert Infix to RPN (Reverse Polish Notation)
 * - Evaluation with DEG / RAD mode for trigonometric functions
 * - High precision floating-point formatting
 */

class MathEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.ans = 0;
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  setAns(value) {
    this.ans = typeof value === 'number' && !isNaN(value) ? value : 0;
  }

  // Pre-process user friendly mathematical expressions into standardized tokens
  preprocess(expr) {
    if (!expr) return '';

    let s = expr.trim();
    // Replace visual symbols with standard tokens
    s = s.replace(/×/g, '*')
         .replace(/÷/g, '/')
         .replace(/−/g, '-')
         .replace(/π/g, 'pi')
         .replace(/√\(/g, 'sqrt(')
         .replace(/√([0-9a-zA-Z._]+)/g, 'sqrt($1)')
         .replace(/ⁿ√\(/g, 'nroot(')
         .replace(/Ans/g, this.ans.toString());

    // Handle absolute value pairs |x| -> abs(x)
    let absPattern = /\|([^|]+)\|/g;
    while (absPattern.test(s)) {
      s = s.replace(absPattern, 'abs($1)');
    }

    // Replace sin⁻¹, cos⁻¹, tan⁻¹
    s = s.replace(/sin⁻¹/g, 'asin')
         .replace(/cos⁻¹/g, 'acos')
         .replace(/tan⁻¹/g, 'atan');

    // Convert percentage x% -> (x/100)
    // s = s.replace(/([0-9a-zA-Z._\)]+)%/g, '($1/100)');

    return s;
  }

  // Tokenize the input string
  tokenize(expr) {
    const s = this.preprocess(expr);
    const tokens = [];
    let i = 0;

    const isDigit = (c) => /[0-9.]/.test(c);
    const isAlpha = (c) => /[a-zA-Z_]/.test(c);

    while (i < s.length) {
      const c = s[i];

      if (/\s/.test(c)) {
        i++;
        continue;
      }

      // Numbers
      if (isDigit(c)) {
        let numStr = '';
        while (i < s.length && isDigit(s[i])) {
          numStr += s[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Identifiers (functions, constants)
      if (isAlpha(c)) {
        let idStr = '';
        while (i < s.length && isAlpha(s[i])) {
          idStr += s[i];
          i++;
        }
        
        if (idStr === 'pi') {
          tokens.push({ type: 'NUMBER', value: Math.PI });
        } else if (idStr === 'e') {
          tokens.push({ type: 'NUMBER', value: Math.E });
        } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'nroot', 'abs', 'log', 'ln', 'fact'].includes(idStr)) {
          tokens.push({ type: 'FUNCTION', value: idStr });
        } else {
          throw new Error(`Unknown function or variable: ${idStr}`);
        }
        continue;
      }

      // Operators and Parentheses
      if ('+-*/%^!,()'.includes(c)) {
        // Detect unary minus or unary plus
        if (c === '-' || c === '+') {
          const prev = tokens[tokens.length - 1];
          const isUnary = !prev || prev.type === 'OPERATOR' || (prev.type === 'PAREN' && prev.value === '(') || prev.type === 'COMMA';
          if (isUnary) {
            tokens.push({ type: 'UNARY_OP', value: c === '-' ? 'neg' : 'pos' });
            i++;
            continue;
          }
        }

        if (c === '(' || c === ')') {
          tokens.push({ type: 'PAREN', value: c });
        } else if (c === ',') {
          tokens.push({ type: 'COMMA', value: ',' });
        } else if (c === '!') {
          tokens.push({ type: 'POSTFIX_OP', value: '!' });
        } else if (c === '%') {
          tokens.push({ type: 'POSTFIX_OP', value: '%' });
        } else {
          tokens.push({ type: 'OPERATOR', value: c });
        }
        i++;
        continue;
      }

      throw new Error(`Unexpected character: ${c}`);
    }

    // Insert implicit multiplication
    // Examples: NUMBER FUNCTION -> NUMBER * FUNCTION, NUMBER PAREN('(') -> NUMBER * '(', PAREN(')') NUMBER -> PAREN(')') * NUMBER, NUMBER NUMBER -> NUMBER * NUMBER
    const processedTokens = [];
    for (let j = 0; j < tokens.length; j++) {
      const curr = tokens[j];
      const prev = processedTokens[processedTokens.length - 1];

      if (prev) {
        const prevCanBeFollowedByImplicitMul = 
          prev.type === 'NUMBER' || 
          (prev.type === 'PAREN' && prev.value === ')') ||
          prev.type === 'POSTFIX_OP';

        const currCanStartImplicitMul = 
          curr.type === 'NUMBER' || 
          curr.type === 'FUNCTION' || 
          (curr.type === 'PAREN' && curr.value === '(');

        if (prevCanBeFollowedByImplicitMul && currCanStartImplicitMul) {
          processedTokens.push({ type: 'OPERATOR', value: '*' });
        }
      }

      processedTokens.push(curr);
    }

    return processedTokens;
  }

  // Convert Infix tokens to RPN using Shunting-Yard
  toRPN(tokens) {
    const output = [];
    const stack = [];

    const precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3,
      'neg': 4,
      'pos': 4,
      '!': 5,
      '%': 5
    };

    const rightAssociative = {
      '^': true,
      'neg': true,
      'pos': true
    };

    for (const token of tokens) {
      if (token.type === 'NUMBER') {
        output.push(token);
      } else if (token.type === 'FUNCTION') {
        stack.push(token);
      } else if (token.type === 'COMMA') {
        while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
          output.push(stack.pop());
        }
        if (stack.length === 0) {
          throw new Error('Misplaced comma or missing parenthesis');
        }
      } else if (token.type === 'OPERATOR' || token.type === 'UNARY_OP' || token.type === 'POSTFIX_OP') {
        const o1 = token.value;
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'PAREN' && top.value === '(') break;

          const o2 = top.value;
          const p1 = precedence[o1] || 0;
          const p2 = precedence[o2] || 0;

          if ((!rightAssociative[o1] && p1 <= p2) || (rightAssociative[o1] && p1 < p2)) {
            output.push(stack.pop());
          } else {
            break;
          }
        }
        stack.push(token);
      } else if (token.type === 'PAREN' && token.value === '(') {
        stack.push(token);
      } else if (token.type === 'PAREN' && token.value === ')') {
        while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
          output.push(stack.pop());
        }
        if (stack.length === 0) {
          throw new Error('Mismatched parentheses');
        }
        stack.pop(); // Pop '('

        if (stack.length > 0 && stack[stack.length - 1].type === 'FUNCTION') {
          output.push(stack.pop());
        }
      }
    }

    while (stack.length > 0) {
      const top = stack.pop();
      if (top.type === 'PAREN') {
        throw new Error('Mismatched parentheses');
      }
      output.push(top);
    }

    return output;
  }

  // Factorial utility
  factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // Limit for JavaScript double precision
    if (!Number.isInteger(n)) {
      // Gamma function approximation for non-integers could be added, or fallback to Euler Gamma
      return NaN;
    }
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  // Evaluate RPN
  evaluateRPN(rpn) {
    const stack = [];

    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    for (const token of rpn) {
      if (token.type === 'NUMBER') {
        stack.push(token.value);
      } else if (token.type === 'UNARY_OP') {
        if (stack.length < 1) throw new Error('Invalid expression');
        const a = stack.pop();
        stack.push(token.value === 'neg' ? -a : +a);
      } else if (token.type === 'POSTFIX_OP') {
        if (stack.length < 1) throw new Error('Invalid expression');
        const a = stack.pop();
        if (token.value === '!') {
          stack.push(this.factorial(a));
        } else if (token.value === '%') {
          stack.push(a / 100);
        }
      } else if (token.type === 'OPERATOR') {
        if (stack.length < 2) throw new Error('Invalid binary operator expression');
        const b = stack.pop();
        const a = stack.pop();
        switch (token.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': 
            if (b === 0) throw new Error('Cannot divide by zero');
            stack.push(a / b); 
            break;
          case '^': stack.push(Math.pow(a, b)); break;
          default: throw new Error(`Unknown operator: ${token.value}`);
        }
      } else if (token.type === 'FUNCTION') {
        const fn = token.value;
        if (fn === 'nroot') {
          if (stack.length < 2) throw new Error('nroot requires two arguments: nroot(n, x)');
          const x = stack.pop();
          const n = stack.pop();
          if (n === 0) throw new Error('Root degree cannot be zero');
          if (x < 0 && n % 2 === 0) throw new Error('Even root of negative number');
          stack.push(Math.pow(x, 1 / n));
        } else {
          if (stack.length < 1) throw new Error(`Function ${fn} requires an argument`);
          const a = stack.pop();
          switch (fn) {
            case 'sin':
              stack.push(Math.sin(this.angleMode === 'DEG' ? toRad(a) : a));
              break;
            case 'cos':
              stack.push(Math.cos(this.angleMode === 'DEG' ? toRad(a) : a));
              break;
            case 'tan':
              if (this.angleMode === 'DEG' && Math.abs(a % 180) === 90) {
                throw new Error('Undefined (tan of 90°)');
              }
              stack.push(Math.tan(this.angleMode === 'DEG' ? toRad(a) : a));
              break;
            case 'asin':
              if (a < -1 || a > 1) throw new Error('asin domain error');
              const resAsin = Math.asin(a);
              stack.push(this.angleMode === 'DEG' ? toDeg(resAsin) : resAsin);
              break;
            case 'acos':
              if (a < -1 || a > 1) throw new Error('acos domain error');
              const resAcos = Math.acos(a);
              stack.push(this.angleMode === 'DEG' ? toDeg(resAcos) : resAcos);
              break;
            case 'atan':
              const resAtan = Math.atan(a);
              stack.push(this.angleMode === 'DEG' ? toDeg(resAtan) : resAtan);
              break;
            case 'sqrt':
              if (a < 0) throw new Error('Square root of negative number');
              stack.push(Math.sqrt(a));
              break;
            case 'abs':
              stack.push(Math.abs(a));
              break;
            case 'log':
              if (a <= 0) throw new Error('Log domain error (must be > 0)');
              stack.push(Math.log10(a));
              break;
            case 'ln':
              if (a <= 0) throw new Error('Ln domain error (must be > 0)');
              stack.push(Math.log(a));
              break;
            default:
              throw new Error(`Unknown function: ${fn}`);
          }
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression format');
    }

    return stack[0];
  }

  // Format result to prevent floating point inaccuracies (e.g., 0.1 + 0.2 = 0.3)
  formatResult(val) {
    if (typeof val !== 'number' || isNaN(val)) return 'Error';
    if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

    // Fix precision floating point issues (e.g. 0.30000000000000004 -> 0.3)
    const precision = 12;
    let str = val.toPrecision(precision);

    // Remove trailing zeroes after decimal point
    if (str.includes('.')) {
      str = str.replace(/\.?0+$/, '');
    }

    // Convert e-notation if too long or scientific needed
    if (Math.abs(val) >= 1e14 || (Math.abs(val) < 1e-7 && val !== 0)) {
      return val.toExponential(8).replace(/\.?0+e/, 'e');
    }

    return str;
  }

  // Public evaluate method
  calculate(expr) {
    if (!expr || expr.trim() === '') return { success: true, result: '', numeric: null };
    try {
      const tokens = this.tokenize(expr);
      const rpn = this.toRPN(tokens);
      const numericVal = this.evaluateRPN(rpn);
      const formatted = this.formatResult(numericVal);
      return { success: true, result: formatted, numeric: numericVal };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Export for module or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
} else {
  window.MathEngine = MathEngine;
}
