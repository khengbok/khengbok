export async function onRequest(context) {
    const { request, env } = context;

    // Haberleri getir
    if (request.method === "GET") {
        const result = await env.db
            .prepare("SELECT * FROM articles ORDER BY createdAt DESC")
            .all();

        return Response.json(result.results);
    }

    // Yeni haber ekle
    if (request.method === "POST") {
        const data = await request.json();

        await env.db
            .prepare(`
                INSERT INTO articles
                (id, title, category, text, source, date, time, image, gif, embedType, embedUrl, popular, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                data.id,
                data.title,
                data.category,
                data.text,
                data.source || "",
                data.date,
                data.time,
                data.image || "",
                data.gif || "",
                data.embedType || "",
                data.embedUrl || "",
                data.popular ? 1 : 0,
                data.createdAt
            )
            .run();

        return Response.json({
            success: true
        });
    }

    return new Response("Method not allowed", {
        status: 405
    });
}