# Pure Monochrome Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's Cloudflare-blog-derived visual language with one strict monochrome design system, collapsing every page to a single 640px column driven by shared tokens and two shared primitives.

**Architecture:** `src/styles/global.css` becomes the single source of truth — tokens, base element styles, and one `.prose` block for MDX bodies. A new `Page.astro` layout wraps Header/main/Footer for every page including the three MDX ones; a new `PostList.astro` renders post rows so the homepage and the post page's "More posts" share one idiom. Page files keep only genuinely page-specific scoped CSS, under ~80 lines across all of them combined.

**Tech Stack:** Astro 5.10.1, MDX, `@astrojs/cloudflare` (static output), Shiki (bundled with Astro), Geist Sans + Geist Mono from Google Fonts, yarn 1.22.

**Spec:** `docs/superpowers/specs/2026-08-21-pure-monochrome-redesign-design.md`

## Global Constraints

These apply to every task. Copied verbatim from the spec.

- **Colour is exactly seven neutral values.** `#ffffff`, `#fafafa`, `#eaeaea`, `#d4d4d4`, `#999999`, `#666666`, `#000000`. No other hex, no `rgb()`, no `hsl()`, no named colours.
- **Depth comes from 1px borders and whitespace.** No `box-shadow`, no `linear-gradient`, no `radial-gradient`, anywhere.
- **No transforms and no animations.** Transitions are limited to `color`, `background-color` and `border-color` at 150ms.
- **Vertical rhythm draws only from the spacing scale** (4, 8, 12, 16, 24, 32, 48, 64, 96). Grid column widths sized to their content are the one exception.
- **Headings** are `font-weight: 600`, `letter-spacing: -0.02em`, tightening to `-0.03em` at `--text-3xl`.
- **Focus** is `outline: 2px solid #000` with `outline-offset: 2px`. Never remove focus outlines.
- **Copy is preserved verbatim.** Rewriting a page means changing its presentation, never its words. Where a task rewrites `about.astro` or `consulting.astro`, every sentence from the file at `HEAD` must survive into the new markup.
- **Per-page scoped CSS budget:** under ~80 lines across all page files combined. A rule that does not fit belongs in a token or in `global.css`.

## Verification harness

The project has no test framework and this plan does not add one. Every task
closes with the same two-part gate, run from the repo root.

**Build gate:**

```bash
yarn build
```

Must exit 0 with no errors.

**System-conformance gate** — this is the automated guard for the governing
rule, and it is the reason the redesign can be checked rather than eyeballed:

```bash
# No out-of-system colour in any emitted stylesheet
grep -ohE '#[0-9a-fA-F]{6}\b' dist/_astro/*.css | tr 'A-F' 'a-f' | sort -u \
  | grep -vE '^#(ffffff|fafafa|eaeaea|d4d4d4|999999|666666|000000)$' \
  && echo 'FAIL: out-of-system colour' || echo 'OK: colour'

# No shadows or gradients
grep -oE 'box-shadow|linear-gradient|radial-gradient' dist/_astro/*.css \
  && echo 'FAIL: shadow or gradient' || echo 'OK: depth'
```

Both must print their `OK:` line. Three-digit hex (`#fff`) and `rgb()` slip
past the first grep, so the plan never writes them; if a task introduces one,
widen the pattern rather than allowing the exception.

Note: run the colour gate only after Task 1 has removed the old stylesheets.
Before that it will legitimately fail on the existing design.

---

### Task 1: Design system foundation

Rewrites the stylesheet, swaps the typeface, and makes Shiki monochrome. The
site will look half-migrated after this task — old page-scoped CSS still
overrides much of it — but it must build and every route must still respond.

**Files:**
- Modify: `src/styles/global.css` (full rewrite, 154 lines → ~230)
- Modify: `src/components/BaseHead.astro:26-28` (font preloads)
- Modify: `astro.config.mjs` (add `shikiConfig`)
- Delete: `public/fonts/atkinson-regular.woff`, `public/fonts/atkinson-bold.woff`

**Interfaces:**
- Consumes: nothing.
- Produces: every token named in Global Constraints, plus `--font-sans`,
  `--font-mono`, `--text-*`, `--space-1..9`, `--width`, `--gutter`,
  `--radius`. Produces the class `.prose` for MDX bodies and `.sr-only`.
  Every later task consumes these by name.

- [ ] **Step 1: Replace `src/styles/global.css` entirely**

