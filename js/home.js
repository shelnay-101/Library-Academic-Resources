import {db,$,esc} from "./db.js";
import {initShowcase} from "./hero-showcase.js";
import {bookCardHTML,bindCardActions} from "./bookcard.js";
let books=[];
const LIMIT=15;                       // 3 rows of 5 books; everything else is found with search / category filter
const grid=$("#book-grid");
$("#load-more")?.remove();            // no "show more" button any more
const hint=document.createElement("p");hint.id="grid-hint";hint.className="grid-hint";grid.insertAdjacentElement("afterend",hint);

// Mix categories so the first 15 books show a variety instead of one subject
function variety(list){
 const by=new Map();list.forEach(b=>{const k=b.category||"General";if(!by.has(k))by.set(k,[]);by.get(k).push(b);});
 const lanes=[...by.values()],out=[];
 for(let i=0;out.length<list.length;i++){let added=false;for(const l of lanes)if(l[i]){out.push(l[i]);added=true;}if(!added)break;}
 return out;
}
function render(){
 const q=$("#search").value.trim().toLowerCase(),cat=$("#category-filter").value;
 const filtered=books.filter(b=>(!cat||b.category===cat)&&[b.title,b.author,b.category,b.isbn,b.id].join(" ").toLowerCase().includes(q));
 const list=(q||cat?filtered:variety(filtered)).slice(0,LIMIT);
 $("#book-count").textContent=filtered.length>LIMIT?`Showing ${LIMIT} of ${filtered.length} books`:`${filtered.length} book${filtered.length===1?"":"s"} found`;
 grid.innerHTML=list.length?list.map(b=>bookCardHTML(b)).join(""):`<p class="muted">No books match your search.</p>`;
 hint.textContent=filtered.length>LIMIT?`Showing ${LIMIT} of ${filtered.length} books. Use the search box or the category filter above to find the others.`:"";
}
const {data,error}=await db.from("books").select("*").order("title");
if(error) grid.innerHTML=`<p class="error">Could not load books. Check your Supabase URL, key, and schema.</p>`;
else{books=data||[];initShowcase(books);const cats=[...new Set(books.map(b=>b.category).filter(Boolean))].sort();$("#category-filter").innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");render();}
$("#search").addEventListener("input",render);$("#category-filter").addEventListener("change",render);
bindCardActions(grid,()=>books);
