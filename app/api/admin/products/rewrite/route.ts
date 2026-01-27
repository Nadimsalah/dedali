import { NextResponse } from 'next/server'

// Simple in-memory cache
const responseCache = new Map<string, string>()
const CACHE_TTL = 24 * 60 * 60 * 1000
const cacheTimestamps = new Map<string, number>()

function getCacheKey(field: string, text: string): string {
    const textHash = text.slice(0, 50) + text.length
    return `google:${field}:${textHash}`
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
    try {
        const { text, field } = await request.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        // Cleanup cache
        const now = Date.now()
        for (const [key, timestamp] of cacheTimestamps) {
            if (now - timestamp > CACHE_TTL) {
                responseCache.delete(key)
                cacheTimestamps.delete(key)
            }
        }

        // Cache check (Skip for 'benefit' to allow regenerating different variations)
        const cacheKey = getCacheKey(field, text)
        if (field !== 'benefit' && responseCache.has(cacheKey)) {
            console.log(`[Cache Hit] Google Direct for ${field}`)
            return NextResponse.json({ text: responseCache.get(cacheKey) })
        }

        // Instructions
        const fieldRules: Record<string, string> = {
            title: `GOAL: Generate a short, attractive cosmetic product name. RULES: Max 10 words. Clear and elegant. No exaggeration.`,
            description: `GOAL: Explain what the product is, what it does, and why it’s useful. RULES: 2–4 short sentences. Marketing style. Friendly and trustworthy.`,
            benefit: `GOAL: Generate a UNIQUE, short, punchy benefit title. RULES: Max 3-5 words. No sentences. creative and distinct.`,
            ingredients: `GOAL: Extract ingredients from text and translate to EGYPTIAN ARABIC (Masri). RULES: No intro. Use common Egyptian terms (e.g. 'زيت', 'خلاصة'). List only.`,
            how_to_use: `GOAL: Extract usage steps and rewrite in EGYPTIAN ARABIC (Masri). RULES: Use friendly dialect (e.g. 'حطي', 'اغسلي'). Direct numbered steps. No intro.`
        }

        const specificRule = fieldRules[field] || "Rewrite efficiently."
        const systemPrompt = `You are an embedded AI assistant inside an e-commerce admin panel for a cosmetics brand.

LANGUAGE & STYLE:
- Output language: Egyptian Arabic ONLY (اللهجة المصرية).
- No English words.
- No emojis.
- Natural, marketing-friendly cosmetics tone.
- Suitable for an online beauty store.
- Clear and easy for customers.

SAFETY & CONTENT RULES:
- Do NOT invent medical or therapeutic claims.
- Do NOT add certifications or lab claims unless present in input.
- Keep ingredient names accurate (INCI safe).
- Do NOT hallucinate benefits.
- No markdown, no bullet symbols unless required.

${specificRule}

FINAL OUTPUT RULE:
Return ONLY the generated content for that field. No explanations. No labels. No system messages.`

        // DIRECT GOOGLE API LOGIC
        if (process.env.GOOGLE_API_KEY) {
            console.log('Using Direct Google Gemini API...')

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `${systemPrompt}\n\nINPUT TO REWRITE: "${text}"` }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1000,
                        }
                    })
                })

                if (!res.ok) {
                    const errorIdx = await res.json().catch(() => ({}))
                    console.error('Google API Error:', errorIdx)
                    throw new Error(`Google API returned ${res.status}`)
                }

                const data = await res.json()
                let rewrittenText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

                if (rewrittenText) {
                    // Cleanup quotes if present
                    if ((rewrittenText.startsWith('"') && rewrittenText.endsWith('"')) ||
                        (rewrittenText.startsWith("'") && rewrittenText.endsWith("'"))) {
                        rewrittenText = rewrittenText.slice(1, -1)
                    }

                    responseCache.set(cacheKey, rewrittenText)
                    cacheTimestamps.set(cacheKey, Date.now())

                    return NextResponse.json({ text: rewrittenText })
                }

            } catch (error: any) {
                console.error('Google Direct API Failed:', error)
                // Fallthrough to OpenRouter if Google fails? Or just throw? 
                // Let's fallback to OpenRouter logic below if this fails.
            }
        }

        // ... Existing OpenRouter Logic as Backup ...
        // Validated Model List (Priority Order)
        const models = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-small-3.1-24b-instruct:free",
        ]

        // Model Iteration Loop (Reduced for bevity as secondary)
        for (const model of models) {
            const key = `or:${model}:${field}:${text.slice(0, 20)}`
            if (responseCache.has(key)) return NextResponse.json({ text: responseCache.get(key) })

            try {
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://localhost:3000",
                        "X-Title": "E-commerce Admin"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { "role": "system", "content": systemPrompt },
                            { "role": "user", "content": `Input: "${text}"` }
                        ]
                    })
                })

                if (res.ok) {
                    const aiData = await res.json()
                    let rewrittenText = aiData.choices?.[0]?.message?.content?.trim()
                    if (rewrittenText) {
                        if ((rewrittenText.startsWith('"') && rewrittenText.endsWith('"')) ||
                            (rewrittenText.startsWith("'") && rewrittenText.endsWith("'"))) {
                            rewrittenText = rewrittenText.slice(1, -1)
                        }
                        return NextResponse.json({ text: rewrittenText })
                    }
                }
            } catch (e) { console.error(e) }
        }

        return NextResponse.json({
            ok: false,
            error_code: "ALL_FAILED",
            message: "All AI services failed."
        }, { status: 503 })

    } catch (error: any) {
        console.error('Rewrite Final Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to rewrite text' },
            { status: 500 }
        )
    }
}
