// ============================================================
// HUDA PWA — All Islamic Data
// ============================================================

// ── Hadiths (20 authenticated, Sahih/Hasan) ─────────────────
const HADITHS = [
  { text: "Actions are judged by intentions, and every person will get what they intended.", source: "Sahih al-Bukhari 1", grade: "Sahih" },
  { text: "The best of you are those who learn the Quran and teach it.", source: "Sahih al-Bukhari 5027", grade: "Sahih" },
  { text: "None of you truly believes until he loves for his brother what he loves for himself.", source: "Sahih al-Bukhari 13, Muslim 45", grade: "Sahih" },
  { text: "The strong person is not one who overcomes people by his strength, but the strong person is the one who controls himself while in anger.", source: "Sahih al-Bukhari 6114, Muslim 2609", grade: "Sahih" },
  { text: "Make things easy for people and do not make them difficult. Give glad tidings and do not make people run away.", source: "Sahih al-Bukhari 69, Muslim 1734", grade: "Sahih" },
  { text: "Cleanliness is half of faith.", source: "Sahih Muslim 223", grade: "Sahih" },
  { text: "He who does not thank people has not thanked Allah.", source: "Sunan Abu Dawud 4811, Tirmidhi 1954", grade: "Hasan" },
  { text: "Every act of kindness is charity.", source: "Sahih Muslim 1005", grade: "Sahih" },
  { text: "Smiling in your brother's face is an act of charity.", source: "Jami' at-Tirmidhi 1956", grade: "Hasan" },
  { text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.", source: "Sahih al-Bukhari 6018, Muslim 47", grade: "Sahih" },
  { text: "This world is a prison for the believer and a paradise for the disbeliever.", source: "Sahih Muslim 2956", grade: "Sahih" },
  { text: "Whoever removes a hardship from a believer, Allah will remove a hardship from him on the Day of Resurrection.", source: "Sahih Muslim 2699", grade: "Sahih" },
  { text: "Take advantage of five before five: your youth before old age, health before sickness, wealth before poverty, free time before being busy, and life before death.", source: "Mustadrak al-Hakim, Shu'ab al-Iman — Sahih", grade: "Sahih" },
  { text: "Be in the world as if you were a stranger or a traveler.", source: "Sahih al-Bukhari 6416", grade: "Sahih" },
  { text: "No Muslim is afflicted with any harm — even the prick of a thorn — except that Allah expiates some of his sins.", source: "Sahih al-Bukhari 5641, Muslim 2573", grade: "Sahih" },
  { text: "When Allah loves a servant, He tests him.", source: "Jami' at-Tirmidhi 2396", grade: "Hasan" },
  { text: "The best jihad is a word of truth in front of a tyrannical ruler.", source: "Sunan Abu Dawud 4344, Tirmidhi 2174", grade: "Hasan" },
  { text: "Feed the hungry, visit the sick, and free the captive.", source: "Sahih al-Bukhari 5373", grade: "Sahih" },
  { text: "Allah is gentle and loves gentleness in all affairs.", source: "Sahih al-Bukhari 6927, Muslim 2593", grade: "Sahih" },
  { text: "The most beloved deeds to Allah are those done regularly, even if they are small.", source: "Sahih al-Bukhari 6465, Muslim 783", grade: "Sahih" },
  { text: "Do not belittle any good deed, even meeting your brother with a cheerful face.", source: "Sahih Muslim 2626", grade: "Sahih" },
  { text: "Whoever guides someone to goodness will have a reward equal to the one who does it.", source: "Sahih Muslim 1893", grade: "Sahih" }
];

// ── Surahs (114 — metadata only; full text fetched via API) ──
const SURAHS = [
  [1,"الفاتحة","Al-Fatihah","The Opening",7,"Meccan"],
  [2,"البقرة","Al-Baqarah","The Cow",286,"Medinan"],
  [3,"آل عمران","Ali 'Imran","Family of Imran",200,"Medinan"],
  [4,"النساء","An-Nisa","The Women",176,"Medinan"],
  [5,"المائدة","Al-Ma'idah","The Table Spread",120,"Medinan"],
  [6,"الأنعام","Al-An'am","The Cattle",165,"Meccan"],
  [7,"الأعراف","Al-A'raf","The Heights",206,"Meccan"],
  [8,"الأنفال","Al-Anfal","The Spoils of War",75,"Medinan"],
  [9,"التوبة","At-Tawbah","The Repentance",129,"Medinan"],
  [10,"يونس","Yunus","Jonah",109,"Meccan"],
  [11,"هود","Hud","Hud",123,"Meccan"],
  [12,"يوسف","Yusuf","Joseph",111,"Meccan"],
  [13,"الرعد","Ar-Ra'd","The Thunder",43,"Medinan"],
  [14,"إبراهيم","Ibrahim","Abraham",52,"Meccan"],
  [15,"الحجر","Al-Hijr","The Rocky Tract",99,"Meccan"],
  [16,"النحل","An-Nahl","The Bee",128,"Meccan"],
  [17,"الإسراء","Al-Isra","The Night Journey",111,"Meccan"],
  [18,"الكهف","Al-Kahf","The Cave",110,"Meccan"],
  [19,"مريم","Maryam","Mary",98,"Meccan"],
  [20,"طه","Ta-Ha","Ta-Ha",135,"Meccan"],
  [21,"الأنبياء","Al-Anbiya","The Prophets",112,"Meccan"],
  [22,"الحج","Al-Hajj","The Pilgrimage",78,"Medinan"],
  [23,"المؤمنون","Al-Mu'minun","The Believers",118,"Meccan"],
  [24,"النور","An-Nur","The Light",64,"Medinan"],
  [25,"الفرقان","Al-Furqan","The Criterion",77,"Meccan"],
  [26,"الشعراء","Ash-Shu'ara","The Poets",227,"Meccan"],
  [27,"النمل","An-Naml","The Ant",93,"Meccan"],
  [28,"القصص","Al-Qasas","The Stories",88,"Meccan"],
  [29,"العنكبوت","Al-Ankabut","The Spider",69,"Meccan"],
  [30,"الروم","Ar-Rum","The Romans",60,"Meccan"],
  [31,"لقمان","Luqman","Luqman",34,"Meccan"],
  [32,"السجدة","As-Sajdah","The Prostration",30,"Meccan"],
  [33,"الأحزاب","Al-Ahzab","The Combined Forces",73,"Medinan"],
  [34,"سبأ","Saba","Sheba",54,"Meccan"],
  [35,"فاطر","Fatir","Originator",45,"Meccan"],
  [36,"يس","Ya-Sin","Ya-Sin",83,"Meccan"],
  [37,"الصافات","As-Saffat","Those Ranged in Ranks",182,"Meccan"],
  [38,"ص","Sad","The Letter Sad",88,"Meccan"],
  [39,"الزمر","Az-Zumar","The Groups",75,"Meccan"],
  [40,"غافر","Ghafir","The Forgiver",85,"Meccan"],
  [41,"فصلت","Fussilat","Explained in Detail",54,"Meccan"],
  [42,"الشورى","Ash-Shura","The Consultation",53,"Meccan"],
  [43,"الزخرف","Az-Zukhruf","The Ornaments of Gold",89,"Meccan"],
  [44,"الدخان","Ad-Dukhan","The Smoke",59,"Meccan"],
  [45,"الجاثية","Al-Jathiyah","The Crouching",37,"Meccan"],
  [46,"الأحقاف","Al-Ahqaf","The Wind-Curved Sandhills",35,"Meccan"],
  [47,"محمد","Muhammad","Muhammad",38,"Medinan"],
  [48,"الفتح","Al-Fath","The Victory",29,"Medinan"],
  [49,"الحجرات","Al-Hujurat","The Rooms",18,"Medinan"],
  [50,"ق","Qaf","The Letter Qaf",45,"Meccan"],
  [51,"الذاريات","Adh-Dhariyat","The Winnowing Winds",60,"Meccan"],
  [52,"الطور","At-Tur","The Mount",49,"Meccan"],
  [53,"النجم","An-Najm","The Star",62,"Meccan"],
  [54,"القمر","Al-Qamar","The Moon",55,"Meccan"],
  [55,"الرحمن","Ar-Rahman","The Beneficent",78,"Medinan"],
  [56,"الواقعة","Al-Waqi'ah","The Inevitable",96,"Meccan"],
  [57,"الحديد","Al-Hadid","The Iron",29,"Medinan"],
  [58,"المجادلة","Al-Mujadila","The Pleading Woman",22,"Medinan"],
  [59,"الحشر","Al-Hashr","The Exile",24,"Medinan"],
  [60,"الممتحنة","Al-Mumtahanah","She That is to be Examined",13,"Medinan"],
  [61,"الصف","As-Saf","The Ranks",14,"Medinan"],
  [62,"الجمعة","Al-Jumu'ah","The Congregation",11,"Medinan"],
  [63,"المنافقون","Al-Munafiqun","The Hypocrites",11,"Medinan"],
  [64,"التغابن","At-Taghabun","The Mutual Disillusion",18,"Medinan"],
  [65,"الطلاق","At-Talaq","The Divorce",12,"Medinan"],
  [66,"التحريم","At-Tahrim","The Prohibition",12,"Medinan"],
  [67,"الملك","Al-Mulk","The Sovereignty",30,"Meccan"],
  [68,"القلم","Al-Qalam","The Pen",52,"Meccan"],
  [69,"الحاقة","Al-Haqqah","The Reality",52,"Meccan"],
  [70,"المعارج","Al-Ma'arij","The Ascending Stairways",44,"Meccan"],
  [71,"نوح","Nuh","Noah",28,"Meccan"],
  [72,"الجن","Al-Jinn","The Jinn",28,"Meccan"],
  [73,"المزمل","Al-Muzzammil","The Enshrouded One",20,"Meccan"],
  [74,"المدثر","Al-Muddaththir","The Cloaked One",56,"Meccan"],
  [75,"القيامة","Al-Qiyamah","The Resurrection",40,"Meccan"],
  [76,"الإنسان","Al-Insan","The Human",31,"Medinan"],
  [77,"المرسلات","Al-Mursalat","The Emissaries",50,"Meccan"],
  [78,"النبأ","An-Naba","The Tidings",40,"Meccan"],
  [79,"النازعات","An-Nazi'at","Those Who Drag Forth",46,"Meccan"],
  [80,"عبس","Abasa","He Frowned",42,"Meccan"],
  [81,"التكوير","At-Takwir","The Overthrowing",29,"Meccan"],
  [82,"الانفطار","Al-Infitar","The Cleaving",19,"Meccan"],
  [83,"المطففين","Al-Mutaffifin","The Defrauding",36,"Meccan"],
  [84,"الانشقاق","Al-Inshiqaq","The Sundering",25,"Meccan"],
  [85,"البروج","Al-Buruj","The Mansions of the Stars",22,"Meccan"],
  [86,"الطارق","At-Tariq","The Nightcomer",17,"Meccan"],
  [87,"الأعلى","Al-A'la","The Most High",19,"Meccan"],
  [88,"الغاشية","Al-Ghashiyah","The Overwhelming",26,"Meccan"],
  [89,"الفجر","Al-Fajr","The Dawn",30,"Meccan"],
  [90,"البلد","Al-Balad","The City",20,"Meccan"],
  [91,"الشمس","Ash-Shams","The Sun",15,"Meccan"],
  [92,"الليل","Al-Layl","The Night",21,"Meccan"],
  [93,"الضحى","Ad-Duha","The Morning Hours",11,"Meccan"],
  [94,"الشرح","Ash-Sharh","The Relief",8,"Meccan"],
  [95,"التين","At-Tin","The Fig",8,"Meccan"],
  [96,"العلق","Al-Alaq","The Clot",19,"Meccan"],
  [97,"القدر","Al-Qadr","The Power",5,"Meccan"],
  [98,"البينة","Al-Bayyinah","The Clear Proof",8,"Medinan"],
  [99,"الزلزلة","Az-Zalzalah","The Earthquake",8,"Medinan"],
  [100,"العاديات","Al-Adiyat","The Courser",11,"Meccan"],
  [101,"القارعة","Al-Qari'ah","The Calamity",11,"Meccan"],
  [102,"التكاثر","At-Takathur","The Rivalry in World Increase",8,"Meccan"],
  [103,"العصر","Al-Asr","The Declining Day",3,"Meccan"],
  [104,"الهمزة","Al-Humazah","The Traducer",9,"Meccan"],
  [105,"الفيل","Al-Fil","The Elephant",5,"Meccan"],
  [106,"قريش","Quraysh","Quraysh",4,"Meccan"],
  [107,"الماعون","Al-Ma'un","The Small Kindnesses",7,"Meccan"],
  [108,"الكوثر","Al-Kawthar","The Abundance",3,"Meccan"],
  [109,"الكافرون","Al-Kafirun","The Disbelievers",6,"Meccan"],
  [110,"النصر","An-Nasr","The Divine Support",3,"Medinan"],
  [111,"المسد","Al-Masad","The Palm Fiber",5,"Meccan"],
  [112,"الإخلاص","Al-Ikhlas","The Sincerity",4,"Meccan"],
  [113,"الفلق","Al-Falaq","The Daybreak",5,"Meccan"],
  [114,"الناس","An-Nas","Mankind",6,"Meccan"]
];

// ── Dhikrs ───────────────────────────────────────────────────
const DHIKRS = [
  {
    arabic: "سُبْحَانَ اللّٰه", transliteration: "Subhan Allah", meaning: "Glory be to Allah", target: 33, source: "Sahih Muslim 597",
    reward: "Said 33 times after each prayer alongside Alhamdulillah and Allahu Akbar — sins are forgiven even if they are like the foam of the sea."
  },
  {
    arabic: "الحَمْدُ لِلّٰه", transliteration: "Alhamdulillah", meaning: "All praise is due to Allah", target: 33, source: "Sahih Muslim 597",
    reward: "Said 33 times after each prayer alongside Subhan Allah and Allahu Akbar — sins are forgiven even if they are like the foam of the sea. The Prophet ﷺ said: 'Alhamdulillah fills the scales.' (Muslim 223)"
  },
  {
    arabic: "اللّٰهُ أَكْبَر", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest", target: 33, source: "Sahih Muslim 597",
    reward: "Said 33 times after each prayer alongside Subhan Allah and Alhamdulillah — sins are forgiven even if they are like the foam of the sea."
  },
  {
    arabic: "لَا إِلٰهَ إِلَّا اللّٰه", transliteration: "La ilaha illallah", meaning: "There is no god but Allah", target: 100, source: "Sahih al-Bukhari 6403, Muslim 2691",
    reward: "Said 100 times: equal in reward to freeing 10 slaves, 100 good deeds written, 100 sins erased, and a shield against Shaytan for the entire day. 'The best remembrance is La ilaha illallah.' (Tirmidhi 3383)"
  },
  {
    arabic: "أَسْتَغْفِرُ اللّٰه", transliteration: "Astaghfirullah", meaning: "I seek forgiveness from Allah", target: 100, source: "Sahih Muslim 2702",
    reward: "The Prophet ﷺ sought forgiveness more than 70–100 times every day (Bukhari 6307). 'Whoever makes istighfar abundantly, Allah will relieve every grief, make a way out from every distress, and provide for him from where he did not expect.' (Abu Dawud 1518)"
  },
  {
    arabic: "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ", transliteration: "Subhanallahi wa bihamdih", meaning: "Glory be to Allah and His is the praise", target: 100, source: "Sahih al-Bukhari 6405, Muslim 2692",
    reward: "'Whoever says Subhanallahi wa bihamdih 100 times a day, his sins will be forgiven even if they are like the foam of the sea.' It is also light on the tongue, heavy on the scales, and beloved to Allah. (Bukhari 6682)"
  },
  {
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰه", transliteration: "La hawla wa la quwwata illa billah", meaning: "There is no power nor strength except with Allah", target: 100, source: "Sahih al-Bukhari 7386, Muslim 2704",
    reward: "The Prophet ﷺ said: 'It is a treasure from the treasures of Paradise.' (Bukhari 7386, Muslim 2704). It is a cure for 99 ailments — the least of which is anxiety. (Authenticated by al-Hakim)"
  }
];

// ── Duas (Hisnul Muslim sourced) ─────────────────────────────
const DUAS = {
  "Morning Adhkar": [
    {
      arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
      meaning: "We have reached the morning and the dominion belongs to Allah; all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.",
      source: "Hisnul Muslim 68", grade: "Sahih — Abu Dawud 5076"
    },
    {
      arabic: "اللّٰهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
      transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilaykan-nushur",
      meaning: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and unto You is the resurrection.",
      source: "Hisnul Muslim 71", grade: "Hasan — Tirmidhi 3391"
    },
    {
      arabic: "اللّٰهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      transliteration: "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana ala ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika alayya, wa abu'u laka bidhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa ant",
      meaning: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me — for verily none can forgive sins except You.",
      source: "Hisnul Muslim 100 — Sayyidul Istighfar", grade: "Sahih — Bukhari 6306"
    },
    {
      arabic: "رَضِيتُ بِاللّٰهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
      transliteration: "Raditu billahi rabban, wa bil-islami dinan, wa bi-Muhammadin sallallahu alayhi wa sallama nabiyya",
      meaning: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (ﷺ) as my Prophet.",
      source: "Hisnul Muslim 84", grade: "Sahih — Abu Dawud 5072, Tirmidhi 3389"
    },
    {
      arabic: "أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      transliteration: "A'udhu bikalimati-llahit-tammati min sharri ma khalaq",
      meaning: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
      source: "Hisnul Muslim 117", grade: "Sahih — Muslim 2709"
    }
  ],
  "Evening Adhkar": [
    {
      arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
      meaning: "We have reached the evening and the dominion belongs to Allah; all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.",
      source: "Hisnul Muslim 68", grade: "Sahih — Abu Dawud 5076"
    },
    {
      arabic: "اللّٰهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
      transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu wa ilaykal-masir",
      meaning: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and unto You is the final return.",
      source: "Hisnul Muslim 71", grade: "Hasan — Tirmidhi 3391"
    },
    {
      arabic: "اللّٰهُمَّ عَافِنِي فِي بَدَنِي، اللّٰهُمَّ عَافِنِي فِي سَمْعِي، اللّٰهُمَّ عَافِنِي فِي بَصَرِي",
      transliteration: "Allahumma afini fi badani, Allahumma afini fi sam'i, Allahumma afini fi basari",
      meaning: "O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight.",
      source: "Hisnul Muslim 79", grade: "Hasan — Abu Dawud 5090"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ",
      transliteration: "Allahumma inni a'udhu bika minal-kufri, wal-faqri, wa a'udhu bika min adhabil-qabr",
      meaning: "O Allah, I seek Your refuge from disbelief and poverty, and I seek Your refuge from the punishment of the grave.",
      source: "Hisnul Muslim 80", grade: "Sahih — Abu Dawud 5090, Ahmad"
    },
    {
      arabic: "بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
      transliteration: "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-alim",
      meaning: "In the name of Allah, with whose name nothing is harmed on earth or in the heavens, and He is the All-Hearing, the All-Knowing.",
      source: "Hisnul Muslim 109", grade: "Sahih — Abu Dawud 5088, Tirmidhi 3388"
    }
  ],
  "Before Sleeping": [
    {
      arabic: "بِاسْمِكَ اللّٰهُمَّ أَمُوتُ وَأَحْيَا",
      transliteration: "Bismika Allahumma amutu wa ahya",
      meaning: "In Your name, O Allah, I die and I live.",
      source: "Hisnul Muslim 148", grade: "Sahih — Bukhari 6324"
    },
    {
      arabic: "اللّٰهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
      transliteration: "Allahumma qini adhabaka yawma tab'athu ibadak",
      meaning: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
      source: "Hisnul Muslim 149", grade: "Hasan — Abu Dawud 5045, Tirmidhi 3398"
    },
    {
      arabic: "اللّٰهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ",
      transliteration: "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa alja'tu zahri ilayk",
      meaning: "O Allah, I have submitted myself to You, entrusted my affairs to You, and placed my back against You.",
      source: "Hisnul Muslim 154", grade: "Sahih — Bukhari 247, Muslim 2710"
    },
    {
      arabic: "سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ، لَا إِلٰهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
      transliteration: "Subhanakal-lahumma wa bihamdik, la ilaha illa ant, astaghfiruka wa atubu ilayk",
      meaning: "Glory be to You O Allah, and with Your praise. None has the right to be worshipped except You. I seek Your forgiveness and repent to You.",
      source: "Hisnul Muslim 155", grade: "Sahih — Abu Dawud 4857"
    },
    {
      arabic: "الحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنَا وَسَقَانَا، وَكَفَانَا، وَآوَانَا، فَكَمْ مِمَّنْ لَا كَافِيَ لَهُ وَلَا مُؤْوِي",
      transliteration: "Alhamdu lillahil-ladhi at'amana wa saqana, wa kafana, wa awana, fakam mimman la kafiya lahu wa la mu'wi",
      meaning: "Praise is to Allah Who has fed us and given us drink, and Who is sufficient for us and has sheltered us; for how many have none to suffice them or shelter them.",
      source: "Hisnul Muslim 163", grade: "Sahih — Muslim 2715"
    }
  ],
  "Upon Waking": [
    {
      arabic: "الحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
      transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
      meaning: "All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.",
      source: "Hisnul Muslim 169", grade: "Sahih — Bukhari 6312"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir",
      meaning: "None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise and He is over all things capable.",
      source: "Hisnul Muslim 170", grade: "Sahih — Bukhari 6312"
    },
    {
      arabic: "الحَمْدُ لِلّٰهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ",
      transliteration: "Alhamdu lillahil-ladhi afani fi jasadi, wa radda alayya ruhi, wa adhina li bidhikrih",
      meaning: "All praise is for Allah who restored to me my health and returned my soul and has allowed me to remember Him.",
      source: "Hisnul Muslim 171", grade: "Hasan — Tirmidhi 3401"
    },
    {
      arabic: "أَصْبَحْنَا عَلَى فِطْرَةِ الإِسْلَامِ، وَعَلَى كَلِمَةِ الإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ",
      transliteration: "Asbahna ala fitratil-islam, wa ala kalimatil-ikhlas, wa ala dini nabiyyina Muhammad",
      meaning: "We have risen upon the fitrah of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad.",
      source: "Hisnul Muslim 83", grade: "Sahih — Ahmad, al-Bayhaqi"
    }
  ],
  "Before Eating": [
    {
      arabic: "بِسْمِ اللّٰه",
      transliteration: "Bismillah",
      meaning: "In the name of Allah.",
      source: "Hisnul Muslim 192", grade: "Sahih — Abu Dawud 3767, Tirmidhi 1858"
    },
    {
      arabic: "اللّٰهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ",
      transliteration: "Allahumma barik lana fihi wa at'imna khayran minh",
      meaning: "O Allah, bless it for us and provide us with better than it.",
      source: "Hisnul Muslim 193", grade: "Hasan — Tirmidhi 3455"
    },
    {
      arabic: "بِسْمِ اللّٰهِ أَوَّلَهُ وَآخِرَهُ",
      transliteration: "Bismillahi awwalahu wa akhirah",
      meaning: "In the name of Allah at its beginning and at its end.",
      source: "Hisnul Muslim 194", grade: "Sahih — Abu Dawud 3767"
    }
  ],
  "After Eating": [
    {
      arabic: "الحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنِي هٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
      transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
      meaning: "All praise is for Allah who fed me this and provided it for me without any might nor power from myself.",
      source: "Hisnul Muslim 196", grade: "Hasan — Abu Dawud 4023, Tirmidhi 3458"
    },
    {
      arabic: "اللّٰهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي، وَاسْقِ مَنْ سَقَانِي",
      transliteration: "Allahumma at'im man at'amani, wasqi man saqani",
      meaning: "O Allah, feed the one who fed me and give drink to the one who gave me drink.",
      source: "Hisnul Muslim 198", grade: "Sahih — Muslim 2055"
    },
    {
      arabic: "الحَمْدُ لِلّٰهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ، غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا",
      transliteration: "Alhamdu lillahi hamdan kathiran tayyiban mubarakan fih, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu rabbana",
      meaning: "All praise is for Allah, praise that is abundant, good and blessed. It cannot be compensated for, nor can it be abandoned, nor is anyone self-sufficient without it — our Lord.",
      source: "Hisnul Muslim 197", grade: "Sahih — Bukhari 5458"
    }
  ],
  "For Anxiety & Distress": [
    {
      arabic: "اللّٰهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ",
      transliteration: "Allahumma inni abduk, ibnu abdik, ibnu amatik, nasiyati biyadik, madin fiyya hukmuk, adlun fiyya qada'uk",
      meaning: "O Allah, I am Your servant, the son of Your servant, the son of Your female servant. My forelock is in Your hand. Your judgment upon me is assured and whatever You have decreed for me is just.",
      source: "Hisnul Muslim 218 — Du'a of distress (Ibn Masud)", grade: "Sahih — Ahmad 3712, Ibn Hibban"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلٰهَ إِلَّا اللّٰهُ رَبُّ الْعَرْشِ الْعَظِيمِ",
      transliteration: "La ilaha illallahul-adhimul-halim, la ilaha illallahu rabbul-arshil-adhim",
      meaning: "There is no deity worthy of worship but Allah, the Magnificent, the Forbearing. There is no deity worthy of worship but Allah, Lord of the magnificent throne.",
      source: "Hisnul Muslim 219", grade: "Sahih — Bukhari 6345, Muslim 2730"
    },
    {
      arabic: "اللّٰهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
      transliteration: "Allahumma rahmataka arju fala takilni ila nafsi tarfata ayn",
      meaning: "O Allah, it is Your mercy that I hope for, so do not leave me in charge of my affairs even for the blink of an eye.",
      source: "Hisnul Muslim 220", grade: "Hasan — Abu Dawud 5090"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
      meaning: "There is no deity worthy of worship but You. Glory be to You! Indeed I have been of the wrongdoers. (Du'a of Yunus ﷺ)",
      source: "Hisnul Muslim 223 — Quran 21:87", grade: "Sahih — Tirmidhi 3505"
    },
    {
      arabic: "حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ",
      transliteration: "Hasbunallahu wa ni'mal-wakil",
      meaning: "Allah is sufficient for us, and He is the best disposer of affairs.",
      source: "Hisnul Muslim 224 — Quran 3:173", grade: "Sahih — Bukhari 4563"
    }
  ],
  "After Prayer": [
    {
      arabic: "أَسْتَغْفِرُ اللّٰهَ (×٣) اللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالإِكْرَامِ",
      transliteration: "Astaghfirullah (x3). Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
      meaning: "I seek Allah's forgiveness (×3). O Allah, You are Peace and from You comes peace. Blessed are You, O possessor of glory and honour.",
      source: "Hisnul Muslim 75", grade: "Sahih — Muslim 591"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir",
      meaning: "None has the right to be worshipped except Allah, alone without partner, to Him belongs all sovereignty and praise, and He is over all things capable.",
      source: "Hisnul Muslim 76", grade: "Sahih — Muslim 597"
    },
    {
      arabic: "اللّٰهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
      transliteration: "Allahumma a'inni ala dhikrika wa shukrika wa husni ibadatik",
      meaning: "O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner.",
      source: "Hisnul Muslim 78", grade: "Sahih — Abu Dawud 1522, Ahmad"
    },
    {
      arabic: "سُبْحَانَ اللّٰه (×٣٣) الحَمْدُ لِلّٰه (×٣٣) اللّٰهُ أَكْبَر (×٣٣)",
      transliteration: "Subhan Allah (×33), Alhamdulillah (×33), Allahu Akbar (×33)",
      meaning: "Glory be to Allah (×33), All praise is for Allah (×33), Allah is the Greatest (×33).",
      source: "Hisnul Muslim 77", grade: "Sahih — Muslim 597"
    },
    {
      arabic: "اللّٰهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
      transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard, man dhal-ladhi yashfa'u indahu illa bi-idhnih, ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi shay'im-min ilmihi illa bima sha', wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifdhuhuma, wa huwal-aliyyul-adhim",
      meaning: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great. (Al-Baqarah 2:255)",
      source: "Whoever recites Ayatul Kursi after every obligatory prayer, nothing will prevent him from entering Paradise except death.", grade: "Sahih — An-Nasa'i, Ibn Hibban | Authenticated by Al-Albani (Sahih Al-Jami' 6464)"
    }
  ],
  "Entering & Leaving Home": [
    {
      arabic: "بِسْمِ اللّٰهِ وَلَجْنَا، وَبِسْمِ اللّٰهِ خَرَجْنَا، وَعَلَى اللّٰهِ رَبِّنَا تَوَكَّلْنَا",
      transliteration: "Bismillahi walajna, wa bismillahi kharajna, wa alallahi rabbina tawakkalna",
      meaning: "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we place our trust.",
      source: "Hisnul Muslim 163", grade: "Hasan — Abu Dawud 5096"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ",
      transliteration: "Allahumma inni as'aluka khayral-mawlaji wa khayral-makhraj",
      meaning: "O Allah, I ask You for the best of entry and the best of exit.",
      source: "Hisnul Muslim 164", grade: "Sahih — Abu Dawud 5096"
    },
    {
      arabic: "بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰه",
      transliteration: "Bismillahi tawakkaltu alallahi, la hawla wa la quwwata illa billah",
      meaning: "In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.",
      source: "Hisnul Muslim 165", grade: "Hasan — Abu Dawud 5095, Tirmidhi 3426"
    }
  ],
  "Entering & Leaving Masjid": [
    {
      arabic: "أَعُوذُ بِاللّٰهِ الْعَظِيمِ، وَبِوَجْهِهِ الْكَرِيمِ، وَسُلْطَانِهِ الْقَدِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
      transliteration: "A'udhu billahil-adhim, wa biwajhihil-karim, wa sultanihil-qadim minash-shaytanir-rajim",
      meaning: "I seek refuge in Allah the Magnificent, in His noble face, and His eternal dominion from the accursed Shaytan.",
      source: "Hisnul Muslim 168", grade: "Sahih — Abu Dawud 466"
    },
    {
      arabic: "اللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
      transliteration: "Allahumma iftah li abwaba rahmatik",
      meaning: "O Allah, open for me the doors of Your mercy.",
      source: "Hisnul Muslim 169", grade: "Sahih — Muslim 713"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
      transliteration: "Allahumma inni as'aluka min fadlik",
      meaning: "O Allah, I ask You from Your bounty.",
      source: "Hisnul Muslim 170 — upon leaving", grade: "Sahih — Muslim 713"
    }
  ],
  "Entering & Leaving Toilet": [
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
      transliteration: "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith",
      meaning: "O Allah, I seek refuge in You from the male and female evil jinn.",
      source: "Hisnul Muslim 74 — said BEFORE entering, with bismillah", grade: "Sahih — Bukhari 142, Muslim 375"
    },
    {
      arabic: "بِسْمِ اللّٰه",
      transliteration: "Bismillah",
      meaning: "In the name of Allah. — Said just before entering.",
      source: "Hisnul Muslim 74", grade: "Sahih — Ibn Majah 297, authenticated by al-Albani"
    },
    {
      arabic: "غُفْرَانَكَ",
      transliteration: "Ghufranaka",
      meaning: "I ask for Your forgiveness. — Said upon leaving the toilet.",
      source: "Hisnul Muslim 76", grade: "Sahih — Abu Dawud 30, Tirmidhi 7, Ibn Majah 300"
    },
    {
      arabic: "الحَمْدُ لِلّٰهِ الَّذِي أَذْهَبَ عَنِّي الأَذَى وَعَافَانِي",
      transliteration: "Alhamdu lillahil-ladhi adhhaba annil-adha wa afani",
      meaning: "All praise is for Allah who removed the harm from me and granted me wellbeing. — Said upon leaving.",
      source: "Hisnul Muslim 77", grade: "Hasan — Ibn Majah 301, authenticated by al-Albani"
    }
  ],
  "Travelling": [
    {
      arabic: "اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
      transliteration: "Allahu akbar (×3). Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
      meaning: "Allah is the Greatest (×3). Glory be to Him who has subjected this to us and we were not capable of it.",
      source: "Hisnul Muslim 174 — Quran 43:13", grade: "Sahih — Abu Dawud 2602, Tirmidhi 3447"
    },
    {
      arabic: "اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى",
      transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-amali ma tarda",
      meaning: "O Allah, we ask You on this journey of ours for righteousness and piety, and for deeds which please You.",
      source: "Hisnul Muslim 175", grade: "Sahih — Muslim 1342"
    },
    {
      arabic: "اللّٰهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الأَهْلِ",
      transliteration: "Allahumma antas-sahibu fis-safar, wal-khalifatu fil-ahl",
      meaning: "O Allah, You are the companion in travel and the guardian of the family.",
      source: "Hisnul Muslim 176", grade: "Sahih — Muslim 1342"
    }
  ],
  "For Parents": [
    {
      arabic: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
      transliteration: "Rabbir hamhuma kama rabbayani saghira",
      meaning: "My Lord, have mercy on them both as they raised me when I was small.",
      source: "Hisnul Muslim 186 — Quran 17:24", grade: "Quranic — 17:24"
    },
    {
      arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَنْ دَخَلَ بَيْتِيَ مُؤْمِنًا",
      transliteration: "Rabbigh-fir li wa liwaliday wa liman dakhala bayti mu'minan",
      meaning: "My Lord, forgive me and my parents and whoever enters my house as a believer.",
      source: "Hisnul Muslim 187 — Quran 71:28", grade: "Quranic — 71:28"
    },
    {
      arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الحِسَابُ",
      transliteration: "Rabbana-ghfir li wa liwaliday wa lil-mu'minina yawma yaqumul-hisab",
      meaning: "Our Lord, forgive me and my parents and the believers on the day when the account is established.",
      source: "Hisnul Muslim 188 — Quran 14:41", grade: "Quranic — 14:41"
    },
    {
      arabic: "اللّٰهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا",
      transliteration: "Allahumma-ghfir lihayyina wa mayyitina, wa shahidina wa gha'ibina, wa saghirina wa kabirina",
      meaning: "O Allah, forgive our living and our dead, those who are present and those who are absent, our young and our old.",
      source: "Hisnul Muslim 189", grade: "Hasan — Abu Dawud 3201, Tirmidhi 1024"
    }
  ],
  "Seeking Forgiveness": [
    {
      arabic: "اللّٰهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      transliteration: "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana ala ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika alayya, wa abu'u laka bidhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa ant",
      meaning: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me — for verily none can forgive sins except You.",
      source: "Hisnul Muslim 100 — Sayyidul Istighfar", grade: "Sahih — Bukhari 6306"
    },
    {
      arabic: "أَسْتَغْفِرُ اللّٰهَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الحَيَّ القَيُّومَ وَأَتُوبُ إِلَيْهِ",
      transliteration: "Astaghfirullahil-ladhi la ilaha illa huwal-hayyal-qayyuma wa atubu ilayh",
      meaning: "I seek the forgiveness of Allah, beside whom none has the right to be worshipped except Him, the Ever-Living, the Self-Sustaining, and I repent to Him.",
      source: "Hisnul Muslim 97", grade: "Sahih — Abu Dawud 1517, Tirmidhi 3577"
    },
    {
      arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
      transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khashirin",
      meaning: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
      source: "Hisnul Muslim — Quran 7:23 (Du'a of Adam)", grade: "Quranic — 7:23"
    },
    {
      arabic: "رَبِّ إِنِّي ظَلَمْتُ نَفْسِي فَاغْفِرْ لِي",
      transliteration: "Rabbi inni zalamtu nafsi faghfir li",
      meaning: "My Lord, indeed I have wronged myself, so forgive me.",
      source: "Hisnul Muslim — Quran 28:16", grade: "Quranic — 28:16"
    },
    {
      arabic: "اللّٰهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ",
      transliteration: "Allahumma-ghfir li dhambi kullahu, diqqahu wa jillah, wa awwalahu wa akhirah, wa alaniyatahu wa sirrah",
      meaning: "O Allah, forgive all my sins, the small and great, the first and last, the open and secret.",
      source: "Hisnul Muslim 98", grade: "Sahih — Muslim 483"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
      meaning: "None has the right to be worshipped except You; glory be to You. Truly I have been among the wrongdoers.",
      source: "Hisnul Muslim — Du'a of Yunus ﷺ, Quran 21:87", grade: "Quranic — 21:87"
    },
    {
      arabic: "اللّٰهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
      transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
      meaning: "O Allah, You are the Pardoner, You love to pardon, so pardon me.",
      source: "Hisnul Muslim 99", grade: "Sahih — Tirmidhi 3513, Ibn Majah 3850"
    },
    {
      arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ",
      transliteration: "Rabbighfir li wa tub 'alayya innaka antal-tawwabur-rahim",
      meaning: "My Lord, forgive me and accept my repentance. Verily You are the Oft-Returning, the Most Merciful.",
      source: "Hisnul Muslim 101", grade: "Sahih — Abu Dawud 1516, Tirmidhi 3434"
    },
    {
      arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
      transliteration: "Rabbana-ghfir li wa liwalidayya wa lil-mu'minina yawma yaqumul-hisab",
      meaning: "Our Lord, forgive me and my parents and the believers on the Day when the account will be established.",
      source: "Du'a of Ibrahim ﷺ — Quran 14:41", grade: "Quranic — 14:41"
    },
    {
      arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ",
      transliteration: "Rabbighfir li wa liwalidayya wa liman dakhala baytiya mu'minan wa lil-mu'minina wal-mu'minat",
      meaning: "My Lord, forgive me and my parents and whoever enters my house as a believer, and the believing men and believing women.",
      source: "Du'a of Nuh ﷺ — Quran 71:28", grade: "Quranic — 71:28"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ وَأَنَا أَعْلَمُ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ",
      transliteration: "Allahumma inni a'udhu bika an ushrika bika wa ana a'lam, wa astaghfiruka lima la a'lam",
      meaning: "O Allah, I seek refuge in You from knowingly associating partners with You, and I seek Your forgiveness for what I do unknowingly.",
      source: "Hisnul Muslim 102", grade: "Sahih — Ahmad 4/403, authenticated by Al-Albani"
    }
  ],
  "For Guidance & Knowledge": [
    {
      arabic: "رَبِّ زِدْنِي عِلْمًا",
      transliteration: "Rabbi zidni ilma",
      meaning: "My Lord, increase me in knowledge.",
      source: "Hisnul Muslim — Quran 20:114", grade: "Quranic — 20:114"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
      transliteration: "Allahumma inni as'aluka ilman nafi'an, wa rizqan tayyiban, wa amalan mutaqabbalan",
      meaning: "O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.",
      source: "Hisnul Muslim 94", grade: "Sahih — Ibn Majah 925"
    },
    {
      arabic: "اللّٰهُمَّ اهْدِنِي وَسَدِّدْنِي",
      transliteration: "Allahumma-hdini wa saddidni",
      meaning: "O Allah, guide me and make me steadfast.",
      source: "Hisnul Muslim 93", grade: "Sahih — Muslim 2725"
    },
    {
      arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً",
      transliteration: "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah",
      meaning: "Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself.",
      source: "Hisnul Muslim — Quran 3:8", grade: "Quranic — 3:8"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ، وَمِنْ قَلْبٍ لَا يَخْشَعُ",
      transliteration: "Allahumma inni a'udhu bika min ilmin la yanfa', wa min qalbin la yakhsha'",
      meaning: "O Allah, I seek refuge in You from knowledge that does not benefit, and from a heart that is not humbled.",
      source: "Hisnul Muslim 95", grade: "Sahih — Muslim 2722"
    }
  ],

  "For Provision & Rizq": [
    {
      arabic: "اللّٰهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
      transliteration: "Allahumma-kfini bi-halalika 'an haramika, wa aghnini bi-fadlika 'amman siwak",
      meaning: "O Allah, suffice me with what You have made lawful against what You have made forbidden, and make me self-sufficient through Your bounty from all others.",
      source: "Hisnul Muslim 118", grade: "Hasan — Tirmidhi 3563 · Dua for halal rizq and freedom from depending on anyone but Allah"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ الهُدَى وَالتُّقَى وَالْعَفَافَ وَالغِنَى",
      transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
      meaning: "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.",
      source: "Hisnul Muslim 93", grade: "Sahih — Muslim 2721 · The Prophet ﷺ taught this dua regularly"
    },
    {
      arabic: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
      transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqir",
      meaning: "My Lord, indeed I am in desperate need of whatever good You send down to me.",
      source: "Hisnul Muslim — Quran 28:24", grade: "Quranic · Dua of Musa ﷺ — he had nothing when he said this; shortly after, Allah gave him a home, a wife, and a new life"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْفَقْرِ وَالْقِلَّةِ وَالذِّلَّةِ، وَأَعُوذُ بِكَ مِنْ أَنْ أَظْلِمَ أَوْ أُظْلَمَ",
      transliteration: "Allahumma inni a'udhu bika minal-faqri wal-qillati wadh-dhillah, wa a'udhu bika min an azlima aw uzlam",
      meaning: "O Allah, I seek refuge in You from poverty, scarcity, and humiliation, and I seek refuge in You from wronging others or being wronged.",
      source: "Hisnul Muslim 119", grade: "Sahih — Abu Dawud 1544, Ibn Majah 3842"
    },
    {
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
      transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa dhala'id-dayni wa ghalabatir-rijal",
      meaning: "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from miserliness and cowardice, from being overwhelmed by debt and overpowered by people.",
      source: "Hisnul Muslim 120", grade: "Sahih — Bukhari 6363 · Comprehensive dua covering all causes of poverty and hardship"
    }
  ],

  "Essential Duas ⭐": [
    {
      arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      transliteration: "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayya wa abu'u bidhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa ant",
      meaning: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I am as faithful to Your covenant and promise as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I confess my sins to You, so forgive me, for none forgives sins except You.",
      source: "Hisnul Muslim 73", grade: "Sahih — Bukhari 6306 · The Prophet ﷺ said: whoever says this with certainty in the morning or evening and dies that day or night, enters Jannah"
    },
    {
      arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
      transliteration: "Allahumma-kfini bi-halalika 'an haramika, wa aghnini bi-fadlika 'amman siwak",
      meaning: "O Allah, make Your lawful provisions sufficient for me against what is unlawful, and enrich me through Your bounty to the exclusion of all others.",
      source: "Hisnul Muslim — Tirmidhi 3563", grade: "Hasan — Tirmidhi · Dua for halal rizq and freedom from depending on anyone but Allah"
    },
    {
      arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
      meaning: "None has the right to be worshipped except You; glory be to You. Truly I have been among the wrongdoers.",
      source: "Hisnul Muslim — Quran 21:87", grade: "Quranic — Sahih · The Prophet ﷺ said: no Muslim calls upon Allah with this except that Allah responds to him"
    },
    {
      arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي وَنُورَ صَدْرِي وَجَلَاءَ حُزْنِي وَذَهَابَ هَمِّي",
      transliteration: "Allahumma inni abduka wa ibnu abdika wa ibnu amatik, nasiyati biyadik, madin fiyya hukmuk, 'adlun fiyya qada'uk, as'aluka bikulli ismin huwa laka sammayta bihi nafsak aw anzaltahu fi kitabik aw 'allamtahu ahadan min khalqik aw ista'tharta bihi fi 'ilmil-ghaybi 'indak, an taj'alal-Qurana rabi'a qalbi wa nura sadri wa jala'a huzni wa dhahaba hammi",
      meaning: "O Allah, I am Your servant, son of Your servant, son of Your female servant. My forelock is in Your hand. Your decree upon me is just. I ask You by every name You have given Yourself, revealed in Your Book, taught to any of Your creation, or kept in Your knowledge of the unseen, to make the Quran the spring of my heart, the light of my chest, the departure of my sorrow, and the relief of my anxiety.",
      source: "Ahmad 3712 · Ibn Hibban 972", grade: "Sahih — The Prophet ﷺ said: Allah will remove his worry and replace it with joy"
    },
    {
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      transliteration: "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaab an-nar",
      meaning: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      source: "Hisnul Muslim — Quran 2:201 · Bukhari 6389 · Muslim 2690", grade: "Quranic & Sahih · Anas ؓ said the Prophet ﷺ most frequently made this dua"
    },
    {
      arabic: "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا",
      transliteration: "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla",
      meaning: "O Allah, there is no ease except in what You make easy, and You make hardship easy if You will.",
      source: "Ibn Hibban 2427 · Ibn as-Sunni 351", grade: "Sahih — authenticated by Al-Albani"
    },
    {
      arabic: "حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ",
      transliteration: "Hasbunallahu wa ni'mal-wakil",
      meaning: "Allah is sufficient for us and He is the best Disposer of affairs.",
      source: "Hisnul Muslim — Quran 3:173", grade: "Quranic · Said by Ibrahim ﷺ when thrown into the fire, and by the Prophet ﷺ at the Battle of Uhud"
    },
    {
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
      transliteration: "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah",
      meaning: "O Allah, I ask You for pardon and well-being in this world and in the Hereafter.",
      source: "Hisnul Muslim — Ibn Majah 3871 · Abu Dawud 5074", grade: "Sahih — authenticated by Al-Albani · Ibn Umar ؓ never left this dua morning or evening"
    },
    {
      arabic: "رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
      transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqir",
      meaning: "My Lord, indeed I am in desperate need of whatever good You send down to me.",
      source: "Hisnul Muslim — Quran 28:24", grade: "Quranic · Dua of Musa ﷺ when he had nothing — shortly after, Allah gave him a home, a wife, and a new life"
    }
  ],

  "Prophetic Duas ﷺ": [
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
      transliteration: "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah",
      meaning: "O Allah, I ask You for pardon and well-being in this world and in the Hereafter.",
      source: "Ibn Majah 3871 · Abu Dawud 5074", grade: "Sahih — authenticated by Al-Albani"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
      transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
      meaning: "O Allah, help me to remember You, to give thanks to You, and to worship You in the best manner.",
      source: "Abu Dawud 1522 · Ahmad 22119", grade: "Sahih — authenticated by Al-Albani"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
      transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wa a'udhu bika minal-'ajzi wal-kasal, wa a'udhu bika minal-jubni wal-bukhl, wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal",
      meaning: "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from being overcome by debt and overpowered by men.",
      source: "Bukhari 6369 · Abu Dawud 1555", grade: "Sahih — Bukhari"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
      transliteration: "Rabbi ghfir li wa tub 'alayya innaka antal-tawwabur-rahim",
      meaning: "My Lord, forgive me and accept my repentance. Verily You are the Oft-Returning, the Most Merciful.",
      source: "Abu Dawud 1516 · Tirmidhi 3434", grade: "Sahih — the Prophet ﷺ said this 100 times per sitting"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
      transliteration: "Ya muqallibal-qulubi thabbit qalbi 'ala dinik",
      meaning: "O Turner of the hearts, keep my heart firm upon Your religion.",
      source: "Tirmidhi 3522 · Ahmad 12107", grade: "Hasan Sahih — Tirmidhi"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
      transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
      meaning: "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.",
      source: "Muslim 2721 · Ibn Majah 3832", grade: "Sahih — Muslim"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ اجْعَلْ فِي قَلْبِي نُورًا، وَفِي لِسَانِي نُورًا، وَاجْعَلْ فِي سَمْعِي نُورًا، وَاجْعَلْ فِي بَصَرِي نُورًا، وَاجْعَلْ مِنْ خَلْفِي نُورًا وَمِنْ أَمَامِي نُورًا، وَاجْعَلْ مِنْ فَوْقِي نُورًا وَمِنْ تَحْتِي نُورًا، اللّٰهُمَّ أَعْطِنِي نُورًا",
      transliteration: "Allahumma ij'al fi qalbi nuran, wa fi lisani nuran, waj'al fi sam'i nuran, waj'al fi basari nuran, waj'al min khalfi nuran wa min amamni nuran, waj'al min fawqi nuran wa min tahti nuran, Allahumma a'tini nuran",
      meaning: "O Allah, place light in my heart, light on my tongue, light in my hearing, light in my sight, light behind me and light before me, light above me and light below me. O Allah, grant me light.",
      source: "Bukhari 6316 · Muslim 763", grade: "Sahih — Bukhari & Muslim"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ أَصْلِحْ لِي دِينِيَ الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ",
      transliteration: "Allahumma aslih li diniyal-ladhi huwa 'ismatu amri, wa aslih li dunya'yal-lati fiha ma'ashi, wa aslih li akhiratiy-allati fiha ma'adi, waj'alil-hayata ziyadatan li fi kulli khayr, waj'alil-mawta rahatan li min kulli sharr",
      meaning: "O Allah, set right for me my religion which is the safeguard of my affairs, set right for me my world where my livelihood lies, set right for me my Hereafter where my return shall be. Make life a means of abundance for me in every good, and make death a relief for me from every evil.",
      source: "Muslim 2720", grade: "Sahih — Muslim"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ وَحُبَّ مَنْ يُحِبُّكَ، وَحُبَّ عَمَلٍ يُقَرِّبُنِي إِلَى حُبِّكَ",
      transliteration: "Allahumma inni as'aluka hubbaka wa hubba man yuhibbuka, wa hubba 'amalin yuqarribuni ila hubbik",
      meaning: "O Allah, I ask You for Your love, the love of those who love You, and the love of deeds that draw me closer to Your love.",
      source: "Tirmidhi 3490 · Ahmad 22165", grade: "Hasan — Tirmidhi, authenticated by Al-Albani"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      transliteration: "Allahumma atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaaban-nar",
      meaning: "O Allah, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      source: "Quran 2:201 · Bukhari 6389 · Muslim 2690", grade: "Quranic (2:201) · The Prophet ﷺ recited this more than any other dua"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
      transliteration: "Allahumma inni zalamtu nafsi zulman kathiran wa la yaghfirudh-dhunuba illa ant, faghfir li maghfiratan min 'indika warhamni innaka antal-ghafurur-rahim",
      meaning: "O Allah, I have greatly wronged myself and none forgives sins except You, so grant me forgiveness from Yourself and have mercy on me. Surely You are the All-Forgiving, the Most Merciful.",
      source: "Bukhari 834 · Muslim 2705", grade: "Sahih — Bukhari & Muslim · Taught to Abu Bakr as-Siddiq ؓ"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ",
      transliteration: "Allahumma inni as'aluka minal-khayri kullihi 'ajilihi wa ajilih, ma 'alimtu minhu wa ma lam a'lam",
      meaning: "O Allah, I ask You for all good — both immediate and deferred — that which I know and that which I do not know.",
      source: "Ibn Majah 3846 · Ahmad 25019", grade: "Sahih — authenticated by Al-Albani & Shu'ayb Al-Arnaut"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ، وَبِمُعَافَاتِكَ مِنْ عُقُوبَتِكَ، وَأَعُوذُ بِكَ مِنْكَ، لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ",
      transliteration: "Allahumma inni a'udhu biridaka min sakhatik, wa bimu'afatika min 'uqubatik, wa a'udhu bika mink, la uhsi thana'an 'alayk, anta kama athnayta 'ala nafsik",
      meaning: "O Allah, I seek refuge in Your pleasure from Your anger, and in Your pardon from Your punishment. I seek refuge in You from You. I cannot enumerate Your praise — You are as You have praised Yourself.",
      source: "Muslim 486 · Abu Dawud 879", grade: "Sahih — Muslim · Recited in sujud"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
      transliteration: "Subhanakal-lahumma wa bihamdik, ashhadu an la ilaha illa ant, astaghfiruka wa atubu ilayk",
      meaning: "Glory be to You, O Allah, and all praise. I bear witness that there is none worthy of worship except You. I seek Your forgiveness and I repent to You.",
      source: "Tirmidhi 3433 · Nasa'i — As-Sunanul Kubra", grade: "Sahih — Kaffaratul Majlis (expiation of a gathering)"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ الثَّبَاتَ فِي الْأَمْرِ، وَأَسْأَلُكَ عَزِيمَةَ الرُّشْدِ، وَأَسْأَلُكَ شُكْرَ نِعْمَتِكَ وَحُسْنَ عِبَادَتِكَ، وَأَسْأَلُكَ قَلْبًا سَلِيمًا وَلِسَانًا صَادِقًا",
      transliteration: "Allahumma inni as'alukat-thabata fil-amr, wa as'aluka 'azimatar-rushd, wa as'aluka shukra ni'matika wa husna 'ibadatik, wa as'aluka qalban saliman wa lisanan sadiqan",
      meaning: "O Allah, I ask You for steadfastness in all matters, and determination upon the right path. I ask You for gratitude for Your blessings and to worship You well. I ask You for a sound heart and a truthful tongue.",
      source: "Nasa'i 1304 · Ahmad 23466", grade: "Sahih — authenticated by Al-Albani"
    },
    {
      prophet: "Prophet Muhammad ﷺ",
      arabic: "اللّٰهُمَّ اغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، وَمَا أَسْرَفْتُ وَمَا أَنْتَ أَعْلَمُ بِهِ مِنِّي، أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ لَا إِلٰهَ إِلَّا أَنْتَ",
      transliteration: "Allahummaghfir li ma qaddamtu wa ma akhkhartu, wa ma asrartu wa ma a'lantu, wa ma asraftu wa ma anta a'lamu bihi minni, antal-muqaddimu wa antal-mu'akhkhiru la ilaha illa ant",
      meaning: "O Allah, forgive me for what I have done before and what I will do after, what I have concealed and what I have made known, what I have been excessive in, and what You know better than I. You are the Bringer Forward and the Delayer — there is none worthy of worship except You.",
      source: "Muslim 771 · Bukhari 1120", grade: "Sahih — Bukhari & Muslim · Recited in Tahajjud"
    },
    {
      prophet: "Prophet Adam ﷺ",
      arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
      transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin",
      meaning: "Our Lord, we have wronged ourselves. If You do not forgive us and have mercy upon us, we will surely be among the losers.",
      source: "Quran 7:23", grade: "Quranic — the dua of Adam and Hawwa ﷺ after their descent"
    },
    {
      prophet: "Prophet Ibrahim ﷺ",
      arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي، رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
      transliteration: "Rabbij'alni muqimas-salati wa min dhurriyyati, Rabbana wa taqabbal du'a",
      meaning: "My Lord, make me an establisher of prayer, and from my descendants. Our Lord, and accept my supplication.",
      source: "Quran 14:40", grade: "Quranic — dua of Ibrahim ﷺ for himself and his children"
    },
    {
      prophet: "Prophet Ibrahim ﷺ",
      arabic: "رَبَّنَا وَاجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِنْ ذُرِّيَّتِنَا أُمَّةً مُسْلِمَةً لَكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
      transliteration: "Rabbana waj'alna muslimayni laka wa min dhurriyyatina ummatan muslimatan lak, wa arina manasikana wa tub 'alayna innaka antal-tawwabur-rahim",
      meaning: "Our Lord, make us both submissive to You, and from our descendants a nation submissive to You. Show us our rites of worship and accept our repentance. Indeed You are the Accepting of repentance, the Merciful.",
      source: "Quran 2:128", grade: "Quranic — dua of Ibrahim and Ismail ﷺ while building the Ka'bah"
    },
    {
      prophet: "Prophet Musa ﷺ",
      arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي",
      transliteration: "Rabbish-rah li sadri wa yassir li amri wahlul 'uqdatan min lisani yafqahu qawli",
      meaning: "My Lord, expand my breast, ease my task for me, and remove the impediment from my speech, so that they may understand my words.",
      source: "Quran 20:25–28", grade: "Quranic — dua of Musa ﷺ before facing Pharaoh"
    },
    {
      prophet: "Prophet Musa ﷺ",
      arabic: "رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
      transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqir",
      meaning: "My Lord, indeed I am in need of whatever good You send down to me.",
      source: "Quran 28:24", grade: "Quranic — dua of Musa ﷺ after fleeing Egypt, alone and destitute"
    },
    {
      prophet: "Prophet Yunus ﷺ",
      arabic: "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
      transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin",
      meaning: "None has the right to be worshipped except You; glory be to You. Truly I have been among the wrongdoers.",
      source: "Quran 21:87", grade: "Quranic — dua of Yunus ﷺ from inside the whale. The Prophet ﷺ said: no Muslim calls upon Allah with it except that Allah responds"
    },
    {
      prophet: "Prophet Ayyub ﷺ",
      arabic: "رَبِّ أَنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ",
      transliteration: "Rabbi anni massaniya-ddhurru wa anta arhamur-rahimin",
      meaning: "My Lord, indeed adversity has touched me, and You are the Most Merciful of the merciful.",
      source: "Quran 21:83", grade: "Quranic — dua of Ayyub ﷺ after years of severe illness and loss"
    },
    {
      prophet: "Prophet Zakariyya ﷺ",
      arabic: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ",
      transliteration: "Rabbi la tadharni fardan wa anta khayrur-waritheen",
      meaning: "My Lord, do not leave me alone (without an heir), and You are the best of inheritors.",
      source: "Quran 21:89", grade: "Quranic — dua of Zakariyya ﷺ, answered with the birth of Yahya ﷺ"
    },
    {
      prophet: "Prophet Sulayman ﷺ",
      arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَى وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ",
      transliteration: "Rabbi awzi'ni an ashkura ni'matakal-lati an'amta 'alayya wa 'ala walidayya wa an a'mala salihan tardahu wa adkhilni birahmatika fi 'ibadika-ssalihin",
      meaning: "My Lord, inspire me to be grateful for Your favour which You have bestowed upon me and upon my parents, and to do righteousness of which You approve. And admit me by Your mercy into the ranks of Your righteous servants.",
      source: "Quran 27:19", grade: "Quranic — dua of Sulayman ﷺ upon hearing the ant"
    },
    {
      prophet: "Prophet Nuh ﷺ",
      arabic: "رَبِّ إِنِّي أَعُوذُ بِكَ أَنْ أَسْأَلَكَ مَا لَيْسَ لِي بِهِ عِلْمٌ وَإِلَّا تَغْفِرْ لِي وَتَرْحَمْنِي أَكُنْ مِنَ الْخَاسِرِينَ",
      transliteration: "Rabbi inni a'udhu bika an as'alaka ma laysa li bihi 'ilm, wa illa taghfir li wa tarhamni akun minal-khasirin",
      meaning: "My Lord, I seek refuge in You from asking You about that of which I have no knowledge. And unless You forgive me and have mercy upon me, I will be among the losers.",
      source: "Quran 11:47", grade: "Quranic — dua of Nuh ﷺ after his son drowned"
    }
  ]
};

