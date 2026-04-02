// lib/whatsapp.ts

export async function sendWhatsAppMessage(to: string, message: string) {
  const { MAYTAPI_PRODUCT_ID, MAYTAPI_PHONE_ID, MAYTAPI_TOKEN } = process.env

  if (!MAYTAPI_PRODUCT_ID || !MAYTAPI_PHONE_ID || !MAYTAPI_TOKEN) {
    console.error("Missing Maytapi credentials in .env.local")
    return { success: false, error: "Missing config" }
  }

  // Formatting phone number to international standard (Morocco 212)
  let cleanPhone = to.replace(/[^0-9]/g, "")
  if (cleanPhone.startsWith("00")) {
    cleanPhone = cleanPhone.substring(2)
  }
  // Convert 0707... to 212707...
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    cleanPhone = "212" + cleanPhone.substring(1)
  }

  try {
    const response = await fetch(
      `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maytapi-key": MAYTAPI_TOKEN,
        },
        body: JSON.stringify({
          to_number: cleanPhone,
          message: message,
          type: "text",
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error("Maytapi Error:", data)
      return { success: false, error: data.message || "Failed to send WhatsApp message" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Network Error sending WhatsApp:", error)
    return { success: false, error: error.message }
  }
}

export async function sendWhatsAppMedia(to: string, mediaContent: string, fileName: string, caption?: string, overrideType?: string) {
  const { MAYTAPI_PRODUCT_ID, MAYTAPI_PHONE_ID, MAYTAPI_TOKEN } = process.env

  if (!MAYTAPI_PRODUCT_ID || !MAYTAPI_PHONE_ID || !MAYTAPI_TOKEN) {
    console.error("Missing Maytapi credentials in .env.local")
    return { success: false, error: "Missing config" }
  }

  let cleanPhone = to.replace(/[^0-9]/g, "")
  if (cleanPhone.startsWith("00")) {
    cleanPhone = cleanPhone.substring(2)
  }
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    cleanPhone = "212" + cleanPhone.substring(1)
  }

  try {
    let rawBase64 = mediaContent;
    let dataUri = mediaContent;
    let isUrl = mediaContent.startsWith('http');
    
    if (!isUrl) {
      if (mediaContent.startsWith('data:')) {
        const parts = mediaContent.split(';base64,');
        if (parts.length > 1) {
          rawBase64 = parts[1];
        }
      } else {
        dataUri = `data:application/pdf;base64,${mediaContent}`;
      }
    }

    const response = await fetch(
      `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maytapi-key": MAYTAPI_TOKEN,
        },
        body: JSON.stringify({
          to_number: cleanPhone,
          type: overrideType || "media",
          message: isUrl ? mediaContent : rawBase64,
          media: isUrl ? mediaContent : dataUri,
          text: caption || "",
          filename: fileName,
          fileName: fileName
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error("Maytapi Error:", data)
      return { success: false, error: data.message || "Failed to send WhatsApp media" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Network Error sending WhatsApp media:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Generates a 6-digit random code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
