// Cloudflare Worker: secure AI content generation for the CMS.
// Configure OPENAI_API_KEY as a Worker secret. Never expose it in browser code.
const allowedOrigin = "https://imankeyhanfard.github.io";
const cors = origin => ({
  "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title_en:{type:"string"}, title_fa:{type:"string"}, slug:{type:"string"},
    alternate_title_en:{type:"string"}, alternate_title_fa:{type:"string"},
    headline_en:{type:"string"}, headline_fa:{type:"string"},
    subtitle_en:{type:"string"}, subtitle_fa:{type:"string"},
    excerpt_en:{type:"string"}, excerpt_fa:{type:"string"},
    body_en:{type:"string"}, body_fa:{type:"string"},
    description_en:{type:"string"}, description_fa:{type:"string"},
    category:{type:"string"}, tags_en:{type:"array",items:{type:"string"}},
    tags_fa:{type:"array",items:{type:"string"}},
    image_alt_en:{type:"string"}, seo_title_en:{type:"string"}, seo_title_fa:{type:"string"},
    seo_description_en:{type:"string"}, seo_description_fa:{type:"string"},
    caption_en:{type:"string"}, caption_fa:{type:"string"}, section:{type:"string"}
  },
  required:["title_en","title_fa","slug","alternate_title_en","alternate_title_fa","headline_en","headline_fa","subtitle_en","subtitle_fa","excerpt_en","excerpt_fa","body_en","body_fa","description_en","description_fa","category","tags_en","tags_fa","image_alt_en","seo_title_en","seo_title_fa","seo_description_en","seo_description_fa","caption_en","caption_fa","section"]
};
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null,{headers});
    if (origin !== allowedOrigin) return Response.json({error:"Origin not allowed"},{status:403,headers});
    if (request.method !== "POST") return Response.json({error:"Method not allowed"},{status:405,headers});
    if (!env.OPENAI_API_KEY) return Response.json({error:"Worker secret OPENAI_API_KEY is not configured."},{status:503,headers});
    try {
      const input = await request.json();
      const source = String(input.source || "").trim();
      if (!source || source.length > 50000) return Response.json({error:"Source text is required (maximum 50,000 characters)."},{status:400,headers});
      const isPost = input.collection === "posts";
      const system = [
        "You are a careful bilingual newsroom editor. Return only the requested JSON object.",
        "Create accurate Persian and American English editorial copy based ONLY on the supplied source text.",
        "Never add facts, names, dates, numbers, quotes, locations, causal claims or attributions not present in the source.",
        "If a detail is unknown, do not guess. Preserve uncertainty and attribution exactly.",
        "Translate faithfully and do not strengthen claims. Do not claim independent verification.",
        "For body fields, use concise HTML paragraphs only; no scripts, styles or markdown fences.",
        "Use concise natural headlines, factual tags, and a short ASCII URL slug.",
        "Set section to work. Set category to a short neutral topic label.",
        isPost ? "This is a NEWS ARTICLE. body_en and body_fa must be faithful publishable versions of the supplied material, not invented expansions." : "This is a PORTFOLIO ENTRY. Descriptions must explain only the supplied work and context."
      ].join(" ");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST",
        headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:env.OPENAI_MODEL || "gpt-4.1-mini",
          temperature:0.2,
          response_format:{type:"json_schema",json_schema:{name:"cms_content",strict:true,schema}},
          messages:[
            {role:"system",content:system},
            {role:"user",content:"Content type: "+String(input.content_type || "Editorial content")+"\nSource URL: "+String(input.source_url || "Not supplied")+"\n\nSOURCE TEXT:\n"+source}
          ]
        })
      });
      const payload = await response.json();
      if (!response.ok) return Response.json({error:payload.error?.message || "AI provider request failed."},{status:502,headers});
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI provider returned an empty response.");
      return Response.json(JSON.parse(content),{headers:{...headers,"Content-Type":"application/json"}});
    } catch (error) {
      return Response.json({error:String(error.message || error)},{status:500,headers});
    }
  }
};
