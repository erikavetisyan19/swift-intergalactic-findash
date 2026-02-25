import Tesseract from 'tesseract.js';

async function testOCR(imagePath) {
    console.log("Starting OCR on:", imagePath);
    try {
        const worker = await Tesseract.createWorker('bul+eng');
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        });

        const result = await worker.recognize(imagePath);
        const text = result.data.text;
        await worker.terminate();

        console.log("=== EXTACTED TEXT ===");
        console.log(text);
        console.log("=====================");

        // 1. Total Amount: Try strict match, then fallback
        let extractedAmount = null;
        const amountStrMatch = text.match(/(?:обща сума|сума за плащане|сума|total|плащане|стойност|всичко|ддс|основа)[\s\:A-Za-zА-Яа-я]*([\d\s]+[\.\,]\d{2})/i);
        if (amountStrMatch && amountStrMatch[1]) {
            extractedAmount = parseFloat(amountStrMatch[1].replace(/\s/g, '').replace(',', '.'));
        } else {
            const allNumbers = [...text.matchAll(/\b(\d{1,6}[\.\,]\d{2})\b/g)];
            if (allNumbers.length > 0) {
                const parsedNums = allNumbers.map(m => parseFloat(m[1].replace(',', '.'))).filter(n => !isNaN(n));
                if (parsedNums.length > 0) extractedAmount = Math.max(...parsedNums);
            }
        }
        console.log("Extracted Amount:", extractedAmount);

        // 2. Client Name
        const clientMatch = text.match(/(?:получател|клиент|получател:|клиент:|купувач)[\s]+([A-Za-zА-Яа-я0-9\s\.\,\-\"\']+)/i) || text.match(/([А-Я][А-Яа-я]+(?:\s[А-Яа-я]+)?\s+(?:ООД|ЕООД|АД|ЕАД|ЕТ))/i);
        if (clientMatch && clientMatch[1]) {
            const cleanedClient = clientMatch[1].replace(/(?:ЕИК|ДДС|BG\d+|гр\.|ул\.).*/i, '').trim();
            console.log("Client Match:", cleanedClient.substring(0, 50));
        }

        // 3. Date
        const dateMatch = text.match(/(?:дата|date)[\s\:\.]*(\d{2})[\/\-\.]?(\d{2})[\/\-\.]?(\d{4})/i) || text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/);
        if (dateMatch) {
            const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
            console.log("Date Match:", `${year}-${dateMatch[2]}-${dateMatch[1]}`);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

testOCR('c:\\Users\\User\\.gemini\\antigravity\\brain\\548a49b2-0058-4153-b627-993a9e39596a\\media__1771999267322.png');