```css
/* Tokens ------------------------------------------------------------- */

:root {
  /* Colour — the complete palette. Nothing outside these seven values. */
  --bg: #ffffff;
  --bg-subtle: #fafafa;
  --border: #eaeaea;
  --border-hi: #d4d4d4;
  --fg-muted: #999999;
  --fg-2: #666666;
  --fg: #000000;

  --font-sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;
  --text-3xl: 2.5rem;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  --width: 640px;
  --gutter: 24px;
  --radius: 6px;

  /* Shiki, theme: 'css-variables'. Weight and tone carry emphasis, not hue. */
  --astro-code-foreground: var(--fg);
  --astro-code-background: var(--bg-subtle);
  --astro-code-token-comment: var(--fg-muted);
  --astro-code-token-keyword: var(--fg);
  --astro-code-token-string: var(--fg-2);
  --astro-code-token-string-expression: var(--fg-2);
  --astro-code-token-function: var(--fg);
  --astro-code-token-constant: var(--fg-2);
  --astro-code-token-parameter: var(--fg-2);
  --astro-code-token-punctuation: var(--fg-muted);
  --astro-code-token-link: var(--fg-2);
}

/* Reset -------------------------------------------------------------- */

*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd,
ul,
ol {
  margin: 0;
}

/* Base --------------------------------------------------------------- */

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--fg);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
}

main {
  width: 100%;
  max-width: var(--width);
  margin: 0 auto;
  padding: var(--space-8) var(--gutter) var(--space-9);
}

h1,
h2,
h3,
h4 {
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--fg);
}

h1 {
  font-size: var(--text-3xl);
  letter-spacing: -0.03em;
}
h2 {
  font-size: var(--text-xl);
}
h3 {
  font-size: var(--text-lg);
}
h4 {
  font-size: var(--text-base);
}

a {
  color: var(--fg);
  text-decoration: none;
  transition: color 150ms ease, background-color 150ms ease,
    border-color 150ms ease;
}

:focus-visible {
  outline: 2px solid var(--fg);
  outline-offset: 2px;
}

::selection {
  background: var(--fg);
  color: var(--bg);
}

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: var(--space-7) 0;
}

time,
.tabular {
  font-variant-numeric: tabular-nums;
}

img {
  max-width: 100%;
  height: auto;
}

/* Shared idioms ------------------------------------------------------ */

/* The one two-column row shape: post lists, About roles. */
.row-list {
  display: grid;
  gap: 0;
}

.row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--space-5);
  padding: var(--space-3) 0;
  align-items: baseline;
}

.row-key {
  font-size: var(--text-sm);
  color: var(--fg-muted);
  font-variant-numeric: tabular-nums;
}

.row-value {
  font-size: var(--text-base);
}

.row a:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.lead {
  font-size: var(--text-lg);
  color: var(--fg-2);
  margin-top: var(--space-4);
}

.button {
  display: inline-block;
  background: var(--fg);
  color: var(--bg);
  font-size: var(--text-sm);
  font-weight: 500;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius);
  border: 1px solid var(--fg);
}

.button:hover {
  background: var(--bg);
  color: var(--fg);
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: 56px 1fr;
    gap: var(--space-4);
  }
}

/* Prose — MDX body content ------------------------------------------- */

.prose {
  font-size: var(--text-base);
  line-height: 1.7;
}

.prose p {
  margin-bottom: var(--space-5);
}

.prose h2 {
  margin-top: var(--space-7);
  margin-bottom: var(--space-4);
}

.prose h3 {
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
}

.prose a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose a:hover {
  color: var(--fg-2);
}

.prose ul,
.prose ol {
  padding-left: 20px;
  margin-bottom: var(--space-5);
}

.prose li {
  margin-bottom: var(--space-2);
}

.prose blockquote {
  border-left: 2px solid var(--border-hi);
  padding-left: var(--space-5);
  color: var(--fg-2);
}

.prose img {
  width: 100%;
  border-radius: var(--radius);
  margin: var(--space-6) 0;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  margin-bottom: var(--space-5);
}

.prose th {
  font-size: var(--text-xs);
  color: var(--fg-2);
  font-weight: 500;
  text-align: left;
}

.prose th,
.prose td {
  border-bottom: 1px solid var(--border);
  padding: var(--space-2) var(--space-3) var(--space-2) 0;
}

.prose :not(pre) > code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 5px;
}

.prose pre {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-4);
  overflow-x: auto;
  margin-bottom: var(--space-5);
  line-height: 1.6;
}

/* Shiki emits inline `style="color:var(--astro-code-token-*)"`, so weight and
   slant are applied by matching that attribute. */
.prose pre span[style*="token-comment"] {
  font-style: italic;
}

.prose pre span[style*="token-keyword"] {
  font-weight: 600;
}

/* Utility ------------------------------------------------------------ */

.sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: 0;
  border: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

- [ ] **Step 2: Swap the font links in `src/components/BaseHead.astro`**

Replace the two Atkinson `<link rel="preload">` lines (currently lines 26-28,
under the `<!-- Font preloads -->` comment) with:

```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap"
/>
```

- [ ] **Step 3: Add `shikiConfig` to `astro.config.mjs`**

Inside the `defineConfig({...})` object, alongside `site` and `integrations`:

```js
  markdown: {
    shikiConfig: {
      theme: "css-variables",
      wrap: false,
    },
  },
```

- [ ] **Step 4: Delete the Atkinson font files**

```bash
git rm public/fonts/atkinson-regular.woff public/fonts/atkinson-bold.woff
```

- [ ] **Step 5: Build and verify the foundation landed**

```bash
yarn build
```

Expected: exit 0.

```bash
grep -rq 'fonts.googleapis.com/css2?family=Geist' dist/index.html \
  && echo 'OK: Geist linked' || echo 'FAIL: Geist missing'
