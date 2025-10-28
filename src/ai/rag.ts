import MiniSearch from "minisearch";
let idx: MiniSearch | null = null;

export function buildRAG({ glossary=[], features=[], segments=[] }:{
  glossary?: Array<{term:string, def:string}>;
  features?: Array<{feature:string, definition?:string}>;
  segments?: Array<{name:string, description?:string}>;
}) {
  idx = new MiniSearch({ fields:["term","text"], storeFields:["kind","term","text"] });
  const docs:any[] = [];
  glossary.forEach((g,i)=> docs.push({ id:`g${i}`, kind:"glossary", term:g.term, text:g.def }));
  features.forEach((f,i)=> docs.push({ id:`f${i}`, kind:"feature", term:f.feature, text:f.definition || f.feature }));
  segments.forEach((s,i)=> docs.push({ id:`s${i}`, kind:"segment", term:s.name, text:s.description || "" }));
  idx.addAll(docs);
}

export function ragSearch(q:string,k=5){
  if(!idx) return [];
  return idx.search(q, { prefix:true }).slice(0,k).map(h => ({ term:h.term, kind:(h as any).kind }));
}
