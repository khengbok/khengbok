// ========================================
// KHENGBOK - HABER DETAY
// ========================================
(function () {
    "use strict";

    (async function () {

        const params = new URLSearchParams(location.search);
        const id = params.get("id");

        const KHENGBOK_API = "https://khengbok-api.khengbok.workers.dev";

        let news = null;

        // ========================================
        // HABERİ API'DEN AL
        // ========================================
        try {
            if (id) {
                const response = await fetch(
                    KHENGBOK_API + "/api/articles/" + encodeURIComponent(id)
                );

                if (response.ok) {
                    const article = await response.json();
                    news = {
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
                    };
                }
            }
        } catch (e) {
            console.error("Haber alınamadı:", e);
        }

        const $ = x => document.getElementById(x);

        // ========================================
        // HABER BULUNAMADI VEYA YÜKLENEMEDİ
        // ========================================
        if (!news) {
            const titleEl = $("newsTitle");
            const contentEl = $("newsContent");

            if (titleEl) titleEl.textContent = "Haber bulunamadı.";
            if (contentEl) contentEl.innerHTML = "<p>Bu haber mevcut değil veya yüklenirken bir sorun oluştu.</p>";
            return;
        }

        // ========================================
        // HABER BİLGİLERİ
        // ========================================
        const titleEl = $("newsTitle");
        const categoryEl = $("newsCategory");
        const dateEl = $("newsDate");

        if (titleEl) titleEl.textContent = news.title || "";
        if (categoryEl) categoryEl.textContent = news.category || "Genel";
        if (dateEl) {
            dateEl.textContent = (news.date || "") + (news.time ? " · " + news.time : "");
        }

        // ========================================
        // KAPAK FOTOĞRAFI
        // ========================================
        const cover = $("newsCover");
        if (cover) {
            cover.innerHTML = "";
            cover.style.display = "none";
        }

        const contentEl = $("newsContent");
        let articleHTML = news.text || "";

        // Kapak görseli metin içinde tekrar varsa çıkar
        if (news.image && articleHTML) {
            try {
                const temp = document.createElement("div");
                temp.innerHTML = articleHTML;
                temp.querySelectorAll("img").forEach(img => {
                    if (img.getAttribute("src") === news.image) {
                        img.remove();
                    }
                });
                articleHTML = temp.innerHTML;
            } catch (err) {
                console.error("Kapak temizleme hatası:", err);
            }
        }

        // ========================================
        // EMBED OLUŞTURMA
        // ========================================
        function createEmbed(type, url) {
            const wrap = document.createElement("div");
            wrap.className = "article-inline-embed";

            if (!type || !url) return wrap;

            try {
                if (type === "gif") {
                    const img = document.createElement("img");
                    img.src = url;
                    img.alt = "GIF";
                    img.className = "article-inline-gif";
                    wrap.appendChild(img);
                    return wrap;
                }

                if (type === "youtube") {
                    const u = new URL(url);
                    const vid = u.hostname.includes("youtu.be")
                        ? u.pathname.slice(1)
                        : u.searchParams.get("v");

                    if (vid) {
                        const box = document.createElement("div");
                        box.className = "embed-container";
                        const iframe = document.createElement("iframe");
                        iframe.src = "https://www.youtube.com/embed/" + encodeURIComponent(vid);
                        iframe.title = "YouTube";
                        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                        iframe.allowFullscreen = true;
                        box.appendChild(iframe);
                        wrap.appendChild(box);
                    }
                    return wrap;
                }

                if (type === "x") {
                    const block = document.createElement("blockquote");
                    block.className = "twitter-tweet";
                    const a = document.createElement("a");
                    a.href = url;
                    block.appendChild(a);
                    wrap.appendChild(block);

                    loadScriptOnce("twitter-widgets-script", "https://platform.twitter.com/widgets.js", () => {
                        if (window.twttr && window.twttr.widgets) {
                            window.twttr.widgets.load(wrap);
                        }
                    });
                    return wrap;
                }

                if (type === "instagram") {
                    const clean = url.split("?")[0].replace(/\/$/, "");
                    const block = document.createElement("blockquote");
                    block.className = "instagram-media";
                    block.setAttribute("data-instgrm-permalink", clean + "/");
                    block.setAttribute("data-instgrm-version", "14");

                    const a = document.createElement("a");
                    a.href = clean + "/";
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.textContent = "Instagram gönderisini görüntüle";

                    block.appendChild(a);
                    wrap.appendChild(block);

                    loadScriptOnce("instagram-embed-script", "https://www.instagram.com/embed.js", () => {
                        if (window.instgrm && window.instgrm.Embeds) {
                            window.instgrm.Embeds.process();
                        }
                    });
                    return wrap;
                }
            } catch (error) {
                console.error("Embed hatası:", error);
            }

            return wrap;
        }

        function loadScriptOnce(id, src, callback) {
            const existing = document.getElementById(id);
            if (existing) {
                if (callback) setTimeout(callback, 0);
                return;
            }
            const script = document.createElement("script");
            script.id = id;
            script.async = true;
            script.src = src;
            if (callback) script.onload = callback;
            document.body.appendChild(script);
        }

        // ========================================
        // HABER İÇERİĞİNİ BASTIRMA VE STİL TEMİZLİĞİ
        // ========================================
        function renderArticleContent(html) {
            if (!contentEl) return;

            const temp = document.createElement("div");
            temp.innerHTML = html || "";

            try {
                // Görsel boyutlandırma ve kırpılma engelleme
                const imgs = temp.querySelectorAll("img");
                imgs.forEach(img => {
                    img.removeAttribute("width");
                    img.removeAttribute("height");
                    // Doğal boyutu koru; yalnızca dar ekranlarda taşmayı önle.
                    img.style.cssText = "width: auto !important; max-width: 100% !important; height: auto !important; max-height: none !important; object-fit: contain !important; display: block !important; margin: 15px auto !important;";
                });

                // Görselleri saran kutuları serbest bırakma
                const boxes = temp.querySelectorAll("p, figure, div, span");
                boxes.forEach(box => {
                    if (box.querySelector("img")) {
                        box.style.cssText += "; height: auto !important; max-height: none !important; overflow: visible !important;";
                    }
                });
            } catch (err) {
                console.error("Resim stili işleme hatası:", err);
            }

            // Embed markerları değiştir
            temp.querySelectorAll(".kh-embed-marker").forEach(marker => {
                const type = marker.getAttribute("data-embed-type");
                const url = marker.getAttribute("data-embed-url");
                marker.replaceWith(createEmbed(type, url));
            });

            contentEl.innerHTML = "";
            while (temp.firstChild) {
                contentEl.appendChild(temp.firstChild);
            }
        }

        // EKRANA BAS
        renderArticleContent(articleHTML);

        // ========================================
        // KAYNAK
        // ========================================
        const source = $("newsSource");
        if (source) {
            source.innerHTML = "";
            if (news.source) {
                const a = document.createElement("a");
                a.href = news.source;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = "Kaynak";
                source.appendChild(a);
            }
        }

        // ========================================
        // GÖRÜNTÜLENME SAYACI
        // ========================================
        const vc = $("viewCount");
        if (vc && news.id) {
            (async () => {
                try {
                    const response = await fetch(
                        KHENGBOK_API + "/api/articles/" + encodeURIComponent(news.id) + "/view",
                        { method: "POST" }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        vc.textContent = String(data.views || 1);
                    }
                } catch (err) {
                    console.error("Görüntülenme hatası:", err);
                }
            })();
        }

        // ========================================
        // YORUMLAR
        // ========================================
        const cb = $("commentButton");
        const listEl = $("commentsList");

        async function loadComments() {
            if (!listEl || !news.id) return;

            try {
                const res = await fetch(KHENGBOK_API + "/api/articles/" + encodeURIComponent(news.id) + "/comments");
                if (res.ok) {
                    const comments = await res.json();
                    listEl.innerHTML = "";

                    if (!Array.isArray(comments) || comments.length === 0) {
                        listEl.innerHTML = "<p>Henüz yorum yok. İlk yorumu sen yap! 💜</p>";
                        return;
                    }

                    comments.forEach(c => {
                        const el = document.createElement("div");
                        el.className = "user-comment";

                        const strong = document.createElement("strong");
                        const p = document.createElement("p");
                        const small = document.createElement("small");

                        strong.textContent = c.name || "Anonim";
                        p.textContent = c.text || "";

                        if (c.created_at) {
                            small.textContent = new Date(c.created_at).toLocaleString("tr-TR");
                        }

                        el.append(strong, p, small);

                        if (c.reply) {
                            const replyBox = document.createElement("div");
                            replyBox.className = "admin-reply";
                            replyBox.style.cssText = "margin-left: 15px; border-left: 2px solid #8a2be2; padding-left: 10px;";
                            replyBox.innerHTML = `<strong>Yönetici Yanıtı:</strong> <p>${c.reply}</p>`;
                            el.appendChild(replyBox);
                        }

                        listEl.appendChild(el);
                    });
                }
            } catch (err) {
                console.error("Yorum çekme hatası:", err);
            }
        }

        loadComments();

        if (cb) {
            cb.addEventListener("click", async () => {
                const name = $("commentName")?.value.trim() || "";
                const email = $("commentEmail")?.value.trim() || "";
                const commentText = $("commentText")?.value.trim() || "";

                if (!name || !email || !commentText) {
                    return alert("Lütfen bütün alanları doldurun.");
                }

                try {
                    const res = await fetch(KHENGBOK_API + "/api/articles/" + encodeURIComponent(news.id) + "/comments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, email, text: commentText })
                    });

                    if (res.ok) {
                        const textBox = $("commentText");
                        if (textBox) textBox.value = "";
                        alert("Yorumun gönderildi ve onay bekliyor! 💜");
                        loadComments();
                    } else {
                        const errData = await res.json();
                        alert("Hata: " + (errData.error || "Yorum gönderilemedi."));
                    }
                } catch (err) {
                    console.error("Yorum gönderme hatası:", err);
                    alert("Bağlantı hatası oluştu.");
                }
            });
        }

    })();
})();