// ── 99 Names of Allah ────────────────────────────────────────
const NAMES_OF_ALLAH = [
  { n:1,  arabic:"اللّٰه",           transliteration:"Allah",            meaning:"The Greatest Name — the one true God",                    source:"Quran 1:1" },
  { n:2,  arabic:"الرَّحْمٰن",       transliteration:"Ar-Rahman",         meaning:"The Most Gracious — boundless mercy encompassing all",     source:"Quran 1:3" },
  { n:3,  arabic:"الرَّحِيم",        transliteration:"Ar-Rahim",          meaning:"The Most Merciful — special mercy for believers",          source:"Quran 1:3" },
  { n:4,  arabic:"الْمَلِك",         transliteration:"Al-Malik",          meaning:"The King — sovereign owner of all existence",              source:"Quran 59:23" },
  { n:5,  arabic:"الْقُدُّوس",       transliteration:"Al-Quddus",         meaning:"The Most Holy — pure from all deficiency",                 source:"Quran 59:23" },
  { n:6,  arabic:"السَّلَام",        transliteration:"As-Salam",          meaning:"The Source of Peace — grants security and safety",         source:"Quran 59:23" },
  { n:7,  arabic:"الْمُؤْمِن",       transliteration:"Al-Mu'min",         meaning:"The Guardian of Faith — gives security to His servants",   source:"Quran 59:23" },
  { n:8,  arabic:"الْمُهَيْمِن",     transliteration:"Al-Muhaymin",       meaning:"The Protector — watches over and safeguards all",          source:"Quran 59:23" },
  { n:9,  arabic:"الْعَزِيز",        transliteration:"Al-Aziz",           meaning:"The Almighty — none can overcome Him",                     source:"Quran 59:23" },
  { n:10, arabic:"الْجَبَّار",       transliteration:"Al-Jabbar",         meaning:"The Compeller — repairs broken things, compels to His will",source:"Quran 59:23" },
  { n:11, arabic:"الْمُتَكَبِّر",    transliteration:"Al-Mutakabbir",     meaning:"The Majestic — possessor of all greatness",                source:"Quran 59:23" },
  { n:12, arabic:"الْخَالِق",        transliteration:"Al-Khaliq",         meaning:"The Creator — brings into existence from nothing",         source:"Quran 59:24" },
  { n:13, arabic:"الْبَارِئ",        transliteration:"Al-Bari'",          meaning:"The Evolver — creates with distinction and separation",    source:"Quran 59:24" },
  { n:14, arabic:"الْمُصَوِّر",      transliteration:"Al-Musawwir",       meaning:"The Fashioner — gives form and shape to all things",       source:"Quran 59:24" },
  { n:15, arabic:"الْغَفَّار",       transliteration:"Al-Ghaffar",        meaning:"The Oft-Forgiving — continually covers and forgives sins", source:"Quran 20:82" },
  { n:16, arabic:"الْقَهَّار",       transliteration:"Al-Qahhar",         meaning:"The Subduer — overcomes everything without opposition",    source:"Quran 12:39" },
  { n:17, arabic:"الْوَهَّاب",       transliteration:"Al-Wahhab",         meaning:"The Bestower — gives gifts freely without expectation",    source:"Quran 3:8" },
  { n:18, arabic:"الرَّزَّاق",       transliteration:"Ar-Razzaq",         meaning:"The Sustainer — provides sustenance for all creation",     source:"Quran 51:58" },
  { n:19, arabic:"الْفَتَّاح",       transliteration:"Al-Fattah",         meaning:"The Opener — opens doors of mercy, judgment and victory",  source:"Quran 34:26" },
  { n:20, arabic:"الْعَلِيم",        transliteration:"Al-Alim",           meaning:"The All-Knowing — His knowledge encompasses everything",   source:"Quran 2:29" },
  { n:21, arabic:"الْقَابِض",        transliteration:"Al-Qabid",          meaning:"The Withholder — constricts provision by wisdom",          source:"Quran 2:245" },
  { n:22, arabic:"الْبَاسِط",        transliteration:"Al-Basit",          meaning:"The Extender — expands provision and opens His hand",      source:"Quran 2:245" },
  { n:23, arabic:"الْخَافِض",        transliteration:"Al-Khafid",         meaning:"The Abaser — lowers the arrogant",                         source:"Tirmidhi 3507" },
  { n:24, arabic:"الرَّافِع",        transliteration:"Ar-Rafi'",          meaning:"The Exalter — raises the righteous in rank",               source:"Tirmidhi 3507" },
  { n:25, arabic:"الْمُعِز",         transliteration:"Al-Mu'izz",         meaning:"The Honourer — bestows honour upon whom He wills",         source:"Tirmidhi 3507" },
  { n:26, arabic:"الْمُذِل",         transliteration:"Al-Mudhill",        meaning:"The Dishonorer — humiliates those who disobey",            source:"Tirmidhi 3507" },
  { n:27, arabic:"السَّمِيع",        transliteration:"As-Sami'",          meaning:"The All-Hearing — hears all sounds including silent thoughts",source:"Quran 2:127" },
  { n:28, arabic:"الْبَصِير",        transliteration:"Al-Basir",          meaning:"The All-Seeing — sees the most minute of details",         source:"Quran 17:1" },
  { n:29, arabic:"الْحَكَم",         transliteration:"Al-Hakam",          meaning:"The Judge — His ruling is final and cannot be disputed",   source:"Tirmidhi 3507" },
  { n:30, arabic:"الْعَدْل",         transliteration:"Al-Adl",            meaning:"The Just — perfectly equitable in all judgments",          source:"Tirmidhi 3507" },
  { n:31, arabic:"اللَّطِيف",        transliteration:"Al-Latif",          meaning:"The Subtle One — kind to servants in ways unseen",         source:"Quran 6:103" },
  { n:32, arabic:"الْخَبِير",        transliteration:"Al-Khabir",         meaning:"The All-Aware — completely informed of hidden realities",  source:"Quran 6:18" },
  { n:33, arabic:"الْحَلِيم",        transliteration:"Al-Halim",          meaning:"The Forbearing — delays punishment despite the power",     source:"Quran 2:225" },
  { n:34, arabic:"الْعَظِيم",        transliteration:"Al-Azim",           meaning:"The Magnificent — immeasurable in greatness",              source:"Quran 2:255" },
  { n:35, arabic:"الْغَفُور",        transliteration:"Al-Ghafur",         meaning:"The Forgiving — forgives all sins however great",          source:"Quran 35:28" },
  { n:36, arabic:"الشَّكُور",        transliteration:"Ash-Shakur",        meaning:"The Appreciative — rewards abundantly for small deeds",    source:"Quran 35:30" },
  { n:37, arabic:"الْعَلِيّ",        transliteration:"Al-Ali",            meaning:"The Most High — exalted above all creation",               source:"Quran 2:255" },
  { n:38, arabic:"الْكَبِير",        transliteration:"Al-Kabir",          meaning:"The Most Great — great in His essence and attributes",     source:"Quran 13:9" },
  { n:39, arabic:"الْحَفِيظ",        transliteration:"Al-Hafiz",          meaning:"The Preserver — guards His creation and their deeds",      source:"Quran 11:57" },
  { n:40, arabic:"الْمُقِيت",        transliteration:"Al-Muqit",          meaning:"The Nourisher — provides what sustains body and soul",     source:"Quran 4:85" },
  { n:41, arabic:"الْحَسِيب",        transliteration:"Al-Hasib",          meaning:"The Reckoner — takes precise account of all deeds",        source:"Quran 4:6" },
  { n:42, arabic:"الْجَلِيل",        transliteration:"Al-Jalil",          meaning:"The Majestic — possesses attributes of awe and greatness", source:"Tirmidhi 3507" },
  { n:43, arabic:"الْكَرِيم",        transliteration:"Al-Karim",          meaning:"The Generous — gives beyond what is asked or deserved",    source:"Quran 27:40" },
  { n:44, arabic:"الرَّقِيب",        transliteration:"Ar-Raqib",          meaning:"The Watchful — ever-vigilant observer over all things",    source:"Quran 5:117" },
  { n:45, arabic:"الْمُجِيب",        transliteration:"Al-Mujib",          meaning:"The Responsive — answers every sincere supplication",      source:"Quran 11:61" },
  { n:46, arabic:"الْوَاسِع",        transliteration:"Al-Wasi'",          meaning:"The All-Encompassing — boundless in knowledge and mercy",  source:"Quran 2:115" },
  { n:47, arabic:"الْحَكِيم",        transliteration:"Al-Hakim",          meaning:"The Wise — everything He does has perfect wisdom",         source:"Quran 2:129" },
  { n:48, arabic:"الْوَدُود",        transliteration:"Al-Wadud",          meaning:"The Loving — loves His righteous servants deeply",         source:"Quran 85:14" },
  { n:49, arabic:"الْمَجِيد",        transliteration:"Al-Majid",          meaning:"The Most Glorious — possesses perfect glory and honor",    source:"Quran 85:15" },
  { n:50, arabic:"الْبَاعِث",        transliteration:"Al-Ba'ith",         meaning:"The Resurrector — will raise all of creation on Judgment Day",source:"Tirmidhi 3507" },
  { n:51, arabic:"الشَّهِيد",        transliteration:"Ash-Shahid",        meaning:"The Witness — present and aware of everything always",     source:"Quran 5:117" },
  { n:52, arabic:"الْحَق",           transliteration:"Al-Haqq",           meaning:"The Truth — truly exists, all else contingent on Him",     source:"Quran 22:62" },
  { n:53, arabic:"الْوَكِيل",        transliteration:"Al-Wakil",          meaning:"The Trustee — best disposer of all affairs",               source:"Quran 3:173" },
  { n:54, arabic:"الْقَوِيّ",        transliteration:"Al-Qawi",           meaning:"The All-Strong — strength perfect in every way",           source:"Quran 22:40" },
  { n:55, arabic:"الْمَتِين",        transliteration:"Al-Matin",          meaning:"The Firm — invincible in strength and authority",          source:"Quran 51:58" },
  { n:56, arabic:"الْوَلِيّ",        transliteration:"Al-Wali",           meaning:"The Protecting Friend — guardian of the believers",        source:"Quran 2:257" },
  { n:57, arabic:"الْحَمِيد",        transliteration:"Al-Hamid",          meaning:"The Praiseworthy — deserves all praise at all times",      source:"Quran 14:8" },
  { n:58, arabic:"الْمُحْصِي",       transliteration:"Al-Muhsi",          meaning:"The Reckoner — counts and records every single thing",     source:"Tirmidhi 3507" },
  { n:59, arabic:"الْمُبْدِئ",       transliteration:"Al-Mubdi'",         meaning:"The Originator — initiates creation for the first time",   source:"Tirmidhi 3507" },
  { n:60, arabic:"الْمُعِيد",        transliteration:"Al-Mu'id",          meaning:"The Restorer — brings back creation after its end",        source:"Tirmidhi 3507" },
  { n:61, arabic:"الْمُحْيِي",       transliteration:"Al-Muhyi",          meaning:"The Giver of Life — grants life to the living and dead",   source:"Tirmidhi 3507" },
  { n:62, arabic:"الْمُمِيت",        transliteration:"Al-Mumit",          meaning:"The Taker of Life — causes death when He wills",           source:"Tirmidhi 3507" },
  { n:63, arabic:"الْحَيّ",          transliteration:"Al-Hayy",           meaning:"The Ever-Living — lives without beginning or end",         source:"Quran 2:255" },
  { n:64, arabic:"الْقَيُّوم",       transliteration:"Al-Qayyum",         meaning:"The Self-Sustaining — everything subsists by Him",         source:"Quran 2:255" },
  { n:65, arabic:"الْوَاجِد",        transliteration:"Al-Wajid",          meaning:"The Finder — nothing is lost to Him",                      source:"Tirmidhi 3507" },
  { n:66, arabic:"الْمَاجِد",        transliteration:"Al-Majid",          meaning:"The Noble — noble in essence and qualities",               source:"Tirmidhi 3507" },
  { n:67, arabic:"الْوَاحِد",        transliteration:"Al-Wahid",          meaning:"The Unique — singular with no resemblance",                source:"Quran 13:16" },
  { n:68, arabic:"الأَحَد",          transliteration:"Al-Ahad",           meaning:"The One — absolutely indivisible in essence",              source:"Quran 112:1" },
  { n:69, arabic:"الصَّمَد",         transliteration:"As-Samad",          meaning:"The Eternal — the independent upon whom all depend",       source:"Quran 112:2" },
  { n:70, arabic:"الْقَادِر",        transliteration:"Al-Qadir",          meaning:"The All-Powerful — able to do whatever He wills",          source:"Quran 6:65" },
  { n:71, arabic:"الْمُقْتَدِر",     transliteration:"Al-Muqtadir",       meaning:"The Prevailing — His power encompasses everything",        source:"Quran 18:45" },
  { n:72, arabic:"الْمُقَدِّم",      transliteration:"Al-Muqaddim",       meaning:"The Expediter — brings forward whom He wills",             source:"Tirmidhi 3507" },
  { n:73, arabic:"الْمُؤَخِّر",      transliteration:"Al-Mu'akhkhir",     meaning:"The Delayer — postpones what He wills by wisdom",          source:"Tirmidhi 3507" },
  { n:74, arabic:"الأَوَّل",         transliteration:"Al-Awwal",          meaning:"The First — before whom nothing existed",                  source:"Quran 57:3" },
  { n:75, arabic:"الآخِر",           transliteration:"Al-Akhir",          meaning:"The Last — after whom nothing will exist",                 source:"Quran 57:3" },
  { n:76, arabic:"الظَّاهِر",        transliteration:"Az-Zahir",          meaning:"The Manifest — apparent through signs in creation",        source:"Quran 57:3" },
  { n:77, arabic:"الْبَاطِن",        transliteration:"Al-Batin",          meaning:"The Hidden — hidden from human sight and comprehension",   source:"Quran 57:3" },
  { n:78, arabic:"الْوَالِي",        transliteration:"Al-Wali",           meaning:"The Governor — has absolute authority over all",           source:"Quran 13:11" },
  { n:79, arabic:"الْمُتَعَالِي",    transliteration:"Al-Muta'ali",       meaning:"The Self-Exalted — exalts Himself above all things",       source:"Quran 13:9" },
  { n:80, arabic:"الْبَرّ",          transliteration:"Al-Barr",           meaning:"The Source of All Goodness — kind and righteous",          source:"Quran 52:28" },
  { n:81, arabic:"التَّوَّاب",       transliteration:"At-Tawwab",         meaning:"The Acceptor of Repentance — turns to servants with mercy",source:"Quran 2:37" },
  { n:82, arabic:"الْمُنْتَقِم",     transliteration:"Al-Muntaqim",       meaning:"The Avenger — takes retribution for the oppressed",        source:"Quran 32:22" },
  { n:83, arabic:"الْعَفُوّ",        transliteration:"Al-Afuw",           meaning:"The Pardoner — erases sins completely without trace",      source:"Quran 4:99" },
  { n:84, arabic:"الرَّؤُوف",        transliteration:"Ar-Ra'uf",          meaning:"The Compassionate — extremely kind and compassionate",     source:"Quran 3:30" },
  { n:85, arabic:"مَالِكُ الْمُلْك", transliteration:"Malik-ul-Mulk",     meaning:"Owner of All Sovereignty — all power belongs to Him",     source:"Quran 3:26" },
  { n:86, arabic:"ذُو الْجَلَالِ وَالإِكْرَام",transliteration:"Dhul-Jalali wal-Ikram",meaning:"Lord of Majesty and Bounty — unique in glory and generosity",source:"Quran 55:78" },
  { n:87, arabic:"الْمُقْسِط",       transliteration:"Al-Muqsit",         meaning:"The Equitable — establishes justice between creation",     source:"Tirmidhi 3507" },
  { n:88, arabic:"الْجَامِع",        transliteration:"Al-Jami'",          meaning:"The Gatherer — will gather all of creation on Judgment Day",source:"Tirmidhi 3507" },
  { n:89, arabic:"الْغَنِيّ",        transliteration:"Al-Ghani",          meaning:"The Self-Sufficient — needs nothing from His creation",    source:"Quran 3:97" },
  { n:90, arabic:"الْمُغْنِي",       transliteration:"Al-Mughni",         meaning:"The Enricher — enriches whom He wills from His bounty",    source:"Tirmidhi 3507" },
  { n:91, arabic:"الْمَانِع",        transliteration:"Al-Mani'",          meaning:"The Preventer — withholds what would harm",                source:"Tirmidhi 3507" },
  { n:92, arabic:"الضَّار",          transliteration:"Ad-Darr",           meaning:"The Distresser — allows harm to come by wisdom",           source:"Tirmidhi 3507" },
  { n:93, arabic:"النَّافِع",        transliteration:"An-Nafi'",          meaning:"The Propitious — the source of all benefit",               source:"Tirmidhi 3507" },
  { n:94, arabic:"النُّور",          transliteration:"An-Nur",            meaning:"The Light — the light of heavens and earth",               source:"Quran 24:35" },
  { n:95, arabic:"الْهَادِي",        transliteration:"Al-Hadi",           meaning:"The Guide — guides hearts and souls to truth",             source:"Quran 22:54" },
  { n:96, arabic:"الْبَدِيع",        transliteration:"Al-Badi'",          meaning:"The Originator — creates without any prior model",         source:"Quran 2:117" },
  { n:97, arabic:"الْبَاقِي",        transliteration:"Al-Baqi",           meaning:"The Everlasting — exists eternally without end",           source:"Tirmidhi 3507" },
  { n:98, arabic:"الْوَارِث",        transliteration:"Al-Warith",         meaning:"The Inheritor — inherits the earth after all perish",      source:"Quran 15:23" },
  { n:99, arabic:"الرَّشِيد",        transliteration:"Ar-Rashid",         meaning:"The Guide to the Right Path — directs creation wisely",    source:"Tirmidhi 3507" }
];

