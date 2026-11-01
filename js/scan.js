import {$,db} from "./db.js";
let scanner=null;
const msg=$("#scan-message"), start=$("#start-scan"), stop=$("#stop-scan");
start.addEventListener("click",async()=>{
 if(!window.Html5Qrcode){msg.textContent="Scanner library did not load. Try your phone's camera app.";return;}
 scanner=new Html5Qrcode("reader");start.disabled=true;msg.textContent="Starting camera…";
 try{
  await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:240,height:240}},async text=>{
   if(scanner){await scanner.stop();scanner=null;}location.href=text;
  },()=>{});
  stop.disabled=false;msg.textContent="Camera is active. Point it at a book QR code.";
 }catch(e){msg.textContent="Could not start camera. Allow camera permission and use this page over HTTPS.";start.disabled=false;}
});
stop.addEventListener("click",async()=>{if(scanner){await scanner.stop();scanner=null;}start.disabled=false;stop.disabled=true;msg.textContent="Scanner stopped.";});

// ----- Categories: pick a category to open it or get its QR code -----
(async()=>{
 const main=document.querySelector("main.narrow");if(!main)return;
 const sec=document.createElement("section");sec.className="panel scan-cats";sec.id="scan-cats";
 sec.innerHTML=`<span class="eyebrow">BROWSE BY CATEGORY</span><h2>Get a QR code by category</h2><p class="muted small">Choose the kind of books you want. You can open the category right away, or save its QR code to scan later.</p><div id="cat-chips" class="cat-chips" role="group" aria-label="Book categories"><span class="muted small">Loading categories…</span></div><div id="cat-result" class="cat-result" hidden><div class="cat-qr"><canvas id="cat-qr" width="190" height="190"></canvas></div><div class="cat-info"><h3 id="cat-name"></h3><p id="cat-meta" class="muted small"></p><div class="cat-btns"><a class="btn primary" id="cat-open" href="#">Open category →</a><button class="btn secondary" id="cat-dl" type="button">Download QR</button></div></div></div>`;
 main.append(sec);
 const chips=$("#cat-chips");
 const {data,error}=await db.from("books").select("category");
 if(error||!data){chips.innerHTML='<span class="muted small">Categories could not be loaded.</span>';return;}
 const counts={};data.forEach(r=>{if(r.category)counts[r.category]=(counts[r.category]||0)+1;});
 const names=Object.keys(counts).sort((a,b)=>a.localeCompare(b));
 if(!names.length){chips.innerHTML='<span class="muted small">No categories yet.</span>';return;}
 chips.innerHTML=names.map(n=>`<button class="cat-chip" type="button" data-cat="${n.replace(/"/g,"&quot;")}">${n.replace(/</g,"&lt;")} <span>${counts[n]}</span></button>`).join("");
 let QR=null;
 chips.addEventListener("click",async e=>{
  const b=e.target.closest(".cat-chip");if(!b)return;
  chips.querySelectorAll(".cat-chip").forEach(x=>x.classList.toggle("active",x===b));
  const n=b.dataset.cat,url=`${location.origin}/category.html?c=${encodeURIComponent(n)}`,box=$("#cat-result"),canvas=$("#cat-qr");
  $("#cat-name").textContent=n;$("#cat-meta").textContent=`${counts[n]} book${counts[n]===1?"":"s"} in this category`;$("#cat-open").href=url;box.hidden=false;
  try{QR??=(await import("https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm")).default;await QR.toCanvas(canvas,url,{width:190,margin:1,color:{dark:"#0a1a35",light:"#ffffff"}});}
  catch(err){canvas.replaceWith(Object.assign(document.createElement("p"),{id:"cat-qr",className:"muted small",textContent:"QR code could not be created. Use the Open button instead."}));}
  $("#cat-dl").onclick=()=>{const c=$("#cat-qr");if(!c.toDataURL)return;const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download=`category-${n.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-qr.png`;a.click();};
  box.scrollIntoView({behavior:"smooth",block:"nearest"});
 });
})();
