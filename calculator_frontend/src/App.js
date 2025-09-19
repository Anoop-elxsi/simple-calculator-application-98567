import React, { useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional themed Calculator App
 * - Centered calculator card
 * - Display on top
 * - Grid of buttons for digits and operations
 * - History panel on the side on wide screens, below on small screens
 */

// Utility to safely evaluate simple arithmetic expressions
// Supports +, -, *, /, %, decimal numbers, and unary minus.
function safeEvaluate(expr) {
  // Normalize expression (replace unicode division/multiplication if any)
  const normalized = String(expr)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();

  // Guard: only allow digits, operators, decimal point, parentheses, and spaces
  if (!/^[\d+\-*/().% \s]*$/.test(normalized)) {
    throw new Error('Invalid characters in expression');
  }

  // Disallow consecutive operators except minus which can be unary
  // We'll rely on try/catch for syntax errors during evaluation.

  // Evaluate using Function to avoid access to scope
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${normalized});`);
  const result = fn();
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('Computation error');
  }
  return result;
}

// PUBLIC_INTERFACE
export default function App() {
  /** Theme is fixed per Ocean Professional light surface. Could be extended if needed */
  const [expression, setExpression] = useState('0');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState([]);

  const buttons = useMemo(
    () => [
      { label: 'C', type: 'action', role: 'clear' },
      { label: '±', type: 'action', role: 'negate' },
      { label: '%', type: 'op', value: '%' },
      { label: '÷', type: 'op', value: '÷' },

      { label: '7', type: 'num', value: '7' },
      { label: '8', type: 'num', value: '8' },
      { label: '9', type: 'num', value: '9' },
      { label: '×', type: 'op', value: '×' },

      { label: '4', type: 'num', value: '4' },
      { label: '5', type: 'num', value: '5' },
      { label: '6', type: 'num', value: '6' },
      { label: '−', type: 'op', value: '−' },

      { label: '1', type: 'num', value: '1' },
      { label: '2', type: 'num', value: '2' },
      { label: '3', type: 'num', value: '3' },
      { label: '+', type: 'op', value: '+' },

      { label: '0', type: 'num', value: '0', wide: true },
      { label: '.', type: 'num', value: '.' },
      { label: '=', type: 'equals', role: 'equals' }
    ],
    []
  );

  // Helpers
  const isOperator = (c) => ['+', '−', '×', '÷', '*', '/', '-', '%'].includes(c);

  const toEvalString = (expr) =>
    expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

  // PUBLIC_INTERFACE
  function handleInput(key) {
    setExpression((prev) => {
      if (prev === 'Error') return key; // reset on error

      // Prevent multiple leading zeros
      if (key === '0' && (prev === '0' || /(?:^|[+\-×÷%])0$/.test(prev))) {
        return prev;
      }

      // If prev is 0 and entering a number or dot, replace 0
      if (prev === '0') {
        if (/[0-9.]/.test(key)) {
          return key === '.' ? '0.' : key;
        }
        if (isOperator(key)) {
          return prev + key;
        }
      }

      // Avoid duplicate operators (replace last operator with new one)
      if (isOperator(key)) {
        if (isOperator(prev.slice(-1))) {
          return prev.slice(0, -1) + key;
        }
      }

      // Avoid multiple dots in the current number chunk
      if (key === '.') {
        const parts = prev.split(/([+\-×÷%])/);
        const last = parts[parts.length - 1] || '';
        if (last.includes('.')) return prev;
      }

      return prev + key;
    });
  }

  // PUBLIC_INTERFACE
  function handleClear() {
    setExpression('0');
    setResult('0');
  }

  // PUBLIC_INTERFACE
  function handleNegate() {
    setExpression((prev) => {
      if (prev === '0' || prev === 'Error') return prev;

      // Find the last number segment
      const parts = prev.split(/([+\-×÷%])/);
      let last = parts[parts.length - 1];

      // If last is operator, target the number before it
      let idx = parts.length - 1;
      if (isOperator(last)) {
        idx = parts.length - 2;
        last = parts[idx];
      }

      if (last == null || last === '') return prev;

      // Toggle the sign of the last number
      const number = parseFloat(last);
      if (Number.isNaN(number)) return prev;

      const toggled = (-number).toString();
      parts[idx] = toggled;

      const next = parts.join('');
      return next;
    });
  }

  // PUBLIC_INTERFACE
  function handlePercent() {
    // Convert last number to percent (divide by 100)
    setExpression((prev) => {
      const parts = prev.split(/([+\-×÷%])/);
      let idx = parts.length - 1;
      let last = parts[idx];

      if (isOperator(last)) {
        idx = parts.length - 2;
        last = parts[idx];
      }

      if (!last) return prev;
      const number = parseFloat(last);
      if (Number.isNaN(number)) return prev;

      parts[idx] = (number / 100).toString();
      return parts.join('');
    });
  }

  // PUBLIC_INTERFACE
  function handleEquals() {
    try {
      const evalExpr = toEvalString(expression);
      // Replace % as modulus operator only when used between numbers.
      // If trailing %, first convert percent by dividing last number by 100
      if (/%$/.test(expression)) {
        handlePercent();
        return;
      }
      const value = safeEvaluate(evalExpr);
      const entry = { exp: expression, res: String(value) };
      setResult(String(value));
      setExpression(String(value));
      setHistory((h) => [entry, ...h].slice(0, 20));
    } catch (e) {
      setResult('Error');
      setExpression('Error');
    }
  }

  // Public click handler for buttons
  function onButtonClick(btn) {
    if (btn.role === 'clear') return handleClear();
    if (btn.role === 'negate') return handleNegate();
    if (btn.role === 'equals') return handleEquals();
    if (btn.value === '%') return handlePercent();

    if (btn.type === 'num' || btn.type === 'op') {
      handleInput(btn.value ?? btn.label);
    }
  }

  return (
    <div className="ocean-app">
      <main className="calculator-shell" aria-label="Calculator">
        <section className="calc-card" role="region" aria-label="Calculator Panel">
          <div className="display" aria-live="polite">
            <div className="expression" title={expression}>
              {expression}
            </div>
            <div className="result" title={result}>
              {result}
            </div>
          </div>

          <div className="grid">
            {buttons.map((b, i) => (
              <button
                key={`${b.label}-${i}`}
                className={[
                  'btn',
                  b.type === 'op' ? 'btn-op' : '',
                  b.type === 'equals' ? 'btn-eq' : '',
                  b.type === 'action' ? 'btn-action' : '',
                  b.wide ? 'btn-wide' : ''
                ].join(' ').trim()}
                onClick={() => onButtonClick(b)}
                aria-label={b.role ? `Action ${b.label}` : `Input ${b.label}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        <aside className="history-card" role="region" aria-label="History Panel">
          <div className="history-title">History</div>
          <div className="history-list">
            {history.length === 0 && (
              <div className="history-empty">No calculations yet</div>
            )}
            {history.map((h, idx) => (
              <button
                key={`hist-${idx}`}
                className="history-item"
                onClick={() => {
                  setExpression(h.res);
                  setResult(h.res);
                }}
                title="Click to reuse result"
              >
                <span className="hist-exp">{h.exp}</span>
                <span className="hist-res">= {h.res}</span>
              </button>
            ))}
          </div>
        </aside>
      </main>

      <footer className="footer-note" aria-hidden="true">
        Ocean Professional • Simple Calculator
      </footer>
    </div>
  );
}
