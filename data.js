/* Monthly ration lists.
   IDs are "<monthId>-<groupId>-<index>" and are what saved prices hang off.
   NEVER reorder / insert / delete inside an items array — append at the end only. */

var MONTHS = [
  {
    id: "nov",
    title: "नवंबर का राशन",
    en: "November Ration",
    groups: [
      {
        id: "nov-d", title: "DMart", en: "Bought at DMart", bought: true,
        items: [
          { hi: "चाय",                   en: "Tea",                 qty: "2 kg",      paid: 380 },
          { hi: "चाट मसाला",             en: "Chaat Masala",        qty: "1 packet",  paid: 81 },
          { hi: "गरम मसाला",             en: "Garam Masala",        qty: "1 packet",  paid: 89 },
          { hi: "दावत चावल",             en: "Daawat Rice",         qty: "10 kg",     paid: 1500 },
          { hi: "मैदा",                  en: "Maida",               qty: "2 kg",      paid: 93 },
          { hi: "सूजी",                  en: "Suji",                qty: "2 kg",      paid: 112 },
          { hi: "ऑलिव ऑयल",             en: "Olive Oil",           qty: "200 ml",    paid: 315 },
          { hi: "हींग डिब्बी",            en: "Hing Tin",            qty: "1",         paid: 140 },
          { hi: "पास्ता",                en: "Pasta",               qty: "2 packet",  paid: 127 },
          { hi: "साबूदाना",              en: "Sabudana",            qty: "2 kg",      paid: 166 },
          { hi: "पार्ले जी",              en: "Parle G",             qty: "1 packet",  paid: 127 },
          { hi: "केक",                   en: "Cake",                qty: "1 packet",  paid: 48 },
          { hi: "लक्स साबुन",            en: "Lux Soap",            qty: "1 packet",  paid: 115 },
          { hi: "बीकाजी",                en: "Bikaji",              qty: "2 packet",  paid: 150 },
          { hi: "रिन — कपड़े धोने साबुन", en: "Rin Washing Soap",    qty: "10 piece",  paid: 260 },
          { hi: "डेटॉल हैंड वॉश",         en: "Dettol Hand Wash",    qty: "1",         paid: 100 },
          { hi: "घड़ी सर्फ",              en: "Ghadi Surf",          qty: "10 packet", paid: 740 },
          { hi: "वीम बार",               en: "Vim Bar",             qty: "10",        paid: 236 },
          { hi: "ऑल आउट",                en: "All Out",             qty: "1",         paid: 140 },
          { hi: "हार्पिक",               en: "Harpic",              qty: "4",         paid: 490 },
          { hi: "बटर पेपर",              en: "Butter Paper",        qty: "2",         paid: 325 }
        ]
      },
      {
        id: "nov-r", title: "राशन", en: "Ration — to buy",
        items: [
          { hi: "शक्कर",                 en: "Sugar",               qty: "12 kg" },
          { hi: "मोगर",                  en: "Moong Mogar",         qty: "6 kg" },
          { hi: "मूंग दाल",              en: "Moong Dal",           qty: "8 kg" },
          { hi: "मिर्च",                 en: "Red Chilli",          qty: "1 kg" },
          { hi: "धना पीसा",              en: "Coriander Powder",    qty: "1 kg" },
          { hi: "जीरा",                  en: "Cumin",               qty: "1/4 kg" },
          { hi: "हींग खुली",             en: "Hing Loose",          qty: "₹200" },
          { hi: "चना भूंगड़ा",            en: "Roasted Chana",       qty: "1 kg" },
          { hi: "कपूर डब्बा",            en: "Camphor Box",         qty: "1" },
          { hi: "उड़द मोगर",              en: "Urad Mogar",          qty: "1 kg" },
          { hi: "पोहा",                  en: "Poha",                qty: "2 kg" },
          { hi: "माचीस पूड़ा",            en: "Matchbox Bundle",     qty: "5" },
          { hi: "टाटा नमक",              en: "Tata Salt",           qty: "2 kg" },
          { hi: "काला चना",              en: "Black Chana",         qty: "1 kg" },
          { hi: "मूंग",                  en: "Moong",               qty: "1 kg" },
          { hi: "गुड़",                   en: "Jaggery",             qty: "3 kg" },
          { hi: "कम्फर्ट",               en: "Comfort",             qty: "2 small" },
          { hi: "रिन आला",               en: "Rin Bar",             qty: "2" },
          { hi: "काली मिर्च",            en: "Black Pepper",        qty: "₹300" },
          { hi: "सरसों तेल",             en: "Mustard Oil",         qty: "1 छोटी (200 ml)" },
          { hi: "खोपरा तेल",             en: "Coconut Oil",         qty: "1" },
          { hi: "रवा",                   en: "Rava",                qty: "2 kg" },
          { hi: "तुवर दाल",              en: "Tuvar Dal",           qty: "1 kg" },
          { hi: "साबुत मिर्च",           en: "Whole Red Chilli",    qty: "₹50" },
          { hi: "तेज पत्ता",             en: "Bay Leaf",            qty: "₹20" },
          { hi: "राजगीरा आटा",           en: "Rajgira Flour",       qty: "4 kg" },
          { hi: "इमली",                  en: "Tamarind",            qty: "₹50" },
          { hi: "अमचूर",                 en: "Amchur",              qty: "₹50" },
          { hi: "पितांबरी white",        en: "Pitambari White",     qty: "1" }
        ]
      },
      {
        id: "nov-x", title: "ड्राई फ्रूट्स व अन्य", en: "Dry fruits & more — to buy",
        items: [
          { hi: "इलायची",                en: "Elaichi",             qty: "₹100" },
          { hi: "सींगाड़ा आटा",           en: "Singhara Flour",      qty: "1 kg" },
          { hi: "चंदन डिब्बी",           en: "Chandan Tin",         qty: "1" },
          { hi: "पीसा खोपरा",            en: "Ground Copra",        qty: "₹50" },
          { hi: "तीली तेल",              en: "Sesame Oil",          qty: "2 bottle" },
          { hi: "बासमती लंबे चावल",      en: "Basmati Long Rice",   qty: "2 kg" },
          { hi: "बादाम — मामरा",         en: "Almonds (Mamra)",     qty: "4 packet" },
          { hi: "अखरोट गिरी",            en: "Walnut Kernels",      qty: "2 packet" },
          { hi: "काजू",                  en: "Cashew",              qty: "1 packet" },
          { hi: "कस्तूरी मेथी",          en: "Kasuri Methi",        qty: "1" },
          { hi: "ताल मखाना",             en: "Makhana",             qty: "3 packet" },
          { hi: "अमूल काऊ घी",           en: "Amul Cow Ghee",       qty: "1 kg" }
        ]
      }
    ]
  }
];
