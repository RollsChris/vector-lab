/**
 * Lightweight maths typesetting for the lesson panels.
 *
 * Lessons author equations as plain strings (`√(d² − (r₁−r₂)²)`, `log_b(MN)`, `e^(−t/RC)`).
 * Rendered as-is they read as clunky ASCII: carets and underscores stay literal, radicals
 * have no bar, and operators crowd their operands. `mathHtml` converts such a string into
 * markup that a stylesheet can lay out properly — real `<sup>`/`<sub>`, a drawn radical
 * vinculum, and spacing classes around relations and binary operators.
 *
 * Deliberately *not* a full formula language: it never reflows or reorders anything, and the
 * rendered text content still reads back as the original string (characters that become pure
 * decoration, such as the brackets after `√` or `^`, are hidden with CSS rather than dropped)
 * so equations stay copyable and testable.
 */

const REL = ["⇔", "⇒", "⟺", "⟹", "≈", "≠", "≤", "≥", "≡", "∝", "→", "↔", "=", "<", ">"];
const BIN = ["±", "∓", "×", "÷", "·", "⋅", "∪", "∩", "∈", "+", "−"];
/** Characters after which a `+`/`−` is a sign on the next term, not an operator between two. */
const UNARY_BEFORE = new Set(["", "(", "[", "{", ",", ";", "|", ...REL, ...BIN]);
const SUPERSCRIPTABLE = /^[\p{L}\p{N}′″'₀-₉]+/u;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Typeset a single expression. Returns HTML wrapped in a `.math` span. */
export function mathHtml(source: string): string {
  return `<span class="math">${render(source)}</span>`;
}

/**
 * A display equation: its own centred block, optionally with a caption underneath. Pass an
 * array to keep related equations on separate lines instead of letting them wrap mid-formula.
 */
export function mathBlock(source: string | readonly string[], note?: string): string {
  const lines = (Array.isArray(source) ? source : [source as string])
    .map((line) => `<span class="eq-line">${mathHtml(line)}</span>`)
    .join("");
  const caption = note ? `<span class="eq-note">${escapeHtml(note)}</span>` : "";
  return `<div class="eq">${lines}${caption}</div>`;
}

/** Elements whose text is treated as maths when a container is typeset. */
export const MATH_SELECTOR = ".formula-body, .eq-src, [data-math]";

/**
 * Typeset every maths element inside `root`, in place, leaving existing markup alone —
 * only text nodes are rewritten. Idempotent: elements are flagged once processed, so this is
 * safe to call from a mutation observer.
 */
export function typesetMath(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(MATH_SELECTOR).forEach((element) => {
    if (element.dataset.mathTypeset === "done") return;
    element.dataset.mathTypeset = "done";
    typesetTextNodes(element);
  });
}

function typesetTextNodes(element: HTMLElement): void {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (text.data.trim()) targets.push(text);
  }
  for (const text of targets) {
    const html = render(text.data);
    if (html === escapeHtml(text.data)) continue; // nothing to gain, keep the plain node
    const holder = doc.createElement("span");
    holder.className = "math";
    holder.innerHTML = html;
    text.replaceWith(holder);
  }
}

// ---- rendering ---------------------------------------------------------------

