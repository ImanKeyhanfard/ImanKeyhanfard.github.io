from pathlib import Path
import base64
import gzip
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "linkedin-archive.html"
OUTPUT = ROOT / "archive-export-preview.json"

html = SOURCE.read_text(encoding="utf-8")
match = re.search(r"const compressed=['\"]([A-Za-z0-9+/=]+)['\"]", html)
if not match:
    raise SystemExit("Could not find the embedded gzip archive string in linkedin-archive.html")

raw = gzip.decompress(base64.b64decode(match.group(1)))
data = json.loads(raw.decode("utf-8"))
if isinstance(data, dict):
    posts = data.get("posts") or data.get("items") or data.get("data") or []
else:
    posts = data
if not isinstance(posts, list):
    raise SystemExit(f"Unexpected archive payload type: {type(posts).__name__}")

def compact(value):
    if isinstance(value, str) and len(value) > 350:
        return value[:350] + "…"
    if isinstance(value, list):
        return [compact(item) for item in value[:8]]
    if isinstance(value, dict):
        return {key: compact(item) for key, item in list(value.items())[:30]}
    return value

categories = sorted({str(post.get("category", "")) for post in posts if isinstance(post, dict)})
sample = [compact(post) for post in posts[:3] if isinstance(post, dict)]
summary = {
    "source": "linkedin-archive.html embedded gzip export",
    "post_count": len(posts),
    "payload_type": type(data).__name__,
    "first_post_keys": list(posts[0].keys()) if posts and isinstance(posts[0], dict) else [],
    "categories": categories,
    "sample_posts": sample,
}
OUTPUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(posts)} posts across {len(categories)} categories into {OUTPUT.name}")
