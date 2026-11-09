# Umar Razzaq — Portfolio & local dashboard

A readable, responsive portfolio with Home, About, Portfolio, Services, and Contact. The public site is static and works on GitHub Pages. The password-protected content dashboard runs only on your computer.

## Open the website and dashboard

Install Node.js 20 or later. In VS Code, open **Terminal → New Terminal** from this repository (`D:\urumarrazzaq.github.io`) and run:

```sh
npm start
```

- Website: http://127.0.0.1:8080/
- Dashboard: http://127.0.0.1:8080/admin/

Open the website at the address above when previewing videos. Opening `index.html` as a `file:///` page prevents YouTube from receiving the website address it requires and causes player error 153. The public GitHub Pages address also provides that website address after you publish.

Keep the terminal open while editing. The first time you open the dashboard, create a password of at least 12 characters. Sign in, choose a content tab, edit, and press **Save changes**. Open the Website link above or **Preview website** in the dashboard, then refresh to see saved changes. Press `Ctrl+C` in the terminal to stop the local server. If port 8080 is busy, use `$env:PORT=8081; npm start` in PowerShell and open port 8081 instead.

No dependency installation is needed to run the server. On first launch, create your own dashboard password (at least 12 characters). No default password is shipped. Sessions expire after four hours and are cleared when the server restarts. To use another port, set the PORT environment variable before starting.

## Manage content

Use the dashboard to edit your name, role, home headline, introduction, portrait, crop position, about copy, profile facts, detailed expertise, collaborator testimonials, services, contact information, and résumé. Under Projects, add, edit, reorder, and remove entries; upload thumbnails; set video links; and write descriptions, contributions, and technology labels.

The gallery starts with 9 projects and loads 9 more at a time. Search and discipline filters operate across all 40 projects. A project opens a readable detail dialog with its full description and video inside the site. YouTube embeds load when Play is selected; embedding availability depends on the video owner's settings. Uploaded MP4/WebM files use the native video player. With JavaScript disabled, the first 9 project previews remain visible.

## Uploads and GitHub Pages

Supported uploads: PNG, JPEG, WebP, GIF, PDF, MP4, and WebM, up to 25 MB each. Use YouTube links for larger videos. Uploaded files are saved under assets/uploads/ and served as normal static assets.

Saving updates assets/data/content.json and regenerates index.html. This makes the result deployable directly to GitHub Pages without running a backend or a build there. The dashboard never commits or pushes.

To publish when ready, review and commit index.html, assets/data/content.json, and any new assets/uploads/ files, then push using your usual Git workflow. The live GitHub Pages site cannot accept dashboard uploads by itself: GitHub Pages serves static files, while this dashboard's upload and authentication API runs locally. A copy of /admin/ on GitHub Pages has no active backend and does not grant editing access.

## Local password and backups

Passwords are stored as salted scrypt hashes in .local/admin-auth.json, excluded from Git. Previous content is backed up in .local/backups/ before saves. These files are denied by the local HTTP server. Keep .local/ private and do not force-add it to Git.

The server binds to 127.0.0.1, checks Host/Origin headers, requires authenticated HTTP-only SameSite sessions plus CSRF tokens for writes, rate-limits failed logins, validates content and file types, and prevents serving repository internals. It is a local editing tool, not an Internet-facing admin service. To reset a forgotten password, stop the server, move .local/admin-auth.json to a private backup location, restart, and create a new password.

## Files

- assets/data/content.json: authoritative profile, about, services, contact, and project content.
- tools/render-site.cjs: static page renderer. Run npm run build after editing JSON manually.
- assets/css/portfolio.css and assets/js/portfolio.js: public design, gallery, and project video/details interactions.
- admin/: local dashboard interface.
- tools/admin-server.cjs and tools/content-schema.cjs: local authentication, uploads, validation, and persistence.
- design/connected-world-concept.svg: earlier concept storyboard, retained for reference. The current site uses the readable layout requested after that concept.

The previous project's supporting assets and legacy detail pages remain available. The old projects.json and worlds.json files are historical inputs; edit content.json or use the dashboard for the current site.

## Verification

```sh
npm test
npm run test:browser
```

The server/security tests use Node's built-in test runner. Browser tests additionally require Playwright and an installed Google Chrome (or set PLAYWRIGHT_CHANNEL for another installed browser). Tests use isolated fixture content and credentials; they do not change the real portfolio password or content. Screenshots are saved in ignored artifacts/.

## Design and content provenance

The Figma reference informed the charcoal and warm-gold palette. The revised sidebar and section structure follow the user's supplied Home/About/Portfolio/Services/Contact reference. Portrait and project thumbnails come from the existing portfolio. Project summaries use existing project names, footage labels, and résumé details; detailed contribution claims are included only where documented. Review and expand descriptions in the dashboard as needed.
