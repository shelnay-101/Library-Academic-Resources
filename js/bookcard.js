// One compact book card used on the home page and the category page.
import {esc,shortId,floorLabel} from "./db.js";
const LONG_TITLE=34,LONG_AUTHOR=30;   // longer text is clamped; a "more" button reveals it

export function bookCardHTML(b,{location=false}={}){
 const href=`/book.html?id=${encodeURIComponent(b.id)}`;
 const long=(b.title||"").length>LONG_TITLE||(b.author||"").length>LONG_AUTHOR;
 return `<article class="book-card"><a href="${href}" class="cover" tabindex="-1" aria-hidden="true">${b.cover_url?`<img src="${esc(b.cover_url)}" alt="" loading="lazy" onerror="this.remove()">`:"▤"}</a><div class="book-card-body"><span class="tag">${esc(b.category||"General")}</span><h3 class="bk-title"><a href="${href}" title="${esc(b.title)}">${esc(b.title)}</a></h3><p class="bk-author">${esc(b.author)}</p>${long?`<button class="bk-more" type="button" data-more aria-expanded="false">more</button>`:""}<p class="bk-id">ID: ${shortId(b.id)}</p>${location?`<p class="bk-loc">⌖ ${esc(floorLabel(b.floor))} · Shelf ${esc(b.shelf)}</p>`:""}<p class="availability">${b.available_copies>0?"● Available":"● Unavailable"}</p><div class="bk-actions"><a class="text-link" href="${href}">Find location →</a>${b.preview_url?`<button class="pv-card-btn" type="button" data-pv="${esc(b.id)}">📖 Preview</button>`:`<span class="pv-card-btn pv-placeholder" aria-hidden="true"></span>`}</div></div></article>`;
}

// Click handling for "more" and "Preview" buttons inside a grid of cards.
export function bindCardActions(grid,getBooks){
 grid.addEventListener("click",async e=>{
  const more=e.target.closest("[data-more]");
  if(more){const card=more.closest(".book-card"),on=card.classList.toggle("expanded");more.textContent=on?"less":"more";more.setAttribute("aria-expanded",String(on));return;}
  const btn=e.target.closest("[data-pv]");if(!btn)return;
  const b=getBooks().find(x=>x.id===btn.dataset.pv);if(!b)return;
  const t=btn.textContent;btn.disabled=true;btn.textContent="Opening…";
  try{const {openPreview}=await import("./preview.js");await openPreview(b.preview_url,b.title,1,btn);}catch(err){window.open(b.preview_url,"_blank");}
  btn.disabled=false;btn.textContent=t;
 });
}