grep -rq 'atkinson' dist/ && echo 'FAIL: Atkinson still referenced' || echo 'OK: Atkinson gone'
grep -q -- '--astro-code-token-comment' dist/_astro/*.css \
  && echo 'OK: shiki tokens' || echo 'FAIL: shiki tokens missing'
```

All three must print `OK:`.

Do **not** run the colour gate yet — the old page CSS is still present and
will fail it legitimately. It comes online in Task 7.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/components/BaseHead.astro astro.config.mjs public/fonts
git commit -m "design: add monochrome token system, Geist, monochrome Shiki"
```

---

### Task 2: Page shell — `Page.astro`, Header, Footer

**Files:**
- Create: `src/layouts/Page.astro`
- Delete: `src/layouts/HomePage.astro` (imported by nothing)
- Modify: `src/components/Header.astro` (169 lines → ~45)
- Modify: `src/components/Footer.astro` (108 lines → ~40)
- Modify: `src/components/HeaderLink.astro` (active state becomes colour-only)

**Interfaces:**
- Consumes: all tokens and `.sr-only` from Task 1.
- Produces: `Page.astro` accepting `{ title: string; description: string;
  image?: string }` **or** the same fields inside an MDX `frontmatter` prop.
  Tasks 3, 4, 5, 6 and 8 all render inside it.

- [ ] **Step 1: Create `src/layouts/Page.astro`**

`press.mdx` declares `image` as an object, while `BaseHead` expects a string
URL — hence the `typeof` guard. Without it, Task 8 breaks the build.

```astro
---
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
	title: string;
	description: string;
	image?: string;
}

// Astro hands an MDX page its frontmatter as a single `frontmatter` prop,
// so the same layout can serve .astro pages and .mdx pages.
const props = (Astro.props as any).frontmatter ?? Astro.props;
const { title, description } = props;
const image = typeof props.image === 'string' ? props.image : undefined;
---

<!doctype html>
<html lang="en">
	<head>
		<BaseHead title={title} description={description} image={image} />
	</head>
	<body>
		<Header />
		<main>
			<slot />
		</main>
		<Footer />
	</body>
</html>
```

- [ ] **Step 2: Delete the dead layout**

```bash
git rm src/layouts/HomePage.astro
```

- [ ] **Step 3: Replace `src/components/Header.astro` entirely**

The two-row header collapses to one. Social icons move to the footer. There
is no `Blog` nav item: the homepage is the blog.

```astro
---
import HeaderLink from './HeaderLink.astro';
import { SITE_TITLE } from '../consts';
---

<header>
	<nav>
		<a href="/" class="site-name">{SITE_TITLE}</a>
		<div class="links">
			<HeaderLink href="/about">About</HeaderLink>
			<HeaderLink href="/consulting">Consulting</HeaderLink>
		</div>
	</nav>
</header>
<style>
	header {
		border-bottom: 1px solid var(--border);
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--space-8);
		max-width: var(--width);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}

	.site-name {
		font-size: var(--text-base);
		font-weight: 500;
	}

	.links {
		display: flex;
		gap: var(--space-5);
		font-size: var(--text-sm);
	}
</style>
```

- [ ] **Step 4: Replace `src/components/HeaderLink.astro`'s style block**

Keep the frontmatter exactly as it is — the active-path logic is correct and
still needed. Replace only the `<style>` block with:

```css
	a {
		color: var(--fg-2);
	}
	a:hover,
	a.active {
		color: var(--fg);
	}
```

- [ ] **Step 5: Replace `src/components/Footer.astro` entirely**

`press.mdx` was previously linked from nowhere; it gains an entry here.

```astro
---
const year = new Date().getFullYear();
---

<footer>
	<div class="inner">
		<div class="links">
			<a href="https://github.com/mertcanaltin" target="_blank" rel="noopener">GitHub</a>
			<a href="https://twitter.com/mecaltin" target="_blank" rel="noopener">Twitter</a>
			<a href="/rss.xml">RSS</a>
			<a href="/contact">Contact</a>
			<a href="/newsletter">Newsletter</a>
			<a href="/press">Press</a>
		</div>
		<p>&copy; {year} Mert Can Altin</p>
	</div>
</footer>
<style>
	footer {
		border-top: 1px solid var(--border);
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
		max-width: var(--width);
		margin: 0 auto;
		padding: var(--space-5) var(--gutter);
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.links {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.inner a {
		color: var(--fg-2);
	}

	.inner a:hover {
		color: var(--fg);
	}

	.inner p {
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	@media (max-width: 480px) {
		.inner {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
```

- [ ] **Step 6: Build and verify the shell**

```bash
yarn build
```

Expected: exit 0.

```bash
grep -q 'header-blog-label' dist/index.html && echo 'FAIL: old header remains' || echo 'OK: header replaced'
grep -q 'Getting Started' dist/index.html && echo 'FAIL: old footer remains' || echo 'OK: footer replaced'
grep -q '/press' dist/index.html && echo 'OK: press linked' || echo 'FAIL: press orphaned'
```

All three must print `OK:`.

- [ ] **Step 7: Commit**

```bash
git add src/layouts src/components
git commit -m "design: single-row header, one-line footer, shared Page layout"
```

---

### Task 3: `PostList` and the homepage

**Files:**
- Create: `src/components/PostList.astro`
- Modify: `src/components/FormattedDate.astro` (add `variant`)
- Modify: `src/pages/index.astro` (251 lines → ~35)
- Delete: `src/content/config.ts` (dead legacy config)

**Interfaces:**
- Consumes: `Page.astro` from Task 2; `.row`, `.row-key`, `.row-value`,
  `.lead` from Task 1.
- Produces: `PostList.astro` accepting
  `{ posts: CollectionEntry<'blog'>[]; groupByYear?: boolean }`. Task 5's
  "More posts" section consumes it with `groupByYear` omitted.
  `FormattedDate` accepting `{ date: Date; variant?: 'short' | 'long' }`,
  default `'long'`.

- [ ] **Step 1: Add the `variant` prop to `src/components/FormattedDate.astro`**

```astro
---
interface Props {
	date: Date;
	variant?: 'short' | 'long';
}

const { date, variant = 'long' } = Astro.props;

const options: Intl.DateTimeFormatOptions =
	variant === 'short'
		? { month: 'short', day: 'numeric' }
		: { year: 'numeric', month: 'short', day: 'numeric' };
---

<time datetime={date.toISOString()}>
	{date.toLocaleDateString('en-us', options)}
</time>
```

- [ ] **Step 2: Create `src/components/PostList.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import FormattedDate from './FormattedDate.astro';

interface Props {
	posts: CollectionEntry<'blog'>[];
	groupByYear?: boolean;
}

const { posts, groupByYear = false } = Astro.props;

const groups: { year: number | null; posts: CollectionEntry<'blog'>[] }[] =
	groupByYear
		? [...new Set(posts.map((p) => p.data.pubDate.getFullYear()))]
				.sort((a, b) => b - a)
				.map((year) => ({
					year,
					posts: posts.filter((p) => p.data.pubDate.getFullYear() === year),
				}))
		: [{ year: null, posts }];
---

<div class="row-list">
	{groups.map((group) => (
		<>
			{group.year !== null && <h2 class="year">{group.year}</h2>}
			{group.posts.map((post) => (
				<div class="row">
					<span class="row-key"><FormattedDate date={post.data.pubDate} variant="short" /></span>
					<span class="row-value">
						<a href={`/blog/${post.id}/`}>{post.data.title}</a>
					</span>
				</div>
			))}
		</>
	))}
</div>
<style>
	.year {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--fg-muted);
		margin-top: var(--space-7);
		margin-bottom: var(--space-2);
		letter-spacing: 0;
	}

	.year:first-child {
		margin-top: 0;
	}
</style>
```

- [ ] **Step 3: Replace `src/pages/index.astro` entirely**

Note what leaves: the `tagColors` map, `getTagColor`, `getTag`, the featured
block, the hero image, the two-column card grid, and 180 lines of `is:global`
CSS.

```astro
---
import Page from '../layouts/Page.astro';
import PostList from '../components/PostList.astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

const posts = (await getCollection('blog')).sort(
	(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
---

<Page title={SITE_TITLE} description={SITE_DESCRIPTION}>
	<h1>{SITE_TITLE}</h1>
	<p class="lead">
		Node.js core contributor and performance team member. Express.js member,
		OpenJS Foundation CPC member.
	</p>
	<div class="posts">
		<PostList posts={posts} groupByYear />
	</div>
</Page>

<style>
	.posts {
		margin-top: var(--space-8);
	}
</style>
```

- [ ] **Step 4: Delete the dead content config**

Astro 5 reads `src/content.config.ts`; `src/content/config.ts` is the Astro 4
leftover whose absent `tag` field is why `getTag()` returned `'coding'` for
every post. Tags are gone, so it goes too.

```bash
git rm src/content/config.ts
```

- [ ] **Step 5: Build and verify the homepage**

```bash
yarn build
```

Expected: exit 0.

```bash
grep -q 'cf-featured\|cf-card\|cf-tag' dist/index.html \
  && echo 'FAIL: old homepage markup remains' || echo 'OK: homepage rebuilt'
grep -c 'href="/blog/' dist/index.html
```

The first must print `OK:`. The second must print at least `10` — one link per
post; fewer means posts are being dropped.

```bash
grep -q '>2026<' dist/index.html && echo 'OK: year headings' || echo 'FAIL: no year grouping'
```

- [ ] **Step 6: Commit**

```bash
git add src/components/PostList.astro src/components/FormattedDate.astro src/pages/index.astro src/content
git commit -m "design: year-grouped post list on the homepage"
```

---

### Task 4: Fold `/blog` into the homepage

**Files:**
- Delete: `src/pages/blog/index.astro`
- Modify: `astro.config.mjs` (add `redirects`)
- Possibly create: `public/_redirects`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on. `/blog/<slug>/` URLs are untouched.

- [ ] **Step 1: Delete the duplicate listing page**

It is byte-for-byte the same page as the old `index.astro`.

```bash
git rm src/pages/blog/index.astro
```

- [ ] **Step 2: Add the redirect to `astro.config.mjs`**

Inside `defineConfig({...})`:

```js
  redirects: {
    "/blog": "/",
  },
```

- [ ] **Step 3: Build and inspect what the redirect actually emitted**

The project builds to static output, so Astro may emit a meta-refresh page
rather than a real 301. Find out rather than assume:

```bash
yarn build
cat dist/blog/index.html
ls dist/_redirects 2>/dev/null && cat dist/_redirects
```

- [ ] **Step 4: If no real 301 is produced, add one by hand**

If Step 3 showed only a meta-refresh page and no `dist/_redirects`, create
`public/_redirects` so Cloudflare serves a genuine 301:

```
/blog / 301
```

Then rebuild and confirm the file reached the output:

```bash
yarn build
cat dist/_redirects
```

Expected: the file contains `/blog / 301`.

If Step 3 already showed a real `dist/_redirects` entry for `/blog`, skip
this step and record that in the commit message.

- [ ] **Step 5: Verify post URLs survived**

```bash
ls dist/blog/ | head
test -d dist/blog/why-cursor-didnt-show-token-savings \
  && echo 'OK: post URLs intact' || echo 'FAIL: post URLs broken'
```

Must print `OK:`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "design: fold /blog into the homepage, redirect permanently"
```

---

### Task 5: Blog post layout

**Files:**
- Modify: `src/layouts/BlogPost.astro` (319 lines → ~90)

**Interfaces:**
- Consumes: `Page.astro` (Task 2), `PostList.astro` and `FormattedDate`
  (Task 3), `.prose` (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace `src/layouts/BlogPost.astro` entirely**

The tag badge, `tagColors`, `getTagColor` and the related-posts card grid all
leave. Hero images stay — this is the one place they appear.

```astro
---
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import Page from './Page.astro';
import FormattedDate from '../components/FormattedDate.astro';
import PostList from '../components/PostList.astro';

type Props = CollectionEntry<'blog'>['data'];

const { title, description, pubDate, updatedDate, heroImage } = Astro.props as any;

const allPosts = (await getCollection('blog')).sort(
	(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
const morePosts = allPosts.filter((p) => p.data.title !== title).slice(0, 3);
---

<Page title={title} description={description} image={heroImage}>
	<a href="/" class="back">&larr; Back</a>

	<article>
		<h1>{title}</h1>
		<p class="meta">
			<FormattedDate date={pubDate} />
			{updatedDate && (<>&middot; Updated <FormattedDate date={updatedDate} /></>)}
		</p>

		{heroImage && <img src={heroImage} alt="" class="hero" />}

		<div class="prose"><slot /></div>
	</article>

	{morePosts.length > 0 && (
		<section class="more">
			<h2>More posts</h2>
			<PostList posts={morePosts} />
		</section>
	)}
</Page>

<style>
	.back {
		display: inline-block;
		font-size: var(--text-sm);
		color: var(--fg-2);
		margin-bottom: var(--space-6);
	}

	.back:hover {
		color: var(--fg);
	}

	.meta {
		font-size: var(--text-sm);
		color: var(--fg-muted);
		margin-top: var(--space-3);
	}

	.hero {
		width: 100%;
		border-radius: var(--radius);
		margin: var(--space-6) 0;
	}

	.more {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--border);
	}

	.more h2 {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--fg-muted);
		letter-spacing: 0;
		margin-bottom: var(--space-2);
	}
</style>
```

- [ ] **Step 2: Build and verify a post page**

```bash
yarn build
```

Expected: exit 0.

```bash
P=dist/blog/why-cursor-didnt-show-token-savings/index.html
grep -q 'cf-post-tag\|cf-related-card' $P && echo 'FAIL: old post markup remains' || echo 'OK: post rebuilt'
grep -q 'class="prose"' $P && echo 'OK: prose applied' || echo 'FAIL: prose missing'
grep -q 'More posts' $P && echo 'OK: more posts' || echo 'FAIL: more posts missing'
grep -q '<img src="/cursor-live-token-gap.png"' $P && echo 'OK: hero kept' || echo 'FAIL: hero dropped'
```

All four must print `OK:`.

- [ ] **Step 3: Check the monochrome code blocks against the longest post**

```bash
grep -c '<pre' dist/blog/comprehensive-guide-to-nodejs-addons/index.html
grep -o 'astro-code-token-[a-z-]*' dist/blog/comprehensive-guide-to-nodejs-addons/index.html | sort -u
```

Expected: several `<pre>` blocks, and every token name printed must be one
declared in `global.css`. A token name appearing here but missing from
`:root` renders as unstyled default colour — add it to `global.css` mapped to
`--fg`, `--fg-2` or `--fg-muted` by how much emphasis it deserves.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BlogPost.astro
git commit -m "design: rebuild post layout on the shared shell"
```

---

### Task 6: About page

**Files:**
- Modify: `src/pages/about.astro` (454 lines → ~90)

**Interfaces:**
- Consumes: `Page.astro` (Task 2), `.row`/`.row-key`/`.row-value`/`.lead`/
  `.button` (Task 1).
- Produces: nothing later tasks depend on.

**Copy constraint:** open `src/pages/about.astro` at `HEAD` first and list
every sentence, role, organisation name and link it contains. All of them
must appear in the rewrite. What leaves is presentation only: `.about-glow`,
`.about-ring`, `.about-gradient`, `.about-badge`, the `role-icon` SVGs, and
the card grid.

- [ ] **Step 1: Rewrite `src/pages/about.astro`**

Structure to follow — fill the copy from the existing file, do not invent or
summarise it:

```astro
---
import Page from '../layouts/Page.astro';
---

<Page
	title="About — Mert Can Altin"
	description="Node.js core contributor & performance team member, Express.js member, OpenJS Foundation CPC member, and full stack engineer."
>
	<img src="/github-image.png" alt="Mert Can Altin" class="photo" />
	<h1>About</h1>
	<p class="lead"><!-- the existing .about-intro sentence, verbatim --></p>

	<section>
		<h2>Memberships &amp; Roles</h2>
		<div class="row-list roles">
			<div class="row">
				<span class="row-key"><a href="https://github.com/openjs-foundation" target="_blank" rel="noopener">OpenJS Foundation</a></span>
				<span class="row-value">CPC Member</span>
			</div>
			<div class="row">
				<span class="row-key"><a href="https://github.com/nodejs/node" target="_blank" rel="noopener">Node.js</a></span>
				<span class="row-value">Core Contributor</span>
			</div>
			<div class="row">
				<span class="row-key"><a href="https://github.com/nodejs/performance" target="_blank" rel="noopener">Node.js Performance</a></span>
				<span class="row-value">Team Member</span>
			</div>
			<!-- continue for every remaining .role-card in the file at HEAD,
			     in its original order, keeping each org link and role title -->
		</div>
	</section>

	<section>
		<h2>Connect</h2>
		<p class="connect"><!-- existing links, inline, separated by spacing --></p>
	</section>

	<section>
		<h2><!-- existing .about-cta-heading text, as one sentence --></h2>
		<a href="/contact" class="button">Get in touch</a>
	</section>
</Page>

<style>
	.photo {
		width: var(--space-9);
		height: var(--space-9);
		object-fit: cover;
		border-radius: var(--radius);
		margin-bottom: var(--space-5);
	}

	section {
		margin-top: var(--space-8);
	}

	/* Organisation names are longer than dates, so this row needs a wider key. */
	.roles :global(.row) {
		grid-template-columns: 200px 1fr;
	}

	.roles :global(.row-key) {
		color: var(--fg);
	}

	/* `.roles .row` (0,2,0) outranks global.css's `@media .row` (0,1,0), so the
	   200px column would survive onto a 375px screen. Stack the rows instead. */
	@media (max-width: 480px) {
		.roles :global(.row) {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.roles :global(.row-value) {
			color: var(--fg-2);
			font-size: var(--text-sm);
		}
	}

	.connect {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
		color: var(--fg-2);
	}
</style>
```

- [ ] **Step 2: Build and verify no copy was lost**

```bash
yarn build
```

Expected: exit 0.

```bash
A=dist/about/index.html
grep -q 'about-glow\|about-ring\|about-gradient' $A && echo 'FAIL: decoration remains' || echo 'OK: decoration gone'
for s in "OpenJS Foundation" "Node.js" "Express" "CPC Member" "Core Contributor"; do
  grep -q "$s" $A && echo "OK: $s" || echo "FAIL missing: $s"
done
```

Every line must print `OK:`. Then diff the visible text against the old page
to be certain nothing else was dropped:

```bash
git show HEAD~1:src/pages/about.astro | grep -oE '>[^<>]{25,}<' | sed 's/[><]//g' | sort > /tmp/about-old.txt
grep -oE '>[^<>]{25,}<' $A | sed 's/[><]//g' | sort > /tmp/about-new.txt
comm -23 /tmp/about-old.txt /tmp/about-new.txt
```

Expected: no output, or only strings that were deliberately merged. Any
dropped sentence must be restored.

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "design: rebuild About without decoration, copy preserved"
```

---

### Task 7: Consulting page

**Files:**
- Modify: `src/pages/consulting.astro` (724 lines → ~150)

**Interfaces:**
- Consumes: `Page.astro` (Task 2), `.lead` and `.button` (Task 1).
- Produces: nothing later tasks depend on.

**Copy constraint:** this is a sales page and its wording is the asset. Every
heading, service description, result, and "costly mistake" from the file at
`HEAD` must survive. What leaves: `.hero-glow`, `.hero-glow-2`,
`.gradient-text`, `.badge-dot`, `.stats-bar` markup, `.service-icon` SVGs and
all card grids.

- [ ] **Step 1: Rewrite `src/pages/consulting.astro`**

Structure to follow:

```astro
---
import Page from '../layouts/Page.astro';

const CTA = 'https://flowflare-website.altinmert.workers.dev/#contact';
---

<Page
	title="Consulting - Mert Can Altin"
	description="Slow Node.js, high cloud bills — we fix both. Performance audits, architecture reviews, and cost optimization for engineering teams."
>
	<h1>Consulting</h1>
	<p class="lead">Slow Node.js. High cloud bills. We fix both.</p>
	<p class="intro"><!-- existing .hero-desc sentence, verbatim --></p>

	<p class="stats">
		~60% server cost reduction &middot; 4x throughput improvement &middot;
		F500 enterprise clients
	</p>

	<a href={CTA} target="_blank" rel="noopener" class="button">Discuss your performance</a>

	<section>
		<h2>How I Help</h2>
		<p class="section-desc"><!-- existing .section-desc, verbatim --></p>
		<h3>Performance Audit</h3>
		<p>
			Comprehensive application profiling to identify what's actually costing
			you money. Bottleneck analysis, resource waste detection, and a clear
			report with ROI-focused recommendations.
		</p>
		<!-- then Node.js Optimization, Architecture Review and Cost Optimization
		     the same way, each h3 + p, copy taken verbatim from the .card-title
		     and .card-desc of the matching .service-card at HEAD -->
	</section>

	<section>
		<h2>Real Results</h2>
		<!-- existing result entries as h3 + p pairs -->
	</section>

	<section>
		<h2>Costly Mistakes I See Every Week</h2>
		<!-- existing four mistakes as h3 + p pairs -->
	</section>

	<section>
		<h2><!-- existing .cta-title text as one sentence --></h2>
		<a href={CTA} target="_blank" rel="noopener" class="button">Discuss your performance</a>
	</section>
</Page>

<style>
	.intro {
		margin-top: var(--space-4);
	}

	.stats {
		font-size: var(--text-sm);
		color: var(--fg-2);
		margin: var(--space-5) 0;
	}

	section {
		margin-top: var(--space-8);
	}

	.section-desc {
		color: var(--fg-2);
		margin-top: var(--space-3);
	}

	section h3 {
		margin-top: var(--space-6);
	}
</style>
```

The old page had two CTAs, `Discuss Your Performance` and `Schedule a Call`,
pointing at the same URL. They collapse into the single button above; this is
the one deliberate copy removal in the plan.

- [ ] **Step 2: Build and verify no copy was lost**

```bash
yarn build
```

Expected: exit 0.

```bash
C=dist/consulting/index.html
grep -q 'hero-glow\|gradient-text\|stats-bar\|service-icon' $C && echo 'FAIL: decoration remains' || echo 'OK: decoration gone'
for s in "Performance Audit" "Node.js Optimization" "Architecture Review" "Cost Optimization" \
         "Scaling Before Profiling" "Blocking the Event Loop" \
         "Buffering Everything in Memory" "Premature Microservices" "Real Results"; do
  grep -q "$s" $C && echo "OK: $s" || echo "FAIL missing: $s"
done
```

Every line must print `OK:`.

```bash
git show HEAD~1:src/pages/consulting.astro | grep -oE '>[^<>]{25,}<' | sed 's/[><]//g' | sort > /tmp/cons-old.txt
grep -oE '>[^<>]{25,}<' $C | sed 's/[><]//g' | sort > /tmp/cons-new.txt
comm -23 /tmp/cons-old.txt /tmp/cons-new.txt
```

Expected: only `Schedule a Call`. Anything else must be restored.

- [ ] **Step 3: Run the system-conformance gate for the first time**

Every page-scoped stylesheet from the old design is gone as of this task, so
the colour and depth gates from the Verification harness must now pass:

```bash
grep -ohE '#[0-9a-fA-F]{6}\b' dist/_astro/*.css | tr 'A-F' 'a-f' | sort -u \
  | grep -vE '^#(ffffff|fafafa|eaeaea|d4d4d4|999999|666666|000000)$' \
  && echo 'FAIL: out-of-system colour' || echo 'OK: colour'

grep -oE 'box-shadow|linear-gradient|radial-gradient' dist/_astro/*.css \
  && echo 'FAIL: shadow or gradient' || echo 'OK: depth'
```

Both must print `OK:`. A failure here names the exact offending value — trace
it to its page and replace it with a token.

- [ ] **Step 4: Commit**

```bash
git add src/pages/consulting.astro
git commit -m "design: rebuild Consulting as prose, copy preserved"
```

---

### Task 8: Wire the MDX pages into the layout

`contact.mdx`, `newsletter.mdx` and `press.mdx` currently declare no
`layout:` frontmatter, so they render as bare HTML fragments with no header,
footer or stylesheet. This task is why `Page.astro` reads `frontmatter`.

**Files:**
- Modify: `src/pages/contact.mdx`, `src/pages/newsletter.mdx`,
  `src/pages/press.mdx` (frontmatter only)

**Interfaces:**
- Consumes: `Page.astro` (Task 2) and its `frontmatter` handling.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the layout to each MDX page**

Add one line to the frontmatter of all three files, leaving `title`,
`description` and everything else untouched:

```yaml
layout: ../layouts/Page.astro
```

`press.mdx` keeps its object-shaped `image:` field. `Page.astro`'s `typeof`
guard ignores it, so `BaseHead` falls back to the default OG image.

- [ ] **Step 2: Wrap the MDX bodies in prose styling**

MDX body content is not inside a `.prose` container by default. In
`src/layouts/Page.astro`, the `<slot />` currently sits bare inside `<main>`.
Leave it that way for `.astro` pages and let MDX pages opt in by adding, as
the first line of each MDX body (after the frontmatter):

```mdx
<div class="prose">
```

and as the last line:

```mdx
</div>
```

- [ ] **Step 3: Build and verify all three render fully**

```bash
yarn build
```

Expected: exit 0.

```bash
for p in contact newsletter press; do
  F=dist/$p/index.html
  grep -q '<footer' $F && grep -q '<header' $F \
    && echo "OK: $p has the shell" || echo "FAIL: $p bare"
  grep -q 'class="prose"' $F && echo "OK: $p prose" || echo "FAIL: $p unstyled"
done
```

All six lines must print `OK:`.

```bash
grep -q 'og:image' dist/press/index.html && echo 'OK: press og:image' || echo 'FAIL: press og:image'
```

Must print `OK:` — this is the check that the object-shaped `image` did not
break `BaseHead`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.mdx src/pages/newsletter.mdx src/pages/press.mdx
git commit -m "fix: render contact, newsletter and press inside the site shell"
```

---

### Task 9: Full-site verification

No new code. This task is the gate that the whole redesign holds together,
and it is where the CSS budget from Global Constraints is actually counted.

**Files:** none modified unless a check fails.

- [ ] **Step 1: Clean build and typecheck**

```bash
rm -rf dist
yarn build
npx tsc --noEmit
```

Both must exit 0.

- [ ] **Step 2: Run the full system-conformance gate**

```bash
grep -ohE '#[0-9a-fA-F]{6}\b' dist/_astro/*.css | tr 'A-F' 'a-f' | sort -u \
  | grep -vE '^#(ffffff|fafafa|eaeaea|d4d4d4|999999|666666|000000)$' \
  && echo 'FAIL: colour' || echo 'OK: colour'
grep -oE 'box-shadow|linear-gradient|radial-gradient|transform:|@keyframes' dist/_astro/*.css \
  && echo 'FAIL: depth or motion' || echo 'OK: depth and motion'
```

- [ ] **Step 3: Count the scoped CSS budget**

```bash
awk '/<style>/,/<\/style>/' src/pages/*.astro src/pages/blog/*.astro 2>/dev/null | wc -l
```

Expected: under 80. If it is over, the excess belongs in `global.css` or in a
token — move it and rebuild.

- [ ] **Step 4: Verify every route still exists and feeds still work**

```bash
for f in index.html about/index.html consulting/index.html contact/index.html \
         newsletter/index.html press/index.html rss.xml sitemap-index.xml; do
  test -f dist/$f && echo "OK: $f" || echo "FAIL: $f"
done
test -d dist/blog/why-cursor-didnt-show-token-savings && echo 'OK: post route' || echo 'FAIL: post route'
grep -c '<item>' dist/rss.xml
```

Every line must print `OK:`, and the RSS item count must match the post count
(10 at time of writing).

- [ ] **Step 5: Confirm no dead references survive**

```bash
grep -rq 'atkinson\|cf-card\|cf-tag\|cf-featured\|about-glow\|hero-glow' dist/ \
  && echo 'FAIL: dead reference' || echo 'OK: clean'
test -f src/layouts/HomePage.astro && echo 'FAIL: HomePage.astro remains' || echo 'OK'
test -f src/content/config.ts && echo 'FAIL: dead config remains' || echo 'OK'
test -f src/pages/blog/index.astro && echo 'FAIL: duplicate listing remains' || echo 'OK'
```

All must print `OK:`.

- [ ] **Step 6: Visual pass**

```bash
yarn dev --port 4321
```

Walk eight routes — `/`, one post, `/about`, `/consulting`, `/contact`,
`/newsletter`, `/press`, `/rss.xml` — at 1440, 768 and 375px. Look
specifically at:

- Hero images: they were chosen for a 1200px layout and now render
  full-width in a 640px column. Flag any that read badly.
- Code blocks in `comprehensive-guide-to-nodejs-addons`: if monochrome
  highlighting is too flat to scan, the fallback is one line in
  `astro.config.mjs` — `theme: "github-light"` instead of `"css-variables"`.
- The 375px breakpoint on the post-list rows, the footer, and the About role
  rows, which are the three places that reflow.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "design: full-site verification fixes"
```

---

## Deferred

Both need the site's real domain, which was not available when this plan was
written. Neither blocks the redesign; both are wrong in production today.

- `astro.config.mjs` has `site: "https://example.com"`. Canonical URLs, the
  sitemap and the RSS feed all derive from it.
- `SITE_DESCRIPTION` in `src/consts.ts` is `"Welcome to my website!"`, which
  appears in the RSS feed description and on every page's meta tags. The
  homepage lead paragraph written in Task 3 is a reasonable source for a
  replacement.
