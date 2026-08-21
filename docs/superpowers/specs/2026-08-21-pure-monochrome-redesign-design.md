# Pure Monochrome Redesign

Date: 2026-08-21
Status: Approved, ready for implementation planning

## Goal

Replace the site's current visual language — Cloudflare-blog-derived cards,
gradients, glows, coloured tag badges, a dark four-column footer — with a
single monochrome design system in the spirit of Vercel, but stricter: no
colour at all beyond a neutral grey ramp.

The redesign is structural, not cosmetic. Layouts collapse to one narrow
column, decorative elements are removed rather than restyled, and the ~1400
lines of per-page CSS currently duplicated across pages are replaced by one
token system plus two shared primitives.

## Decisions

Each was settled during brainstorming; the rationale matters more than the
choice, because it resolves future questions the spec does not cover.

| Decision | Choice | Rationale |
|---|---|---|
| Colour | Strict monochrome | No accent colour anywhere, including tags and buttons. |
| Theme | Light only | One code path, no theme JS, no FOUC. Tokens still live in custom properties so a future dark theme is a token override, not a rewrite. |
| Font | Geist Sans + Geist Mono via Google Fonts | The typeface carries most of the "Vercel" impression. Third-party request accepted knowingly. |
| Structural depth | Radical | Cards, hero images in lists, tag badges, stats bars and the multi-column footer are removed, not restyled. |
| Hero images | Post page only | Kept where the work shows, dropped from listings. Still used as `og:image`. |
| Consulting page | ~~Same treatment~~ → **deleted** | Superseded during execution: the user chose to remove About and Consulting entirely rather than restyle them. See "About and Consulting: deleted". |
| `/blog` | Redirect to `/` | Ten posts do not justify two identical listing pages. |

**Governing rule:** depth is expressed through 1px borders and whitespace,
never through shadows, gradients or colour. Any rule that reaches for
`box-shadow`, `linear-gradient` or a hue is out of system.

## Non-goals

- Dark mode.
- A reading-time indicator, tag/category pages, search, or pagination.
- Any test framework. The project has none; verification is build, typecheck
  and visual review.
- Rewriting post content. Prose in `src/content/blog/*.mdx` is untouched.

## Design tokens

All tokens live in `:root` in `src/styles/global.css`.

### Colour

```
--bg:        #ffffff   page background
--bg-subtle: #fafafa   code block background, table header
--border:    #eaeaea   every 1px rule
--border-hi: #d4d4d4   hr, blockquote rule, hover borders
--fg-muted:  #999999   dates, code punctuation
--fg-2:      #666666   descriptions, meta, secondary nav
--fg:        #000000   headings, body, links
```

Seven neutral values. Nothing else may introduce a colour.

### Typography

Geist Sans (weights 400, 500, 600) for text and Geist Mono (400) for code,
loaded from Google Fonts with `preconnect` to `fonts.googleapis.com` and
`fonts.gstatic.com` and `display=swap`.

```
--text-xs    12px   footer, table headers
--text-sm    14px   meta, nav, dates, code
--text-base  16px   body
--text-lg    18px   lead paragraphs
--text-xl    24px   h2
--text-3xl   40px   h1
```

Headings are `font-weight: 600` with `letter-spacing: -0.02em`, tightening to
`-0.03em` at `--text-3xl`. Body `line-height: 1.7`, headings `1.2`. Dates and
any tabular figures use `font-variant-numeric: tabular-nums`.

### Spacing, measure, and the rest

```
--space-1..9   4, 8, 12, 16, 24, 32, 48, 64, 96
--width        640px
--gutter       24px
--radius       6px    images, buttons, code blocks
```

Vertical rhythm draws only from the spacing scale; no intermediate values.
Grid column widths (the post-list date column, the About role column) are
sized to their content and are the one exception.
Transitions are limited to `color`, `background-color` and `border-color` at
150ms. No
transforms, no animations, no shadows. Focus is `outline: 2px solid #000`
with `outline-offset: 2px`.

## File architecture

