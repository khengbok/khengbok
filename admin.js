// ========================================
// KHENGBOK - YÖNETİM PANELİ
// D1 DATABASE + ŞİFRE KORUMALI API
// ========================================

(function () {
    "use strict";

    // ========================================
    // YARDIMCI
    // ========================================

    const $ = id => document.getElementById(id);

    // ========================================
    // FORM ELEMANLARI
    // ========================================

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

    const modal = $("cropModal");
    const cropImg = $("cropImage");
    const cancel = $("cropCancel");
    const confirmBtn = $("cropConfirm");
    const coverStatus = $("coverStatus");

    // ========================================
    // API
    // ========================================

    const KHENGBOK_API =
        "https://khengbok-api.khengbok.workers.dev";

    // ========================================
    // DEĞİŞKENLER
    // ========================================

    let editingId = null;
    let cropMode = null;
    let croppedCover = "";
    let savedRange = null;

    // ========================================
    // ESCAPE
    // ========================================

    function esc(value) {
        const div = document.createElement("div");

        div.textContent =
            value == null ? "" : String(value);

        return div.innerHTML;
    }

    // ========================================
    // ŞİFRE
    // ========================================

    function getAdminPassword() {

        let password =
            sessionStorage.getItem(
                "khengbokAdminPassword"
            );

        if (!password) {

            password = prompt(
                "Yönetim paneli şifresini gir:"
            );

            if (
                password === null ||
                password.trim() === ""
            ) {
                alert("Şifre girilmedi.");
                return null;
            }

            password = password.trim();

            sessionStorage.setItem(
                "khengbokAdminPassword",
                password
            );
        }

        return password;
    }

    // ========================================
    // KORUMALI API İSTEĞİ
    // ========================================

    async function adminFetch(
        url,
        options = {}
    ) {

        let password =
            getAdminPassword();

        if (!password) {
            return null;
        }

        let response = await fetch(
            url,
            {
                ...options,

                headers: {
                    ...(options.headers || {}),

                    "X-Admin-Password":
                        password
                }
            }
        );

        // Şifre yanlışsa tekrar sor
        if (response.status === 401) {

            sessionStorage.removeItem(
                "khengbokAdminPassword"
            );

            password = prompt(
                "Şifre yanlış. Şifreyi tekrar gir:"
            );

            if (
                password === null ||
                password.trim() === ""
            ) {
                alert("Şifre girilmedi.");
                return null;
            }

            password = password.trim();

            sessionStorage.setItem(
                "khengbokAdminPassword",
                password
            );

            response = await fetch(
                url,
                {
                    ...options,

                    headers: {
                        ...(options.headers || {}),

                        "X-Admin-Password":
                            password
                    }
                }
            );
        }

        return response;
    }

    // ========================================
    // D1 HABERLERİ GETİR
    // ========================================

    async function loadCloudNews() {

        try {

            const response =
                await fetch(
                    KHENGBOK_API +
                    "/api/articles"
                );

            if (!response.ok) {

                throw new Error(
                    "Haberler alınamadı."
                );
            }

            const articles =
                await response.json();

            if (!Array.isArray(articles)) {
                return [];
            }

            return articles.map(
                article => ({

                    id:
                        article.id,

                    title:
                        article.title || "",

                    text:
                        article.content || "",

                    image:
                        article.cover_image || "",

                    category:
                        article.category || "Genel",

                    source:
                        article.source || "",

                    date:
                        article.news_date || "",

                    time:
                        article.news_time || "",

                    gif:
                        article.gif || "",

                    embedType:
                        article.embed_type || "",

                    embedUrl:
                        article.embed_url || "",

                    popular:
                        Boolean(
                            article.popular
                        ),

                    createdAt:
                        article.created_at || ""
                })
            );

        } catch (error) {

            console.error(
                "Cloud haber hatası:",
                error
            );

            return [];
        }
    }

    // ========================================
    // FORM VERİSİ
    // ========================================

    function cloudFormData() {

        return {

            title:
                title.value.trim(),

            category:
                category.value,

            text:
                serializeArticle(),

            source:
                source.value.trim(),

            date:
                date.value,

            time:
                time.value,

            popular:
                popular.checked
        };
    }

    // ========================================
    // FORM KONTROL
    // ========================================

    function cloudValidate(data) {

        if (
            !data.title ||
            !data.category ||
            !data.text
        ) {

            alert(
                "Lütfen başlık, kategori ve haber metnini doldurun."
            );

            return false;
        }

        if (
            !data.date ||
            !data.time
        ) {

            alert(
                "Lütfen yayın tarihi ve saatini seçin."
            );

            return false;
        }

        return true;
    }

    // ========================================
    // YÖNETİM PANELİ HABERLERİ
    // ========================================

    async function showAdminNews() {

        const list =
            await loadCloudNews();

        adminList.innerHTML = "";

        if (!list.length) {

            adminList.innerHTML =
                "<p>Henüz haber eklenmemiş.</p>";

            return;
        }

        list.forEach(news => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-news-item";

            item.innerHTML = `
                <div class="admin-news-info">

                    <strong>
                        ${esc(news.title)}
                    </strong>

                    <p>
                        ${esc(news.category)}
                        ·
                        ${esc(news.date)}
                        ·
                        ${esc(news.time)}
                    </p>

                </div>

                <div class="admin-news-buttons">

                    <button
                        type="button"
                        class="cloud-edit-button">
                        ✏️ Düzenle
                    </button>

                    <button
                        type="button"
                        class="cloud-delete-button">
                        🗑️ Sil
                    </button>

                </div>
            `;

            const editButton =
                item.querySelector(
                    ".cloud-edit-button"
                );

            const deleteButton =
                item.querySelector(
                    ".cloud-delete-button"
                );

            editButton.addEventListener(
                "click",
                () => editCloudNews(news.id)
            );

            deleteButton.addEventListener(
                "click",
                () => deleteCloudNews(news.id)
            );

            adminList.appendChild(item);
        });
    }

    // ========================================
    // HABER DÜZENLE
    // ========================================

    async function editCloudNews(id) {

        try {

            const response =
                await fetch(
                    KHENGBOK_API +
                    "/api/articles/" +
                    encodeURIComponent(id)
                );

            if (!response.ok) {

                alert(
                    "Haber alınamadı."
                );

                return;
            }

            const article =
                await response.json();

            editingId =
                article.id;

            title.value =
                article.title || "";

            category.value =
                article.category || "";

            source.value =
                article.source || "";

            date.value =
                article.news_date || "";

            time.value =
                article.news_time || "";

            popular.checked =
                Boolean(
                    article.popular
                );

            text.innerHTML =
                article.content || "";

            croppedCover =
                article.cover_image || "";

            if (coverStatus) {

                coverStatus.textContent =
                    croppedCover
                        ? "✓ Mevcut kapak fotoğrafı korunuyor"
                        : "";
            }

            publish.style.display =
                "none";

            update.style.display =
                "block";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {

            console.error(error);

            alert(
                "Haber alınırken hata oluştu."
            );
        }
    }

    // ========================================
    // HABER SİL
    // ========================================

    async function deleteCloudNews(id) {

        const list =
            await loadCloudNews();

        const article =
            list.find(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (!article) {
            return;
        }

        if (
            !confirm(
                '"' +
                article.title +
                '" haberini silmek istediğine emin misin?'
            )
        ) {
            return;
        }

        try {

            const response =
                await adminFetch(
                    KHENGBOK_API +
                    "/api/articles/" +
                    encodeURIComponent(id),
                    {
                        method: "DELETE"
                    }
                );

            if (!response) {
                return;
            }

            const result =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Haber silinemedi."
                );
            }

            alert(
                "Haber silindi. 🗑️"
            );

            showAdminNews();

        } catch (error) {

            console.error(error);

            alert(
                "Silme hatası:\n" +
                error.message
            );
        }
    }

    // ========================================
    // YAYINLA
    // ========================================

    const newPublishButton =
        publish.cloneNode(true);

    publish.parentNode.replaceChild(
        newPublishButton,
        publish
    );

    newPublishButton.addEventListener(
        "click",
        async () => {

            const data =
                cloudFormData();

            if (
                !cloudValidate(data)
            ) {
                return;
            }

            try {

                const response =
                    await adminFetch(
                        KHENGBOK_API +
                        "/api/articles",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    title:
                                        data.title,

                                    content:
                                        data.text,

                                    cover_image:
                                        croppedCover || "",

                                    category:
                                        data.category,

                                    source:
                                        data.source,

                                    news_date:
                                        data.date,

                                    news_time:
                                        data.time,

                                    popular:
                                        data.popular,

                                    published:
                                        true
                                })
                        }
                    );

                if (!response) {
                    return;
                }

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Haber yayınlanamadı."
                    );
                }

                alert(
                    "Haber başarıyla yayınlandı! 💜"
                );

                clearForm();

                showAdminNews();

            } catch (error) {

                console.error(error);

                alert(
                    "Haber yayınlanırken hata oluştu:\n" +
                    error.message
                );
            }
        }
    );

    // ========================================
    // GÜNCELLE
    // ========================================

    const newUpdateButton =
        update.cloneNode(true);

    update.parentNode.replaceChild(
        newUpdateButton,
        update
    );

    newUpdateButton.addEventListener(
        "click",
        async () => {

            if (
                editingId === null
            ) {
                return;
            }

            const data =
                cloudFormData();

            if (
                !cloudValidate(data)
            ) {
                return;
            }

            try {

                const response =
                    await adminFetch(
                        KHENGBOK_API +
                        "/api/articles/" +
                        encodeURIComponent(
                            editingId
                        ),
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    title:
                                        data.title,

                                    content:
                                        data.text,

                                    cover_image:
                                        croppedCover || "",

                                    category:
                                        data.category,

                                    source:
                                        data.source,

                                    news_date:
                                        data.date,

                                    news_time:
                                        data.time,

                                    popular:
                                        data.popular,

                                    published:
                                        true
                                })
                        }
                    );

                if (!response) {
                    return;
                }

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Haber güncellenemedi."
                    );
                }

                alert(
                    "Haber başarıyla güncellendi! 💜"
                );

                clearForm();

                showAdminNews();

            } catch (error) {

                console.error(error);

                alert(
                    "Güncelleme hatası:\n" +
                    error.message
                );
            }
        }
    );

    // ========================================
    // FORM TEMİZLE
    // ========================================

    function clearForm() {

        title.value = "";
        category.value = "";
        text.innerHTML = "";
        source.value = "";
        date.value = "";
        time.value = "";
        popular.checked = false;

        if (coverInput) {
            coverInput.value = "";
        }

        if (articleInput) {
            articleInput.value = "";
        }

        croppedCover = "";
        savedRange = null;
        editingId = null;

        if (coverStatus) {
            coverStatus.textContent = "";
        }

        publish.style.display =
            "block";

        update.style.display =
            "none";
    }

    // ========================================
    // KATEGORİLER
    // ========================================

    let cats = [];

    try {

        cats =
            JSON.parse(
                localStorage.getItem(
                    "khengbokCategories"
                ) || "[]"
            );

        if (!Array.isArray(cats)) {
            cats = [];
        }

    } catch (error) {

        cats = [];
    }

    function addCat(c) {

        if (
            !c ||
            [...category.options].some(
                option =>
                    option.value === c
            )
        ) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value = c;
        option.textContent = c;

        category.appendChild(option);
    }

    cats.forEach(addCat);

    const addCategoryButton =
        $("addCategoryButton");

    if (addCategoryButton) {

        addCategoryButton.addEventListener(
            "click",
            () => {

                const c =
                    newCat.value.trim();

                if (!c) {

                    alert(
                        "Lütfen kategori adı yazın."
                    );

                    return;
                }

                if (cats.includes(c)) {

                    alert(
                        "Bu kategori zaten var."
                    );

                    return;
                }

                cats.push(c);

                localStorage.setItem(
                    "khengbokCategories",
                    JSON.stringify(cats)
                );

                addCat(c);

                category.value = c;

                newCat.value = "";
            }
        );
    }

    // ========================================
    // EDITOR SEÇİMİ
    // ========================================

    function saveRange() {

        const selection =
            window.getSelection();

        if (
            selection &&
            selection.rangeCount &&
            text.contains(
                selection.anchorNode
            )
        ) {

            savedRange =
                selection
                    .getRangeAt(0)
                    .cloneRange();
        }
    }

    [
        "keyup",
        "mouseup",
        "focus",
        "input"
    ].forEach(event => {

        text.addEventListener(
            event,
            saveRange
        );
    });

    function restoreRange() {

        if (!savedRange) {

            text.focus();

            const range =
                document.createRange();

            range.selectNodeContents(
                text
            );

            range.collapse(false);

            const selection =
                window.getSelection();

            selection.removeAllRanges();

            selection.addRange(range);

            return;
        }

        const selection =
            window.getSelection();

        selection.removeAllRanges();

        selection.addRange(
            savedRange
        );

        text.focus();
    }

    function insertNodeAtCursor(node) {

        restoreRange();

        const selection =
            window.getSelection();

        if (!selection.rangeCount) {

            text.appendChild(node);

            return;
        }

        const range =
            selection.getRangeAt(0);

        range.deleteContents();

        range.insertNode(node);

        const after =
            document.createRange();

        after.setStartAfter(node);

        after.collapse(true);

        selection.removeAllRanges();

        selection.addRange(after);

        savedRange =
            after.cloneRange();

        text.focus();
    }

    // ========================================
    // BOLD
    // ========================================

    const boldButton =
        $("boldButton");

    if (boldButton) {

        boldButton.addEventListener(
            "mousedown",
            e => e.preventDefault()
        );

        boldButton.addEventListener(
            "click",
            () => {

                restoreRange();

                document.execCommand(
                    "bold"
                );

                saveRange();
            }
        );
    }

    // ========================================
    // ITALIC
    // ========================================

    const italicButton =
        $("italicButton");

    if (italicButton) {

        italicButton.addEventListener(
            "mousedown",
            e => e.preventDefault()
        );

        italicButton.addEventListener(
            "click",
            () => {

                restoreRange();

                document.execCommand(
                    "italic"
                );

                saveRange();
            }
        );
    }

    // ========================================
    // LINK
    // ========================================

    const linkButton =
        $("linkButton");

    if (linkButton) {

        linkButton.addEventListener(
            "mousedown",
            e => e.preventDefault()
        );

        linkButton.addEventListener(
            "click",
            () => {

                restoreRange();

                const url =
                    prompt(
                        "Link adresini gir:"
                    );

                if (url) {

                    document.execCommand(
                        "createLink",
                        false,
                        url
                    );
                }

                saveRange();
            }
        );
    }

    // ========================================
    // MAKALE İÇİ GÖRSEL
    // ========================================

    const articleImageButton =
        $("articleImageButton");

    if (articleImageButton) {

        articleImageButton.addEventListener(
            "mousedown",
            e => e.preventDefault()
        );

        articleImageButton.addEventListener(
            "click",
            () => {

                saveRange();

                cropMode =
                    "article";

                articleInput.click();
            }
        );
    }

    if (articleInput) {

        articleInput.addEventListener(
            "change",
            () => {

                if (
                    articleInput.files &&
                    articleInput.files[0]
                ) {

                    openCrop(
                        articleInput.files[0]
                    );
                }
            }
        );
    }

    // ========================================
    // KAPAK GÖRSELİ
    // ========================================

    if (coverInput) {

        coverInput.addEventListener(
            "change",
            () => {

                if (
                    coverInput.files &&
                    coverInput.files[0]
                ) {

                    cropMode =
                        "cover";

                    openCrop(
                        coverInput.files[0]
                    );
                }
            }
        );
    }

    // ========================================
    // CROP AÇ
    // ========================================

    function openCrop(file) {

        if (
            !file ||
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Lütfen bir fotoğraf seç."
            );

            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            event => {

                cropImg.src =
                    event.target.result;

                modal.style.display =
                    "flex";
            };

        reader.onerror =
            () => {

                alert(
                    "Fotoğraf okunamadı."
                );
            };

        reader.readAsDataURL(file);
    }

    // ========================================
    // CROP İPTAL
    // ========================================

    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                modal.style.display =
                    "none";

                cropImg.src = "";

                cropMode = null;

                if (coverInput) {
                    coverInput.value = "";
                }

                if (articleInput) {
                    articleInput.value = "";
                }
            }
        );
    }

    // ========================================
    // CROP ONAY
    // ========================================

    if (confirmBtn) {

        confirmBtn.addEventListener(
            "click",
            () => {

                if (
                    !cropImg.src ||
                    !cropMode
                ) {
                    return;
                }

                const image =
                    new Image();

                image.onload =
                    () => {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );

                        const max = 1200;

                        const side =
                            Math.min(
                                image.width,
                                image.height
                            );

                        const scale =
                            Math.min(
                                1,
                                max / side
                            );

                        const output =
                            Math.max(
                                1,
                                Math.round(
                                    side *
                                    scale
                                )
                            );

                        canvas.width =
                            output;

                        canvas.height =
                            output;

                        canvas
                            .getContext("2d")
                            .drawImage(
                                image,

                                (
                                    image.width -
                                    side
                                ) / 2,

                                (
                                    image.height -
                                    side
                                ) / 2,

                                side,
                                side,

                                0,
                                0,

                                output,
                                output
                            );

                        const data =
                            canvas.toDataURL(
                                "image/jpeg",
                                0.82
                            );

                        if (
                            cropMode ===
                            "cover"
                        ) {

                            croppedCover =
                                data;

                            if (coverStatus) {

                                coverStatus.textContent =
                                    "✓ Kapak fotoğrafı hazır";
                            }

                        } else {

                            insertArticleImage(
                                data
                            );
                        }

                        modal.style.display =
                            "none";

                        cropImg.src = "";

                        if (coverInput) {
                            coverInput.value = "";
                        }

                        if (articleInput) {
                            articleInput.value = "";
                        }

                        cropMode = null;
                    };

                image.onerror =
                    () => {

                        alert(
                            "Fotoğraf işlenemedi."
                        );
                    };

                image.src =
                    cropImg.src;
            }
        );
    }

    function insertArticleImage(data) {

        const img =
            document.createElement(
                "img"
            );

        img.src = data;

        img.alt =
            "Haber içi görsel";

        img.className =
            "article-inline-image";

        insertNodeAtCursor(img);
    }

    // ========================================
    // INLINE EMBED
    // ========================================

    function makeEmbedBlock(
        type,
        url
    ) {

        const wrap =
            document.createElement(
                "div"
            );

        wrap.className =
            "kh-inline-embed";

        wrap.contentEditable =
            "false";

        wrap.dataset.embedType =
            type;

        wrap.dataset.embedUrl =
            url;

        const names = {

            gif:
                "GIF",

            youtube:
                "YouTube videosu",

            x:
                "X gönderisi",

            instagram:
                "Instagram gönderisi",

            reddit:
                "Reddit gönderisi"
        };

        wrap.innerHTML =
            '<div class="kh-inline-embed-title">' +
            "🔗 " +
            esc(
                names[type] ||
                "Gömülü içerik"
            ) +
            "</div>" +

            '<div class="kh-inline-embed-url">' +
            esc(url) +
            "</div>" +

            '<button type="button" class="kh-inline-embed-remove">' +
            "× Kaldır" +
            "</button>";

        const remove =
            wrap.querySelector(
                ".kh-inline-embed-remove"
            );

        if (remove) {

            remove.addEventListener(
                "mousedown",
                e => e.preventDefault()
            );

            remove.addEventListener(
                "click",
                () => {

                    wrap.remove();

                    text.focus();

                    saveRange();
                }
            );
        }

        return wrap;
    }

    function addInlineEmbed(
        type,
        label
    ) {

        saveRange();

        const url =
            prompt(
                label +
                " bağlantısını yapıştır:"
            );

        if (
            !url ||
            !url.trim()
        ) {
            return;
        }

        const clean =
            url.trim();

        if (type === "gif") {

            const img =
                document.createElement(
                    "img"
                );

            img.src = clean;

            img.alt = "GIF";

            img.className =
                "article-inline-gif";

            insertNodeAtCursor(img);

            return;
        }

        insertNodeAtCursor(
            makeEmbedBlock(
                type,
                clean
            )
        );
    }

    [
        [
            "gifButton",
            "gif",
            "GIF"
        ],

        [
            "youtubeButton",
            "youtube",
            "YouTube video"
        ],

        [
            "xButton",
            "x",
            "X gönderisi"
        ],

        [
            "instagramButton",
            "instagram",
            "Instagram gönderisi"
        ],

        [
            "redditButton",
            "reddit",
            "Reddit gönderisi"
        ]

    ].forEach(
        ([id, type, label]) => {

            const button =
                $(id);

            if (!button) {
                return;
            }

            button.addEventListener(
                "mousedown",
                e => e.preventDefault()
            );

            button.addEventListener(
                "click",
                () => {

                    addInlineEmbed(
                        type,
                        label
                    );
                }
            );
        }
    );

    // ========================================
    // EDITOR HTML TEMİZLE
    // ========================================

    function serializeArticle() {

        const clone =
            text.cloneNode(true);

        clone
            .querySelectorAll(
                ".kh-inline-embed"
            )
            .forEach(
                block => {

                    const type =
                        block.dataset.embedType ||
                        "";

                    const url =
                        block.dataset.embedUrl ||
                        "";

                    const marker =
                        document.createElement(
                            "div"
                        );

                    marker.className =
                        "kh-embed-marker";

                    marker.setAttribute(
                        "data-embed-type",
                        type
                    );

                    marker.setAttribute(
                        "data-embed-url",
                        url
                    );

                    marker.textContent =
                        "";

                    block.replaceWith(
                        marker
                    );
                }
            );

        clone
            .querySelectorAll(
                ".kh-inline-embed-remove"
            )
            .forEach(
                element =>
                    element.remove()
            );

        return clone.innerHTML.trim();
    }

    // ========================================
    // BAŞLAT
    // ========================================

    showAdminNews();

})();