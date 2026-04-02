const productId = "f762b5e6-f3e6-4ae4-a1eb-f4f55a88f0b2";
const token = "e12c58f0-62f9-4bb1-aaaf-16ebc62584b5";
const testPhone = "212707777721";

async function testMaytapi() {
  try {
    console.log("1. Fetching linked phones...");
    const phonesRes = await fetch(`https://api.maytapi.com/api/${productId}/listPhones`, {
      method: "GET",
      headers: { "x-maytapi-key": token }
    });
    
    // Maytapi sometimes returns an array directly instead of {success, data}
    let phonesData = await phonesRes.json();
    let phoneList = Array.isArray(phonesData) ? phonesData : phonesData.data;

    if (!phoneList || phoneList.length === 0) {
      console.error("No phone linked to this Maytapi product. Please create one in Maytapi Dashboard!");
      return;
    }

    const phone = phoneList[0];
    const phoneId = phone.id; 
    console.log(`✅ Found linked phone ID: ${phoneId} (Status: ${phone.status})`);

    console.log(`2. Sending WhatsApp test message to ${testPhone} ...`);
    
    const message = "👋 Bonjour depuis Didali Store !\n\nCeci est un test de l'API WhatsApp Maytapi généré par votre assistant IA. Le code OTP test est : *849132*";
    
    const sendRes = await fetch(`https://api.maytapi.com/api/${productId}/${phoneId}/sendMessage`, {
      method: "POST",
      headers: {
        "x-maytapi-key": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to_number: testPhone,
        type: "text",
        message: message
      })
    });
    
    const sendData = await sendRes.json();
    
    if (sendRes.ok && sendData.success !== false) {
      console.log("🚀 Message WhatsApp envoyé avec succès !", sendData);
    } else {
      console.error("❌ Erreur lors de l'envoi du message:", sendData);
    }
    
  } catch (err) {
    console.error("Network Exception:", err.message);
  }
}


testMaytapi();
