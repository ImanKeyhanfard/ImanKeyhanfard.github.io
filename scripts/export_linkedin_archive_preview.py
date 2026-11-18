from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
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

POSTS_DIR.mkdir(parents=True, exist_ok=True)
migrated = updated = 0

if LEGACY_DIR.exists():
    for legacy in LEGACY_DIR.glob("*.json"):
        post = json.loads(legacy.read_text(encoding="utf-8"))
        post_id = str(post.get("id") or legacy.stem).strip()
        if not post_id:
            continue
        post.setdefault("category_fa", CATEGORY_FA.get(str(post.get("category") or ""), ""))
        post.setdefault("image_alt", "")
        target = POSTS_DIR / f"{post_id}.json"
        if target.exists():
            existing = json.loads(target.read_text(encoding="utf-8"))
            changed = False
            if not existing.get("category_fa"):
                existing["category_fa"] = post.get("category_fa", "")
                changed = True
            if "image_alt" not in existing:
                existing["image_alt"] = ""
                changed = True
            if changed:
                target.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                updated += 1
        else:
            target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            migrated += 1
    shutil.rmtree(LEGACY_DIR)

total = len(list(POSTS_DIR.glob("*.json")))
if total == 0:
    raise SystemExit("No archive records were found to migrate.")
print(f"Legacy archive records migrated: {migrated}")
print(f"Existing records updated with missing fields: {updated}")
print(f"Total Jekyll CMS data files: {total}")