function render(source: string): string {
  let out = "";
  let plain = ""; // the un-marked-up text emitted so far, used for unary/binary decisions
  let i = 0;

  const emitText = (chunk: string): void => {
    out += escapeHtml(chunk);
    plain += chunk;
  };

  while (i < source.length) {
    const rest = source.slice(i);

    const radical = matchRadical(rest);
    if (radical) {
      out += radical.html;
      plain += "√";
      i += radical.length;
      continue;
    }

    const char = source[i];

    if (char === "^" || char === "_") {
      const script = matchScript(source, i);
      if (script) {
        out += script.html;
        plain += script.text;
        i = script.end;
        continue;
      }
    }

    // Runs of letters are words or function names, not variables: keep them upright in the
    // interface font rather than setting "possible outcomes" in italic-ish maths serif.
    const word = /^[A-Za-z]{3,}/.exec(rest);
    if (word) {
      out += `<span class="mword">${escapeHtml(word[0])}</span>`;
      plain += word[0];
      i += word[0].length;
      continue;
    }

    const relation = REL.find((token) => rest.startsWith(token));
    if (relation) {
      out += `<span class="mrel">${escapeHtml(relation)}</span>`;
      plain += relation;
      i += relation.length;
      continue;
    }

    const minus = matchAsciiMinus(source, i);
    if (minus) {
      out += `<span class="mbin">−</span>`;
      plain += "−";
      i += 1;
      continue;
    }

    const binary = BIN.find((token) => rest.startsWith(token));
    if (binary) {
      const previous = lastMeaningful(plain);
      const unary = (binary === "+" || binary === "−") && UNARY_BEFORE.has(previous);
      out += unary ? escapeHtml(binary) : `<span class="mbin">${escapeHtml(binary)}</span>`;
      plain += binary;
      i += binary.length;
      continue;
    }

    emitText(char);
    i += 1;
  }

  return out;
}

/** `√(…)`, `sqrt(…)` or `√n` — draws the vinculum over the radicand. */
function matchRadical(rest: string): { html: string; length: number } | undefined {
  const sign = rest.startsWith("√") ? "√" : /^sqrt(?=\s*[(\p{L}\p{N}])/u.test(rest) ? "sqrt" : undefined;
  if (!sign) return undefined;

  let cursor = sign.length;
  while (rest[cursor] === " ") cursor += 1;

  if (rest[cursor] === "(") {
    const close = matchingParen(rest, cursor);
    if (close < 0) return undefined;
    const inner = rest.slice(cursor + 1, close);
    return {
      html: radicalHtml(`<span class="mhide">(</span>${render(inner)}<span class="mhide">)</span>`),
      length: close + 1,
    };
  }

  const bare = SUPERSCRIPTABLE.exec(rest.slice(cursor));
  if (!bare) return undefined;
  return { html: radicalHtml(render(bare[0])), length: cursor + bare[0].length };
}

function radicalHtml(radicand: string): string {
  return `<span class="msqrt">√<span class="mrad">${radicand}</span></span>`;
}

/** `^2`, `_b`, `^(−t/RC)` or `^{n+1}` — the grouping brackets become decoration only. */
function matchScript(source: string, at: number): { html: string; text: string; end: number } | undefined {
  const tag = source[at] === "^" ? "sup" : "sub";
  const start = at + 1;
  const opener = source[start];

  if (opener === "(" || opener === "{") {
    const close = matchingParen(source, start);
    if (close < 0) return undefined;
    const inner = source.slice(start + 1, close);
    if (!inner.trim()) return undefined;
    const brackets = opener === "("
      ? [`<span class="mhide">(</span>`, `<span class="mhide">)</span>`]
      : ["", ""];
    const text = opener === "(" ? `(${inner})` : inner;
    return {
      html: `<${tag}>${brackets[0]}${render(inner)}${brackets[1]}</${tag}>`,
      text,
      end: close + 1,
    };
  }

  const run = SUPERSCRIPTABLE.exec(source.slice(start));
  if (!run) return undefined;
  return { html: `<${tag}>${render(run[0])}</${tag}>`, text: run[0], end: start + run[0].length };
}

/** An ASCII hyphen only reads as a minus sign next to a number or a closing bracket. */
function matchAsciiMinus(source: string, at: number): boolean {
  if (source[at] !== "-") return false;
  const before = source[at - 1] ?? "";
  const after = source[at + 1] ?? "";
  const numericLeft = /[\d)\]²³¹⁰⁴-⁹₀-₉]/.test(before);
  const numericRight = /[\d(]/.test(after);
  if (!numericLeft && !numericRight) return false;
  return /[\p{L}\p{N}(]/u.test(after);
}

function matchingParen(source: string, open: number): number {
  const closer = source[open] === "{" ? "}" : ")";
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === source[open]) depth += 1;
    else if (source[i] === closer) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function lastMeaningful(plain: string): string {
  const trimmed = plain.trimEnd();
  return trimmed.slice(-1);
}
