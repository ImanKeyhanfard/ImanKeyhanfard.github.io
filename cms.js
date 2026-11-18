/* Pages CMS integration. Existing portfolio content remains the fallback. */
(() => {
  const owner = "ImanKeyhanfard", repo = "ImanKeyhanfard.github.io";
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const raw = `https://${owner.toLowerCase()}.github.io/`;
  const lang = () => document.documentElement.lang === "fa" ? "fa" : "en";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function directory(path) {
    const r = await fetch(api + path + "?ref=main&per_page=100", {headers:{"Accept":"application/vnd.github+json"}});
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
  function applyPageContent(record) {
    const content = String(record.page_content || "").trim();
    if (!content) return;
    const main = document.querySelector("body > main") || document.querySelector("main");
    if (main) {
      main.innerHTML = content;
      document.dispatchEvent(new CustomEvent("cms-page-content-applied"));
    }
  }
  function applyLocalizedCopy(settings, selector, key, addDot = false, addArrow = false, addPlus = false) {
    const element = document.querySelector(selector);
    if (!element) return;
    const en = settings[key + "_en"], fa = settings[key + "_fa"];
    if (!en && !fa) return;
    const format = value => esc(value).replace(/\n/g, "<br>") + (addDot ? '<span class="red-dot">.</span>' : "") + (addArrow ? ' <b>↗</b>' : "") + (addPlus ? '<span>+</span>' : "");
    if (en) element.dataset.en = format(en);
    if (fa) element.dataset.fa = format(fa);
    element.innerHTML = element.dataset[lang()] || element.dataset.en || element.dataset.fa || "";
  }
  function applyHomepageLabels(settings) {
    const labels = settings.home_labels || {};
    const fields = [
      [".availability span:last-child","availability"],
      [".hero-actions .primary-action span:first-child","hero_cta_services"],
      [".hero-actions .text-action span:first-child","hero_cta_work"],
      [".home-note .micro-label","profile_label"],
      [".home-stat-card .stat-label","stats_label"],
      [".home-stat-card .stat-list span:nth-child(1)","stat_item_1"],
      [".home-stat-card .stat-list span:nth-child(2)","stat_item_2"],
      [".home-stat-card .stat-list span:nth-child(3)","stat_item_3"],
      [".home-stat-card .stat-list span:nth-child(4)","stat_item_4"],
      [".home-archive .view-heading .micro-label","archive_label"],
      [".home-archive > div:nth-of-type(2) .micro-label","archive_period"],
      [".home-archive > div:nth-of-type(2) .original-post","archive_link"],
      ["#view-work > .view-heading .micro-label","work_label"],
      ["#view-work .work-aside > .micro-label","work_browse_label"],
      ["#view-projects > .view-heading .micro-label","projects_label"],
      ["#view-experience > .view-heading .micro-label","experience_label"],
      ["#view-services > .view-heading .micro-label","services_label"],
      ["#view-contact .contact-hero .micro-label","contact_label"],
      [".delivery-flow > .micro-label","process_label"],
      [".delivery-flow .flow-steps span:nth-of-type(1) b","process_step_1"],
      [".delivery-flow .flow-steps span:nth-of-type(2) b","process_step_2"],
      [".delivery-flow .flow-steps span:nth-of-type(3) b","process_step_3"],
      [".delivery-flow .flow-steps span:nth-of-type(4) b","process_step_4"],
      [".delivery-flow .flow-steps span:nth-of-type(5) b","process_step_5"],
      [".delivery-flow .flow-steps span:nth-of-type(6) b","process_step_6"],
      [".delivery-flow p","process_intro"],
      [".contact-grid .contact-card:nth-child(1) .micro-label","contact_email_label"],
      [".contact-grid .contact-card:nth-child(2) .micro-label","contact_linkedin_label"],
      [".contact-grid .contact-card:nth-child(3) .micro-label","contact_phone_label"],
      [".site-footer .footer-brand span","footer_tagline"],
      [".site-footer .footer-end span:first-child","footer_status"],
      [".welcome-drop .welcome-kicker","welcome_kicker"],
      [".welcome-drop .welcome-role","welcome_role"],
      [".welcome-drop p","welcome_intro"]
    ];
    for (const [selector,key] of fields) applyLocalizedCopy(labels,selector,key,false);
    applyLocalizedCopy(labels,".home-note .inline-link","profile_cta",false,true);
    applyLocalizedCopy(labels,".home-stat-card .stat-huge","years_value",false,false,true);
  }
  function applyHomepageCopy(settings) {
    applyHomepageLabels(settings);
    const fields = [
      [".hero-overline","home_hero_overline",false],
      [".hero-title","home_hero_roles",false],
      [".hero-lead","home_hero_intro",false],
      [".home-note h2","home_profile_heading",false],
      [".home-note p","home_profile_intro",false],
      [".home-archive .view-heading h2","home_archive_heading",true],
      [".home-archive .view-heading p","home_archive_intro",false],
      ["#view-work > .view-heading h2","home_work_heading",true],
      ["#view-work > .view-heading p","home_work_intro",false],
      ["#view-projects > .view-heading h2","home_projects_heading",true],
      ["#view-projects > .view-heading p","home_projects_intro",false],
      ["#view-experience > .view-heading h2","home_experience_heading",true],
      ["#view-experience > .view-heading p","home_experience_intro",false],
      ["#view-services > .view-heading h2","home_services_heading",true],
      ["#view-services > .view-heading p","home_services_intro",false],
      ["#view-contact .contact-hero h2","home_contact_heading",true],
      ["#view-contact .contact-hero p","home_contact_intro",false],
      ["#view-contact .contact-cta span:first-child","home_contact_cta",false]
    ];
    for (const [selector,key,dot] of fields) applyLocalizedCopy(settings,selector,key,dot);
  }
  function applyArchiveCopy(settings) {
    if (!location.pathname.endsWith("linkedin-archive.html")) return;
    const fields = [
      [".hero .eyebrow","archive_page_eyebrow",false],
      [".hero h1","archive_page_heading",false],
      [".hero p","archive_page_intro",false],
      [".foot","archive_page_footer",false]
    ];
    for (const [selector,key,dot] of fields) applyLocalizedCopy(settings,selector,key,dot);
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
    for (const [language, value] of [["en",record.alternate_en],["fa",record.alternate_fa],["x-default",record.alternate_en]]) {
      const href = safeUrl(value);
      if (!href) continue;
      let alternate = document.querySelector('link[rel="alternate"][hreflang="' + language + '"]');
      if (!alternate) { alternate = document.createElement("link"); alternate.rel = "alternate"; alternate.hreflang = language; document.head.appendChild(alternate); }
      alternate.href = href;
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
    ensureMeta('meta[name="robots"]', "content", record.noindex === true ? "noindex, nofollow" : "index, follow");
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
  function applySectionLayouts(sections) {
    const clamp = (value, fallback, min, max) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    for (const section of sections) {
      const slug = String(section.slug || section.name || "");
      const panel = document.querySelector('[data-view-panel="' + CSS.escape(slug) + '"]');
      if (!panel) continue;
      if (section.layout) panel.dataset.cmsLayout = section.layout;
      const desktop = clamp(section.columns_desktop, 3, 1, 6);
      const tablet = clamp(section.columns_tablet, 2, 1, 4);
      const mobile = clamp(section.columns_mobile, 1, 1, 2);
      panel.style.setProperty("--cms-grid-columns", desktop);
      panel.style.setProperty("--cms-grid-columns-tablet", tablet);
      panel.style.setProperty("--cms-grid-columns-mobile", mobile);
      panel.style.setProperty("--cms-section-grid-gap", clamp(section.grid_gap, 12, 8, 32) + "px");
      panel.style.setProperty("--cms-section-card-min-width", clamp(section.card_min_width, 220, 180, 340) + "px");
      panel.style.setProperty("--cms-section-content-width", clamp(section.content_width, 1600, 900, 1800) + "px");
      panel.style.setProperty("--cms-view-padding-top", clamp(section.padding_top, 50, 12, 120) + "px");
      panel.style.setProperty("--cms-view-padding-bottom", clamp(section.padding_bottom, 42, 12, 120) + "px");
      const ratio = ["16/9","4/3","1/1","3/4","auto"].includes(section.image_ratio) ? section.image_ratio : "16/9";
      panel.style.setProperty("--cms-section-image-ratio", ratio);
      if (section.visible === false) panel.hidden = true;
      else panel.hidden = false;
    }
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
    const items=[...posts.filter(x=>x.status==="published").map(x=>({...x,_kind:"post"})),...projects.filter(x=>x.status==="published"&&x.featured===true).map(x=>({...x,_kind:"project"}))];
    if(!items.length)return;
    const section=document.createElement("section"); section.className="cms-published-items";
    section.style.cssText="margin:32px 0 12px;padding-top:22px;border-top:1px solid var(--line)";
    const heading=document.createElement("h3"); heading.textContent=lang()==="fa"?"مطالب و پروژه‌های منتشرشده از CMS":"Published from CMS"; heading.style.cssText="font-size:20px;margin:0 0 16px";
    const grid=document.createElement("div");grid.className="cms-content-grid";
    items.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)) || (Number(a.order)||999)-(Number(b.order)||999) || String(b.publication_date||b.date||"").localeCompare(String(a.publication_date||a.date||"")));
    for(const x of items){
      const title=x["title_"+lang()]||x.title_en||"";
      const rawDesc=x["excerpt_"+lang()]||x["description_"+lang()]||x.excerpt_en||x.description_en||"";
      const desc=/original portfolio script also uses an alternate headline/i.test(rawDesc)||/نسخه.{0,4}اصلی اسکریپت/.test(rawDesc)?"":rawDesc;
      const tagSource=lang()==="fa"?(x.tags_fa||[]):(x.tags||[]);
      const tags=Array.isArray(tagSource)?tagSource.filter(t=>!String(t).startsWith("category:")).slice(0,4):[];
      const url=safeUrl(x.source_url||x.original_url||x.video_url), image=safeUrl(x.cover_image||x.thumbnail||(Array.isArray(x.gallery)?x.gallery[0]:""));
      const card=document.createElement("article");card.style.cssText="border:1px solid var(--line);padding:16px;background:#ffffff05;border-radius:var(--cms-card-radius);overflow:hidden";
      card.innerHTML=`<div style="font-size:9px;color:var(--muted);margin-bottom:8px">${esc(x.category||x.project_type||"")}</div><h4 style="font-size:15px;margin:0 0 8px">${esc(title)}</h4>${desc?`<p style="font-size:11px;color:var(--muted);line-height:1.8">${esc(desc)}</p>`:""}${tags.length?`<div class="cms-card-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0">${tags.map(t=>`<span style="font-size:9px;border:1px solid var(--line);border-radius:20px;padding:3px 8px;color:var(--muted)">${esc(t)}</span>`).join("")}</div>`:""}${url?`<a class="original-post" target="_blank" rel="noopener noreferrer" href="${esc(url)}">${lang()==="fa"?"مشاهده مطلب":"Open original"} ↗</a>`:""}`;
      if(image){const img=document.createElement("img");img.src=image;img.alt=String(x.image_alt||title);img.loading="lazy";img.style.cssText="width:100%;aspect-ratio:var(--cms-section-image-ratio,16/9);object-fit:cover;border-radius:var(--cms-card-radius);margin-bottom:12px";card.prepend(img);}
      grid.append(card);
    }
    section.append(heading,grid);host.after(section);
  }

  document.addEventListener("portfolio-language-change", () => {
    const frame = document.getElementById("projectsFrame");
    if (!frame) return;
    const target = lang() === "fa" ? "/fa/projects.html?v=20261119e" : "/projects.html?v=20261119e";
    if (frame.getAttribute("src") !== target) frame.setAttribute("src", target);
  });
  async function start() {
    try {
      const [experience,services,posts,projects,sections,seoPages,settings]=await Promise.all([
        directory("content/experience").catch(()=>[]),directory("content/services").catch(()=>[]),
        directory("content/posts").catch(()=>[]),directory("content/portfolio").catch(()=>[]),
        directory("content/sections").catch(()=>[]),directory("content/seo-pages").catch(()=>[]),
        one("content/site-settings.json").catch(()=>null)
      ]);
      if(sections.length){applyNavigation(sections);applySectionLayouts(sections);}
      const currentPath = decodeURIComponent(location.pathname.replace(/^\//, "") || "index.html");
      const pageSeo = seoPages.find(item => String(item.page_path || "").replace(/^\//, "") === currentPath);
      if(experience.length)renderExperience(experience);
      if(services.length)renderServices(services);
      renderCmsItems(posts,projects);
      if(settings){
        applyLayoutSettings(settings);
        applyHomepageCopy(settings);
        applyArchiveCopy(settings);
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
        if(email){
          document.querySelectorAll('a[href^="mailto:"]').forEach(a=>a.href="mailto:"+email);
          document.querySelectorAll('.contact-card[href^="mailto:"] strong,.footer-contact a[href^="mailto:"]').forEach(a=>a.textContent=email);
        }
        if(phone){
          document.querySelectorAll('.contact-card strong[dir="ltr"],.footer-contact a[dir="ltr"]').forEach(a=>a.textContent=phone);
        }
        if(linkedin)document.querySelectorAll('a[href*="linkedin.com"]').forEach(a=>a.href=linkedin);
        if(whatsapp)document.querySelectorAll('a[href*="wa.me"]').forEach(a=>a.href=whatsapp);
        const tagline=(settings.home_labels||{})["welcome_intro_"+lang()]||settings["tagline_"+lang()];
        if(tagline){const welcome=document.querySelector(".welcome-drop p");if(welcome)welcome.textContent=tagline;}
        const profile=safeUrl(settings.profile_image), contactImage=safeUrl(settings.contact_image);
        if(profile)document.querySelectorAll(".hero-profile-photo").forEach(img=>img.src=profile);
        if(contactImage)document.querySelectorAll(".contact-profile-photo").forEach(img=>img.src=contactImage);
      }
      if(pageSeo) {
        applyPageContent(pageSeo);
        applySeoRecord(pageSeo);
        document.addEventListener("portfolio-language-change",()=>{applyPageContent(pageSeo);applySeoRecord(pageSeo);});
      }
      document.documentElement.dataset.cmsLoaded="true";
      document.dispatchEvent(new CustomEvent("cms-ready"));
    } catch(error) {
      console.warn("Pages CMS content could not be loaded; using built-in portfolio content.",error);
      document.dispatchEvent(new CustomEvent("cms-ready"));
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();