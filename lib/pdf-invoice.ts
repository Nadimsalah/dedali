import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatPrice } from './utils';

// Helper to strip non-Latin characters because standard jsPDF fonts don't support Arabic
function safeString(str: string | null | undefined): string {
    if (!str) return '';
    // Replace Arabic/non-Latin characters with their Latin equivalent if possible, or just strip
    // For now, let's just ensure it's a string and remove very problematic chars
    return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function generateOrderPDFBase64(order: any): Promise<string> {
    console.log(`[PDFGen] Starting for Order ${order.order_number}`);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    }) as any;

    // Header Color
    doc.setFillColor(242, 242, 242);
    doc.rect(0, 0, 210, 40, 'F');

    // Store Info
    doc.setFontSize(18);
    doc.setTextColor(0, 112, 186); // Blue-ish primary color
    doc.text('Didali Store SARL', 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Casablanca, Morocco', 15, 26);
    doc.text('Email: contact@dedalistore.com', 15, 31);

    // Title & Order Info
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('BON DE COMMANDE', 120, 22);

    doc.setFontSize(10);
    doc.text(`N° Commande: ${order.order_number}`, 120, 30);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 120, 35);

    // Client Info Section
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('CLIENT', 15, 55);
    doc.text('ADRESSE DE LIVRAISON', 120, 55);

    doc.setTextColor(0, 0, 0);
    
    // Client Column
    const clientName = safeString(order.reseller?.company_name || order.customer_name);
    const attn = safeString(order.reseller?.profile?.name || order.customer_name);
    doc.text(clientName, 15, 62);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Attn: ${attn}`, 15, 67);
    doc.text(safeString(order.customer_email), 15, 72);
    doc.text(safeString(order.customer_phone), 15, 77);

    // Shipping Column
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(safeString(order.customer_name), 120, 62);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(safeString(order.address_line1), 120, 67);
    doc.text(`${safeString(order.city)}, ${safeString(order.governorate)}`, 120, 72);

    // Items Table
    const tableData = order.order_items.map((item: any) => [
        safeString(item.product_title),
        item.quantity,
        `${formatPrice(item.price)} MAD`,
        `${formatPrice(item.subtotal)} MAD`
    ]);

    doc.autoTable({
        startY: 90,
        head: [['Produit', 'Quantité', 'Prix Unitaire', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 112, 186], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 10, cellPadding: 4 }
    });

    // Totals Section
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Sous-total:', 140, lastY);
    doc.text(`${formatPrice(order.subtotal)} MAD`, 195, lastY, { align: 'right' });

    doc.text('Livraison:', 140, lastY + 6);
    doc.text(`${formatPrice(order.shipping_cost)} MAD`, 195, lastY + 6, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL:', 140, lastY + 15);
    doc.text(`${formatPrice(order.total)} MAD`, 195, lastY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('Ce document est généré automatiquement par Didali Store.', 105, 285, { align: 'center' });

    // Return as data URL format for Maytapi
    console.log(`[PDFGen] Document ready, outputting string...`);
    const pdfData = doc.output('datauristring');
    console.log(`[PDFGen] PDF generation complete (DataURI Start: ${pdfData.substring(0, 30)}...)`);
    return pdfData;
}

export async function generateOrderPDFBuffer(order: any): Promise<Buffer> {
    console.log(`[PDFGen] Starting for Order ${order.order_number}`);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    }) as any;

    doc.setFillColor(242, 242, 242);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(18);
    doc.setTextColor(0, 112, 186); 
    doc.text('Didali Store SARL', 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Casablanca, Morocco', 15, 26);
    doc.text('Email: contact@dedalistore.com', 15, 31);

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('BON DE COMMANDE', 120, 22);

    doc.setFontSize(10);
    doc.text(`N° Commande: ${order.order_number}`, 120, 30);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 120, 35);

    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('CLIENT', 15, 55);
    doc.text('ADRESSE DE LIVRAISON', 120, 55);

    doc.setTextColor(0, 0, 0);
    const clientName = safeString(order.reseller?.company_name || order.customer_name);
    const attn = safeString(order.reseller?.profile?.name || order.customer_name);
    doc.text(clientName, 15, 62);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Attn: ${attn}`, 15, 67);
    doc.text(safeString(order.customer_email), 15, 72);
    doc.text(safeString(order.customer_phone), 15, 77);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(safeString(order.customer_name), 120, 62);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(safeString(order.address_line1), 120, 67);
    doc.text(`${safeString(order.city)}, ${safeString(order.governorate)}`, 120, 72);

    const tableData = order.order_items.map((item: any) => [
        safeString(item.product_title),
        item.quantity,
        `${formatPrice(item.price)} MAD`,
        `${formatPrice(item.subtotal)} MAD`
    ]);

    doc.autoTable({
        startY: 90,
        head: [['Produit', 'Quantité', 'Prix Unitaire', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 112, 186], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 10, cellPadding: 4 }
    });

    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Sous-total:', 140, lastY);
    doc.text(`${formatPrice(order.subtotal)} MAD`, 195, lastY, { align: 'right' });
    doc.text('Livraison:', 140, lastY + 6);
    doc.text(`${formatPrice(order.shipping_cost)} MAD`, 195, lastY + 6, { align: 'right' });
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL:', 140, lastY + 15);
    doc.text(`${formatPrice(order.total)} MAD`, 195, lastY + 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('Ce document est généré automatiquement par Didali Store.', 105, 285, { align: 'center' });

    console.log(`[PDFGen] Document ready, outputting ArrayBuffer...`);
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
}
