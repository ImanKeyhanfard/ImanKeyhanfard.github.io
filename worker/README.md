# AI Editorial Assistant Worker setup

This is a small server-side proxy for the CMS's bilingual editorial assistant. It keeps the OpenAI API key out of the browser.

## Deploy
1. Create a Cloudflare Worker.
2. Paste `ai-editorial-assistant.js` as the Worker source.
3. Add Worker secret `OPENAI_API_KEY` (your OpenAI API key).
4. Optional variable `MODEL`: defaults to `gpt-4.1-mini`.
5. Deploy and copy the Worker URL.
6. Open the CMS AI Assistant custom page and paste the endpoint URL; it is saved in local browser storage.

## Safety
- The Worker only accepts requests from the portfolio's GitHub Pages origin.
- It does not store source material or generated output.
- This is a draft assistant, not a fact-checking system. Editors must verify source fidelity before publication.
- Consider adding Cloudflare rate limiting before public use to control API cost.

The current assistant page produces editable bilingual fields and copyable JSON/text. It is not yet wired to automatically write into an open Sveltia CMS entry; that would require a CMS-supported entry editing integration or a custom CMS fork.