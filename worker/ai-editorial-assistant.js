// Cloudflare Worker: bilingual portfolio content assistant.
// Set OPENAI_API_KEY as a Worker secret. Deploy this Worker separately.
// Restrict CORS to https://imankeyhanfard.github.io and https://www.imankeyhanfard.github.io if applicable.
const ALLOWED = new Set(["https://imankeyhanfard.github.io"]);
const cors = origin => ({
 "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : "https://imankeyhanfard.github.io",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type",
 "Vary":"Origin"
});
export default {
 async fetch(request, env) {
  const origin=request.headers.get("Origin")||"";
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=="POST") return new Response("Method not allowed",{status:405,headers:cors(origin)});
  if(!ALLOWED.has(origin)) return new Response("Origin not allowed",{status:403,headers:cors(origin)});
  if(!env.OPENAI_API_KEY) return new Response("Worker secret OPENAI_API_KEY is not configured",{status:503,headers:cors(origin)});
  let input; try{input=await request.json();}catch{return new Response("Invalid JSON",{status:400,headers:cors(origin)});}
  const source=String(input.source||"").trim();
  if(source.length<20||source.length>30000)return new Response("Source must be 20–30000 characters",{status:400,headers:cors(origin)});
  const system=`You are a professional bilingual Persian-English newsroom and portfolio editor. Generate fields from the supplied source only. Do not invent facts, names, dates, quotations, claims, roles, or locations. If a detail is absent, leave the field blank. Preserve attribution and uncertainty. Headlines must be accurate, concise, editorially professional, and not sensationalized. Translate naturally, not literally. Output JSON only with keys: title_en,title_fa,headline_en,headline_fa,description_en,description_fa,alternate_title_en,alternate_title_fa,image_alt_en,image_alt_fa,caption_en,caption_fa,tags_en,tags_fa,seo_title_en,seo_title_fa,seo_description_en,seo_description_fa. Tags are comma-separated strings. Descriptions should be short portfolio copy. Alt text/captions only describe visual details if source includes them; otherwise blank. SEO fields should be concise and factual.`;
  const payload={model:env.MODEL||"gpt-4.1-mini",input:[{role:"system",content:system},{role:"user",content:"Content type: "+String(input.content_type||"Other")+"\nSource URL: "+String(input.source_url||"")+"\nSource material:\n"+source}],text:{format:{type:"json_object"}}};
  const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const raw=await upstream.json(); if(!upstream.ok)return new Response(JSON.stringify({error:raw.error?.message||"AI request failed"}),{status:502,headers:{...cors(origin),"Content-Type":"application/json"}});
  const text=raw.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
  try{return new Response(JSON.stringify(JSON.parse(text||"{}")),{headers:{...cors(origin),"Content-Type":"application/json"}});}catch{return new Response("AI returned invalid JSON",{status:502,headers:cors(origin)});}
 }
};