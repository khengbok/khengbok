    // =====================================
    // TÜM HABERLER  (HAFIF LISTE)
    //
    // Liste sayfalari icin sadece karta gereken alanlar donuluyor.
    // - content: sadece ilk 600 karakter (kart onizleme yazisi icin)
    // - cover_image: HIC gonderilmiyor; yerine has_cover bayragi var.
    //   Kapak gorseli asagidaki /cover adresinden gercek resim olarak gelir.
    // =====================================

    if (
      request.method === "GET" &&
      url.pathname === "/api/articles"
    ) {
      try {

        const result = await env.DB
          .prepare(`
            SELECT
              id,
              title,
              category,
              source,
              news_date,
              news_time,
              popular,
              created_at,
              CASE
                WHEN cover_image IS NOT NULL AND cover_image != ''
                THEN 1
                ELSE 0
              END AS has_cover,
              substr(content, 1, 600) AS content
            FROM articles
            ORDER BY created_at DESC
          `)
          .all();

        return json(result.results);

      } catch (error) {

        return json({
          error: error.message || String(error)
        }, 500);
      }
    }

    // =====================================
    // KAPAK GÖRSELİ  (gercek resim dosyasi olarak)
    //
    // Kapaklar veritabaninda base64 metin olarak duruyor.
    // Bu adres onu cozup normal bir JPEG/PNG olarak gonderir.
    // Boylece tarayici gorseli onbellege alabilir, Google Gorseller
    // indeksleyebilir ve haber listesi yaniti kucucuk kalir.
    //
    // ONEMLI: Bu blok, tek haber getiren
    // "GET /api/articles/:id" blogundan ONCE gelmeli.
    // =====================================

    if (
      request.method === "GET" &&
      url.pathname.startsWith("/api/articles/") &&
      url.pathname.endsWith("/cover")
    ) {
      try {

        const parts = url.pathname.split("/").filter(Boolean);
        const articleId = parts[2];

        if (!articleId) {
          return new Response("Haber ID bulunamadı.", {
            status: 400,
            headers: corsHeaders
          });
        }

        const row = await env.DB
          .prepare(
            "SELECT cover_image FROM articles WHERE id = ?"
          )
          .bind(articleId)
          .first();

        const dataUri =
          row && row.cover_image ? String(row.cover_image) : "";

        const match = dataUri.match(/^data:([^;,]+);base64,(.+)$/);

        if (!match) {
          return new Response("Kapak görseli yok.", {
            status: 404,
            headers: corsHeaders
          });
        }

        const mime = match[1];
        const binary = atob(match[2]);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
            ...corsHeaders
          }
        });

      } catch (error) {

        return new Response("Kapak görseli okunamadı.", {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // =====================================
    // ROBOTS.TXT
    //
    // Google, siteyi olustururken bu adresteki haberleri de cekiyor.
    // Bu yuzden API'nin Google'a ACIK kalmasi sart.
    // Buraya ASLA "Disallow: /" yazma - yazarsan Google haberleri
    // goremez ve site bos gorunur.
    // =====================================

    if (
      request.method === "GET" &&
      url.pathname === "/robots.txt"
    ) {
      return new Response(
        "User-agent: *\nAllow: /\n",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            ...corsHeaders
          }
        }
      );
    }
