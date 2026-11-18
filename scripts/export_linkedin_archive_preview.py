from pathlib import Path
import base64
import gzip
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "linkedin-archive.html"
LEGACY_DIR = ROOT / "content" / "archive-posts"
POSTS_DIR = ROOT / "_data" / "archive_posts"

CATEGORY_FA = {
    "Conflict & Military Affairs": "درگیری‌ها و امور نظامی",
    "Diplomacy & International Relations": "دیپلماسی و روابط بین‌الملل",
    "International News & Current Affairs": "اخبار بین‌الملل و تحولات روز",
    "Energy & Maritime Security": "انرژی و امنیت دریایی",
    "Iran & Domestic Affairs": "ایران و امور داخلی",
    "US Politics & Policy": "سیاست و خط‌مشی آمریکا",
    "Humanitarian & Society": "امور بشردوستانه و جامعه",
    "Economy, Sanctions & Trade": "اقتصاد، تحریم‌ها و تجارت",
    "Media & Journalism": "رسانه و روزنامه‌نگاری"
}

html = SOURCE.read_text(encoding="utf-8")
match = re.search(r"const compressed=['\"]([A-Za-z0-9+/=]+)['\"]", html)
if not match:
    raise SystemExit("Could not find the embedded gzip archive string in linkedin-archive.html")

payload = json.loads(gzip.decompress(base64.b64decode(match.group(1))).decode("utf-8"))
if isinstance(payload, dict):
    source_posts = payload.get("posts") or payload.get("items") or payload.get("data") or []
else:
    source_posts = payload
if not isinstance(source_posts, list):
    raise SystemExit(f"Unexpected archive payload type: {type(payload).__name__}")

POSTS_DIR.mkdir(parents=True, exist_ok=True)
created = migrated = updated = 0
for source_post in source_posts:
    if not isinstance(source_post, dict):
        continue
    post_id = str(source_post.get("id") or "").strip()
    if not post_id:
        continue
    target = POSTS_DIR / f"{post_id}.json"
    if target.exists():
        existing = json.loads(target.read_text(encoding="utf-8"))
        if not existing.get("category_fa"):
            existing["category_fa"] = CATEGORY_FA.get(str(existing.get("category") or ""), "")
            target.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            updated += 1
        continue

    legacy = LEGACY_DIR / f"{post_id}.json"
    if legacy.exists():
        post = json.loads(legacy.read_text(encoding="utf-8"))
        post.setdefault("category_fa", CATEGORY_FA.get(str(post.get("category") or ""), ""))
        target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        migrated += 1
        continue

    post = {
        "id": post_id,
        "date": str(source_post.get("date") or ""),
        "title": str(source_post.get("title") or ""),
        "text": str(source_post.get("text") or ""),
        "url": str(source_post.get("url") or ""),
        "category": str(source_post.get("category") or ""),
        "category_fa": CATEGORY_FA.get(str(source_post.get("category") or ""), ""),
        "status": "published",
        "thumbnail": "",
        "image_alt": "",
        "video_url": "",
        "gallery": [],
        "gallery_alt": [],
        "gallery_caption_en": [],
        "gallery_caption_fa": []
    }
    target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    created += 1

if LEGACY_DIR.exists():
    shutil.rmtree(LEGACY_DIR)

total = len(list(POSTS_DIR.glob("*.json")))
print(f"Source posts: {len(source_posts)}")
print(f"New CMS records created: {created}")
print(f"Legacy CMS records migrated: {migrated}")
print(f"Existing records updated with missing Persian categories: {updated}")
print(f"Total CMS data files: {total}")
