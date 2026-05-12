# Survey Dashboard Manager

A self-contained, single-file dashboard for browsing, launching, and managing EDB survey templates.

The whole app is one HTML file (`survey-templates.html`) — no build step, no backend, no dependencies. Drop it on any static host, open it in a browser, done.

---

## What's in here

- **`survey-templates.html`** — the dashboard itself. ~2,000 lines of inline HTML, CSS, and vanilla JS.
- **`claude-design-deeplinks.user.js`** — optional Tampermonkey userscript that auto-triggers Claude Design actions (Download `.zip`, Handoff) when arriving via dashboard deep-links.
- **`.claude/launch.json`** — local dev-server config (the `npx serve` command used during development).

---

## Run locally

```bash
npx serve -l 3477 .
```

Then open <http://localhost:3477/survey-templates.html>.

That's it — no install step, no package manager, nothing to compile.

---

## Features

### Browse
- Filter by audience (All / Internal / External)
- Live search across title, description, and category
- Tile / list view toggle (list is the default)

### Per-card actions (⋯ menu, top-right of each thumbnail)
- **Duplicate** — clones the card with `(copy)` appended
- **Rename** — inline-editable title (Enter saves, Esc cancels)
- **Edit metadata** — modal to tweak title, description, audience, accent color, GitHub URL, thumb label, etc.
- **Delete** — removes the card from the dashboard (doesn't touch the underlying Claude Design project)

### Card buttons
- **Launch Survey ↗** — opens the underlying Claude Design project in a new tab
- **GitHub ↗** (dropdown) — opens the linked GitHub repo if the card has one

### Create new templates

#### Option 1 — Mix & Match prompt builder (`+ New Template` toolbar button)
A modal that helps you compose a prompt for Claude by:
1. Naming the new template
2. Picking which existing templates to borrow elements from (header, form, palette, voice)
3. Stating the audience and purpose
4. Toggling badge-style customizations (mobile-first, dark mode, multi-page flow, WCAG AA contrast, etc.)
5. Auto-generating a prompt with an `AI-READY` chip and a green-accent gradient border

Click **Open Claude ↗** to launch a new Claude chat with the prompt already in the input box (uses `claude.ai/new?q=...`). For prompts that exceed the URL length cap, the prompt is auto-copied to your clipboard as a fallback.

After Claude has built the new template, paste its URL into Step 6 (**Register Template**) to add it as a card on the dashboard.

#### Option 2 — Import JSON (`↓ Import JSON` toolbar button)
Paste a JSON block (with or without fenced backticks) describing a full template. The dashboard parses, validates, and registers it as a card. The Mix & Match prompt instructs Claude to emit a JSON block in this exact shape at the end of its response.

Required fields: `title`, `url`. Optional: `description`, `audience`, `category`, `accent`, `thumbBg`, `thumbLabel`, `thumbGradient`, `githubUrl`.

---

## Persistence

All templates and mutations live in `localStorage` under the key `edb-survey-templates@v1`. The hardcoded `DEFAULT_TEMPLATES` array in the HTML file is only used on first load.

To reset to defaults, run this in DevTools:

```js
localStorage.removeItem('edb-survey-templates@v1'); location.reload();
```

A future migration will move state to a real backend (Supabase / Cloudflare Worker) for multi-user sync.

---

## Accessibility

The dashboard targets **WCAG AA**:

- All text/background combinations meet 4.5:1 contrast (most exceed 7:1)
- Every interactive element has a visible focus ring
- Modals are `role="dialog" aria-modal="true"` with `aria-labelledby`, Esc-to-close, click-outside-to-close
- `aria-expanded` on every popover trigger
- Skip link to main content
- Live regions (`aria-live="polite"`) for the count label

---

## Roadmap

- [ ] Replace `localStorage` with Supabase (auth + multi-user state)
- [ ] Real-time sync between teammates
- [ ] Drag-and-drop HTML file imports (host templates locally instead of referencing Claude Design)
- [ ] Permission model (owner vs admin vs read-only)
- [ ] Hosted version on Cloudflare Pages or Vercel

---

## License

Internal EDB tool. Not currently licensed for external use.
