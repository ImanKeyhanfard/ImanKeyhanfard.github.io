(() => {
  const root = document.getElementById("view-work");
  if (!root) return;
  const tabs = document.getElementById("topicTabs");
  const deck = document.getElementById("topicDeck");
  const counter = document.getElementById("topicCount");
  const eyebrow = document.getElementById("topicEyebrow");
  const prev = document.getElementById("topicPrev");
  const next = document.getElementById("topicNext");
  const progress = document.getElementById("storyProgress");
  if (!tabs || !deck || !counter || !eyebrow || !prev || !next || !progress) return;

  const owner = "ImanKeyhanfard";
  const repo = "ImanKeyhanfard.github.io";
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const lang = () => document.documentElement.lang === "fa" ? "fa" : "en";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const safeColor = value => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#6daeff";

  async function directory(path) {
    const response = await fetch(api + path + "?ref=main&per_page=100", {
      headers: {"Accept":"application/vnd.github+json"},
      cache: "no-store"
    });
    if (!response.ok) throw new Error("GitHub API " + response.status + " for " + path);
    const files = await response.json();
    return Promise.all(files.filter(file => file.type === "file" && file.name.endsWith(".json"))
      .map(async file => {
        const result = await fetch(file.download_url + "?v=" + Date.now(), {cache:"no-store"});
        if (!result.ok) throw new Error("Could not load " + file.name);
        return result.json();
      }));
  }

  let groups = [];
  let groupIndex = 0;
  let itemIndex = 0;
  let expanded = false;
  let progressValue = 0;
  let lastTick = Date.now();
  let timer = null;
  let ignoreClick = false;
  let pointerStart = null;
  let pointerStartY = null;
  const duration = 6800;

  const currentGroup = () => groups[groupIndex];
  const currentPost = () => currentGroup()?.items?.[itemIndex];

  function itemId(post) {
    const fromSlug = String(post.slug || "").match(/linkedin-(\d+)/);
    if (fromSlug) return fromSlug[1];
    const fromUrl = String(post.original_url || "").match(/activity-(\d+)/);
    return fromUrl ? fromUrl[1] : "";
  }

  function safeMedia(value) {
    const raw=String(value||"").trim();
    return /^(https:\/\/|\/|\.\/|\.\.\/)/i.test(raw) ? raw : "";
  }

  function mediaMarkup(post,title,isFa) {
    const video=safeMedia(post.video_url);
    const image=safeMedia(post.thumbnail || (Array.isArray(post.gallery) ? post.gallery[0] : ""));
    if(video) return '<video class="work-media-video" controls playsinline preload="metadata"><source src="' + esc(video) + '"></video>';
    if(image) return '<img class="work-media-image" src="' + esc(image) + '" alt="' + esc(title) + '" loading="lazy">';
    const id=itemId(post);
    if(id) return '<iframe loading="lazy" tabindex="-1" aria-hidden="true" title="' + esc(title) +
      '" src="https://www.linkedin.com/embed/feed/update/urn:li:activity:' + esc(id) + '?compact=1"></iframe>';
    return '<div class="story-media-fallback">' + esc(isFa ? "پیش‌نمایش در دسترس نیست" : "Preview unavailable") + '</div>';
  }

  function itemDescription(post, topic) {
    const value = post["description_" + lang()] || post.description_en || post.description_fa || "";
    if (value && !/original portfolio script also uses an alternate headline/i.test(value) &&
        !/نسخه.{0,5}اصلی اسکریپت/.test(value)) return value;
    const tags = (post.tags || []).filter(tag => !String(tag).startsWith("category:"));
    if (lang() === "fa") {
      return "این مطلب در دسته‌بندی «" + (topic.label_fa || "نمونه‌کارهای منتخب") + "» قرار دارد. برای مشاهده متن کامل و رسانه‌های پیوست، پست اصلی لینکدین را باز کنید.";
    }
    return tags.length
      ? "This post is part of the " + topic.label_en + " coverage thread, with a focus on " + tags.join(", ") + ". Open the original LinkedIn item for its full text and attached media."
      : "Open the original LinkedIn item to review its full text and attached media.";
  }

  function renderTabs() {
    tabs.innerHTML = groups.map((group, index) =>
      '<button class="topic-tab ' + (index === groupIndex ? "active" : "") +
      '" type="button" role="tab" aria-selected="' + (index === groupIndex) +
      '" data-group="' + index + '"><span>' + esc(group["label_" + lang()] || group.label_en) +
      '</span><span class="tab-count">' + String(group.items.length).padStart(2,"0") +
      '</span></button>'
    ).join("");
    tabs.querySelectorAll("button[data-group]").forEach(button => {
      button.addEventListener("click", () => {
        groupIndex = Number(button.dataset.group);
        itemIndex = 0;
        expanded = false;
        progressValue = 0;
        lastTick = Date.now();
        render();
        document.querySelector(".work-stage")?.scrollIntoView({behavior:"smooth",block:"start"});
      });
    });
  }

  function render() {
    const group = currentGroup();
    const post = currentPost();
    if (!group || !post) return;
    const isFa = lang() === "fa";
    const title = post["title_" + lang()] || post.title_en || post.title_fa || "";
    const tagSource = lang() === "fa" ? (post.tags_fa || []) : (post.tags || []);
    const tags = tagSource.filter(tag => !String(tag).startsWith("category:")).slice(0,5);
    const id = itemId(post);
    const original = String(post.original_url || "");
    const description = itemDescription(post, group);
    const color = safeColor(group.color);
    root.style.setProperty("--accent", color);
    eyebrow.textContent = (group["label_" + lang()] || group.label_en || "").toLocaleUpperCase(isFa ? "fa" : "en");
    counter.textContent = String(itemIndex + 1).padStart(2,"0") + " / " + String(group.items.length).padStart(2,"0");
    deck.classList.toggle("expanded", expanded);
    const previewMedia = mediaMarkup(post,title,isFa);
    const detailMedia = mediaMarkup(post,title,isFa);
    const originalLink = /^https:\/\/www\.linkedin\.com\//i.test(original)
      ? '<a class="original-post" href="' + esc(original) +
        '" target="_blank" rel="noopener noreferrer">' +
        (isFa ? "مشاهده پست اصلی در لینکدین" : "OPEN ORIGINAL LINKEDIN POST") + ' <b>↗</b></a>'
      : "";
    deck.innerHTML =
      '<article class="topic-card" tabindex="0" role="button" aria-expanded="' + expanded +
      '" aria-label="' + esc(isFa ? "باز کردن جزئیات نمونه‌کار" : "Open story details") + '">' +
      '<div class="story-number">' + (isFa ? "نمونه‌کار " : "SELECTED STORY / ") +
      String(itemIndex + 1).padStart(2,"0") + '</div><div class="story-media-preview">' + previewMedia +
      '</div><h3>' + esc(title) + '</h3><div class="story-tags">' +
      tags.map(tag => '<span>' + esc(tag) + '</span>').join("") +
      '</div><div class="story-open-hint">' +
      (isFa ? (expanded ? "برای بستن جزئیات کلیک کنید" : "برای مشاهده جزئیات کلیک کنید") :
        (expanded ? "CLICK TO COLLAPSE" : "CLICK TO EXPLORE")) +
      ' <b>' + (expanded ? "−" : "↗") + '</b></div></article>' +
      '<aside class="topic-detail"><div class="micro-label">' +
      (isFa ? "زمینه و منبع اصلی" : "STORY CONTEXT & ORIGINAL SOURCE") +
      '</div><h4>' + esc(title) + '</h4><p>' + esc(description) +
      '</p><div class="detail-tags">' + tags.map(esc).join(" · ") +
      '</div>' + detailMedia + originalLink + '</aside>';

    const card = deck.querySelector(".topic-card");
    card.addEventListener("click", () => {
      if (ignoreClick) { ignoreClick = false; return; }
      expanded = !expanded;
      render();
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        expanded = !expanded;
        render();
      }
    });
    progress.style.width = progressValue + "%";
  }

  function step(delta) {
    const count = currentGroup()?.items?.length || 0;
    if (!count) return;
    itemIndex = (itemIndex + delta + count) % count;
    expanded = false;
    progressValue = 0;
    lastTick = Date.now();
    render();
  }

  function tick() {
    if (!root.classList.contains("active") || expanded || document.hidden) {
      lastTick = Date.now();
      return;
    }
    const elapsed = Date.now() - lastTick;
    progressValue = Math.min(100, elapsed / duration * 100);
    progress.style.width = progressValue + "%";
    if (elapsed >= duration) step(1);
  }

  function start() {
    if (timer) clearInterval(timer);
    lastTick = Date.now();
    timer = setInterval(tick, 120);
  }

  function initInteractions() {
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    deck.addEventListener("pointerdown", event => {
      pointerStart = event.clientX;
      pointerStartY = event.clientY;
    });
    deck.addEventListener("pointerup", event => {
      if (pointerStart === null) return;
      const dx = event.clientX - pointerStart;
      const dy = event.clientY - pointerStartY;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        ignoreClick = true;
        step(dx < 0 ? 1 : -1);
        setTimeout(() => { ignoreClick = false; }, 140);
      }
      pointerStart = null;
      pointerStartY = null;
    });
    deck.addEventListener("pointercancel", () => {
      pointerStart = null;
      pointerStartY = null;
    });
    document.addEventListener("visibilitychange", () => { lastTick = Date.now(); });
    document.addEventListener("portfolio-language-change", () => {
      render();
      lastTick = Date.now();
    });
    document.addEventListener("portfolio-view-open", () => {
      render();
      lastTick = Date.now();
    });
  }

  async function startPortfolio() {
    try {
      const [projects, topics] = await Promise.all([
        directory("content/portfolio"),
        directory("content/topics")
      ]);
      const published = projects.filter(item => item.status !== "draft" && item.status !== "hidden");
      groups = topics
        .filter(topic => topic.visible !== false)
        .sort((a,b) => (Number(a.order) || 999) - (Number(b.order) || 999))
        .map(topic => {
          const category = "category:" + topic.slug;
          const items = published.filter(item => Array.isArray(item.tags) && item.tags.includes(category))
            .sort((a,b) => (Number(a.order) || 999) - (Number(b.order) || 999));
          return {...topic, items};
        })
        .filter(group => group.items.length > 0);
      if (!groups.length) throw new Error("No published, categorized portfolio items were found.");
      groupIndex = 0;
      itemIndex = 0;
      initInteractions();
      render();
      start();
    } catch (error) {
      console.warn("Selected work could not be loaded from CMS content.", error);
      eyebrow.textContent = lang() === "fa" ? "نمونه‌کارها بارگذاری نشد" : "SELECTED WORK UNAVAILABLE";
      counter.textContent = "";
      deck.innerHTML = '<p class="work-load-error">' +
        esc(lang() === "fa" ? "بارگذاری نمونه‌کارها با مشکل روبه‌رو شد. لطفاً صفحه را تازه‌سازی کنید." :
          "Selected work could not be loaded. Please refresh the page.") + '</p>';
      tabs.innerHTML = "";
    }
  }

  startPortfolio();
})();