// ── Arabic Letters ───────────────────────────────────────────
const ARABIC_LETTERS = [
  { letter:"ا", name:"Alif",   sound:"aa/a",  example:"أَسَد (asad) — lion" },
  { letter:"ب", name:"Ba",     sound:"b",     example:"بَيْت (bayt) — house" },
  { letter:"ت", name:"Ta",     sound:"t",     example:"تُفَّاح (tuffah) — apple" },
  { letter:"ث", name:"Tha",    sound:"th",    example:"ثَوْب (thawb) — garment" },
  { letter:"ج", name:"Jim",    sound:"j",     example:"جَمَل (jamal) — camel" },
  { letter:"ح", name:"Ha",     sound:"h (heavy)",example:"حِصَان (hisan) — horse" },
  { letter:"خ", name:"Kha",    sound:"kh",    example:"خُبْز (khubz) — bread" },
  { letter:"د", name:"Dal",    sound:"d",     example:"دَجَاجَة (dajaja) — chicken" },
  { letter:"ذ", name:"Dhal",   sound:"dh",    example:"ذَهَب (dhahab) — gold" },
  { letter:"ر", name:"Ra",     sound:"r",     example:"رَجُل (rajul) — man" },
  { letter:"ز", name:"Zayn",   sound:"z",     example:"زَهْرَة (zahra) — flower" },
  { letter:"س", name:"Sin",    sound:"s",     example:"سَمَكَة (samaka) — fish" },
  { letter:"ش", name:"Shin",   sound:"sh",    example:"شَمْس (shams) — sun" },
  { letter:"ص", name:"Sad",    sound:"s (heavy)",example:"صَبِيّ (sabi) — boy" },
  { letter:"ض", name:"Dad",    sound:"d (heavy)",example:"ضِفْدَع (difda') — frog" },
  { letter:"ط", name:"Ta",     sound:"t (heavy)",example:"طَائِر (ta'ir) — bird" },
  { letter:"ظ", name:"Dha",    sound:"dh (heavy)",example:"ظَبْي (dhaby) — gazelle" },
  { letter:"ع", name:"Ayn",    sound:"' (deep)",example:"عَيْن (ayn) — eye" },
  { letter:"غ", name:"Ghayn",  sound:"gh",    example:"غَيْم (ghaym) — cloud" },
  { letter:"ف", name:"Fa",     sound:"f",     example:"فِيل (fil) — elephant" },
  { letter:"ق", name:"Qaf",    sound:"q",     example:"قَمَر (qamar) — moon" },
  { letter:"ك", name:"Kaf",    sound:"k",     example:"كِتَاب (kitab) — book" },
  { letter:"ل", name:"Lam",    sound:"l",     example:"لَيْل (layl) — night" },
  { letter:"م", name:"Mim",    sound:"m",     example:"مَاء (ma') — water" },
  { letter:"ن", name:"Nun",    sound:"n",     example:"نَجْم (najm) — star" },
  { letter:"ه", name:"Ha",     sound:"h",     example:"هِلَال (hilal) — crescent" },
  { letter:"و", name:"Waw",    sound:"w/uu",  example:"وَرْد (ward) — rose" },
  { letter:"ي", name:"Ya",     sound:"y/ii",  example:"يَد (yad) — hand" }
];

