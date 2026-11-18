from pathlib import Path
import base64
import gzip
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "linkedin-archive.html"
POSTS_DIR = ROOT / "content" / "archive-posts"
INDEX = ROOT / "archive-posts.json"

html = SOURCE.read_text(encoding="utf-8")
match = re.search(r"const compressed=['\"]([A-Za-z0-9+/=]+)['\"]", html)
if not match:
    raise SystemExit("Could not find the embedded gzip archive string in linkedin-archive.html")

raw = gzip.decompress(base64.b64decode(match.group(1)))
payload = json.loads(raw.decode("utf-8"))
if isinstance(payload, dict):
    source_posts = payload.get("posts") or payload.get("items") or payload.get("data") or []
else:
    source_posts = payload
if not isinstance(source_posts, list):
    raise SystemExit(f"Unexpected archive payload type: {type(source_posts).__name__}")

POSTS_DIR.mkdir(parents=True, exist_ok=True)
created = 0
for source_post in source_posts:
    if not isinstance(source_post, dict):
        continue
    post_id = str(source_post.get("id") or "").strip()
    if not post_id:
        continue
    target = POSTS_DIR / f"{post_id}.json"
    # Never overwrite an existing CMS-edited record during a later source refresh.
    if target.exists():
        continue
    post = {
        "id": post_id,
        "date": str(source_post.get("date") or ""),
        "title": str(source_post.get("title") or ""),
        "text": str(source_post.get("text") or ""),
        "url": str(source_post.get("url") or ""),
        "category": str(source_post.get("category") or ""),
        "status": "published",
        "thumbnail": "",
        "video_url": "",
        "gallery": [],
        "gallery_alt": [],
        "gallery_caption_en": [],
        "gallery_caption_fa": []
    }
    target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    created += 1

posts = []
for path in POSTS_DIR.glob("*.json"):
    try:
        item = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(item, dict):
            posts.append(item)
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Invalid archive record {path.name}: {exc}")

posts.sort(key=lambda item: str(item.get("date") or ""), reverse=True)
INDEX.write_text(json.dumps(posts, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
categories = sorted({str(item.get("category") or "") for item in posts if item.get("category")})
print(f"Source posts: {len(source_posts)}")
print(f"New CMS records created: {created}")
print(f"Total CMS records compiled: {len(posts)}")
print(f"Categories: {len(categories)}")
print(f"Compiled index size: {INDEX.stat().st_size:,} bytes")
