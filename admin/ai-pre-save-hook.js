(() => {
  if (!window.CMS?.registerEventListener) return;
  const txt = v => String(v || "").trim();
  const has = v => Boolean(txt(v));
  const slugify = v => txt(v).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,90) || "story";
  const asList = v => Array.isArray(v) ? v : txt(v).split(/[,،]/).map(x=>x.trim()).filter(Boolean);
  CMS.registerEventListener({
    name:"preSave",
    handler:async ({entry}) => {
      const collection=entry.get("collection");
      if(!["portfolio","posts"].includes(collection)) return;
      let data=entry.get("data");
      const source=txt(data.get("ai_source_text"));
      const enabled=data.get("ai_generate_on_save") !== false;
      const requiredMissing=collection==="posts"
        ? !has(data.get("title_en")) || !has(data.get("title_fa")) || !has(data.get("body_en")) || !has(data.get("body_fa"))
        : !has(data.get("title_en")) || !has(data.get("title_fa")) || !has(data.get("description_en")) || !has(data.get("description_fa"));
      if(enabled && source && requiredMissing) {
        const endpoint=txt(localStorage.getItem("portfolio_ai_endpoint"));
        if(!endpoint) throw new Error("One-time setup required: open AI Editorial Assistant in the CMS sidebar, save your secure AI Worker URL, then retry.");
        const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          source,source_url:txt(data.get(collection==="posts"?"source_url":"original_url")),
          content_type:collection==="posts"?"News article":(txt(data.get("project_type"))||"Portfolio project"),collection
        })});
        if(!response.ok){let detail="";try{detail=(await response.json()).error||"";}catch(_){}throw new Error("AI generation failed (HTTP "+response.status+"). "+detail+" Nothing was saved.");}
        const g=await response.json();
        const fill=(field,value)=>{if(!has(data.get(field))&&has(value))data=data.set(field,value);};
        const fillList=(field,value)=>{const old=data.get(field);if(!old||(old.size??old.length??0)===0){const arr=asList(value);if(arr.length)data=data.set(field,arr);}};
        if(collection==="posts"){
          for(const f of ["title_en","title_fa","subtitle_en","subtitle_fa","excerpt_en","excerpt_fa","body_en","body_fa","category","image_alt","seo_title_en","seo_title_fa","seo_description_en","seo_description_fa"])fill(f,g[f]);
          fill("slug",g.slug||slugify(g.title_en||g.title_fa));fill("section",g.section||"work");
          fill("author","Iman Keyhanfard");fill("publication_date",new Date().toISOString());
          fillList("tags",g.tags_en);fillList("tags_fa",g.tags_fa);
        } else {
          fill("title_en",g.title_en);fill("title_fa",g.title_fa);
          fill("alternate_title_en",g.alternate_title_en||g.headline_en);fill("alternate_title_fa",g.alternate_title_fa||g.headline_fa);
          fill("description_en",g.description_en);fill("description_fa",g.description_fa);fill("image_alt",g.image_alt_en);
          fill("slug",g.slug||slugify(g.title_en||g.title_fa));fill("section","work");
          fillList("tags",g.tags_en);fillList("tags_fa",g.tags_fa);fillList("gallery_caption_en",g.caption_en);fillList("gallery_caption_fa",g.caption_fa);
          fill("date",new Date().toISOString().slice(0,10));fill("project_type","other");
        }
      }
      data=data.set("ai_source_text","").set("ai_generate_on_save",false);
      if(!has(data.get("title_en")))throw new Error("Paste source text with AI generation enabled, or enter an English headline.");
      if(!has(data.get("slug")))data=data.set("slug",slugify(data.get("title_en")));
      if(collection==="posts"){if(!has(data.get("section")))data=data.set("section","work");if(!has(data.get("author")))data=data.set("author","Iman Keyhanfard");if(!has(data.get("publication_date")))data=data.set("publication_date",new Date().toISOString());}
      return data;
    }
  });
})();