| File | Change |
|---|---|
| `src/styles/global.css` | Rewritten: reset, tokens, base elements, `.prose`, `.sr-only` |
| `src/layouts/Page.astro` | New — Header/main/Footer wrapper taking `title`, `description`, optional `image` |
| `src/layouts/HomePage.astro` | Deleted — imported by nothing |
| `src/layouts/BlogPost.astro` | Rewritten on top of `Page` |
| `src/components/PostList.astro` | New — post rows; `posts` prop plus `groupByYear` flag. Homepage groups, the post page's "More posts" does not |
| `src/components/Header.astro` | 169 → ~45 lines, single row |
| `src/components/Footer.astro` | 108 → ~35 lines, single row |
| `src/components/FormattedDate.astro` | Gains `variant="short"` (`Aug 12`) alongside the default long form (`Aug 12, 2026`) |
| `src/components/BaseHead.astro` | Atkinson preloads replaced by Geist links |
| `src/pages/index.astro` | Rewritten — intro + `PostList` |
| `src/pages/blog/index.astro` | Deleted, replaced by a redirect |
| `src/pages/about.astro` | **Deleted** |
| `src/pages/consulting.astro` | **Deleted** |
| `src/components/HeaderLink.astro` | **Deleted** — no nav left to render |
| `src/pages/{contact,newsletter,press}.mdx` | Gain `layout: ../layouts/Page.astro` frontmatter |
| `src/content/config.ts` | Deleted — dead legacy config |
| `public/fonts/atkinson-*.woff` | Deleted |
| `astro.config.mjs` | Gains `redirects` and `shikiConfig` |

Per-page scoped CSS must total under ~80 lines across all pages. A rule that
does not fit belongs in a token or in `global.css`.

### Why these deletions

- `src/layouts/HomePage.astro` is imported by no file.
- `src/content/config.ts` is legacy Astro 4 content config. Astro 5 reads
  `src/content.config.ts`, whose schema has no `tag` field — which is why
  `getTag()` in both listing pages falls back to `'coding'` for every post.
  Tags are being removed, so the file goes with them.
- `src/pages/index.astro` and `src/pages/blog/index.astro` are byte-for-byte
  the same page. `PostList` exists to make that duplication impossible to
  reintroduce.

### The MDX layout contract

Astro passes an MDX page's frontmatter to its layout as a single `frontmatter`
prop, not as individual props. `Page.astro` must therefore read:

```js
const { title, description, image } = Astro.props.frontmatter ?? Astro.props;
```

so the same layout serves both `.astro` pages (direct props) and the three
`.mdx` pages (frontmatter).

One trap: `press.mdx` declares `image` as an object (`src`, `caption`, `alt`),
while `BaseHead` expects a string URL. `Page.astro` must forward `image` only
when it is a string, and fall back to the default otherwise.

## Pages

### Header

Single row, 64px, 1px bottom border. Site name on the left at
`--text-base`/weight 500, linking to `/`. **No navigation at all** — with
About and Consulting deleted and the homepage serving as the blog, every nav
item would either point at a page that no longer exists or duplicate the
site-name link. Social icons move to the footer; the current two-row header
becomes one row carrying only the name.

### Homepage

```
Mert Can Altin                                    h1
Node.js core contributor & performance team       lead, --text-lg, --fg-2
member. Express.js member, OpenJS Foundation CPC.

2026                                              --text-sm, --fg-muted
   Aug 12   Why Cursor didn't show token savings
   Jul 03   Introducing ata-vite
2025
   Nov 14   Debugging Node.js with LLDB
```

`PostList` renders rows as `grid-template-columns: 72px 1fr` with
`--space-5` gap; the date column uses tabular figures so it aligns. No rule
between rows — year headings and whitespace carry the rhythm. Hover
underlines the title only. Below 480px the date column narrows to 56px;
`Aug 12` still fits, so rows never stack.

### `/blog`

`src/pages/blog/index.astro` is deleted and `/blog` redirects permanently to
`/`. Post URLs (`/blog/<slug>/`) are unaffected.

The project builds to static output, so Astro's `redirects` config may emit a
meta-refresh page rather than a true 301. Implementation must inspect
`dist/blog/index.html` after the first build; if no real redirect is
produced, add a `public/_redirects` line (`/blog / 301`) so Cloudflare serves
a genuine 301.

### Blog post

```
← Back
Why Cursor didn't show token savings              h1
Aug 12, 2026 · Updated Aug 20, 2026               --text-sm, --fg-muted
[ hero image — full width, --radius ]
body (.prose)
─────────────────────────────────────
More posts
   Jul 03   Introducing ata-vite
   Jun 21   JSON Schema is already a TypeScript type
```

The existing "Related Posts" card grid becomes three rows in the same list
idiom as the homepage. Tag badges are removed.

### About and Consulting: deleted

