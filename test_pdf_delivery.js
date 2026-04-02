const productId = "f762b5e6-f3e6-4ae4-a1eb-f4f55a88f0b2";
const token = "e12c58f0-62f9-4bb1-aaaf-16ebc62584b5";
const testPhone = "212707777721"; // The phone from your test script

// Small 1-page PDF Base64
const minimalPdfBase64 = "JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDIyPj5zdHJlYW0KQlQgL0YxIDI0IFRmIDEwMCA3MDAgVGQgKFRlc3QgUERGKSBUaiBFVAplbmRzdHJlYW0lJUVPRg==";

async function testPdfDelivery() {
  try {
    console.log("Fetching phone ID...");
    const phonesRes = await fetch(`https://api.maytapi.com/api/${productId}/listPhones`, {
      method: "GET",
      headers: { "x-maytapi-key": token }
    });
    const phonesData = await phonesRes.json();
    const phoneId = (Array.isArray(phonesData) ? phonesData[0] : phonesData.data[0]).id;
    
    console.log(`Using Phone ID: ${phoneId}`);
    
    console.log(`Sending Test PDF to ${testPhone}...`);
    
    // Testing the MOST COMPLIANT payload
    const sendRes = await fetch(`https://api.maytapi.com/api/${productId}/${phoneId}/sendMessage`, {
      method: "POST",
      headers: {
        "x-maytapi-key": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to_number: testPhone,
        type: "media",
        message: minimalPdfBase64, // Raw base64
        media: `data:application/pdf;base64,${minimalPdfBase64}`, // Data URI
        text: "Ceci est un test PDF Direct depuis Antigravity 📄",
        filename: "test-antigravity.pdf",
        fileName: "test-antigravity.pdf"
      })
    });
    
    const data = await sendRes.json();
    console.log("Response from Maytapi:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Test Failed:", err.message);
  }
}

testPdfDelivery();
