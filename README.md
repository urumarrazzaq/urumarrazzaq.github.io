# Umar Razzaq — Connected portfolio

A static, GitHub Pages-compatible portfolio inspired by the supplied cinematic Figma reference: Inter typography, charcoal surfaces, warm gold accents, and a connected spatial journey.

The five destinations share one Three.js environment: identity entrance, mission control, project exhibition, exterior career district, and panoramic contact observatory. The camera travels along a shared skywalk; project portals move toward individual exhibition gates. Room architecture is procedural, with animated airlocks, holograms, and ambient particles. This is a lightweight architectural scene rather than Unreal-rendered environment art.

## Local preview

Serve the repository over HTTP, for example with `python -m http.server 8080`, then open `http://localhost:8080`. Opening `index.html` using `file://` prevents browsers from fetching the project JSON.

No build step, backend, or package install is needed. Three.js is served locally; the optional Google Fonts request falls back to system fonts when unavailable. Email uses a `mailto:` link; no nonfunctional PHP submission is presented on GitHub Pages.

## Editing content

- `index.html`: identity, profile, skills, career history, contact links, and destination navigation.
- `assets/data/projects.json`: all 40 projects migrated from the previous portfolio, with their original image/video/project links. `filter` supports multiple space-separated disciplines.
- `assets/data/worlds.json`: the four curated project worlds. Set `media` to a local image path and `video` to an HTTPS video URL; edit description, technology labels, and contributions here.
- `assets/css/world.css`: Figma-inspired colors, typography, layout, responsive rules, and portal visuals.
- `assets/js/world.js`: navigation, dialogs, archive filtering, and procedural world geometry/camera travel.
- `design/connected-world-concept.svg`: original editable visual concept and annotated motion storyboard.

Subject Human, Cheebz Migrate, and Copper Bowl have explicitly labeled media and case-study placeholders. Their technology stacks and contributions have not been invented. Tensei Games content and career history are drawn from `resume/UmarRazzaqATSFinal.pdf`; the résumé's ongoing-employment date is labeled accordingly.

## Accessibility and fallbacks

Navigation supports browser history, deep links, and previous anchors such as `#portfolio` and `#about`. Native dialogs support Escape, focus containment, and focus restoration. Inactive destinations are inert. Reading mode shows all destinations as a normal document; without JavaScript the document is readable and project-video links remain available. WebGL failure leaves navigation and content usable. Reduced-motion preferences disable the 3D scene and transitions; Pause motion stops scene animation. Rendering stops in background tabs.

## Verification

With Node, Playwright, and Google Chrome available, run `node tools/verify-world.cjs`. Set `PLAYWRIGHT_CHANNEL` to another installed Playwright browser channel if needed. The check starts and closes its own local HTTP server and browser, checks desktop/mobile navigation, all project-image paths, portals, archive search/filter/details, map navigation, motion and reading modes, old anchors, and no-JavaScript/no-WebGL fallbacks. Screenshots are written to ignored `artifacts/`.

## Asset provenance

- Visual reference: [supplied Figma portfolio](https://www.figma.com/design/glfpOcAU3QGQPXaSuZiFWC/).
- Landscape: a discrete image asset from the user-supplied `.fig` file, matched to Figma node `1:18` and optimized to WebP. The reference UI screenshot is not used as a website asset.
- Portrait and project images: existing portfolio assets.
- Three.js r128: retained version from the previous portfolio, now vendored locally; MIT license in `assets/vendor/three.LICENSE.txt`.

Legacy detail pages and their supporting assets remain in the repository. The new homepage has its own stylesheet and script so those pages are unaffected.