// ── New Muslim Lessons ───────────────────────────────────────
const NEW_MUSLIM_LESSONS = [
  {
    title: "The Shahada — Declaration of Faith",
    arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰه",
    transliteration: "Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan rasulullah",
    content: `The Shahada is the foundation of Islam. Its meaning: **"I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad (ﷺ) is the Messenger of Allah."**

**La ilaha illallah** — This means that we worship Allah alone, without any partners, idols, or intermediaries. Nothing deserves worship except Allah — not saints, prophets, angels, or anything in creation.

**Muhammadun rasulullah** — Muhammad ibn Abdullah (ﷺ) (born ~570 CE in Makkah) is the final Prophet and Messenger. He conveyed the Quran and showed us how to worship Allah through the Sunnah (his teachings and way of life).

**Evidence from Quran:**
- "So know that there is no deity worthy of worship except Allah." (Quran 47:19)
- "Muhammad is not the father of any of your men, but the Messenger of Allah and the seal of the prophets." (Quran 33:40)

**Evidence from Hadith:**
- The Prophet (ﷺ) said: "Islam is built on five: bearing witness that there is no deity worthy of worship except Allah and that Muhammad is His Messenger…" (Sahih Bukhari 8, Muslim 16)`,
  },
  {
    title: "The Five Pillars of Islam",
    arabic: "أَرْكَانُ الإِسْلَام الْخَمْسَة",
    transliteration: "Arkan al-Islam al-Khamsa",
    content: `The Five Pillars are the core practices every Muslim must observe. They are the framework of Muslim life.

**1. Shahada — Declaration of Faith**
"I bear witness that there is no deity worthy of worship except Allah, and that Muhammad (ﷺ) is His Messenger." (Bukhari 8)

**2. Salah — Prayer (5 times daily)**
Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), Isha (night). Prayer is a direct connection with Allah, performed facing the Qibla (Makkah). (Quran 2:43)

**3. Zakat — Obligatory Charity**
2.5% of savings held for one lunar year, if it exceeds the nisab threshold. It purifies wealth and helps the poor. (Quran 9:103)

**4. Sawm — Fasting in Ramadan**
Abstaining from food, drink, and intimate relations from Fajr to Maghrib during the month of Ramadan. (Quran 2:183)

**5. Hajj — Pilgrimage to Makkah**
Obligatory once in a lifetime for those physically and financially able. The annual gathering of millions of Muslims in unity. (Quran 3:97)`,
  },
  {
    title: "The Six Articles of Faith (Iman)",
    arabic: "أَرْكَانُ الإِيمَان السِّتَّة",
    transliteration: "Arkan al-Iman as-Sitta",
    content: `The Six Articles are what every Muslim must believe in the heart. They come from the famous Hadith of Jibril (Muslim 8).

**1. Belief in Allah**
The one true God, Creator of all, with perfect names and attributes. He has no partners, sons, or equals. (Quran 112:1-4)

**2. Belief in the Angels (Mala'ikah)**
Created from light, they worship Allah perfectly and never disobey. Jibril brought revelation, Mika'il brings provision, Israfil will blow the Trumpet. (Quran 2:285)

**3. Belief in the Divine Books (Kutub)**
The Tawrah (Torah), Zabur (Psalms), Injil (Gospel), and the Quran — which is the final, preserved Word of Allah. (Quran 2:285)

**4. Belief in the Prophets (Rusul)**
Allah sent 124,000 prophets, beginning with Adam (ﷺ) and ending with Muhammad (ﷺ). We love them all. (Quran 33:40)

**5. Belief in the Last Day (Yawm al-Qiyamah)**
Every soul will die, be resurrected, and stand before Allah for judgment. Then enter Jannah (Paradise) or Jahannam (Hellfire). (Quran 99:7-8)

**6. Belief in Divine Decree (Qadar)**
Everything — good and bad — is part of Allah's knowledge and plan. We trust in His wisdom. (Quran 54:49)`,
  },
  {
    title: "How to Perform Wudu (Ablution)",
    arabic: "كَيْفِيَّةُ الْوُضُوء",
    transliteration: "Kayfiyyat al-Wudu'",
    content: `Wudu is ritual purification required before Salah (prayer). It takes about 2 minutes.

**Steps (following the Sunnah):**

**1. Intention (Niyyah)**
In your heart, intend to perform wudu for the sake of Allah. No verbal statement required.

**2. Bismillah**
Say "Bismillah" (In the name of Allah) before beginning.

**3. Wash both hands** — 3 times, up to the wrists, rubbing between fingers.

**4. Rinse the mouth** — Take water into the mouth and swirl. 3 times.

**5. Rinse the nose** — Inhale water into the nose and blow out. 3 times.

**6. Wash the face** — From hairline to chin, ear to ear. 3 times.

**7. Wash both arms** — Right arm first, up to and including the elbows. 3 times each.

**8. Wipe the head (Masah)** — Wet hands pass over the head from front to back once. Then wipe both ears (inner with index fingers, outer with thumbs). 1 time.

**9. Wash both feet** — Right foot first, up to and including the ankles, between the toes. 3 times each.

**Dua after Wudu:** "Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan abduhu wa rasuluh. Allahumma ij'alni minat-tawwabin waj'alni minal-mutatahhirin." (Muslim 234)

**Wudu is broken by:** using the bathroom, passing wind, deep sleep, blood loss, unconsciousness, intimacy.`,
  },
  {
    title: "How to Perform Salah (Prayer)",
    arabic: "كَيْفِيَّةُ الصَّلَاة",
    transliteration: "Kayfiyyat as-Salah",
    content: `Salah is the second pillar of Islam — 5 daily prayers establishing direct communication with Allah.

**Before Prayer:** Wudu (ablution), clean clothing, pure place, face Qibla (direction of Kaaba in Makkah).

**The Prayer (demonstrated for 2-raka'ah Fajr):**

**1. Takbiratul Ihram** — Stand, raise hands to ears, say "Allahu Akbar" to begin.

**2. Qiyam (Standing)** — Recite Surah Al-Fatihah (obligatory). Then any other surah (e.g. Al-Ikhlas).

**3. Ruku (Bowing)** — Bow with back flat, say "Subhana Rabbiyal Adhim" (Glory to my Lord, the Magnificent) ×3.

**4. I'tidal (Rising from Ruku)** — Straighten up, say "Sami'allahu liman hamidah, Rabbana wa lakal-hamd."

**5. Sujud (Prostration)** — Go down, 7 body parts touch the ground (forehead+nose, 2 palms, 2 knees, 2 feet). Say "Subhana Rabbiyal A'la" ×3.

**6. Jalsah (Sitting between Prostrations)** — Sit briefly, say "Rabbigh-fir li" (My Lord forgive me).

**7. Second Sujud** — Repeat prostration.

**8. End of raka'ah** — Rise for second raka'ah and repeat from step 2.

**9. Tashahhud (Final Sitting)** — Recite the complete Tashahhud and Salat Ibrahimiyyah.

**10. Tasleem** — Turn head right, "Assalamu alaykum wa rahmatullah." Then left.

**Daily prayer times:** Fajr (2 raka'ah), Dhuhr (4), Asr (4), Maghrib (3), Isha (4).`,
  },
  {
    title: "The Tashahhud — Final Sitting",
    arabic: "التَّشَهُّد",
    transliteration: "At-Tashahhud",
    content: `The Tashahhud is recited in the final sitting of every prayer. It is one of the most important and frequently repeated prayers in a Muslim's life.

**The Tashahhud (Arabic):**

التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ

**Transliteration:**
At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu an la ilaha illallah wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.

**Translation:**
"All greetings, prayers and pure words are due to Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is His servant and Messenger."
*(Bukhari 831, Muslim 402)*

---

**The Salat al-Ibrahimiyyah (Durood):**

اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ

*Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammadin kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid.*

"O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim — You are the Most Praiseworthy, the Most Glorious. O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim — You are the Most Praiseworthy, the Most Glorious."
*(Bukhari 3370)*

---

**Dua Before Tasleem (Highly Recommended):**

اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ

*Allahumma inni a'udhu bika min 'adhabi jahannam, wa min 'adhabil-qabr, wa min fitnatil-mahya wal-mamat, wa min sharri fitnatil-masihid-dajjal.*

"O Allah, I seek refuge in You from the punishment of Hell, from the punishment of the grave, from the trials of life and death, and from the evil of the trial of the False Messiah."
*(Muslim 588 — the Prophet ﷺ commanded this to be said before tasleem)*

---

**Tips:**
- Raise the index finger of the right hand during the Tashahhud as a sign of Tawhid (monotheism). (Abu Dawud 989, Sahih)
- The Tashahhud is obligatory (wajib) in the final sitting; the Salat Ibrahimiyyah is a pillar (rukn) of prayer according to many scholars.
- The Companion Ibn Mas'ud ؓ narrated teaching the Tashahhud: "The Prophet ﷺ taught it to me as he would teach me a surah of the Quran." (Bukhari 6265)`,
  },
  {
    title: "Halal & Haram — Permissible & Prohibited",
    arabic: "الحَلَال وَالحَرَام",
    transliteration: "Al-Halal wal-Haram",
    content: `Islam provides clear guidance on what is permissible (halal) and prohibited (haram). These boundaries are a mercy from Allah to protect us.

**Prohibited Foods:**
- Pork and all its by-products (Quran 2:173)
- Alcohol and intoxicants (Quran 5:90)
- Blood (Quran 2:173)
- Animals not slaughtered in Allah's name
- Carnivorous animals with fangs, birds with talons (Bukhari 5527)

**Permissible:**
- All seafood (Quran 5:96)
- Fruits, vegetables, grains
- Animals slaughtered saying "Bismillah, Allahu Akbar"

**Financial Prohibitions:**
- Riba (interest/usury) — severely prohibited (Quran 2:275-276)
- Gambling and games of chance (Quran 5:90)
- Fraud, deception, theft

**Social Prohibitions:**
- Fornication and adultery (Quran 17:32)
- Backbiting (gheebah) and slander (Quran 49:12)
- Arrogance and pride (Bukhari 6114)
- Shirk (associating partners with Allah) — the greatest sin (Quran 4:48)

**The Principle:**
The Prophet (ﷺ) said: "The halal is clear and the haram is clear, and between them are doubtful matters. Whoever avoids them has protected his religion and his honor." (Bukhari 52, Muslim 1599)`,
  },
  {
    title: "Islamic Character & Akhlaq",
    arabic: "الأَخْلَاق الإِسْلَامِيَّة",
    transliteration: "Al-Akhlaq al-Islamiyyah",
    content: `The Prophet Muhammad (ﷺ) said: "I was sent only to perfect good character." (Ahmad 8952, Sahih)

**Core Character Traits of a Muslim:**

**1. Truthfulness (Sidq)**
"Indeed, truthfulness leads to righteousness, and righteousness leads to Paradise." (Bukhari 6094)

**2. Trustworthiness (Amanah)**
"There is no faith for one who has no trustworthiness." (Ahmad 12406, Hasan)

**3. Patience (Sabr)**
"No one has been given a gift better and more comprehensive than patience." (Bukhari 1469, Muslim 1053)

**4. Gratitude (Shukr)**
"Whoever is not grateful to people is not grateful to Allah." (Abu Dawud 4811, Hasan)

**5. Generosity (Karam)**
The Prophet (ﷺ) was "the most generous of all people." (Bukhari 3554)

**6. Humility (Tawadu)**
"Whoever humbles himself for the sake of Allah, Allah will raise him." (Muslim 2588)

**7. Kindness to Family (Silat ar-Rahim)**
"The best of you is the one who is best to his family." (Tirmidhi 3895, Sahih)

**8. Justice (Adl)**
"Be just — that is closer to piety." (Quran 5:8)

**Treating Others:**
The Prophet (ﷺ): "None of you truly believes until he loves for his brother what he loves for himself." (Bukhari 13)`,
  }
];