Superseded mid-execution. These two pages were originally to be rewritten in
the monochrome idiom, preserving every sentence of their copy. The user
decided instead to remove them outright, and `src/pages/about.astro` and
`src/pages/consulting.astro` are deleted.

Consequences, all accepted deliberately:

- The site is now the homepage archive, the post pages, and
  `contact`/`newsletter`/`press`. Nothing else.
- The header has no nav (see Header above) and `HeaderLink.astro` is deleted
  with it, having no remaining caller.
- `/about` and `/consulting` will 404. They are dropped from the sitemap
  automatically. No redirects are added: there is no destination that
  honestly serves those URLs.
- The Consulting page's calls to action pointed at
  `flowflare-website.altinmert.workers.dev/#contact`. That path off the site
  no longer exists; `/contact` is the only remaining contact route.


### Footer

Dark background and four-column grid are removed. A 1px top border, then one
row:

```
─────────────────────────────────────────────────────
GitHub  Twitter  RSS  Contact  Newsletter  Press    © 2026 Mert Can Altin
```

`press.mdx` was previously linked from nowhere; it gains an entry here.
Below 480px the link row and the copyright stack.

## Prose and code

`.prose` governs all MDX body content:

- `p`: `line-height: 1.7`, `--space-5` bottom margin
- `h2` / `h3`: `--space-7` / `--space-6` top margin
- `a`: underlined with `text-underline-offset: 2px`, `--fg-2` on hover
- `blockquote`: 2px left `--border-hi` rule, `--fg-2` text, body-size (the
  current `1.333em` enlargement is dropped)
- `img`: full width, `--radius`
- `hr`: `--border`, `--space-7` vertical margin
- `table`: `--text-sm`, 1px row rules, `--text-xs` `--fg-2` headers
- `ul` / `ol`: 20px indent, `--space-2` between items

### Syntax highlighting

Astro's Shiki default is `github-dark` — colourful dark blocks in the middle
of a white monochrome page. The posts contain 48 fenced blocks (`ts`,
`javascript`, `cpp`, `bash`, `c`, `json`, and 27 unlabelled).

Use `shikiConfig.theme: 'css-variables'` and define the
`--astro-code-token-*` variables against the grey ramp: comments `--fg-muted`
italic, keywords `--fg` at weight 600, strings `--fg-2`, punctuation
`--fg-muted`.
Emphasis comes from weight and tone rather than hue — the typographic form of
the borders-not-shadows rule. Block background `--bg-subtle`, 1px `--border`,
`--radius`, `overflow-x: auto`, `--text-sm`.

Monochrome code is measurably harder to scan than coloured code. This is an
accepted trade of legibility for consistency. If it reads badly in the
longest post, `github-light` is a one-line fallback.

## Verification

The project has no test framework and this spec does not add one.

1. `yarn build` completes clean, then `tsc`.
2. Dev server visual pass over six routes — `/`, one post, `/contact`,
   `/newsletter`, `/press`, `/rss.xml` — at 1440, 768 and 375px.
3. `.prose` checked against the longest post,
   `comprehensive-guide-to-nodejs-addons.mdx`.
4. `dist/` still contains a valid `rss.xml` and `sitemap-index.xml`, and
   `/blog` genuinely redirects.

## Risks

- `consulting.astro` and `about.astro` are deleted. Their copy — the service
  descriptions, the results, the memberships list — survives only in git
  history. Recovering any of it later means reading `git show` on a commit
  before the deletion.
- Geist adds a third-party request and a brief FOUT on first paint.
- Hero images were chosen for a 1200px layout and will read differently
  full-width in a 640px column.

## Open questions

Both need the real domain and are blocked on it. Neither blocks the redesign.

- `astro.config.mjs` has `site: "https://example.com"`. Canonical URLs, the
  sitemap and the RSS feed all derive from it, so all three currently publish
  the wrong domain.
- `SITE_DESCRIPTION` in `src/consts.ts` is still `"Welcome to my website!"`,
  which appears in the RSS feed description and every page's meta tags.

## Environment note

Not part of this design, recorded because it blocked the dev server during
brainstorming: `node_modules/@cloudflare/workerd-darwin-arm64/bin/` was
empty — the 84MB `workerd` binary had been deleted. Astro reported a
"wrong platform" error, which was misleading; the platform was correct.
Reinstalling the single package fixed it. Note that `yarn install
--check-files --frozen-lockfile` rewrote both lockfiles anyway, stripping the
non-darwin workerd entries; those changes were reverted.
