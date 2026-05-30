import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

export const maxDuration = 60 // Allow longer processing for concurrent API calls

// Helper function to search, download, and upload the actual real-world product image from the web
async function fetchAndUploadProductImage(brand: string, name: string): Promise<string> {
    try {
        // Clean name: keep first 5-6 words to avoid long bloated titles
        const cleanName = name.split(" ").slice(0, 6).join(" ");
        const query = `${brand} ${cleanName}`;
        console.log(`[Image Crawler] Searching image for: "${query}"`);
        
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const html = await response.text();
        
        // Extract Bing CDN high-quality OIP thumbnails
        const turlRegex = /&quot;turl&quot;:&quot;(https?:\/\/ts\d\.mm\.bing\.net\/th\?id=OIP\.[^&"]+)/g;
        let match;
        const urls: string[] = [];
        while ((match = turlRegex.exec(html)) !== null) {
            if (match[1]) {
                urls.push(match[1]);
            }
        }
        
        if (urls.length > 0) {
            const webImageUrl = urls[0];
            console.log(`[Image Crawler] Found web image: ${webImageUrl}. Downloading and uploading to Supabase...`);
            
            // Download binary buffer
            const imageFetch = await fetch(webImageUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
            if (!imageFetch.ok) throw new Error(`HTTP error ${imageFetch.status}`);
            
            const imageBlob = await imageFetch.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const fileName = `products/web-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(fileName, buffer, {
                    contentType: "image/png",
                    upsert: true
                });
                
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("product-images")
                    .getPublicUrl(fileName);
                console.log(`[Image Crawler] Successfully uploaded to Supabase: ${publicUrl}`);
                return publicUrl;
            } else {
                console.error("❌ Supabase storage upload failure for web image:", uploadError);
                return webImageUrl; // Fallback to hotlink URL
            }
        }
    } catch (error: any) {
        console.error("❌ Image Crawler failure:", error.message || error);
    }
    return "/placeholder.png"; // Fallback to local placeholder
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            console.error("❌ Missing OPENAI_API_KEY environment variable.")
            return NextResponse.json({ 
                error: "La clé API OpenAI (OPENAI_API_KEY) n'est pas configurée dans les variables d'environnement." 
            }, { status: 500 })
        }

        const { products } = await req.json()
        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: "Format invalide. Liste de produits attendue." }, { status: 400 })
        }

        const openai = new OpenAI({ apiKey })

        // Process all products concurrently
        const generationPromises = products.map(async (p: any, index: number) => {
            const artcode = p.artcode || p.Sku || p.sku || `SKU-TEMP-${index}`
            const artdesignation = p.artdesignation || p.Name || p.title || "Produit Inconnu"
            const artcollection = p.artcollection || p.Brand || p.brand || "Generique"

            const textPrompt = `You are an expert product marketing specialist for Didali Store, distributes IT equipment, laptops, servers, enterprise printers, components, and networking products in Morocco.
Generate professional, high-converting e-commerce product details in French based on this raw Moroccan ERP product information:
- SKU / Reference: ${artcode}
- Raw Designation: ${artdesignation}
- Brand / Collection: ${artcollection}

You must return a JSON object with EXACTLY the following structure:
{
  "title": "A professional, clean, compelling French product title. Do not include SKU in the title.",
  "description": "An engaging, high-quality, rich French SEO description (2-3 sentences).",
  "benefits": ["Benefit 1 in French (max 10 words)", "Benefit 2 in French (max 10 words)", "Benefit 3 in French (max 10 words)"],
  "technicalSpecs": ["Spec 1 in French (e.g. Processeur: Intel Core i7)", "Spec 2 in French (e.g. RAM: 16 Go)", "Spec 3 in French"],
  "productType": "Short category/type (e.g. Laptop, Server, Switch, RAM, Printer)",
  "category": "Match the category strictly from this list: [\"Ordinateurs & Portables\", \"Serveurs & Stockage\", \"Imprimantes & Scanners\", \"Composants\", \"Gaming\", \"Réseaux\", \"Accessoires\"]"
}

Do not include any extra text. Return ONLY the raw JSON string.`

            try {
                // 1. Concurrent GPT text details generation
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a helpful assistant designed to output only valid JSON objects." },
                        { role: "user", content: textPrompt }
                    ],
                    response_format: { type: "json_object" }
                })

                const jsonText = completion.choices[0]?.message?.content || "{}"
                const aiData = JSON.parse(jsonText)

                // 2. Fetch the actual product image from the web (FAST, FREE, accurate)
                const finalTitle = aiData.title || artdesignation
                const generatedImageUrl = await fetchAndUploadProductImage(artcollection, finalTitle)

                return {
                    sku: artcode,
                    originalName: artdesignation,
                    brand: artcollection,
                    price_ht: p.price_ht || 0,
                    stock: p.stock || 0,
                    title: finalTitle,
                    description: aiData.description || "",
                    benefits: aiData.benefits || [],
                    technicalSpecs: aiData.technicalSpecs || [],
                    productType: aiData.productType || "",
                    category: aiData.category || "Accessoires",
                    images: [generatedImageUrl],
                    status: "generated",
                    success: true,
                    isFallback: false
                }
            } catch (err: any) {
                console.error(`⚠️ OpenAI Quota Exceeded or API Error for SKU ${artcode}. Using smart local fallback:`, err.message || err)
                
                // Smart local fallback generator
                const cleanBrand = artcollection !== "Generique" ? artcollection : ""
                const fallbackTitle = cleanBrand ? `${cleanBrand} ${artdesignation}` : artdesignation

                const nameLower = artdesignation.toLowerCase()
                const isLaptop = nameLower.includes("laptop") || nameLower.includes("pc") || nameLower.includes("notebook") || nameLower.includes("ordinateur")
                const isServer = nameLower.includes("server") || nameLower.includes("serveur") || nameLower.includes("poweredge")
                const isPrinter = nameLower.includes("printer") || nameLower.includes("imprimante") || nameLower.includes("canon") || nameLower.includes("hp deskjet")
                const isNetwork = nameLower.includes("switch") || nameLower.includes("routeur") || nameLower.includes("router") || nameLower.includes("cisco")

                let matchedCategory = "Accessoires"
                if (isLaptop) matchedCategory = "Ordinateurs & Portables"
                else if (isServer) matchedCategory = "Serveurs & Stockage"
                else if (isPrinter) matchedCategory = "Imprimantes & Scanners"
                else if (isNetwork) matchedCategory = "Réseaux"

                // Do not crawl or fetch images for the fallback generator
                return {
                    sku: artcode,
                    originalName: artdesignation,
                    brand: artcollection,
                    price_ht: p.price_ht || 0,
                    stock: p.stock || 0,
                    title: fallbackTitle,
                    description: `Découvrez le matériel professionnel ${fallbackTitle}. Une solution performante et de haute fiabilité conçue par ${artcollection} pour optimiser vos flux de travail au Maroc.`,
                    benefits: [
                        "Conception professionnelle robuste",
                        `Fiabilité supérieure signée ${artcollection}`,
                        "Parfaitement adapté aux exigences d'entreprise"
                    ],
                    technicalSpecs: [
                        `Marque : ${artcollection}`,
                        `Modèle : ${artdesignation}`,
                        `Référence Réseau : ${artcode}`
                    ],
                    productType: isLaptop ? "Ordinateur" : isServer ? "Serveur" : isPrinter ? "Imprimante" : "Matériel IT",
                    category: matchedCategory,
                    images: [],
                    status: "generated", // Mark as generated so they can still import
                    success: true,
                    isFallback: true, // Flag to display fallback banner
                    error: err.message || "Failed to call OpenAI APIs"
                }
            }
        })

        const results = await Promise.all(generationPromises)

        return NextResponse.json({ products: results })
    } catch (error: any) {
        console.error("❌ Global Generate Error:", error)
        return NextResponse.json({ error: error.message || "Erreur interne de génération" }, { status: 500 })
    }
}
