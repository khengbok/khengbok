// ========================================
// KHENGBOK - YÖNETİM PANELİ
// Tek ve ortak haber veri sistemi
// ========================================
(function () {
"use strict";

const $ = id => document.getElementById(id);

const title = $("newsTitle");
const category = $("newsCategory");
const newCat = $("newCategory");
const text = $("newsText");
const source = $("newsSource");
const date = $("newsDate");
const time = $("newsTime");
const popular = $("isPopular");

const coverInput = $("newsImage");
const articleInput = $("articleImage");
const publish = $("publishButton");
const update = $("updateButton");
const adminList = $("adminNewsList");

const KHENGBOK_API = "https://khengbok-api.dilanakbudak07.workers.dev";

let editingId = null;

async function loadCloudNews() {
    try {
        const response = await fetch(KHENGBOK_API + "/api/articles");
        if (!response.ok) throw new Error("Haberler alınamadı.");
        const articles = await response.json();
        return Array.isArray(articles) ? articles.map(article => ({
            id: article.id,
            title: article.title || "",
            text: article.content || "",
            image: article.cover_image || "",
            category: article.category || "Genel",
            source: article.source || "",
            date: article.news_date || "",
            time: article.news_time || "",
            gif: article.gif || "",
            embedType: article.embed_type || "",
            embedUrl: article.embed_url || "",
            popular: Boolean(article.popular),
            createdAt: article.created_at || ""
        })) : [];
    } catch (error) {
        console.error("Cloud haber hatası:", error);
        return [];
    }
}

function cloudFormData() {
    return {
        title: title.value.trim(),
        category: category.value,
        text: serializeArticle(),
        source: source.value.trim(),
        date: date.value,
        time: time.value,
        popular: popular.checked
    };
}

function cloudValidate(d) {
    if (!d.title || !d.category || !d.text) {
        alert("Lütfen başlık, kategori ve haber metnini doldurun.");
        return false;
    }
    if (!d.date || !d.time) {
        alert("Lütfen yayın tarihi ve saatini seçin.");
        return false;
    }
    return true;
}

async function showAdminNews() {
    const list = await loadCloudNews();
    adminList.innerHTML = "";

    if (!list.length) {
        adminList.innerHTML = "<p>Henüz haber eklenmemiş.</p>";
        return;
    }

    list.forEach(news => {
        const item = document.createElement("div");
        item.className = "admin-news-item";
        item.innerHTML = `
            <div class="admin-news-info">
                <strong>${esc(news.title)}</strong>
                <p>${esc(news.category)} · ${esc(news.date)} · ${esc(news.time)}</p>
            </div>
            <div class="admin-news-buttons">
                <button type="button" class="cloud-edit-button" data-id="${news.id}">✏️ Düzenle</button>
                <button type="button" class="cloud-delete-button" data-id="${news.id}">🗑️ Sil</button>
            </div>`;
        adminList.appendChild(item);
    });

    adminList.querySelectorAll(".cloud-delete-button").forEach(button => {
        button.addEventListener("click", async () => {
            if (!confirm("Bu haberi silmek istediğine emin misin?")) return;
            const response = await fetch(KHENGBOK_API + "/api/articles/" + encodeURIComponent(button.dataset.id), { method: "DELETE" });
            if (!response.ok) {
                alert("Haber silinemedi.");
                return;
            }
            alert("Haber silindi. 🗑️");
            showAdminNews();
        });
    });

    adminList.querySelectorAll(".cloud-edit-button").forEach(button => {
        button.addEventListener("click", async () => {
            const response = await fetch(KHENGBOK_API + "/api/articles/" + encodeURIComponent(button.dataset.id));
            if (!response.ok) {
                alert("Haber alınamadı.");
                return;
            }
            const article = await response.json();

            editingId = article.id;
            title.value = article.title || "";
            category.value = article.category || "";
            source.value = article.source || "";
            date.value = article.news_date || "";
            time.value = article.news_time || "";
            popular.checked = Boolean(article.popular);
            text.innerHTML = article.content || "";
            croppedCover = article.cover_image || "";

            if (coverStatus) {
                coverStatus.textContent = croppedCover ? "✓ Mevcut kapak fotoğrafı korunuyor" : "";
            }

            publish.style.display = "none";
            update.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
}

// Yeni publish/update düğmeleri: eski localStorage eventlerini kaldırıp D1'e bağlarız.
const newPublishButton = publish.cloneNode(true);
publish.parentNode.replaceChild(newPublishButton, publish);

newPublishButton.addEventListener("click", async () => {
    const d = cloudFormData();
    if (!cloudValidate(d)) return;

    try {
        const response = await fetch(KHENGBOK_API + "/api/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: d.title,
                content: d.text,
                cover_image: croppedCover || "",
                category: d.category,
                source: d.source,
                news_date: d.date,
                news_time: d.time,
                popular: d.popular,
                published: true
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Haber yayınlanamadı.");

        alert("Haber başarıyla yayınlandı! 💜");
        clear();
        showAdminNews();
    } catch (error) {
        console.error(error);
        alert("Haber yayınlanırken hata oluştu:\n" + error.message);
    }
});

const newUpdateButton = update.cloneNode(true);
update.parentNode.replaceChild(newUpdateButton, update);

newUpdateButton.addEventListener("click", async () => {
    if (editingId === null) return;

    const d = cloudFormData();
    if (!cloudValidate(d)) return;

    try {
        const response = await fetch(KHENGBOK_API + "/api/articles/" + encodeURIComponent(editingId), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: d.title,
                content: d.text,
                cover_image: croppedCover || "",
                category: d.category,
                source: d.source,
                news_date: d.date,
                news_time: d.time,
                popular: d.popular,
                published: true
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Haber güncellenemedi.");

        alert("Haber başarıyla güncellendi! 💜");
        clear();
        showAdminNews();
    } catch (error) {
        console.error(error);
        alert("Güncelleme hatası:\n" + error.message);
    }
});

showAdminNews();

const modal = $("cropModal");
const cropImg = $("cropImage");
const cancel = $("cropCancel");
const confirmBtn = $("cropConfirm");
const coverStatus = $("coverStatus");

let cropMode = null;
let croppedCover = "";
let savedRange = null;

// ---------- Storage ----------
function get() {
    try {
        const x = JSON.parse(localStorage.getItem("khengbokNews") || "[]");
        return Array.isArray(x) ? x : [];
    } catch (e) {
        return [];
    }
}

function save(list) {
    try {
        localStorage.setItem("khengbokNews", JSON.stringify(list));
        return true;
    } catch (e) {
        alert("Haber kaydedilemedi. Görseller çok büyük olabilir. Daha küçük görseller kullan.");
        return false;
    }
}

function esc(v) {
    const d = document.createElement("div");
    d.textContent = v == null ? "" : String(v);
    return d.innerHTML;
}

// ---------- Categories ----------
let cats = [];
try {
    cats = JSON.parse(localStorage.getItem("khengbokCategories") || "[]");
    if (!Array.isArray(cats)) cats = [];
} catch (e) {
    cats = [];
}

function addCat(c) {
    if (!c || [...category.options].some(o => o.value === c)) return;
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    category.appendChild(o);
}
cats.forEach(addCat);

$("addCategoryButton").addEventListener("click", () => {
    const c = newCat.value.trim();
    if (!c) return alert("Lütfen kategori adı yazın.");
    if (cats.includes(c)) return alert("Bu kategori zaten var.");

    cats.push(c);
    localStorage.setItem("khengbokCategories", JSON.stringify(cats));
    addCat(c);
    category.value = c;
    newCat.value = "";
});

// ---------- Editor selection ----------
function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && text.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0).cloneRange();
    }
}

["keyup", "mouseup", "focus", "input"].forEach(evt => {
    text.addEventListener(evt, saveRange);
});

function restoreRange() {
    if (!savedRange) {
        text.focus();
        const r = document.createRange();
        r.selectNodeContents(text);
        r.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        return;
    }

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    text.focus();
}

function insertNodeAtCursor(node) {
    restoreRange();

    const sel = window.getSelection();
    if (!sel.rangeCount) {
        text.appendChild(node);
        return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    savedRange = after.cloneRange();
    text.focus();
}

// ---------- Basic formatting ----------
$("boldButton").addEventListener("mousedown", e => e.preventDefault());
$("italicButton").addEventListener("mousedown", e => e.preventDefault());
$("linkButton").addEventListener("mousedown", e => e.preventDefault());

$("boldButton").addEventListener("click", () => {
    restoreRange();
    document.execCommand("bold");
    saveRange();
});

$("italicButton").addEventListener("click", () => {
    restoreRange();
    document.execCommand("italic");
    saveRange();
});

$("linkButton").addEventListener("click", () => {
    restoreRange();
    const u = prompt("Link adresini gir:");
    if (u) document.execCommand("createLink", false, u);
    saveRange();
});

// ---------- Image inside article ----------
$("articleImageButton").addEventListener("mousedown", e => e.preventDefault());
$("articleImageButton").addEventListener("click", () => {
    saveRange();
    cropMode = "article";
    articleInput.click();
});

articleInput.addEventListener("change", () => {
    if (articleInput.files[0]) openCrop(articleInput.files[0]);
});

// ---------- Cover image ----------
coverInput.addEventListener("change", () => {
    if (coverInput.files[0]) {
        cropMode = "cover";
        openCrop(coverInput.files[0]);
    }
});

function openCrop(file) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Lütfen bir fotoğraf seç.");
        return;
    }

    const r = new FileReader();

    r.onload = e => {
        cropImg.src = e.target.result;
        modal.style.display = "flex";
    };

    r.onerror = () => alert("Fotoğraf okunamadı.");
    r.readAsDataURL(file);
}

cancel.addEventListener("click", () => {
    modal.style.display = "none";
    cropImg.src = "";
    cropMode = null;
    coverInput.value = "";
    articleInput.value = "";
});

confirmBtn.addEventListener("click", () => {
    if (!cropImg.src || !cropMode) return;

    const im = new Image();

    im.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1200;
        const side = Math.min(im.width, im.height);
        const scale = Math.min(1, max / side);
        const out = Math.max(1, Math.round(side * scale));

        canvas.width = out;
        canvas.height = out;

        canvas.getContext("2d").drawImage(
            im,
            (im.width - side) / 2,
            (im.height - side) / 2,
            side,
            side,
            0,
            0,
            out,
            out
        );

        const data = canvas.toDataURL("image/jpeg", 0.82);

        if (cropMode === "cover") {
            croppedCover = data;
            if (coverStatus) {
                coverStatus.textContent = "✓ Kapak fotoğrafı hazır";
            }
        } else {
            insertArticleImage(data);
        }

        modal.style.display = "none";
        cropImg.src = "";
        coverInput.value = "";
        articleInput.value = "";
        cropMode = null;
    };

    im.onerror = () => alert("Fotoğraf işlenemedi.");
    im.src = cropImg.src;
});

function insertArticleImage(data) {
    const img = document.createElement("img");
    img.src = data;
    img.alt = "Haber içi görsel";
    img.className = "article-inline-image";
    insertNodeAtCursor(img);
}

// ---------- Inline embed blocks ----------
function makeEmbedBlock(type, url) {
    const wrap = document.createElement("div");
    wrap.className = "kh-inline-embed";
    wrap.contentEditable = "false";
    wrap.dataset.embedType = type;
    wrap.dataset.embedUrl = url;

    const names = {
        gif: "GIF",
        youtube: "YouTube videosu",
        x: "X gönderisi",
        instagram: "Instagram gönderisi",
        reddit: "Reddit gönderisi"
    };

    wrap.innerHTML =
        '<div class="kh-inline-embed-title">🔗 ' + esc(names[type] || "Gömülü içerik") + '</div>' +
        '<div class="kh-inline-embed-url">' + esc(url) + '</div>' +
        '<button type="button" class="kh-inline-embed-remove">× Kaldır</button>';

    wrap.querySelector(".kh-inline-embed-remove").addEventListener("mousedown", e => e.preventDefault());
    wrap.querySelector(".kh-inline-embed-remove").addEventListener("click", () => {
        wrap.remove();
        text.focus();
        saveRange();
    });

    return wrap;
}

function addInlineEmbed(type, label) {
    saveRange();

    const url = prompt(label + " bağlantısını yapıştır:");
    if (!url || !url.trim()) return;

    const clean = url.trim();

    // GIF için doğrudan görsel göster; diğerleri veri bloğu olarak kaydedilir.
    if (type === "gif") {
        const img = document.createElement("img");
        img.src = clean;
        img.alt = "GIF";
        img.className = "article-inline-gif";
        insertNodeAtCursor(img);
        return;
    }

    insertNodeAtCursor(makeEmbedBlock(type, clean));
}

// Toolbar buttons
[
    ["gifButton", "gif", "GIF"],
    ["youtubeButton", "youtube", "YouTube video"],
    ["xButton", "x", "X gönderisi"],
    ["instagramButton", "instagram", "Instagram gönderisi"],
    ["redditButton", "reddit", "Reddit gönderisi"]
].forEach(([id, type, label]) => {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener("mousedown", e => e.preventDefault());
    btn.addEventListener("click", () => addInlineEmbed(type, label));
});

// ---------- Convert editor DOM to clean saved HTML ----------
function serializeArticle() {
    const clone = text.cloneNode(true);

    clone.querySelectorAll(".kh-inline-embed").forEach(block => {
        const type = block.dataset.embedType || "";
        const url = block.dataset.embedUrl || "";

        const marker = document.createElement("div");
        marker.className = "kh-embed-marker";
        marker.setAttribute("data-embed-type", type);
        marker.setAttribute("data-embed-url", url);
        marker.textContent = "";

        block.replaceWith(marker);
    });

    clone.querySelectorAll(".kh-inline-embed-remove").forEach(x => x.remove());
    return clone.innerHTML.trim();
}

// ---------- Form ----------
function form() {
    return {
        title: title.value.trim(),
        category: category.value,
        text: serializeArticle(),
        source: source.value.trim(),
        date: date.value,
        time: time.value,
        popular: popular.checked
    };
}

function valid(d) {
    if (!d.title || !d.category || !d.text) {
        alert("Lütfen başlık, kategori ve haber metnini doldurun.");
        return false;
    }

    if (!d.date || !d.time) {
        alert("Lütfen yayın tarihi ve saatini seçin.");
        return false;
    }

    return true;
}

// ---------- Form reset ----------
function clear() {
    title.value = "";
    category.value = "";
    text.innerHTML = "";
    source.value = "";
    date.value = "";
    time.value = "";
    popular.checked = false;

    coverInput.value = "";
    articleInput.value = "";
    croppedCover = "";
    savedRange = null;
    editingId = null;

    if (coverStatus) coverStatus.textContent = "";

    publish.style.display = "block";
    update.style.display = "none";
}

// ---------- Publish ----------
publish.addEventListener("click", () => {
    const d = form();
    if (!valid(d)) return;

    const list = get();
    const now = Date.now();

    const n = {
        id: String(now) + "_" + Math.random().toString(36).slice(2, 8),
        ...d,
        image: croppedCover || "",
        createdAt: now
    };

    list.push(n);

    if (!save(list)) return;

    alert("Yeni haber başarıyla yayınlandı! 💜");
    clear();
    show();
});

// ---------- Update ----------
update.addEventListener("click", () => {
    if (editingId === null) return;

    const d = form();
    if (!valid(d)) return;

    const list = get();
    const i = list.findIndex(n => String(n.id) === String(editingId));
    if (i < 0) return;

    list[i] = {
        ...list[i],
        ...d,
        image: croppedCover || list[i].image || ""
    };

    if (!save(list)) return;

    alert("Haber başarıyla güncellendi! 💜");
    clear();
    show();
});

// ---------- Edit ----------
function edit(id) {
    const n = get().find(x => String(x.id) === String(id));
    if (!n) return;

    editingId = n.id;

    title.value = n.title || "";
    category.value = n.category || "";
    source.value = n.source || "";
    date.value = n.date || "";
    time.value = n.time || "";
    popular.checked = !!n.popular;

    text.innerHTML = n.text || "";

    // Eski ayrı GIF/embed alanlarını yeni inline sisteme taşı.
    if (!text.querySelector(".kh-embed-marker") && (n.gif || (n.embedType && n.embedUrl))) {
        if (n.gif) {
            text.insertAdjacentHTML("beforeend",
                '<div class="kh-embed-marker" data-embed-type="gif" data-embed-url="' +
                esc(n.gif) + '"></div>');
        }
        if (n.embedType && n.embedUrl) {
            text.insertAdjacentHTML("beforeend",
                '<div class="kh-embed-marker" data-embed-type="' +
                esc(n.embedType) + '" data-embed-url="' +
                esc(n.embedUrl) + '"></div>');
        }
    }

    croppedCover = n.image || "";

    if (coverStatus) {
        coverStatus.textContent = n.image ? "✓ Mevcut kapak fotoğrafı korunuyor" : "";
    }

    publish.style.display = "none";
    update.style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Delete ----------
function del(id) {
    const list = get();
    const i = list.findIndex(n => String(n.id) === String(id));
    if (i < 0) return;

    if (!confirm('"' + list[i].title + '" haberini silmek istediğine emin misin?')) return;

    list.splice(i, 1);
    save(list);
    show();
}

// ---------- Admin list ----------
function show() {
    adminList.innerHTML = "";

    const list = get().slice().sort((a, b) =>
        (Number(b.createdAt) || Number(b.id) || 0) -
        (Number(a.createdAt) || Number(a.id) || 0)
    );

    if (!list.length) {
        adminList.innerHTML = "<p>Henüz haber eklenmemiş.</p>";
        return;
    }

    list.forEach(n => {
        const item = document.createElement("div");
        item.className = "admin-news-item";

        item.innerHTML =
            '<div class="admin-news-info">' +
                '<strong>' + esc(n.title) + '</strong>' +
                '<p>' + esc(n.category || "Genel") + ' · ' +
                    esc(n.date || "") + ' · ' + esc(n.time || "") +
                '</p>' +
            '</div>' +
            '<div class="admin-news-buttons">' +
                '<button type="button" class="edit-news-button">✏️ Düzenle</button>' +
                '<button type="button" class="delete-news-button">🗑️ Sil</button>' +
            '</div>';

        item.querySelector(".edit-news-button").onclick = () => edit(n.id);
        item.querySelector(".delete-news-button").onclick = () => del(n.id);

        adminList.appendChild(item);
    });
}

show();

})();
