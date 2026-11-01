// Responsive helpers, loaded on every page through db.js:
//  1) adds /css/responsive.css after the other stylesheets (breakpoints for phones, tablets, laptops, large screens)
//  2) hamburger (three-line) menu for the public header and the admin sidebar
//  3) labels table cells so tables can turn into stacked cards on small screens (no sideways scrolling)
if(!document.querySelector('link[href*="responsive.css"]')){
 const l=document.createElement("link");l.rel="stylesheet";l.href="/css/responsive.css";document.head.append(l);
}

function labelTables(){
 document.querySelectorAll("table").forEach(t=>{
  const heads=[...t.querySelectorAll("thead th")].map(h=>h.textContent.trim());
  if(!heads.length)return;
  t.classList.add("stackable");
  t.querySelectorAll("tbody tr").forEach(tr=>[...tr.children].forEach((td,i)=>{if(heads[i]&&!td.dataset.label)td.dataset.label=heads[i];}));
 });
}

function init(){
 for(const host of document.querySelectorAll(".topbar,.sidebar")){
  if(host.querySelector(".nav-toggle"))continue;
  const b=document.createElement("button");
  b.type="button";b.className="nav-toggle";b.setAttribute("aria-label","Open menu");b.setAttribute("aria-expanded","false");
  b.innerHTML="<span></span><span></span><span></span>";
  host.append(b);
  const set=open=>{host.classList.toggle("open",open);b.setAttribute("aria-expanded",String(open));b.setAttribute("aria-label",open?"Close menu":"Open menu");};
  b.addEventListener("click",()=>set(!host.classList.contains("open")));
  host.addEventListener("click",e=>{if(e.target.closest("nav a,.sidebar>a,.sidebar-logout"))set(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false);});
  document.addEventListener("click",e=>{if(!host.contains(e.target))set(false);});
  window.matchMedia?.("(min-width:1025px)").addEventListener?.("change",e=>{if(e.matches)set(false);});
 }
 labelTables();
 let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(labelTables,40);}).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
