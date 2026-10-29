/* DMart shopping list — transcribed from the handwritten pages.
   u: true  => handwriting was unclear, please verify / edit in the app.
   est      => approximate price written on the left of the page (reference only). */

const PAGES = [
  {
    id: "p1",
    title: "पेज 1",
    sub: "किराना + घरेलू सामान",
    items: [
      { hi: "तेल पीपा",            en: "Oil Tin (15L)",          qty: "1",            est: 2970 },
      { hi: "शक्कर",               en: "Sugar",                  qty: "12 किलो",      est: 720 },
      { hi: "चावल",                en: "Rice",                   qty: "10 किलो",      est: 1800 },
      { hi: "सूजी / रवा",          en: "Suji (Rava)",            qty: "2 किलो",       est: 220 },
      { hi: "मोगर",                en: "Moong Mogar Dal",        qty: "6 किलो",       est: 750 },
      { hi: "मूंग दाल",            en: "Moong Dal",              qty: "8 किलो",       est: 920 },
      { hi: "मिर्च",               en: "Red Chilli",             qty: "1 किलो",       est: 320 },
      { hi: "धनिया पीसा",          en: "Coriander Powder",       qty: "1 किलो",       est: 160 },
      { hi: "जीरा",                en: "Cumin / Jeera",          qty: "पाव (250 ग्रा)", est: 90 },
      { hi: "गरम मसाला",           en: "Garam Masala",           qty: "₹100 का",      est: 100 },
      { hi: "हींग डिब्बी (Big)",   en: "Hing Tin - Big",         qty: "1  (रेट ₹230)", est: 260 },
      { hi: "हींग खुली",           en: "Hing Loose",             qty: "₹200 का",      est: 200 },
      { hi: "चना भूंगड़ा",          en: "Roasted Chana",          qty: "1 किलो",       est: 50 },
      { hi: "कपूर",                en: "Camphor (50 ग्रा)",       qty: "1",            est: 100 },
      { hi: "बटर पेपर",            en: "Butter Paper",           qty: "2",            est: 300 },
      { hi: "उड़द मोगर",            en: "Urad Mogar",             qty: "2 किलो (रेट ₹132)", est: 150 },
      { hi: "पोहा",                en: "Poha",                   qty: "2 किलो",       est: 150 },
      { hi: "सर्फ वाडी",           en: "Surf / Detergent Bar",   qty: "10  (रेट ₹85)", est: 800 },
      { hi: "विम बार",             en: "Vim Bar",                qty: "10  (रेट ₹30)", est: 290 },
      { hi: "नहाने की साबुन",      en: "Bath Soap",              qty: "1 पैकेट (रेट ₹130)", est: 120 },
      { hi: "कपड़े धोने का साबुन (XL)", en: "Washing Soap XL",    qty: "9  (रेट ₹42)", est: 360 },
      { hi: "हार्पिक",             en: "Harpic",                 qty: "4 बोतल",       est: 640 },
      { hi: "माचीस (फुल)",         en: "Matchbox Full",          qty: "5  (रेट ₹10)", est: 50 },
      { hi: "नमक",                 en: "Salt",                   qty: "2 किलो",       est: 60 },
      { hi: "बिस्कुट 50-50",       en: "Biscuit 50-50",          qty: "2 पैकेट (रेट ₹60)", est: 114 },
      { hi: "काला चना",            en: "Black Chana",            qty: "1 किलो",       est: 100 },
      { hi: "मूंग",                en: "Moong",                  qty: "1 किलो",       est: 125 }
    ]
  },
  {
    id: "p2",
    title: "पेज 2",
    sub: "मसाले + प्रोविजन",
    items: [
      { hi: "घी",                  en: "Ghee",                   qty: "1 किलो (1 टिन)", est: 1195 },
      { hi: "पोस्तदाना",           en: "Poppy Seeds",            qty: "3 किलो",       est: 450 },
      { hi: "गुड़",                 en: "Jaggery",                qty: "2 किलो",       est: 150 },
      { hi: "बेसन",                en: "Besan",                  qty: "2 किलो",       est: 210 },
      { hi: "पतली कालीजीरी",       en: "Kalonji (thin)",         qty: "1  (800 ग्रा, रेट ₹380)", est: 390 },
      { hi: "हल्दी",               en: "Turmeric",               qty: "1½ किलो",      est: 160 },
      { hi: "कमरकस",               en: "Kamarkas",               qty: "2  (रेट ₹60)", est: 110 },
      { hi: "ग्रीन इलायची",        en: "Green Elaichi",          qty: "2  (रेट ₹90)", est: 175 },
      { hi: "लौंग",                en: "Cloves",                 qty: "1 पाव",        est: 32 },
      { hi: "चाय पत्ती",           en: "Tea Leaves",             qty: "2 किलो",       est: 600 },
      { hi: "काली मिर्च",          en: "Black Pepper",           qty: "₹300 का",      est: 300 },
      { hi: "सरसों तेल शीशी",      en: "Mustard Oil bottle",     qty: "2 छोटी (200ml)", est: 90 },
      { hi: "खोपरा तेल",           en: "Coconut Oil",            qty: "1 शीशी (रेट ₹110)", est: 115 },
      { hi: "रवा",                 en: "Rava",                   qty: "2 किलो",       est: 100 },
      { hi: "मैदा",                en: "Maida",                  qty: "2 किलो",       est: 140 },
      { hi: "तुवर दाल",            en: "Tuvar Dal",              qty: "1 किलो",       est: 150 },
      { hi: "हरड़ बड़ी",            en: "Harad Badi",             qty: "2 पाव",        est: 105 },
      { hi: "टोमेटो सॉस",           en: "Tomato Sauce",           qty: "2  (रेट ₹150)", est: 250 },
      { hi: "साबुत मिर्च",         en: "Whole Red Chilli",       qty: "₹50 का",       est: 50 },
      { hi: "तेज पत्ता",           en: "Bay Leaf",               qty: "₹20 का",       est: 20 },
      { hi: "राजगीरा आटा",         en: "Rajgira Flour",          qty: "4 किलो",       est: 160 },
      { hi: "साबूदाना",            en: "Sabudana",               qty: "2 किलो",       est: 180 },
      { hi: "इमली",                en: "Tamarind",               qty: "₹50 का",       est: 50 },
      { hi: "अमचूर",               en: "Amchur",                 qty: "₹50 का",       est: 50 },
      { hi: "आटा पास्ता",          en: "Pasta (atta)",           qty: "1 पौ (500 ग्रा)", est: 65 },
      { hi: "पीताम्बरी White",     en: "Pitambari White",        qty: "1",            est: 80 },
      { hi: "इलायची",              en: "Elaichi",                qty: "₹100 का",      est: 100 },
      { hi: "निम्बू सत",            en: "Nimbu Sat (citric acid)", qty: "₹50 का",      est: 50 },
      { hi: "मोली",                en: "Moli",                   qty: "₹20 का",       est: 20 },
      { hi: "अदरक",                en: "Ginger  (side note)",    qty: "1 किलो",       est: null },
      { hi: "मूंगफली",             en: "Peanuts",                qty: "₹50 का",       est: 50 },
      { hi: "साबूदाना पापड़",       en: "Sabudana Papad",         qty: "4 पैकेट",      est: null }
    ]
  },
  {
    id: "p3",
    title: "पेज 3",
    sub: "ड्राई फ्रूट्स + तेल (आधा पेज)",
    items: [
      { hi: "चन्दन डिब्बी",        en: "Chandan Dibbi",          qty: "1  (रेट ₹25)", est: 50 },
      { hi: "पीसा खोपरा",          en: "Ground Copra",           qty: "₹50 का",       est: 50 },
      { hi: "तीली तेल",            en: "Sesame (Til) Oil",       qty: "1 शीशी",       est: 330 },
      { hi: "लम्बा चावल (बासमती)", en: "Basmati Long Rice",      qty: "2 किलो (रेट ₹130/किलो)", est: 260 },
      { hi: "बादाम गिरी",          en: "Almonds",                qty: "4 पैकेट",      est: 4000 },
      { hi: "अखरोट",               en: "Walnut",                 qty: "2 पैकेट",      est: 660 },
      { hi: "काजू",                en: "Cashew (500 ग्रा)",       qty: "1 पौ",         est: 525 },
      { hi: "कस्तूरी / कश्मीरी मेथी", en: "Kasuri Methi",        qty: "1  (रेट ₹102)", est: 80 },
      { hi: "चार मसाला",           en: "Char Masala",            qty: "1  (रेट ₹95)", est: 90 },
      { hi: "ताल मखाना",           en: "Makhana (fox nuts)",     qty: "3 पैकेट",      est: 720 },
      { hi: "(कटा हुआ आइटम)",      en: "crossed-out item",       qty: "—",            est: 100 }
    ]
  }
];
