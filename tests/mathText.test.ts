import { describe, expect, it } from "vitest";
import { mathBlock, mathHtml } from "../src/core/MathText";

/** What the rendered markup reads back as, which must match the authored string. */
function textOf(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

describe("math typesetting", () => {
  it("wraps an expression in a math span", () => {
    expect(mathHtml("a = b")).toMatch(/^<span class="math">.*<\/span>$/);
  });

  it("turns carets and underscores into real scripts", () => {
    expect(mathHtml("x^2")).toContain("<sup>2</sup>");
    expect(mathHtml("log_b(MN)")).toContain("<sub>b</sub>");
    expect(mathHtml("L_ext")).toContain('<sub><span class="mword">ext</span></sub>');
  });

  it("keeps bracketed scripts readable without printing the brackets", () => {
    const html = mathHtml("e^(−t/RC)");
    expect(html).toContain("<sup>");
    expect(html).toContain('<span class="mhide">(</span>');
    expect(textOf(html)).toBe("e(−t/RC)"); // brackets kept for copy/paste, hidden visually
  });

  it("drops brace grouping entirely", () => {
    const html = mathHtml("x^{n+1}");
    expect(html).toContain("<sup>");
    expect(textOf(html)).toBe("xn+1");
  });

  it("draws a vinculum over a bracketed radicand", () => {
    const html = mathHtml("√(d² − (r₁ − r₂)²)");
    expect(html).toContain('<span class="msqrt">√');
    expect(html).toContain('<span class="mrad">');
    expect(textOf(html)).toBe("√(d² − (r₁ − r₂)²)"); // text is unchanged
  });

  it("covers a bare radicand and accepts the ascii spelling", () => {
    expect(mathHtml("σ / √n")).toContain('<span class="mrad">n</span>');
    expect(textOf(mathHtml("sqrt(2)"))).toBe("√(2)");
  });

  it("spaces relations and binary operators without changing the text", () => {
    const html = mathHtml("P(Aᶜ)=1-P(A)");
    expect(html).toContain('<span class="mrel">=</span>');
    expect(html).toContain('<span class="mbin">−</span>');
    expect(textOf(html)).toBe("P(Aᶜ)=1−P(A)");
  });

  it("leaves a sign attached to its term", () => {
    const html = mathHtml("(−t/RC)");
    expect(html).not.toContain('<span class="mbin">−</span>');
    expect(mathHtml("a − b")).toContain('<span class="mbin">−</span>');
  });

  it("leaves hyphenated words alone", () => {
    expect(textOf(mathHtml("right-angled"))).toBe("right-angled");
    expect(mathHtml("right-angled")).not.toContain("mbin");
  });

  it("keeps words upright instead of setting them as variables", () => {
    const html = mathHtml("P(A) = favourable outcomes / possible outcomes");
    expect(html).toContain('<span class="mword">favourable</span>');
    expect(html).not.toContain('<span class="mword">P</span>'); // single letters stay variables
    expect(textOf(html)).toBe("P(A) = favourable outcomes / possible outcomes");
  });

  it("escapes markup characters", () => {
    const html = mathHtml('f″(x*) > 0 & "safe"');
    expect(html).toContain("&quot;");
    expect(html).toContain("&amp;");
    expect(html).toContain('<span class="mrel">&gt;</span>');
  });

  it("renders nested structure inside scripts and radicals", () => {
    const html = mathHtml("√(1 − h²)·û⊥");
    expect(html).toContain('<span class="mbin">·</span>');
    expect(textOf(html)).toBe("√(1 − h²)·û⊥");
  });

  it("builds a display block with an optional note", () => {
    const html = mathBlock("c = 2πr", "circumference");
    expect(html).toContain('<div class="eq">');
    expect(html).toContain('<span class="eq-note">circumference</span>');
    expect(mathBlock("c = 2πr")).not.toContain("eq-note");
  });

  it("keeps related equations on their own lines when given an array", () => {
    const html = mathBlock(["a = b", "c = d"]);
    expect(html.match(/eq-line/g)).toHaveLength(2);
  });
});
