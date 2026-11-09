# Umar Razzaq — Portfolio & local dashboard

A readable, responsive portfolio with Home, About, Portfolio, Services, Fab, Hire On, and Contact. The public site is static and works on GitHub Pages. The password-protected content dashboard runs only on your computer.

## Open the website and dashboard

Install Node.js 20 or later. In VS Code, open **Terminal → New Terminal** from this repository (`D:\urumarrazzaq.github.io`) and run this PowerShell-safe command:

```sh
node tools/admin-server.cjs
```

- Website: http://127.0.0.1:8080/
- Dashboard: http://127.0.0.1:8080/admin/

Open the website at the address above when previewing videos. Opening `index.html` as a `file:///` page prevents YouTube from receiving the website address it requires and causes player error 153. The public GitHub Pages address also provides that website address after you publish.

Keep the terminal open while editing. The first time you open the dashboard, create a password of at least 12 characters. Sign in, choose a content tab, edit, and press **Save changes**. Open the Website link above or **Preview website** in the dashboard, then refresh to see saved changes. Press `Ctrl+C` in the terminal to stop the local server. If port 8080 is busy, use `$env:PORT=8081; node tools/admin-server.cjs` in PowerShell and open port 8081 instead. `npm.cmd start` also works in PowerShell if you prefer the npm script; `npm start` may be blocked by your PowerShell execution policy.

No dependency installation is needed to run the server. On first launch, create your own dashboard password (at least 12 characters). No default password is shipped. Sessions expire after four hours and are cleared when the server restarts. To use another port, set the PORT environment variable before starting.

## Manage content

Use the dashboard to edit your name, role, rotating “I’m a …” titles, home headline, introduction, portrait, crop position, about copy, profile facts, detailed expertise, collaborator testimonials, services, contact information, and résumé. Under Projects, add, edit, reorder, and remove entries; upload thumbnails; set video links; and write descriptions, contributions, and technology labels.

Under **Hire On**, edit your Upwork and Fiverr links. Under **Fab Publishings**, add listing links, artwork, and descriptions. The Fab gallery shows 3 listings at a time, with Load more for larger collections. The supplied Fab preview link is included with editable placeholder details because its private portal page could not be read. Under **Layout & sections**, choose the default layout for `/` and show or hide About, Portfolio, Services, Fab, Hire On, and Contact. Visitors can always switch between **One page** and **Separate pages** using the public navigation. Home remains visible. The one-page version is at `/one-page.html`; the separate-page version starts at `/home.html`.

The gallery starts with 9 projects and loads 9 more at a time. Search and discipline filters operate across all 44 entries. The three newly supplied YouTube links are listed under Simulations, with titles and summaries based on the upload copy supplied in the same order. Their thumbnails are copied from the supplied local artwork. Zhai is included as an in-development Steam project; its page text and official Steam header inform the entry. A project opens a readable detail dialog with its full description and video when available inside the site. YouTube embeds load when Play is selected; embedding availability depends on the video owner's settings. Uploaded MP4/WebM files use the native video player. With JavaScript disabled, the first 9 project previews remain visible.

## Uploads and GitHub Pages

Supported uploads: PNG, JPEG, WebP, GIF, PDF, MP4, and WebM, up to 25 MB each. Use YouTube links for larger videos. Uploaded files are saved under assets/uploads/ and served as normal static assets.

Saving updates assets/data/content.json and regenerates index.html, one-page.html, home.html, and the visible section pages. Hidden section pages are removed. This makes the result deployable directly to GitHub Pages without running a backend or a build there. The dashboard never commits or pushes.

To publish when ready, review and commit the generated public `.html` pages, assets/data/content.json, and any new assets/uploads/ files, then push using your usual Git workflow. The live GitHub Pages site cannot accept dashboard uploads by itself: GitHub Pages serves static files, while this dashboard's upload and authentication API runs locally. A copy of /admin/ on GitHub Pages has no active backend and does not grant editing access.

## Local password and backups

Passwords are stored as salted scrypt hashes in .local/admin-auth.json, excluded from Git. Previous content is backed up in .local/backups/ before saves. These files are denied by the local HTTP server. Keep .local/ private and do not force-add it to Git.

The server binds to 127.0.0.1, checks Host/Origin headers, requires authenticated HTTP-only SameSite sessions plus CSRF tokens for writes, rate-limits failed logins, validates content and file types, and prevents serving repository internals. It is a local editing tool, not an Internet-facing admin service. To reset a forgotten password, stop the server, move .local/admin-auth.json to a private backup location, restart, and create a new password.

## Files

- assets/data/content.json: authoritative layout settings, section visibility, profile, about, services, contact, and project content.
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

The public UStore HSVColorPicker listing uses a generated promotional thumbnail. The full PNG and design brief are in `design/hsv-color-picker-thumbnail.png` and `design/hsv-color-picker-prompt.txt`; the optimized website asset is `assets/img/fab/hsv-color-picker.webp`. Replace it through the dashboard's Fab editor at any time.

Project descriptions were expanded using published YouTube descriptions and sampled storyboard frames. The review record is `design/project-content-review.json`; it does not represent full audio/video playback review.

## Change the homepage background

Run `npm.cmd start`, open `http://127.0.0.1:8080/admin/`, and sign in (or create a password on first use). Under **Profile & home**, edit **Background YouTube URL** and save. The background plays muted and loops when visible. Clear the field to show a still background. Use a public or unlisted video that permits embedding; browser autoplay settings or YouTube restrictions may prevent playback. Preview through localhost, not a `file:///` URL.

The admin source (`admin/`, `tools/`, and `package.json`) can be committed and pushed with the repository. Never add `.local/`: it contains the local password hash and backups and is already ignored. GitHub Pages excludes the dashboard and server through `_config.yml`; `/admin/` is not an online admin login. On another computer, clone the repository, install Node.js 20+, run `npm.cmd start`, and create a password for that computer. Saving generates the public HTML locally; commit and push those changes to publish. A remotely accessible dashboard would need server hosting beyond GitHub Pages.

## Search visibility

The build creates individual `work-*.html` project pages with readable descriptions, embedded videos, canonical URLs, social previews, and structured data. All project pages are linked from the expandable portfolio directory. It also creates `sitemap.xml` and `robots.txt`. Removing projects or hiding Portfolio removes the corresponding generated pages on the next dashboard save/build.

Set the public domain under **Layout & sections → Public website URL** before publishing to a different domain. After publishing, submit the sitemap in Google Search Console and monitor indexing. These changes support discovery; they cannot guarantee search rankings. The local dashboard remains local and is excluded from the GitHub Pages build. Run `npm.cmd start` from PowerShell to avoid the npm.ps1 execution-policy error.

The Figma reference informed the charcoal and warm-gold palette. The revised sidebar and section structure follow the user's supplied Home/About/Portfolio/Services/Contact reference. Portrait and project thumbnails come from the existing portfolio. Project summaries use existing project names, footage labels, and résumé details; detailed contribution claims are included only where documented. Review and expand descriptions in the dashboard as needed.