// ── Hajj & Umrah Guide ───────────────────────────────────────
const HAJJ_UMRAH = {
  umrah: [
    {
      step: 1,
      title: "Ihram",
      subtitle: "الإِحْرَام",
      content: "Perform a full body wash (ghusl), put on the white Ihram garments (men: 2 unsewn white cloths; women: modest clothing), pray 2 raka'ah, then make the intention (niyyah) for Umrah and recite the Talbiyah:",
      supplication: { arabic: "لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَك", transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk. Innal-hamda wan-ni'mata laka wal-mulk, la sharika lak", meaning: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Indeed all praise, grace, and sovereignty belong to You. You have no partner." },
      notes: "Avoid cutting hair/nails, using perfume, hunting, and intimate relations until Ihram is removed. Recite Talbiyah frequently."
    },
    {
      step: 2,
      title: "Tawaf",
      subtitle: "الطَّوَاف",
      content: "Upon entering Masjid al-Haram, perform Tawaf: walk counter-clockwise around the Ka'bah 7 complete circuits beginning and ending at the Black Stone (Hajar al-Aswad). Men: walk briskly for first 3 rounds (Ramal) with right shoulder exposed (Idtiba).",
      supplication: { arabic: "بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ — رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّار", transliteration: "Bismillah, Allahu Akbar — Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar", meaning: "In the name of Allah, Allah is the Greatest — Our Lord, give us good in this world and good in the Hereafter and save us from the punishment of Fire." },
      notes: "At Hajar al-Aswad: if possible, kiss or touch it; otherwise point toward it and say 'Allahu Akbar'. After Tawaf, pray 2 raka'ah near Maqam Ibrahim."
    },
    {
      step: 3,
      title: "Sa'i",
      subtitle: "السَّعْي",
      content: "Walk 7 times between the hills of Safa and Marwa, commemorating Hajar's (AS) search for water for her son Ismail (AS). Begin at Safa facing the Ka'bah. Men: jog between the green markers.",
      supplication: { arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ — اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ، اللّٰهُ أَكْبَرُ", transliteration: "Innas-safa wal-marwata min sha'a'irillah — Allahu Akbar, Allahu Akbar, Allahu Akbar", meaning: "Indeed Safa and Marwa are among the signs of Allah — Allah is the Greatest (×3)" },
      notes: "At Safa and Marwa: face the Qibla, raise hands in supplication and make du'a. Safa to Marwa = 1 circuit; 7 circuits ends at Marwa."
    },
    {
      step: 4,
      title: "Halq or Taqsir",
      subtitle: "الحَلْق أَوِ التَّقْصِير",
      content: "After completing Sa'i, men shave (Halq — preferred) or cut at least 2.5cm of hair (Taqsir). Women cut a small amount of hair (fingertip-length). This marks the end of Ihram.",
      supplication: { arabic: "اللّٰهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ", transliteration: "Allahumma-ghfir lil-muhalliqqin", meaning: "O Allah, forgive those who shave their heads." },
      notes: "The Prophet (ﷺ) made du'a 3 times for those who shave and once for those who cut hair (Bukhari 1727). Umrah is now complete — all Ihram restrictions are lifted."
    }
  ],
  hajj: [
    {
      step: 1,
      title: "8th Dhul Hijjah — Mina",
      subtitle: "يَوْم التَّرْوِيَة",
      content: "Put on Ihram, make intention for Hajj, and travel to Mina. Spend the day and night in Mina performing all 5 prayers (shortened but not combined). This is the Day of Tarwiyah (watering).",
      supplication: { arabic: "لَبَّيْكَ اللّٰهُمَّ حَجًّا", transliteration: "Labbayk Allahumma Hajjan", meaning: "Here I am O Allah, for Hajj." },
      notes: "Pray Dhuhr, Asr, Maghrib, Isha, and Fajr in Mina. Shorten 4-raka'ah prayers to 2 (Qasr) but do not combine them."
    },
    {
      step: 2,
      title: "9th Dhul Hijjah — Arafah",
      subtitle: "يَوْم عَرَفَة — The Pillar of Hajj",
      content: "After Fajr, proceed to Arafah. This is THE essential pillar of Hajj — the Prophet (ﷺ) said: 'Hajj is Arafah.' (Abu Dawud 1949, Sahih). Stand from Dhuhr time until sunset in supplication, dhikr, and prayer. Combine Dhuhr and Asr (shortened) at Dhuhr time.",
      supplication: { arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ala kulli shay'in qadir", meaning: "None has the right to be worshipped except Allah, alone, without partner. To Him belongs all dominion and praise, and He is over all things capable." },
      notes: "The best du'a is the du'a of Arafah. Face the Qibla, raise your hands, and make heartfelt supplication. Repeat this dhikr abundantly."
    },
    {
      step: 3,
      title: "Night of 9th/10th — Muzdalifah",
      subtitle: "الْمُزْدَلِفَة",
      content: "After sunset, depart Arafah calmly and travel to Muzdalifah. Combine Maghrib and Isha here (at Isha time). Collect 7+ pebbles (chickpea-sized) for stoning tomorrow. Sleep here and pray Fajr.",
      supplication: { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّار", transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar", meaning: "Our Lord, give us good in this world and good in the Hereafter and protect us from the punishment of Fire." },
      notes: "The elderly and weak may depart for Mina after midnight. Others depart after Fajr. Collect 49–70 pebbles total for all stoning days."
    },
    {
      step: 4,
      title: "10th — Stoning Jamarat (Aqabah)",
      subtitle: "رَمْي جَمْرَة الْعَقَبَة",
      content: "After reaching Mina on the 10th, stone only the large Jamarat (Jamrat al-Aqabah) with 7 pebbles, saying 'Allahu Akbar' with each throw. This commemorates Ibrahim's (AS) rejection of Shaytan.",
      supplication: { arabic: "اللّٰهُ أَكْبَر", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest (say with each of the 7 throws)" },
      notes: "Throw each pebble separately with force so it falls in the basin. After stoning Aqabah, the Talbiyah stops."
    },
    {
      step: 5,
      title: "10th — Sacrifice (Udhiyah/Hady)",
      subtitle: "ذَبْح الهَدْي",
      content: "Slaughter the sacrificial animal (or arrange for it). This commemorates Ibrahim's (AS) willingness to sacrifice his son Ismail (AS) and Allah's mercy in replacing it with a ram.",
      supplication: { arabic: "بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ، اللّٰهُمَّ هٰذَا مِنْكَ وَلَكَ", transliteration: "Bismillah, Allahu Akbar, Allahumma hadha minka wa lak", meaning: "In the name of Allah, Allah is the Greatest. O Allah, this is from You and for You." },
      notes: "After sacrifice: shave or cut hair to exit most of Ihram restrictions. Only intimate relations remain prohibited until Tawaf Ifadah."
    },
    {
      step: 6,
      title: "10th–12th — Tawaf al-Ifadah",
      subtitle: "طَوَاف الإِفَاضَة",
      content: "Perform Tawaf al-Ifadah (7 circuits around Ka'bah) — this is a pillar of Hajj. Then perform Sa'i between Safa and Marwa (if not done after Tawaf al-Qudum). This completes Ihram fully.",
      supplication: { arabic: "سُبْحَانَ اللّٰهِ، وَالْحَمْدُ لِلّٰهِ، وَلَا إِلٰهَ إِلَّا اللّٰهُ، وَاللّٰهُ أَكْبَر", transliteration: "Subhanallah, walhamdu lillah, wa la ilaha illallah, wallahu akbar", meaning: "Glory be to Allah, all praise is for Allah, none has the right to be worshipped except Allah, Allah is the Greatest." },
      notes: "Best done on 10th Dhul Hijjah, but valid through the days of Tashreeq. Return to Mina to spend the nights of 11th and 12th."
    },
    {
      step: 7,
      title: "11th–13th — Days of Tashreeq (Mina)",
      subtitle: "أَيَّام التَّشْرِيق",
      content: "Spend the nights in Mina. Each day (11th, 12th, 13th) stone all 3 Jamarat with 7 pebbles each after Dhuhr: small (Sughra), medium (Wusta), then large (Aqabah). Say Allahu Akbar with each throw.",
      supplication: { arabic: "اللّٰهُ أَكْبَرُ وَلِلّٰهِ الحَمْد", transliteration: "Allahu Akbar wa lillahil-hamd", meaning: "Allah is the Greatest and all praise belongs to Allah." },
      notes: "If leaving on the 12th (permitted), depart before sunset. If still in Mina at sunset, you must stone on the 13th as well. After the small and medium Jamarat, stand facing Qibla and make du'a."
    },
    {
      step: 8,
      title: "Tawaf al-Wada'",
      subtitle: "طَوَاف الوَدَاع — Farewell Tawaf",
      content: "The final act before leaving Makkah: perform Tawaf al-Wada' (7 circuits). The Prophet (ﷺ) said: 'Let the last thing anyone does be Tawaf of the House.' (Muslim 1327)",
      supplication: { arabic: "اللّٰهُمَّ إِنَّ هٰذَا البَيْتَ بَيْتُكَ، وَالعَبْدُ عَبْدُكَ، وَابْنُ عَبْدِكَ، حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ", transliteration: "Allahumma inna hadhal-bayta baytuk, wal-abdu abduk, wabnu abdik, hamaltani ala ma sakhkharta li min khalqik", meaning: "O Allah, this house is Your house, and the servant is Your servant and the son of Your servant. You carried me on what You subjected for me from Your creation." },
      notes: "After Farewell Tawaf, proceed directly to leave. Menstruating women are exempt from Tawaf al-Wada'. Hajj is complete — may Allah accept it as Hajj Mabrur!"
    }
  ]
};

// ── Short Surahs for Children's Quran ────────────────────────
const SHORT_SURAHS = [112, 113, 114, 103, 108, 110, 105, 109, 107, 106, 102, 101, 100, 99, 97, 93, 94, 95, 96];

// ── Hijri Calendar ───────────────────────────────────────────
const HIJRI_MONTHS = [
  'Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",
  "Jumada al-Awwal","Jumada al-Thani",'Rajab',"Sha'ban",
  'Ramadan','Shawwal',"Dhul Qa'dah",'Dhul Hijjah'
];

function toHijri(date) {
  const d = date.getDate(), m = date.getMonth() + 1;
  let y = date.getFullYear();
  if (m < 3) { y--; }
  const A = Math.floor(y / 100);
  const jd = Math.floor(365.25 * (y + 4716)) +
             Math.floor(30.6001 * ((m < 3 ? m + 12 : m) + 1)) +
             d + (2 - A + Math.floor(A / 4)) - 1524.5;
  let l = Math.floor(jd) - 1948438 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l) / 709);
  const hd = l - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  return { day: hd, month: hm, year: hy, monthName: HIJRI_MONTHS[hm - 1] };
}

// ── Ayatul Kursi ─────────────────────────────────────────────
const AYATUL_KURSI = {
  arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
  translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
  ref: "Quran 2:255"
};

// ── Islamic Key Dates ─────────────────────────────────────────
// ── Quran Thematic Categories ─────────────────────────────────
const QURAN_CATEGORIES = [
  {
    id: 'mercy', label: 'Mercy', icon: '💚', color: '#059669',
    verses: [
      {s:7,a:156},{s:39,a:53},{s:6,a:12},{s:21,a:107},
      {s:12,a:87},{s:6,a:54},{s:30,a:21},{s:17,a:24},
      {s:21,a:83},{s:57,a:28}
    ]
  },
  {
    id: 'patience', label: 'Patience', icon: '⚓', color: '#6366f1',
    verses: [
      {s:2,a:153},{s:2,a:155},{s:39,a:10},{s:16,a:127},
      {s:3,a:200},{s:70,a:5},{s:103,a:3},{s:13,a:24},
      {s:3,a:146},{s:8,a:46}
    ]
  },
  {
    id: 'gratitude', label: 'Gratitude', icon: '🌿', color: '#d97706',
    verses: [
      {s:14,a:7},{s:2,a:152},{s:31,a:12},{s:27,a:40},
      {s:16,a:114},{s:76,a:3},{s:17,a:3},
      {s:7,a:144},{s:34,a:13},{s:55,a:13}
    ]
  },
  {
    id: 'tawakkul', label: 'Trust in Allah', icon: '🕊️', color: '#0284c7',
    verses: [
      {s:3,a:159},{s:65,a:3},{s:9,a:51},{s:14,a:12},
      {s:25,a:58},{s:67,a:29},{s:8,a:2},
      {s:5,a:23},{s:33,a:3}
    ]
  },
  {
    id: 'forgiveness', label: 'Forgiveness', icon: '🌙', color: '#7c3aed',
    verses: [
      {s:39,a:53},{s:2,a:222},{s:4,a:110},{s:3,a:133},
      {s:66,a:8},{s:20,a:82},{s:71,a:10},{s:71,a:11},
      {s:71,a:12},{s:3,a:17},{s:57,a:21}
    ]
  },
  {
    id: 'paradise', label: 'Paradise', icon: '✨', color: '#db2777',
    verses: [
      {s:32,a:17},{s:9,a:72},{s:55,a:46},{s:50,a:35},
      {s:13,a:23},{s:76,a:12},{s:3,a:133},
      {s:3,a:15},{s:52,a:17},{s:56,a:15}
    ]
  },
  {
    id: 'dua', label: 'Dua', icon: '🤲', color: '#0f766e',
    verses: [
      {s:2,a:186},{s:40,a:60},{s:7,a:55},{s:27,a:62},
      {s:21,a:88},{s:3,a:38},{s:14,a:39},
      {s:2,a:201},{s:17,a:80},{s:3,a:8}
    ]
  },
  {
    id: 'family', label: 'Family', icon: '🏡', color: '#ea580c',
    verses: [
      {s:17,a:23},{s:31,a:14},{s:46,a:15},{s:4,a:1},
      {s:30,a:21},{s:16,a:72},{s:2,a:233},
      {s:25,a:74},{s:2,a:83}
    ]
  },
  {
    id: 'knowledge', label: 'Knowledge', icon: '📖', color: '#0f766e',
    verses: [
      {s:96,a:1},{s:96,a:4},{s:20,a:114},{s:2,a:269},
      {s:58,a:11},{s:39,a:9},{s:35,a:28},
      {s:29,a:43},{s:3,a:18}
    ]
  },
  {
    id: 'hardship', label: 'Tests & Hardship', icon: '🌊', color: '#475569',
    verses: [
      {s:2,a:286},{s:94,a:5},{s:94,a:6},{s:65,a:7},
      {s:3,a:139},{s:13,a:28},{s:2,a:45},
      {s:57,a:22},{s:29,a:2}
    ]
  },
  {
    id: 'justice', label: 'Justice', icon: '⚖️', color: '#92400e',
    verses: [
      {s:4,a:135},{s:5,a:8},{s:16,a:90},{s:4,a:58},
      {s:57,a:25},{s:55,a:9},{s:49,a:9},{s:7,a:29}
    ]
  },
  {
    id: 'rizq', label: 'Provision', icon: '🌾', color: '#15803d',
    verses: [
      {s:11,a:6},{s:65,a:3},{s:51,a:58},{s:34,a:39},
      {s:3,a:37},{s:2,a:261},{s:71,a:10},{s:71,a:11},{s:71,a:12}
    ]
  },
  {
    id: 'guidance', label: 'Guidance', icon: '🌟', color: '#b45309',
    verses: [
      {s:1,a:6},{s:2,a:2},{s:2,a:256},{s:24,a:35},
      {s:39,a:23},{s:16,a:9},{s:7,a:43},
      {s:6,a:153},{s:2,a:120}
    ]
  },
  {
    id: 'character', label: 'Character', icon: '💎', color: '#6d28d9',
    verses: [
      {s:68,a:4},{s:41,a:34},{s:16,a:90},{s:49,a:11},
      {s:49,a:13},{s:3,a:134},{s:25,a:63},
      {s:31,a:18},{s:31,a:19},{s:24,a:30}
    ]
  },
  {
    id: 'afterlife', label: 'Afterlife', icon: '🌌', color: '#334155',
    verses: [
      {s:3,a:185},{s:2,a:156},{s:67,a:2},{s:39,a:68},
      {s:56,a:60},{s:75,a:1},{s:99,a:7},
      {s:14,a:48},{s:82,a:1}
    ]
  },
];

const ISLAMIC_DATES = [
  { month: 1,  day: 1,  name: 'Islamic New Year' },
  { month: 1,  day: 10, name: 'Ashura' },
  { month: 3,  day: 12, name: "Mawlid al-Nabi \uFDFA" },
  { month: 7,  day: 27, name: "Isra wal-Mi'raj" },
  { month: 8,  day: 15, name: "Laylat al-Bara'ah" },
  { month: 9,  day: 1,  name: 'Start of Ramadan' },
  { month: 9,  day: 27, name: "Laylat al-Qadr" },
  { month: 10, day: 1,  name: 'Eid ul-Fitr' },
  { month: 12, day: 9,  name: 'Day of Arafah' },
  { month: 12, day: 10, name: 'Eid ul-Adha' },
];
