/**
 * Thai-safe text splitting. Thai vowels / tone marks combine with the consonant before them,
 * so we split by grapheme cluster (Intl.Segmenter) instead of by code point.
 */
const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;

export const graphemes = (text: string): string[] => (seg ? [...seg.segment(text)].map((s) => s.segment) : [...text]);

/** wraps each grapheme of `el` in <span class="ch">; keeps words unbreakable. Returns the spans. */
export function splitChars(el: HTMLElement, className = 'ch'): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLSpanElement[] = [];
  text.split(/(\s+)/).forEach((word) => {
    if (!word) return;
    if (/^\s+$/.test(word)) { el.append(document.createTextNode(' ')); return; }
    const w = document.createElement('span');
    w.style.display = 'inline-block';
    w.style.whiteSpace = 'nowrap';
    w.setAttribute('aria-hidden', 'true');
    graphemes(word).forEach((g) => {
      const s = document.createElement('span');
      s.className = className;
      s.style.display = 'inline-block';
      s.textContent = g;
      w.append(s);
      out.push(s);
    });
    el.append(w);
  });
  return out;
}
