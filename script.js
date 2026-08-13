// KHENGBOK - ORTAK SİSTEM
(function(){
"use strict";

let cloudNewsCache = null;
let cloudNewsPromise = null;
const KHENGBOK_API = "https://khengbok-api.dilanakbudak07.workers.dev";

function getNewsList(){
  return cloudNewsCache || [];
}

async function loadCloudNews(){
  if (cloudNewsCache) return cloudNewsCache;
  if (cloudNewsPromise) return cloudNewsPromise;
  cloudNewsPromise = fetch(KHENGBOK_API + "/api/articles")
    .then(r => { if(!r.ok) throw new Error("Haberler alınamadı"); return r.json(); })
    .then(rows => {
      cloudNewsCache = Array.isArray(rows) ? rows.map(a => ({
        id:a.id, title:a.title||"", text:a.content||"", image:a.cover_image||"",
        category:a.category||"Genel", source:a.source||"", date:a.news_date||"",
        time:a.news_time||"", gif:a.gif||"", embedType:a.embed_type||"",
        embedUrl:a.embed_url||"", popular:Boolean(a.popular), createdAt:a.created_at||""
      })) : [];
      return cloudNewsCache;
    })
    .catch(err => { console.error("Khengbok API:",err); cloudNewsCache=[]; return []; });
  return cloudNewsPromise;
}

function isPublished(n){
  if(!n.date||!n.time)return true;
  const d=new Date(n.date+"T"+n.time);
  return !Number.isNaN(d.getTime())&&d<=new Date();
}
function escapeHTML(v){
  const d=document.createElement("div"); d.textContent=v==null?"":String(v); return d.innerHTML;
}
function preview(html,len=150){
  const d=document.createElement("div");d.innerHTML=html||"";
  const t=(d.textContent||d.innerText||"").replace(/\s+/g," ").trim();
  return t.length>len?t.slice(0,len)+"...":t;
}
function sortNews(list){
 return list.filter(isPublished).slice().sort((a,b)=>
  (Number(b.createdAt)||Number(b.id)||0)-(Number(a.createdAt)||Number(a.id)||0)
 );
}
function href(n){return "haber.html?id="+encodeURIComponent(n.id);}
function card(n){
 const el=document.createElement("article");el.className="news-card-item";
 const image=n.image?`<img src="${n.image}" class="news-card-image" alt="${escapeHTML(n.title||"Haber")}">`:`<div class="news-card-no-image">HABER GÖRSELİ</div>`;
 el.innerHTML=`<a class="news-card-link" href="${href(n)}">
  <div class="news-card-image-wrapper">${image}</div>
  <div class="news-card-content">
   <span class="news-card-category">${escapeHTML(n.category||"Genel")}</span>
   <h3>${escapeHTML(n.title||"")}</h3>
   <p class="news-card-text">${escapeHTML(preview(n.text))}</p>
   <p class="news-card-date">${escapeHTML(n.date||"")}${n.time?" · "+escapeHTML(n.time):""}</p>
  </div></a>`;
 return el;
}
function render(id,opts={}){
 const box=document.getElementById(id);if(!box)return;
 let list=sortNews(getNewsList());
 if(opts.category)list=list.filter(n=>(n.category||"").toLocaleLowerCase("tr-TR")===opts.category.toLocaleLowerCase("tr-TR"));
 if(opts.popular)list=list.filter(n=>n.popular);
 if(opts.limit)list=list.slice(0,opts.limit);
 box.innerHTML="";
 if(!list.length){box.innerHTML=`<div class="no-news"><h3>${opts.popular?"Henüz popüler haber yok 💜":"Henüz haber yok 💜"}</h3><p>Yönetim panelinden haber yayınlayabilirsin.</p></div>`;return;}
 list.forEach(n=>box.appendChild(card(n)));
}

async function bootstrapNews(){
  await loadCloudNews();
  render("homeLatestNewsList",{limit:6});
  render("latestNewsList");
  render("popularNewsList",{popular:true,limit:20});

  const categoryGrid=document.getElementById("categoryGrid");
  if(categoryGrid){
    const cats=getCategories();
    const published=sortNews(getNewsList());
    categoryGrid.innerHTML="";
    if(!cats.length){
      categoryGrid.innerHTML='<div class="no-news"><h3>Henüz kategori yok 💜</h3><p>Bir haber yayınladığında kategori burada görünecek.</p></div>';
    }else{
      cats.forEach(name=>{
        const count=published.filter(n=>(n.category||"").toLocaleLowerCase("tr-TR")===name.toLocaleLowerCase("tr-TR")).length;
        const a=document.createElement("a");
        a.href="grup.html?name="+encodeURIComponent(name);
        a.className="group-card";
        a.innerHTML='<div class="group-image">'+escapeHTML(name)+'</div><h3>'+escapeHTML(name)+'</h3><p>'+count+' haber</p>';
        categoryGrid.appendChild(a);
      });
    }
  }

  const groupNews=document.getElementById("groupNewsList");
  if(groupNews){
    const name=new URLSearchParams(location.search).get("name")||"";
    const title=document.getElementById("groupTitle");
    if(title)title.textContent=name||"Kategori";
    render("groupNewsList",{category:name});
  }
}

bootstrapNews();

const search=document.getElementById("newsSearch");
const latest=document.getElementById("latestNewsList");
if(search&&latest)search.addEventListener("input",()=>{
 const q=search.value.trim().toLocaleLowerCase("tr-TR");
 latest.querySelectorAll(".news-card-item").forEach(c=>c.style.display=c.textContent.toLocaleLowerCase("tr-TR").includes(q)?"":"none");
});

// KATEGORİLER
// Admin panelinde eklenen her kategori burada otomatik olarak kart olur.
function getCategories(){
  let saved=[];
  try{
    const x=JSON.parse(localStorage.getItem("khengbokCategories")||"[]");
    if(Array.isArray(x)) saved=x;
  }catch(e){}

  // D1'deki haberlerde kullanılan kategorileri de otomatik ekle.
  const cloudCats = (cloudNewsCache || []).map(n => n.category).filter(Boolean);
  const defaults=["BTS","BLACKPINK","Stray Kids","TWICE","IVE"];
  const result=[];
  [...defaults,...saved,...cloudCats].forEach(c=>{
    const name=String(c||"").trim();
    if(name && !result.some(x=>x.toLocaleLowerCase("tr-TR")===name.toLocaleLowerCase("tr-TR"))) result.push(name);
  });
  return result;
}

const groupSearch=document.getElementById("groupSearch");
if(groupSearch)groupSearch.addEventListener("input",()=>{
 const q=groupSearch.value.trim().toLocaleLowerCase("tr-TR");
 document.querySelectorAll(".group-card").forEach(c=>c.style.display=c.textContent.toLocaleLowerCase("tr-TR").includes(q)?"":"none");
});

// Kategori detayları: grup.html?name=BTS (dosya adı eski bağlantılarla uyumlu bırakıldı)
// Admin'den eski id/index kullanan linkleri de tolere etmek için yardımcı.
window.Khengbok={getNewsList,sortNews,render,escapeHTML};
})();

/* ========================================
   KHENGBOK - ORTAK MOBİL MENÜ
   Tüm sayfalarda aynı header/nav yapısını
   kullanır; mevcut bağlantıları değiştirmez.
======================================== */
(function initMobileMenu(){
  const header = document.querySelector("header");
  const nav = header ? header.querySelector("nav") : null;
  if (!header || !nav || nav.dataset.mobileReady === "1") return;

  nav.dataset.mobileReady = "1";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mobile-menu-button";
  button.setAttribute("aria-label", "Menüyü aç/kapat");
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = "<span></span><span></span><span></span>";

  const h1 = header.querySelector("h1");
  if (h1) h1.insertAdjacentElement("afterend", button);
  else header.insertBefore(button, nav);

  const closeMenu = () => {
    nav.classList.remove("mobile-nav-open");
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-open");
  };

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("mobile-nav-open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("mobile-menu-open", open);
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) closeMenu();
  });
})();
