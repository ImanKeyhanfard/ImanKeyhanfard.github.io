# Iman Keyhanfard — Bilingual Editorial Portfolio

A bilingual English/Persian editorial portfolio and professional website for Iman Keyhanfard, a Tehran-based senior news producer, field producer and journalist.

## Website
- Live site: https://imankeyhanfard.github.io/
- LinkedIn archive: https://imankeyhanfard.github.io/linkedin-archive.html
- Projects: https://imankeyhanfard.github.io/projects.html
- English and Persian service pages are linked from the homepage and each page's language switcher.

## Architecture
- `index.html`, `fa/index.html`: homepage structure and fallback content
- `styles.css`: responsive layout and visual design
- `script.js`: language switching, navigation and interaction
- `cms.js`: site-side content loader; reads public JSON content from this repository and applies CMS-managed copy, layouts, sections, experience, services, featured content, page SEO and page content
- `content/site-settings.json`: bilingual homepage copy, labels, layout controls, contact information and site-level SEO
- `content/sections/`: navigation and section visibility/layout settings
- `content/experience/`, `content/services/`, `content/portfolio/`, `content/posts/`: CMS-managed content collections
- `content/seo-pages/`: per-page SEO metadata and editable page content
- `_data/archive_posts/`: original LinkedIn archive records; Jekyll exports these to the archive data file
- `admin/`: Sveltia CMS editor and GitHub-backed configuration
- `linkedin-archive.html`, `archive-posts.json`: searchable archive interface and generated data
- `sitemap.xml`, `robots.txt`: search-engine discovery files

## Editing content
Use the Sveltia CMS editor at `/admin/`. Its configuration is in `admin/config.yml`; authenticate with a GitHub personal access token scoped to this repository with Contents read/write permission.

1. **Website Settings & Contact** — update bilingual homepage copy, labels, images, contact links, layout and site-level SEO.
2. **Website Sections & Tabs** — adjust navigation labels, order, visibility and section layout controls.
3. **Professional Experience / Services / Portfolio & Media Projects / News & Articles** — edit content records. Only records marked visible/published are rendered where supported by the site.
4. **Individual Page SEO & Content** — edit page titles, descriptions, keywords, canonical URLs, language alternates, social images, noindex, and supported standalone page content.
5. **LinkedIn Archive — Original Posts** — maintain original archive records and their publication status. Avoid changing IDs or original URLs unless correcting verified source data.

Changes committed to the default branch are deployed by GitHub Pages Actions. Check the Actions tab for a successful build/deployment before considering a change live. Archive export automation is defined in `.github/workflows/archive-export-preview.yml`.

## SEO and quality checks
- Keep each page's canonical URL self-referential and its English/Persian alternates reciprocal.
- Keep page titles and descriptions distinct, accurate, and written for the actual page content.
- Use `noindex` only for pages intentionally excluded from search.
- Verify the sitemap includes public canonical pages and that `robots.txt` points to it.
- Do not claim certification, legal advice, guaranteed crew/equipment, or services beyond the stated experience and agreed scope.

## Publishing
The site is hosted on GitHub Pages. The repository's Actions workflows build and deploy updates. This is a static site; CMS changes are stored as repository files and are deployed through the repository's publishing workflow.
