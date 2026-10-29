# DMart खरीदी लिस्ट

Mobile-first grocery checklist. 70 items transcribed from the 2.5 handwritten pages.

## कैसे चलाना है
- किसी भी आइटम के **नाम पर टैप** करो → उस पर लाइन खिंच जाएगी (ले लिया).
- **✎** दबाओ → नाम वहीं इनलाइन एडिट हो जाता है. जैसे `घी` → `घी — अमूल 1kg`. Enter = सेव, Esc = कैंसिल.
- **कितना लिया** = जो असल में उठाया (2 किलो, 3 पैकेट…).
- **नया भाव ₹** = जो असल में चुकाया. डालते ही नीचे चिप आ जाएगी:
  `पुराना ₹1195` और `▲ ₹50 ज़्यादा` / `▼ ₹30 बचा`.
- किसी भी डिब्बे में **Enter** दबाओ → आइटम अपने आप कट जाएगा.
- ऊपर: हो गया · पुराना कुल · अंतर. नीचे: **नया कुल खर्च**.
- `+ आइटम` = नया जोड़ो · `📋` = पूरी लिस्ट कॉपी · `↺` = रीसेट.

सब कुछ फ़ोन के localStorage में रहता है — कोई सर्वर नहीं, offline भी चलेगा.

## Deploy via GitHub → Vercel
```bash
git remote add origin https://github.com/<you>/dmart-list.git
git branch -M main
git push -u origin main
```
Then on vercel.com → **Add New → Project → Import** this repo →
Framework Preset: **Other** · Build Command: *(empty)* · Output Directory: `.` → **Deploy**.

Or straight from the terminal:
```bash
vercel --prod
```
Static site, no build step.

## Local test
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Files
- `items.js`  — the list data (edit here to change items permanently)
- `app.js`    — logic + localStorage
- `styles.css`, `index.html`
