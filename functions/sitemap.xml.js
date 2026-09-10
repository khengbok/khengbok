// ============================================================
// KHENGBOK - OTOMATIK SITE HARITASI
//
// Bu dosya /sitemap.xml adresini olusturur.
// Artik elle haber eklemene gerek yok: panelden yayinladigin
// her haber, bu liste bir sonraki uretilisinde otomatik girer.
//
// Nasil calisir:
//   1. Worker'daki haber listesini cekiyoruz.
//   2. Yayin tarihi gelmis haberleri suzuyoruz.
//   3. Google'in bekledigi XML bicimine ceviriyoruz.
//
// Veritabani baglantisi (env.DB) KULLANMIYOR - sadece herkese
// acik API adresini okuyor. Bu yuzden ek ayar gerektirmez.
// ============================================================

const SITE_URL = "https://khengbok.pages.dev";
const KHENGBOK_API = "https://khengbok-api.khengbok.workers.dev";

// Sitenin sabit sayfalari
const STATIC_PAGES = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/haberler", changefreq: "daily", priority: "0.9" },
    { path: "/gruplar", changefreq: "weekly", priority: "0.7" },
    { path: "/populer", changefreq: "weekly", priority: "0.7" },
    { path: "/hakkinda", changefreq: "monthly", priority: "0.4" }
];

function xmlEscape(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// Bugunun tarihi: 2026-09-10 biciminde
function today() {
    return new Date().toISOString().slice(0, 10);
}

// Yayin tarihi gelmis mi?
// script.js'teki isPublished() ile ayni mantik; saatler Turkiye
// saatine (+03:00) gore degerlendiriliyor.
function isPublished(article) {
    if (!article.news_date || !article.news_time) {
        return true;
    }

    const publishAt = new Date(
        article.news_date + "T" + article.news_time + ":00+03:00"
    );

    // Tarih bozuksa haberi yanlislikla gizleme
    if (Number.isNaN(publishAt.getTime())) {
        return true;
    }

    return publishAt <= new Date();
}

function urlBlock(loc, lastmod, changefreq, priority) {
    let block = "  <url>\n";
    block += "    <loc>" + xmlEscape(loc) + "</loc>\n";

    if (lastmod) {
        block += "    <lastmod>" + xmlEscape(lastmod) + "</lastmod>\n";
    }

    if (changefreq) {
        block += "    <changefreq>" + changefreq + "</changefreq>\n";
    }

    if (priority) {
        block += "    <priority>" + priority + "</priority>\n";
    }

    block += "  </url>\n";
    return block;
}

function buildSitemap(articles) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const stamp = today();

    for (const page of STATIC_PAGES) {
        xml += urlBlock(
            SITE_URL + page.path,
            stamp,
            page.changefreq,
            page.priority
        );
    }

    for (const article of articles) {
        xml += urlBlock(
            SITE_URL + "/haber?id=" + encodeURIComponent(article.id),
            article.news_date || stamp,
            null,
            "0.8"
        );
    }

    xml += "</urlset>\n";
    return xml;
}

// Yaniti okurken bir ust sinir koyuyoruz.
// Worker henuz "hafif liste" surumune guncellenmediyse yanit
// 10 MB'i asabilir; o durumda islemeye calismak yerine vazgecip
// en azindan sabit sayfalari iceren bir harita donduruyoruz.
const MAX_BYTES = 2 * 1024 * 1024;

async function readLimited(response) {
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        received += value.length;

        if (received > MAX_BYTES) {
            await reader.cancel();
            throw new Error(
                "Haber listesi cok buyuk (" + received + " bayt). " +
                "Worker'in hafif liste surumu yayinlanmis mi?"
            );
        }

        chunks.push(value);
    }

    return new TextDecoder().decode(
        chunks.reduce((all, chunk) => {
            const merged = new Uint8Array(all.length + chunk.length);
            merged.set(all, 0);
            merged.set(chunk, all.length);
            return merged;
        }, new Uint8Array(0))
    );
}

export async function onRequest() {
    let articles = [];

    try {
        const response = await fetch(
            KHENGBOK_API + "/api/articles",
            { signal: AbortSignal.timeout(10000) }
        );

        if (response.ok) {
            const rows = JSON.parse(await readLimited(response));

            if (Array.isArray(rows)) {
                articles = rows
                    .filter(a => a && a.id !== undefined && a.id !== null)
                    .filter(isPublished);
            }
        }
    } catch (error) {
        // API'ye ulasilamadiysa site haritasini bos birakmiyoruz:
        // en azindan sabit sayfalar Google'a gitsin.
        console.error("Site haritasi: haberler alinamadi.", error);
    }

    return new Response(buildSitemap(articles), {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=1800"
        }
    });
}
