import { test, expect, Page } from '@playwright/test';

// WCAG AA body-text contrast. Code renders at about 14px, so the lower 3:1
// large-text allowance never applies. Paths are relative to baseURL.
const MIN_RATIO = 4.5;

// Asciidoctor posts, coloured by Rouge's inline styles (lib/rouge_monokai_contrast.rb).
const ROUGE_POSTS = [
  '/2026/04/28/materialized-tables-in-apache-flink/', // SQL, plus Rouge error tokens
  '/2025/04/25/its-time-we-talked-about-time-exploring-watermarks-and-more-in-flink-sql/', // numbers and timestamps
  '/2024/02/27/flink-sql-and-the-joy-of-jars/', // bash
  '/2026/02/19/ten-years-late-to-the-dbt-party-duckdb-edition/', // separately styled results blocks
];

// Markdown posts, coloured by Chroma classes and the --hl-* variables in redesign.css.
const CHROMA_POSTS = [
  '/2022/09/16/data-engineering-in-2022-exploring-lakefs-with-jupyter-and-pyspark/',
  '/2018/12/03/kafka-connect-cli-tricks/', // bash
  '/2018/12/15/docker-tips-and-tricks-with-kafka-connect-ksqldb-and-kafka/', // highlighted lines
];

type Rgba = { r: number; g: number; b: number; a: number };
type Failure = { ratio: number; fg: string; bg: string; text: string };
type Report = { tokens: number; colours: string[]; failures: Failure[] };

