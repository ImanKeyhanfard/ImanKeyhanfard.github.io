# AI Quick Publish setup

The CMS supports one-source quick publishing for both News & Articles and Portfolio Projects. Paste source text into the first field, leave AI generation enabled, and save. AI fills only missing fields; manually entered values are preserved. The temporary source text is removed before commit.

## One-time secure AI setup (required)

1. Create a Cloudflare Worker and paste the contents of workers/ai-content-worker.js.
2. Add a Worker secret named OPENAI_API_KEY containing your OpenAI API key. Optionally add a variable OPENAI_MODEL (default: gpt-4.1-mini).
3. Deploy the Worker and copy its HTTPS URL.
4. Open https://imankeyhanfard.github.io/admin/, choose AI Editorial Assistant, enter the Worker URL, and click Save endpoint. The URL is stored only in this browser's local storage.
5. In News and Articles or Portfolio Projects, create an entry, paste the source into the first field, keep AI generation enabled, optionally add a source URL or media, and save. Keep Status = published for immediate publication; choose draft for review.

## Safeguards

- Existing manually supplied field values are never overwritten.
- Pasted source material is cleared before commit and is not stored in the public repository.
- AI instructions prohibit inventing names, dates, figures, quotations, or attribution.
- Review factual details and media rights before publication.
- If the Worker is unavailable or fails, saving is blocked rather than silently publishing incomplete AI content.
- Keep the API key in Worker secrets; never paste it into the CMS or browser console.

GitHub Pages is static and cannot safely store an AI API key. This Worker is the secure server-side component.