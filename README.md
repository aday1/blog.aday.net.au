# blog.aday.net.au

Commit-driven static blog for `blog.aday.net.au`.

## How it works

- Write posts in `posts/*.md`.
- Push to `main`.
- GitHub Actions builds static HTML into `public/`.
- Deploys to Cloudflare (custom domain) and GitHub Pages backup.

## Post format

Use simple front matter:

    ---
    title: Your post title
    date: 2026-05-14
    summary: One line summary
    ---

    Post body in markdown.

Raw HTML charts / widgets: open a fenced block with language `html`
(triple backtick + html), put markup inside, then close with a bare
triple-backtick line. The builder passes that markup through unescaped.

Optional front matter for chip posts:

    github: https://github.com/aday1/AdLibitum
    nav: chip
    shader: fm

`nav: chip` (or any `github:` URL) drops mastodon/codepen and links GitHub.
`shader: fm` loads `/blog-fm-shader.js` + `/blog-fm.css` (subtle FM phosphor backdrop).
