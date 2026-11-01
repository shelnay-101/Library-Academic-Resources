// Category page: opened by scanning a category QR code. Lists only that category's books,
// searchable by book name, author, ISBN or book ID.
import {db,$,shortId} from "./db.js";
import {mountFloorMap,resolveBook} from "./floormap.js";
import {bookCardHTML,bindCardActions} from "./bookcard.js";
const name=(new URLSearchParams(location.search).get("c")||"").trim();
const grid=$("#cat-grid"),count=$("#cat-count"),title=$("#cat-title"),search=$("#cat-search");
let books=[];
function render(){
 const q=search.value.trim().toLowerCase();
 const rows=books.filter(b=>!q||[b.title,b.author,b.isbn,b.id,shortId(b.id)].join(" ").toLowerCase().includes(q));
 count.textContent=q?`${rows.length} of ${books.length} book${books.length===1?"":"s"} match`:`${books.length} book${books.length===1?"":"s"} in this category`;
 grid.innerHTML=rows.length?rows.map(b=>bookCardHTML(b,{location:true})).join(""):`<p class="muted">No books match your search.</p>`;
}
bindCardActions(grid,()=>books);
if(!name){
 title.textContent="No category selected";count.textContent="";$("#cat-tools").hidden=true;
 grid.innerHTML='<p class="error">This QR code or link has no category. Go back and choose a category.</p>';
}else{
 title.textContent=name;document.title=`${name} · Library & Academic Resources`;
 const {data,error}=await db.from("books").select("*").eq("category",name).order("title");
 if(error){count.textContent="";grid.innerHTML='<p class="error">Could not load books. Please try again.</p>';}
 else if(!data||!data.length){count.textContent="0 books";$("#cat-tools").hidden=true;grid.innerHTML='<p class="muted">No books found in this category.</p>';}
 else{
  books=data;render();search.addEventListener("input",render);
  // map: show the book store where most of this category's books are shelved
  const tally={};books.forEach(b=>{const r=resolveBook(b);if(r.zone){const k=r.floor+":"+r.zone.id;tally[k]=(tally[k]||0)+1;}});
  const top=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
  if(top){const [f,z]=top[0].split(":");mountFloorMap($("#floor-map"),{floor:f,shelf:z});$("#map-details").hidden=false;}
 }
}
