import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
    try {
        const { products } = await req.json()
        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: "Format invalide. Liste de produits attendue." }, { status: 400 })
        }

        // Cache for brand lookup to avoid hitting the DB multiple times for the same brand
        const brandCache: Record<string, string> = {}
        const savedProductsPayload = []

        for (const p of products) {
            const rawBrand = p.brand ? p.brand.trim() : (p.artcollection ? p.artcollection.trim() : "Generique")
            let brandId = null

            // 1. Resolve Brand to brand_id
            if (brandCache[rawBrand]) {
                brandId = brandCache[rawBrand]
            } else {
                // Check if brand exists in DB (case-insensitive)
                const { data: existingBrand, error: brandLookupError } = await supabase
                    .from("brands")
                    .select("id")
                    .ilike("name", rawBrand)
                    .maybeSingle()

                if (existingBrand) {
                    brandId = existingBrand.id
                    brandCache[rawBrand] = brandId
                } else {
                    // Create new Brand
                    const slug = rawBrand
                        .toLowerCase()
                        .trim()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "") // Remove accents
                        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with -
                        .replace(/(^-|-$)/g, "") // Remove leading/trailing hyphens

                    const finalSlug = slug || `brand-${Date.now()}`

                    const { data: newBrand, error: brandInsertError } = await supabase
                        .from("brands")
                        .insert({
                            name: rawBrand,
                            slug: finalSlug,
                            logo: "/placeholder.png"
                        })
                        .select("id")
                        .single()

                    if (newBrand) {
                        brandId = newBrand.id
                        brandCache[rawBrand] = brandId
                    } else {
                        console.error("❌ Failed to create brand:", rawBrand, brandInsertError)
                    }
                }
            }

            // 2. Prep pricing & stock - Do not invent prices/stock if missing (make it 0 if not provided)
            const priceHt = p.price_ht !== undefined && p.price_ht !== null && p.price_ht !== "" ? Number(p.price_ht) : 0
            const resellerPrice = p.reseller_price !== undefined && p.reseller_price !== null && p.reseller_price !== "" ? Number(p.reseller_price) : priceHt
            const partnerPrice = p.partner_price !== undefined && p.partner_price !== null && p.partner_price !== "" ? Number(p.partner_price) : (priceHt !== 0 ? Number((priceHt * 0.95).toFixed(2)) : 0)
            const wholesalerPrice = p.wholesaler_price !== undefined && p.wholesaler_price !== null && p.wholesaler_price !== "" ? Number(p.wholesaler_price) : (priceHt !== 0 ? Number((priceHt * 0.90).toFixed(2)) : 0)
            const guestPrice = p.price !== undefined && p.price !== null && p.price !== "" ? Number(p.price) : (priceHt !== 0 ? Number((priceHt * 1.20).toFixed(2)) : 0)
            const stock = p.stock !== undefined && p.stock !== null && p.stock !== "" ? Number(p.stock) : 0
            const compareAtPrice = p.compare_at_price !== undefined && p.compare_at_price !== null && p.compare_at_price !== "" ? Number(p.compare_at_price) : null

            // Clean technical specs representation
            const technicalSpecsString = p.technicalSpecs && Array.isArray(p.technicalSpecs) 
                ? p.technicalSpecs.join("\n") 
                : ""

            savedProductsPayload.push({
                title: p.title || p.artdesignation || p.originalName,
                sku: p.sku || p.artcode || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                description: p.description || "",
                category: p.category || "Accessoires",
                price: guestPrice,
                reseller_price: resellerPrice,
                partner_price: partnerPrice,
                wholesaler_price: wholesalerPrice,
                compare_at_price: compareAtPrice,
                reseller_min_qty: p.reseller_min_qty ? Number(p.reseller_min_qty) : null,
                partner_min_qty: p.partner_min_qty ? Number(p.partner_min_qty) : null,
                wholesaler_min_qty: p.wholesaler_min_qty ? Number(p.wholesaler_min_qty) : null,
                stock: stock,
                status: p.statusOverride || "draft", // Save as draft or custom active override
                images: p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/placeholder.png"],
                benefits: p.benefits || [],
                ingredients: p.ingredients || technicalSpecsString, // Map tech specs to text column 'ingredients'
                brand_id: p.brand_id || brandId,
                sales_count: 0
            })
        }

        if (savedProductsPayload.length === 0) {
            return NextResponse.json({ error: "Aucun produit valide à insérer." }, { status: 400 })
        }

        // 3. Batch insert in one Supabase transaction
        const { data, error: insertError } = await supabase
            .from("products")
            .insert(savedProductsPayload)

        if (insertError) {
            console.error("❌ Supabase insert products error:", insertError)
            return NextResponse.json({ 
                error: `Échec d'importation dans la base de données : ${insertError.message}` 
            }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            count: savedProductsPayload.length 
        })
    } catch (error: any) {
        console.error("❌ Save Batch Error:", error)
        return NextResponse.json({ error: error.message || "Erreur interne de sauvegarde" }, { status: 500 })
    }
}
