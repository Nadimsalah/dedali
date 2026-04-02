import { sendWhatsAppMessage, sendWhatsAppMedia } from './whatsapp';
import { generateOrderPDFBase64, generateOrderPDFBuffer } from './pdf-invoice';
import { supabaseAdmin } from './supabase-server';

export async function notifyOrderStatusChange(orderData: any) {
    if (!orderData || !orderData.customer_phone) {
        console.log("[OrderNotify] Missing order data or phone number");
        return;
    }

    const orderNum = orderData.order_number;
    const orderId = orderData.id;
    const status = orderData.status.toLowerCase();
    const phone = orderData.customer_phone;
    
    let msg = "";

    switch (status) {
        case 'pending':
            msg = `🛍️ Votre commande ${orderNum} est En attente de validation. Merci de votre confiance !`;
            break;
        case 'processing':
            msg = `⚙️ Bonne nouvelle ! Votre commande ${orderNum} est En traitement. Nous préparons vos articles.`;
            break;
        case 'shipped':
            msg = `🚚 Votre commande ${orderNum} a été Expédiée. Elle arrivera chez vous très bientôt !`;
            break;
        case 'delivered':
            msg = `✅ Votre commande ${orderNum} a été Livrée. Nous espérons que vous l'appréciez !`;
            break;
        case 'cancelled':
            msg = `❌ Votre commande ${orderNum} a été Annulée. Veuillez nous contacter pour plus d'informations.`;
            break;
    }

    if (msg) {
        try {
            console.log(`[OrderNotify] Starting notification for ${orderNum} (Status: ${status})`);
            
            // 1. Send text message
            const textRes = await sendWhatsAppMessage(phone, msg);
            console.log(`[OrderNotify] Text message result:`, textRes.success ? "Success" : "Failed: " + textRes.error);
            
            // 2. If status is processing or delivered, also send the PDF Invoice
            if (status === 'processing' || status === 'delivered') {
                console.log(`[OrderNotify] Generating PDF for ${orderNum}...`);
                
                // Ensure we have full order data (with items)
                let fullOrder = orderData;
                
                // Check if items are actually present
                const hasItems = (orderData.order_items && orderData.order_items.length > 0) || 
                                 (orderData.items && orderData.items.length > 0);

                if (!hasItems) {
                    console.log(`[OrderNotify] Items missing in payload, fetching from Supabase...`);
                    const { data, error: fetchError } = await supabaseAdmin
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', orderId)
                        .single();
                    
                    if (fetchError) {
                        console.error(`[OrderNotify] Failed to fetch items for PDF:`, fetchError);
                    } else if (data) {
                        fullOrder = data;
                    }
                }
                
                // Consistency fix: some parts of the app use 'items', some use 'order_items'
                if (fullOrder) {
                    const normalizedOrder = {
                        ...fullOrder,
                        order_items: fullOrder.order_items || fullOrder.items || []
                    };
                    
                    if (normalizedOrder.order_items.length === 0) {
                        console.warn(`[OrderNotify] No items found for order ${orderNum}, PDF might be empty.`);
                    }

                    try {
                        console.log(`[OrderNotify] Generating Buffer for ${orderNum}...`);
                        const pdfBuffer = await generateOrderPDFBuffer(normalizedOrder);
                        const storagePath = `${orderNum}_${Date.now()}.pdf`;

                        console.log(`[OrderNotify] Uploading to Supabase Storage (invoices/${storagePath})...`);
                        
                        const { data: uploadData, error: uploadError } = await supabaseAdmin
                            .storage
                            .from('invoices')
                            .upload(storagePath, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (uploadError) {
                            console.log(`[OrderNotify] Storage upload failed: ${uploadError.message}`);
                            // Fallback to legacy base64 method
                            const pdfBase64 = await generateOrderPDFBase64(normalizedOrder);
                            await sendWhatsAppMedia(phone, pdfBase64, `Bon-${orderNum}.pdf`, `Note: Envoi via base64 car le stockage a échoué.`, 'file');
                        } else {
                            const { data: { publicUrl } } = supabaseAdmin
                                .storage
                                .from('invoices')
                                .getPublicUrl(storagePath);
                            
                            console.log(`[OrderNotify] Public URL ready: ${publicUrl}`);
                            console.log(`[OrderNotify] Waiting 2.5s before sending PDF...`);
                            await new Promise(resolve => setTimeout(resolve, 2500));

                            const mediaRes = await sendWhatsAppMedia(
                                phone, 
                                publicUrl, 
                                `Bon-Commande-${orderNum}.pdf`, 
                                `Voici votre bon de commande #${orderNum}`
                            );
                            
                            console.log(`[OrderNotify] PDF delivery result:`, mediaRes.success ? "Success" : "Failed: " + mediaRes.error);
                        }
                    } catch (pdfErr) {
                        console.error(`[OrderNotify] PDF processing failed:`, pdfErr);
                    }
                }
            }
        } catch (err) {
            console.error("[OrderNotify] Unexpected Error:", err);
        }
    }
}

export async function notifyOrderItemsUpdated(orderData: any) {
    if (!orderData || !orderData.customer_phone) {
        console.log("[OrderNotify] Missing order data or phone for item update notification");
        return;
    }

    const orderNum = orderData.order_number;
    const phone = orderData.customer_phone;

    const msg = `✏️ Bonne nouvelle ! Votre commande *${orderNum}* a été mise à jour selon votre demande.\n\nConsultez votre tableau de bord pour voir les articles révisés et le nouveau total.`;

    try {
        console.log(`[OrderNotify] Sending item-update notification for ${orderNum}...`);
        const textRes = await sendWhatsAppMessage(phone, msg);
        console.log(`[OrderNotify] Item-update result:`, textRes.success ? "Success" : "Failed: " + textRes.error);
    } catch (err) {
        console.error("[OrderNotify] Error sending item-update notification:", err);
    }
}
