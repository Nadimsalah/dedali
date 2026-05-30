import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()
        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "URL d'image valide attendue." }, { status: 400 })
        }

        console.log(`[URL Importer] Downloading image from URL: ${url}`)
        
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        })
        
        if (!response.ok) {
            throw new Error(`Échec du téléchargement de l'image (Status ${response.status})`)
        }

        const contentType = response.headers.get("content-type") || "image/png"
        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Deduce extension
        let fileExt = "png"
        if (contentType.includes("jpeg") || contentType.includes("jpg")) fileExt = "jpg"
        else if (contentType.includes("webp")) fileExt = "webp"
        else if (contentType.includes("gif")) fileExt = "gif"

        const fileName = `products/paste-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: true
            })

        if (uploadError) {
            console.error("❌ Supabase upload failed for URL image:", uploadError)
            return NextResponse.json({ error: `Erreur Supabase Storage : ${uploadError.message}` }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName)

        console.log(`[URL Importer] Successfully uploaded to Supabase: ${publicUrl}`)

        return NextResponse.json({ url: publicUrl })
    } catch (error: any) {
        console.error("❌ URL Upload Error:", error)
        return NextResponse.json({ error: error.message || "Erreur interne d'importation d'image" }, { status: 500 })
    }
}
