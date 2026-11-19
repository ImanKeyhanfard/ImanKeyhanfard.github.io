// Sveltia CMS pre-save AI hook. Source text is cleared before it is committed.
(() => {
  if (!window.CMS?.registerEventListener) return;
  CMS.registerEventListener({
    name: "preSave",
    handler: async ({ entry }) => {
      if (entry.get("collection") !== "portfolio") return;
      const data = entry.get("data");
      const source = String(data.get("ai_source_text") || "").trim();
      const enabled = data.get("ai_generate_on_save") === true;
      if (!enabled || !source) return;
      const endpoint = String(localStorage.getItem("portfolio_ai_endpoint") || "").trim();
      if (!endpoint) throw new Error("AI generation is enabled, but no AI Worker endpoint is saved. Open AI Editorial Assistant and save the endpoint first.");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          source_url: data.get("original_url") || "",
          content_type: data.get("project_type") || "Portfolio project"
        })
      });
      if (!response.ok) throw new Error("AI content generation failed (HTTP " + response.status + "). Entry was not saved.");
      const generated = await response.json();
      let next = data;
      const hasItems = value => value && ((value.size ?? value.length ?? 0) > 0);\n      const fill = (field, value) => {
        if (value && !String(next.get(field) || "").trim()) next = next.set(field, value);
      };
      fill("title_en", generated.title_en);
      fill("title_fa", generated.title_fa);
      fill("alternate_title_en", generated.alternate_title_en || generated.headline_en);
      fill("alternate_title_fa", generated.alternate_title_fa || generated.headline_fa);
      fill("description_en", generated.description_en);
      fill("description_fa", generated.description_fa);
      fill("image_alt", generated.image_alt_en);
      if (!hasItems(next.get("tags")) && generated.tags_en) next = next.set("tags", String(generated.tags_en).split(/[,،]/).map(x => x.trim()).filter(Boolean));
      if (!hasItems(next.get("tags_fa")) && generated.tags_fa) next = next.set("tags_fa", String(generated.tags_fa).split(/[,،]/).map(x => x.trim()).filter(Boolean));
      if (!hasItems(next.get("gallery_caption_en")) && generated.caption_en) next = next.set("gallery_caption_en", [generated.caption_en]);
      if (!hasItems(next.get("gallery_caption_fa")) && generated.caption_fa) next = next.set("gallery_caption_fa", [generated.caption_fa]);
      // Never commit pasted source material. Generated entries remain drafts for editorial review.
      next = next.set("ai_source_text", "").set("ai_generate_on_save", false);
      if (next.get("status") === "published") next = next.set("status", "draft");
      return next;
    }
  });
})();