import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    let target = request.nextUrl.searchParams.get("url")

    if (!target) {
        return new Response(JSON.stringify({ message: "Missing url parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    };

    if (target.includes("/_next/image")) {
        try {
            const nextImageUrl = new URL(target)
            const realUrl = nextImageUrl.searchParams.get("url")
            if (realUrl) {
                target = realUrl
            }
        } catch {
            return new Response(JSON.stringify({ message: "Invalid media url" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }
    };

    let parsedUrl: URL
    try {
        parsedUrl = new URL(target)
    } catch {
        return new Response(JSON.stringify({ message: "Invalid media url" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return new Response(JSON.stringify({ message: "Only http/https urls are supported" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    try {
        const upstream = await fetch(parsedUrl.toString(), { cache: "no-store" })

        if (!upstream.ok) {
            return new Response(
                JSON.stringify({ message: `Failed to fetch media. Status: ${upstream.status}` }),
                {
                    status: upstream.status,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        const body = await upstream.arrayBuffer()
        const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"

        return new Response(body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store",
            },
        })
    } catch {
        return new Response(JSON.stringify({ message: "Unexpected error while fetching media" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
