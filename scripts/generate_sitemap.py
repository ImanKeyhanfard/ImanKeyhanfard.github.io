#!/usr/bin/env python3
"""Generate sitemap.xml from CMS page SEO records.

Only public pages with a canonical URL and no explicit noindex flag are included.
Canonical URLs are deduplicated and constrained to this site's hostname.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SEO_DIR = ROOT / "content" / "seo-pages"
SITEMAP = ROOT / "sitemap.xml"
SITE = "https://imankeyhanfard.github.io"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NS)

CHANGEFREQ = {
    "index": "monthly",
    "fa-index": "monthly",
    "linkedin-archive": "weekly",
    "fa-linkedin-archive": "weekly",
}

PRIORITY = {
    "index": "1.0",
    "fa-index": "1.0",
    "projects": "0.7",
    "fa-projects": "0.7",
    "linkedin-archive": "0.7",
    "fa-linkedin-archive": "0.7",
}

def main():
    records = []
    for file in sorted(SEO_DIR.glob("*.json")):
        data = json.loads(file.read_text(encoding="utf-8"))
        if data.get("noindex") is True:
            continue
        canonical = str(data.get("canonical_url") or "").strip()
        if not canonical.startswith(SITE + "/") and canonical != SITE + "/":
            continue
        if canonical in {r[0] for r in records}:
            continue
        records.append((canonical, data.get("slug") or file.stem))

    today = datetime.now(timezone.utc).date().isoformat()
    urlset = ET.Element(f"{{{NS}}}urlset")
    for canonical, slug in records:
        url = ET.SubElement(urlset, f"{{{NS}}}url")
        ET.SubElement(url, f"{{{NS}}}loc").text = canonical
        ET.SubElement(url, f"{{{NS}}}lastmod").text = today
        ET.SubElement(url, f"{{{NS}}}changefreq").text = CHANGEFREQ.get(slug, "yearly")
        ET.SubElement(url, f"{{{NS}}}priority").text = PRIORITY.get(slug, "0.8")

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    SITEMAP.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset, encoding="unicode") + "\n", encoding="utf-8")
    print(f"Generated sitemap with {len(records)} canonical, indexable URLs.")

if __name__ == "__main__":
    main()
