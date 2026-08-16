// ========================================
// KHENGBOK - HABER DETAY
// ========================================
(function () {
    "use strict";

    (async function () {

        const params = new URLSearchParams(location.search);
        const id = params.get("id");

        const KHENGBOK_API =
            "https://khengbok-api.khengbok.workers.dev";

        let news = null;

        // ========================================
        // HABERİ API'DEN AL
        // ========================================

        try {
            const response = await fetch(
                KHENGBOK_API +
                "/api/articles/" +
                encodeURIComponent(id)
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

        } catch (e) {

            console.error("Haber alınamadı:", e);
        }

        const $ = x => document.getElementById(x);

        // ========================================
        // HABER BULUNAMADI
        // ========================================

        if (!news) {

            const titleEl = $("newsTitle");
            const contentEl = $("newsContent");

            if (titleEl) {
                titleEl.textContent = "Haber bulunamadı.";
            }

            if (contentEl) {
                contentEl.innerHTML =
                    "<p>Bu haber mevcut değil veya silinmiş.</p>";
            }

            return;
        }

        // ========================================
        // HABER BİLGİLERİ
        // ========================================

        const titleEl = $("newsTitle");
        const categoryEl = $("newsCategory");
        const dateEl = $("newsDate");

        if (titleEl) {
            titleEl.textContent = news.title || "";
        }

        if (categoryEl) {
            categoryEl.textContent =
                news.category || "Genel";
        }

        if (dateEl) {
            dateEl.textContent =
                (news.date || "") +
                (news.time ? " · " + news.time : "");
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

        // ========================================
        // KAPAK FOTOĞRAFI METNE YANLIŞLIKLA
        // EKLENDİYSE ÇIKAR
        // ========================================

        if (news.image && articleHTML) {

            const temp = document.createElement("div");

            temp.innerHTML = articleHTML;

            temp.querySelectorAll("img").forEach(img => {

                if (
                    img.getAttribute("src") ===
                    news.image
                ) {
                    img.remove();
                }

            });

            articleHTML = temp.innerHTML;
        }

        // ========================================
        // EMBED OLUŞTUR
        // ========================================

        function createEmbed(type, url) {

            const wrap =
                document.createElement("div");

            wrap.className =
                "article-inline-embed";

            if (!type || !url) {
                return wrap;
            }

            try {

                // -------------------------------
                // GIF
                // -------------------------------

                if (type === "gif") {

                    const img =
                        document.createElement("img");

                    img.src = url;
                    img.alt = "GIF";
                    img.className =
                        "article-inline-gif";

                    wrap.appendChild(img);

                    return wrap;
                }

                // -------------------------------
                // YOUTUBE
                // -------------------------------

                if (type === "youtube") {

                    const u = new URL(url);

                    const vid =
                        u.hostname.includes("youtu.be")
                            ? u.pathname.slice(1)
                            : u.searchParams.get("v");

                    if (vid) {

                        const box =
                            document.createElement("div");

                        box.className =
                            "embed-container";

                        const iframe =
                            document.createElement("iframe");

                        iframe.src =
                            "https://www.youtube.com/embed/" +
                            encodeURIComponent(vid);

                        iframe.title = "YouTube";

                        iframe.allow =
                            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

                        iframe.allowFullscreen = true;

                        box.appendChild(iframe);
                        wrap.appendChild(box);
                    }

                    return wrap;
                }

                // -------------------------------
                // X / TWITTER
                // -------------------------------

                if (type === "x") {

                    const block =
                        document.createElement("blockquote");

                    block.className =
                        "twitter-tweet";

                    const a =
                        document.createElement("a");

                    a.href = url;

                    block.appendChild(a);
                    wrap.appendChild(block);

                    loadScriptOnce(
                        "twitter-widgets-script",
                        "https://platform.twitter.com/widgets.js",
                        () => {

                            if (
                                window.twttr &&
                                window.twttr.widgets
                            ) {

                                window.twttr.widgets.load(
                                    wrap
                                );
                            }
                        }
                    );

                    return wrap;
                }

                // -------------------------------
                // INSTAGRAM
                // -------------------------------

                if (type === "instagram") {

                    const clean =
                        url
                            .split("?")[0]
                            .replace(/\/$/, "");

                    const block =
                        document.createElement(
                            "blockquote"
                        );

                    block.className =
                        "instagram-media";

                    block.setAttribute(
                        "data-instgrm-permalink",
                        clean + "/"
                    );

                    block.setAttribute(
                        "data-instgrm-version",
                        "14"
                    );

                    const a =
                        document.createElement("a");

                    a.href = clean + "/";
                    a.target = "_blank";
                    a.rel =
                        "noopener noreferrer";

                    a.textContent =
                        "Instagram gönderisini görüntüle";

                    block.appendChild(a);
                    wrap.appendChild(block);

                    loadScriptOnce(
                        "instagram-embed-script",
                        "https://www.instagram.com/embed.js",
                        () => {

                            if (
                                window.instgrm &&
                                window.instgrm.Embeds
                            ) {

                                window.instgrm.Embeds.process();
                            }
                        }
                    );

                    return wrap;
                }

            } catch (error) {

                console.error(
                    "Embed oluşturulamadı:",
                    error
                );
            }

            return wrap;
        }

        // ========================================
        // DIŞ SCRIPT'İ BİR KEZ YÜKLE
        // ========================================

        function loadScriptOnce(
            id,
            src,
            callback
        ) {

            const existing =
                document.getElementById(id);

            if (existing) {

                if (callback) {
                    setTimeout(callback, 0);
                }

                return;
            }

            const script =
                document.createElement("script");

            script.id = id;
            script.async = true;
            script.src = src;

            if (callback) {
                script.onload = callback;
            }

            document.body.appendChild(script);
        }

        // ========================================
        // HABER İÇERİĞİNİ GÖSTER
        // ========================================

        function renderArticleContent(html) {

            const temp =
                document.createElement("div");

            temp.innerHTML = html || "";

            temp
                .querySelectorAll(".kh-embed-marker")
                .forEach(marker => {

                    const type =
                        marker.getAttribute(
                            "data-embed-type"
                        );

                    const url =
                        marker.getAttribute(
                            "data-embed-url"
                        );

                    marker.replaceWith(
                        createEmbed(type, url)
                    );
                });

            if (contentEl) {

                contentEl.innerHTML = "";

                while (temp.firstChild) {

                    contentEl.appendChild(
                        temp.firstChild
                    );
                }
            }
        }

        renderArticleContent(articleHTML);

        // ========================================
        // KAYNAK
        // ========================================

        const source = $("newsSource");

        if (source) {

            source.innerHTML = "";

            if (news.source) {

                const a =
                    document.createElement("a");

                a.href = news.source;
                a.target = "_blank";
                a.rel =
                    "noopener noreferrer";

                a.textContent = "Kaynak";

                source.appendChild(a);
            }
        }

        // ========================================
        // GÖRÜNTÜLENME
        // ========================================

        const vc = $("viewCount");

        if (vc) {

            const key =
                "khengbokViews_" + news.id;

            const value =
                (Number(
                    localStorage.getItem(key)
                ) || 0) + 1;

            localStorage.setItem(
                key,
                String(value)
            );

            vc.textContent =
                String(value);
        }

        // ========================================
        // YORUMLAR
        // ========================================

        const cb = $("commentButton");

        if (cb) {

            const listEl =
                $("commentsList");

            const key =
                "khengbokComments_" +
                news.id;

            let comments = [];

            try {

                comments =
                    JSON.parse(
                        localStorage.getItem(key) ||
                        "[]"
                    );

                if (!Array.isArray(comments)) {
                    comments = [];
                }

            } catch (e) {

                comments = [];
            }

            const commentName =
                $("commentName");

            const commentEmail =
                $("commentEmail");

            if (commentName) {

                commentName.value =
                    localStorage.getItem(
                        "khengbokCommentName"
                    ) || "";
            }

            if (commentEmail) {

                commentEmail.value =
                    localStorage.getItem(
                        "khengbokCommentEmail"
                    ) || "";
            }

            function show() {

                if (!listEl) {
                    return;
                }

                listEl.innerHTML = "";

                if (!comments.length) {

                    listEl.innerHTML =
                        "<p>Henüz yorum yok. İlk yorumu sen yap! 💜</p>";

                    return;
                }

                comments.forEach(c => {

                    const el =
                        document.createElement(
                            "div"
                        );

                    el.className =
                        "user-comment";

                    const strong =
                        document.createElement(
                            "strong"
                        );

                    const p =
                        document.createElement(
                            "p"
                        );

                    const small =
                        document.createElement(
                            "small"
                        );

                    strong.textContent =
                        c.name || "Anonim";

                    p.textContent =
                        c.text || "";

                    small.textContent =
                        c.date || "";

                    el.append(
                        strong,
                        p,
                        small
                    );

                    listEl.appendChild(el);
                });
            }

            show();

            cb.addEventListener(
                "click",
                () => {

                    const name =
                        $("commentName")
                            ?.value
                            .trim() || "";

                    const email =
                        $("commentEmail")
                            ?.value
                            .trim() || "";

                    const commentText =
                        $("commentText")
                            ?.value
                            .trim() || "";

                    if (
                        !name ||
                        !email ||
                        !commentText
                    ) {

                        return alert(
                            "Lütfen bütün alanları doldurun."
                        );
                    }

                    localStorage.setItem(
                        "khengbokCommentName",
                        name
                    );

                    localStorage.setItem(
                        "khengbokCommentEmail",
                        email
                    );

                    comments.push({

                        name,
                        email,
                        text: commentText,

                        date:
                            new Date()
                                .toLocaleString(
                                    "tr-TR"
                                )
                    });

                    localStorage.setItem(
                        key,
                        JSON.stringify(
                            comments
                        )
                    );

                    const textBox =
                        $("commentText");

                    if (textBox) {
                        textBox.value = "";
                    }

                    show();

                    alert(
                        "Yorumun gönderildi! 💜"
                    );
                }
            );
        }

    })();

})();