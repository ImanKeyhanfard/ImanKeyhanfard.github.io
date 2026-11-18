/* Pages CMS integration. Existing portfolio content remains the fallback. */
(() => {
  const owner = "ImanKeyhanfard", repo = "ImanKeyhanfard.github.io";
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const raw = `https://${owner.toLowerCase()}.github.io/`;
  const lang = () => document.documentElement.lang === "fa" ? "fa" : "en";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function directory(path) {
    const r = await fetch(api + path, {headers:{"Accept":"application/vnd.github+json"}});
    if (!r.ok) throw new Error("GitHub API " + r.status);
    const files = await r.json();
    return Promise.all(files.filter(f => f.type === "file" && f.name.endsWith(".json"))
      .map(async f => { const x = await fetch(f.download_url + "?v=" + Date.now(), {cache:"no-store"}); if (!x.ok) throw new Error("Content " + x.status); return x.json(); }));
  }
  async function one(path) {
    const r = await fetch(raw + path + "?v=" + Date.now());
    if (!r.ok) return null;
    return r.json();
  }
  function text(v) { return v || ""; }
  function applyLayoutSettings(settings) {
    const root = document.documentElement;
    const clamp = (value, fallback, min, max) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    const gutter = clamp(settings.layout_page_gutter, 7.2, 3, 12);
    const radius = clamp(settings.layout_card_radius, 8, 0, 24);
    const gap = clamp(settings.layout_grid_gap, 12, 8, 32);
    const width = clamp(settings.layout_content_width, 1600, 900, 1800);
    const sectionGap = clamp(settings.layout_section_gap, 24, 8, 64);
    const cardMin = clamp(settings.layout_card_min_width, 220, 180, 340);
    root.style.setProperty("--cms-page-gutter", `clamp(16px, ${gutter}vw, 120px)`);
    root.style.setProperty("--cms-card-radius", `${radius}px`);
    root.style.setProperty("--cms-grid-gap", `${gap}px`);
    root.style.setProperty("--cms-content-width", `${width}px`);
    root.style.setProperty("--cms-section-gap", `${sectionGap}px`);
    root.style.setProperty("--cms-card-min-width", `${cardMin}px`);
  }
  function safeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(https?:|mailto:|tel:)/i.test(raw) || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return raw;
    return "";
  }
  function ensureMeta(selector, attribute, value) {
    if (!value) return;
    let node = document.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      const match = selector.match(/\[(name|property)=["']([^"']+)["']\]/);
      if (match) node.setAttribute(match[1], match[2]);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  }
  function applySeoRecord(record) {
    const l = lang();
    const title = record["title_" + l] || record.title_en;
    const description = record["description_" + l] || record.description_en;
    const keywords = record["keywords_" + l] || record.keywords_en;
    if (title) document.title = title;
    ensureMeta('meta[name="description"]', "content", description);
    ensureMeta('meta[name="keywords"]', "content", keywords);
    const canonical = safeUrl(record.canonical_url);
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = canonical;
      ensureMeta('meta[property="og:url"]', "content", canonical);
    }
    ensureMeta('meta[property="og:title"]', "content", title);
    ensureMeta('meta[property="og:description"]', "content", description);
    const image = safeUrl(record.og_image);
    if (image) {
      ensureMeta('meta[property="og:image"]', "content", new URL(image, location.origin).href);
      ensureMeta('meta[name="twitter:image"]', "content", new URL(image, location.origin).href);
    }
    ensureMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    ensureMeta('meta[name="twitter:title"]', "content", title);
    ensureMeta('meta[name="twitter:description"]', "content", description);
    if (record.noindex === true) ensureMeta('meta[name="robots"]', "content", "noindex, nofollow");
  }
  function applyNavigation(sections) {
    const nav = document.querySelector(".main-tabs");
    if (!nav || !sections.length) return;
    const buttons = [...nav.querySelectorAll(".nav-tab[data-view]")];
    const ordered = [];
    for (const section of [...sections].sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999))) {
      const button = buttons.find(b => b.dataset.view === (section.slug || section.name));
      if (!button) continue;
      if (section.visible === false) button.hidden = true;
      else button.hidden = false;
      if (section.label_en) button.dataset.en = section.label_en;
      if (section.label_fa) button.dataset.fa = section.label_fa;
      button.textContent = button.dataset[lang()] || section.label_en || button.textContent;
      ordered.push(button);
    }
    for (const button of buttons) if (!ordered.includes(button)) ordered.push(button);
    const archive = nav.querySelector('a.nav-tab[href*="linkedin-archive"]');
    ordered.forEach(button => nav.insertBefore(button, archive || null));
  }
  function renderExperience(items) {
    const visible = items.filter(x => x.visible !== false).sort((a,b)=>(a.order||999)-(b.order||999));
    if (!visible.length) return;
    const tabs = document.getElementById("experienceTabs"), panel = document.getElementById("experienceContent");
    if (!tabs || !panel) return;
    function show(item, index) {
      const l=lang(), org=text(item["organization_"+l])||item.organization_en||"", role=text(item["role_"+l])||item.role_en||"";
      const desc=text(item["description_"+l])||item.description_en||"";
      const caps=item["capabilities_"+l]?.length?item["capabilities_"+l]:(item.capabilities_en||[]);
      panel.innerHTML = `${item.image?`<div class="experience-visual"><img src="${esc(item.image)}" alt="${esc(item.image_alt||org)}" loading="lazy"><span>${esc(item.image_caption||"FIELD & EDITORIAL EXPERIENCE")}</span></div>`:""}<div class="period">${esc(item.period)}</div><h3>${esc(org)}</h3><div class="role">${esc(role)}</div><p>${esc(desc)}</p>${caps.length?`<h4>${l==="fa"?"توانمندی‌های مرتبط":"RELEVANT CAPABILITIES"}</h4><ul class="capability-list">${caps.map(c=>`<li>${esc(c)}</li>`).join("")}</ul>`:""}${(item.client_value||item.client_value_en||item.client_value_fa)?`<div class="client-ideas"><strong>${l==="fa"?"ارزش این تجربه برای پروژه شما":"HOW THIS EXPERIENCE SUPPORTS YOUR PROJECT"}</strong><p>${esc(item["client_value_"+l]||item.client_value)}</p></div>`:""}`;
      tabs.querySelectorAll(".exp-tab").forEach((b,i)=>b.classList.toggle("active",i===index));
    }
    tabs.innerHTML=visible.map((x,i)=>`<button class="exp-tab" type="button" data-cms-exp="${i}">${esc(x["tab_"+lang()]||x["organization_"+lang()]||x.organization_en)}</button>`).join("");
    tabs.querySelectorAll("[data-cms-exp]").forEach(b=>b.addEventListener("click",()=>show(visible[Number(b.dataset.cmsExp)],Number(b.dataset.cmsExp))));
    show(visible[0],0);
    document.addEventListener("portfolio-language-change",()=>show(visible[Number(tabs.querySelector(".active")?.dataset.cmsExp)||0],Number(tabs.querySelector(".active")?.dataset.cmsExp)||0));
  }
  function renderServices(items) {
    const visible=items.filter(x=>x.visible!==false).sort((a,b)=>(a.order||999)-(b.order||999));
    if (!visible.length) return;
    const tabs=document.getElementById("serviceTabs"), panel=document.getElementById("serviceContent");
    if(!tabs||!panel)return;
    function show(item,index) {
      const l=lang(), title=text(item["title_"+l])||item.title_en||"", intro=text(item["intro_"+l])||item.intro_en||"", details=item["details_"+l]?.length?item["details_"+l]:(item.details_en||[]);
      panel.innerHTML=`<div class="service-expanded">${item.image?`<div class="service-visual"><img src="${esc(item.image)}" alt="${esc(item.image_alt||title)}" loading="lazy"></div>`:""}<div class="service-detail"><div class="service-content-head"><div><h3>${esc(title)}</h3><p class="service-intro">${esc(intro)}</p></div></div><div class="service-columns"><div class="service-column"><h4>${l==="fa"?"دامنه خدمات":"SERVICE SCOPE"}</h4><ul>${details.slice(0,Math.ceil(details.length/2)).map(d=>`<li>${esc(d)}</li>`).join("")}</ul></div><div class="service-column"><h4>${l==="fa"?"اجرا و تحویل":"PRODUCTION & DELIVERY"}</h4><ul>${details.slice(Math.ceil(details.length/2)).map(d=>`<li>${esc(d)}</li>`).join("")}</ul></div></div>${item.delivery_en||item.delivery_fa?`<div class="service-client-use"><h4>${l==="fa"?"خروجی قابل سفارش":"WHAT YOU CAN COMMISSION"}</h4><p>${esc(item["delivery_"+l]||item.delivery_en||item.delivery_fa)}</p></div>`:""}</div></div>`;
      tabs.querySelectorAll(".service-tab").forEach((b,i)=>b.classList.toggle("active",i===index));
    }
    tabs.innerHTML=visible.map((x,i)=>`<button class="service-tab" type="button" data-cms-service="${i}">${esc(x["tab_"+lang()]||x["title_"+lang()]||x.title_en)}</button>`).join("");
    tabs.querySelectorAll("[data-cms-service]").forEach(b=>b.addEventListener("click",()=>show(visible[Number(b.dataset.cmsService)],Number(b.dataset.cmsService))));
    show(visible[0],0);
    document.addEventListener("portfolio-language-change",()=>{const i=Number(tabs.querySelector(".active")?.dataset.cmsService)||0;show(visible[i],i);});
  }
  function renderCmsItems(posts, projects) {
    const host=document.querySelector("#view-work .work-layout");
    if(!host || (!posts.length&&!projects.length)) return;
    const items=[...posts.filter(x=>x.status==="published").map(x=>({...x,_kind:"post"})),...projects.filter(x=>x.status==="published").map(x=>({...x,_kind:"project"}))];
    if(!items.length)return;
    const section=document.createElement("section"); section.className="cms-published-items";
    section.style.cssText="margin:32px 0 12px;padding-top:22px;border-top:1px solid var(--line)";
    const heading=document.createElement("h3"); heading.textContent=lang()==="fa"?"مطالب و پروژه‌های منتشرشده از CMS":"Published from CMS"; heading.style.cssText="font-size:20px;margin:0 0 16px";
    const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px";
    items.sort((a,b)=>String(b.publication_date||b.date||"").localeCompare(String(a.publication_date||a.date||"")));
    for(const x of items){
      const title=x["title_"+lang()]||x.title_en||"", desc=x["excerpt_"+lang()]||x["description_"+lang()]||x.excerpt_en||x.description_en||"";
      const url=x.source_url||x.original_url||x.video_url;
      const card=document.createElement("article");card.style.cssText="border:1px solid var(--line);padding:16px;background:#ffffff05";
      card.innerHTML=`<div style="font-size:9px;color:var(--muted);margin-bottom:8px">${esc(x.category||x.project_type||"")}</div><h4 style="font-size:15px;margin:0 0 8px">${esc(title)}</h4><p style="font-size:11px;color:var(--muted);line-height:1.8">${esc(desc)}</p>${url?`<a class="original-post" target="_blank" rel="noopener" href="${esc(url)}">${lang()==="fa"?"مشاهده مطلب":"Open original"} ↗</a>`:""}`;
      grid.append(card);
    }
    section.append(heading,grid);host.after(section);
  }
  async function start() {
    try {
      const [experience,services,posts,projects,sections,seoPages,settings]=await Promise.all([
        directory("content/experience").catch(()=>[]),directory("content/services").catch(()=>[]),
        directory("content/posts").catch(()=>[]),directory("content/portfolio").catch(()=>[]),
        directory("content/sections").catch(()=>[]),directory("content/seo-pages").catch(()=>[]),
        one("content/site-settings.json").catch(()=>null)
      ]);
      if(sections.length)applyNavigation(sections);
      const currentPath = decodeURIComponent(location.pathname.replace(/^\//, "") || "index.html");
      const pageSeo = seoPages.find(item => String(item.page_path || "").replace(/^\//, "") === currentPath);
      if(pageSeo)applySeoRecord(pageSeo);
      if(experience.length)renderExperience(experience);
      if(services.length)renderServices(services);
      renderCmsItems(posts,projects);
      if(settings){
        applyLayoutSettings(settings);
        if(settings.site_title)document.title=settings["seo_title_"+lang()]||settings.site_title;
        const meta=document.querySelector('meta[name="description"]');
        if(meta){const d=settings["seo_description_"+lang()]||settings.seo_description_en;if(d)meta.content=d;}
        ensureMeta('meta[name="keywords"]',"content",settings["seo_keywords_"+lang()]||settings.seo_keywords_en);
        if(settings.seo_og_image){
          const image=safeUrl(settings.seo_og_image);
          if(image){ensureMeta('meta[property="og:image"]',"content",new URL(image,location.origin).href);ensureMeta('meta[name="twitter:image"]',"content",new URL(image,location.origin).href);}
        }
        ensureMeta('meta[property="og:title"]',"content",document.title);
        ensureMeta('meta[property="og:description"]',"content",settings["seo_description_"+lang()]||settings.seo_description_en);
        ensureMeta('meta[name="twitter:card"]',"content","summary_large_image");
        ensureMeta('meta[name="twitter:title"]',"content",document.title);
        ensureMeta('meta[name="twitter:description"]',"content",settings["seo_description_"+lang()]||settings.seo_description_en);
        const email=settings.email, phone=settings.phone, linkedin=settings.linkedin, whatsapp=settings.whatsapp;
        if(email)document.querySelectorAll('a[href^="mailto:"]').forEach(a=>a.href="mailto:"+email);
        if(phone)document.querySelectorAll('.contact-card strong[dir="ltr"]').forEach(a=>a.textContent=phone);
        if(linkedin){const a=document.querySelector('.contact-card[href*="linkedin.com"]');if(a)a.href=linkedin;}
        if(whatsapp){const a=document.querySelector('.contact-card[href*="wa.me"]');if(a)a.href=whatsapp;}
      }
      document.documentElement.dataset.cmsLoaded="true";
    } catch(error) { console.warn("Pages CMS content could not be loaded; using built-in portfolio content.",error); }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();