// Runs in the browser. Measures what the browser actually painted: the computed
// colour of each piece of code text, against the backgrounds stacked behind it.
function installMeasure() {
  const parse = (css: string): Rgba => {
    const m = css.match(/^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)$/);
    if (!m) throw new Error(`Unparseable colour: ${css}`);
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const over = (top: Rgba, under: Rgba): Rgba => {
    const a = top.a + under.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (t: number, u: number) => (t * top.a + u * under.a * (1 - top.a)) / a;
    return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a };
  };
  const luminance = ({ r, g, b }: Rgba) => {
    const [R, G, B] = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const ratio = (a: Rgba, b: Rgba) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  // Paints one pixel with the text and one beside it without, up through every
  // ancestor. An element's opacity fades its background and its contents together,
  // so both pixels pick up each background and each opacity on the way.
  const measureElement = (el: Element) => {
    const canvas = { r: 255, g: 255, b: 255, a: 1 };
    let text = parse(getComputedStyle(el).color);
    let beside: Rgba = { r: 0, g: 0, b: 0, a: 0 };
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const layer = parse(style.backgroundColor);
      const opacity = parseFloat(style.opacity);
      text = over(text, layer);
      beside = over(beside, layer);
      text = { ...text, a: text.a * opacity };
      beside = { ...beside, a: beside.a * opacity };
    }
    const fg = over(text, canvas);
    const bg = over(beside, canvas);
    const css = ({ r, g, b }: Rgba) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    return { ratio: ratio(fg, bg), fg: css(fg), bg: css(bg) };
  };
  const report = (samples: { el: Element; text: string }[], min: number) => {
    const measured = samples.map((s) => ({ ...measureElement(s.el), text: s.text }));
    const seen = new Set<string>();
    const failures = measured
      .filter((m) => m.ratio < min)
      .filter((m) => {
        const key = `${m.fg}|${m.bg}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((m) => ({ ...m, ratio: Math.round(m.ratio * 100) / 100, text: m.text.trim().slice(0, 30) }));
    return { tokens: measured.length, colours: [...new Set(measured.map((m) => m.fg))], failures };
  };
  (window as any).codeContrast = { report };
}

async function measurePage(page: Page): Promise<Report> {
  await page.evaluate(installMeasure);
  return page.evaluate((min) => {
    const samples: { el: Element; text: string }[] = [];
    document.querySelectorAll('pre').forEach((pre) => {
      const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (/\S/.test(node.textContent || '')) {
          samples.push({ el: node.parentElement!, text: node.textContent! });
        }
      }
    });
    return (window as any).codeContrast.report(samples, min);
  }, MIN_RATIO);
}

// Renders one span per `.chroma .xx` rule in the site's stylesheets inside a real
// code block, so token types a sampled post happens not to use are measured too.
async function measureChromaClasses(page: Page, highlightedLine: boolean): Promise<Report> {
  await page.evaluate(installMeasure);
  return page.evaluate(
    ({ min, highlightedLine }) => {
      const classes = new Set<string>();
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin sheet (fonts), not ours
        }
        for (const rule of Array.from(rules)) {
          const m = rule instanceof CSSStyleRule && rule.selectorText.match(/^\.chroma \.([a-z0-9]+)$/);
          if (m && (rule as CSSStyleRule).style.color) classes.add(m[1]);
        }
      }
      const pre = document.querySelector('pre.chroma')!;
      const host = pre.querySelector('code') || pre;
      const line = document.createElement('span');
      if (highlightedLine) line.className = 'hl';
      const samples = [...classes].map((cls) => {
        const el = document.createElement('span');
        el.className = cls;
        el.textContent = cls;
        line.appendChild(el);
        return { el: el as Element, text: cls };
      });
      host.appendChild(line);
      return (window as any).codeContrast.report(samples, min);
    },
    { min: MIN_RATIO, highlightedLine },
  );
}

const describeFailures = (r: Report) =>
  r.failures.map((f) => `${f.ratio}:1 ${f.fg} on ${f.bg} "${f.text}"`).join('\n');

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Code contrast, ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const post of ROUGE_POSTS) {
      test(`AsciiDoc tokens reach ${MIN_RATIO}:1 on ${post}`, async ({ page }) => {
        await page.goto(post);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        const report = await measurePage(page);
        expect(report.tokens).toBeGreaterThan(100);
        expect(report.colours.length).toBeGreaterThanOrEqual(5);
        expect(report.failures, describeFailures(report)).toEqual([]);
      });
    }

    for (const post of CHROMA_POSTS) {
      test(`Markdown tokens reach ${MIN_RATIO}:1 on ${post}`, async ({ page }) => {
        await page.goto(post);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        const report = await measurePage(page);
        expect(report.tokens).toBeGreaterThan(50);
        expect(report.colours.length).toBeGreaterThanOrEqual(4);
        expect(report.failures, describeFailures(report)).toEqual([]);
      });
    }

    for (const highlightedLine of [false, true]) {
      test(`every Markdown token type reaches ${MIN_RATIO}:1${highlightedLine ? ' on a highlighted line' : ''}`, async ({ page }) => {
        await page.goto(CHROMA_POSTS[0]);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        const report = await measureChromaClasses(page, highlightedLine);
        // Chroma's generated stylesheet has about 70 coloured token classes.
        expect(report.tokens).toBeGreaterThan(50);
        expect(report.failures, describeFailures(report)).toEqual([]);
      });
    }
  });
}

test.describe('Contrast measurement', () => {
  const measureFixture = async (page: Page, html: string): Promise<Report> => {
    await page.setContent(html);
    await page.evaluate(installMeasure);
    return page.evaluate(() => {
      const el = document.querySelector('#token')!;
      return (window as any).codeContrast.report([{ el, text: 'token' }], 100);
    });
  };

  test('fades text and background together through a translucent ancestor', async ({ page }) => {
    const report = await measureFixture(
      page,
      '<body style="background:#fff"><pre style="background:#000;color:#fff;opacity:.5"><span id="token">x</span></pre>',
    );
    // White text over the half-transparent black block, which paints as mid grey.
    expect(report.failures[0].ratio).toBeCloseTo(3.98, 1);
  });

  test('stacks a translucent token background over the block behind it', async ({ page }) => {
    const report = await measureFixture(
      page,
      '<body style="background:#fff"><pre style="background:#000"><span id="token" style="color:#fff;background:rgba(255,255,255,.5)">x</span></pre>',
    );
    expect(report.failures[0].ratio).toBeCloseTo(3.98, 1);
  });
});

test.describe('Monokai character', () => {
  test('blocks use the real Monokai background and its unchanged accent colours', async ({ page }) => {
    await page.goto(ROUGE_POSTS[1]);
    const block = page.locator('pre.rouge.highlight').first();
    await expect(block).toHaveCSS('background-color', 'rgb(39, 40, 34)'); // #272822

    const colours = await page.evaluate(() => {
      const seen = new Set<string>();
      document.querySelectorAll('pre.rouge code span').forEach((s) => seen.add(getComputedStyle(s).color));
      return [...seen];
    });
    expect(colours).toContain('rgb(174, 129, 255)'); // numbers, #ae81ff
    expect(colours).toContain('rgb(102, 217, 239)'); // keywords, #66d9ef
    expect(colours).toContain('rgb(230, 219, 116)'); // strings, #e6db74
  });
});
