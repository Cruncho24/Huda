// HUDA — Complete Islamic Companion App
// All features: Quran, Prayer, Dhikr, Duas, 99 Names, New Muslim Guide,
//               Children's Quran, Hajj Guide, Zakat Calculator
//
// Install before running:
//   npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
//   npm install react-native-screens react-native-safe-area-context
//   npx expo install expo-location react-dom react-native-web
//
// Run: npx expo start --web

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as Adhan from 'adhan';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const C = {
  emerald:'#059669', emerald2:'#10B981', emerald3:'#D1FAE5', emerald4:'#ECFDF5',
  white:'#FFFFFF', offwhite:'#F9FAFB', gray1:'#F3F4F6', gray2:'#E5E7EB', gray3:'#9CA3AF',
  text:'#111827', text2:'#374151', text3:'#6B7280',
  gold:'#D97706', gold2:'#FCD34D', gold3:'#FEF3C7',
};

function formatTime(d) {
  if (!d) return '--:--';
  let h = d.getHours(); const m = d.getMinutes().toString().padStart(2,'0');
  const ap = h>=12?'PM':'AM'; h = h%12||12; return `${h}:${m} ${ap}`;
}
function getCountdown(t) {
  if (!t) return ''; const diff = t - new Date(); if (diff<=0) return 'Now';
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  return h>0?`${h}h ${m}m`:m>0?`${m}m ${s}s`:`${s}s`;
}
function getQibla(lat,lon) {
  const kLat=21.4225*Math.PI/180, kLon=39.8262*Math.PI/180, uLat=lat*Math.PI/180;
  const dLon=kLon-lon*Math.PI/180;
  const y=Math.sin(dLon)*Math.cos(kLat), x=Math.cos(uLat)*Math.sin(kLat)-Math.sin(uLat)*Math.cos(kLat)*Math.cos(dLon);
  return Math.round((Math.atan2(y,x)*180/Math.PI+360)%360);
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const HADITHS = [
  {text:'"The best of you are those who learn the Quran and teach it."',source:'Sahih al-Bukhari 5027'},
  {text:'"None truly believes until he loves for his brother what he loves for himself."',source:'Sahih al-Bukhari 13'},
  {text:'"The strong person controls himself when angry."',source:'Sahih al-Bukhari 6114'},
  {text:'"A good word is charity."',source:'Sahih Muslim 1009'},
  {text:'"Smiling at your brother is an act of charity."',source:'Tirmidhi 1956 — Sahih'},
  {text:'"Make things easy and do not make them difficult."',source:'Sahih al-Bukhari 69'},
  {text:'"He who shows no mercy will not be shown mercy."',source:'Sahih al-Bukhari 6013'},
  {text:'"Whoever removes a hardship from a believer, Allah removes one of his hardships on Judgement Day."',source:'Sahih Muslim 2699'},
  {text:'"Do not belittle any good deed, even greeting your brother with a cheerful face."',source:'Sahih Muslim 2626'},
  {text:'"Pay the worker his wages before his sweat dries."',source:'Ibn Majah 2443 — Sahih'},
];

const SURAHS = [
  {n:1,ar:'الفاتحة',en:'Al-Fatihah',v:7,type:'Meccan',meaning:'The Opening'},
  {n:2,ar:'البقرة',en:'Al-Baqarah',v:286,type:'Medinan',meaning:'The Cow'},
  {n:3,ar:'آل عمران',en:'Ali Imran',v:200,type:'Medinan',meaning:'Family of Imran'},
  {n:4,ar:'النساء',en:'An-Nisa',v:176,type:'Medinan',meaning:'The Women'},
  {n:5,ar:'المائدة',en:'Al-Maidah',v:120,type:'Medinan',meaning:'The Table'},
  {n:18,ar:'الكهف',en:'Al-Kahf',v:110,type:'Meccan',meaning:'The Cave'},
  {n:36,ar:'يس',en:'Ya-Sin',v:83,type:'Meccan',meaning:'Ya Sin'},
  {n:55,ar:'الرحمن',en:'Ar-Rahman',v:78,type:'Medinan',meaning:'The Most Merciful'},
  {n:67,ar:'الملك',en:'Al-Mulk',v:30,type:'Meccan',meaning:'The Sovereignty'},
  {n:112,ar:'الإخلاص',en:'Al-Ikhlas',v:4,type:'Meccan',meaning:'Sincerity'},
  {n:113,ar:'الفلق',en:'Al-Falaq',v:5,type:'Meccan',meaning:'The Daybreak'},
  {n:114,ar:'الناس',en:'An-Nas',v:6,type:'Meccan',meaning:'Mankind'},
];

const AYAHS = {
  1:[
    {ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',en:'In the name of Allah, the Entirely Merciful, the Especially Merciful.'},
    {ar:'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',en:'All praise is for Allah, Lord of all worlds.'},
    {ar:'الرَّحْمَٰنِ الرَّحِيمِ',en:'The Entirely Merciful, the Especially Merciful.'},
    {ar:'مَالِكِ يَوْمِ الدِّينِ',en:'Sovereign of the Day of Recompense.'},
    {ar:'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',en:'It is You we worship and You we ask for help.'},
    {ar:'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',en:'Guide us to the straight path.'},
    {ar:'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',en:'The path of those upon whom You have bestowed favour, not of those who have evoked anger or gone astray.'},
  ],
  112:[
    {ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',en:'In the name of Allah, the Entirely Merciful, the Especially Merciful.'},
    {ar:'قُلْ هُوَ اللَّهُ أَحَدٌ',en:'Say: He is Allah, the One.'},
    {ar:'اللَّهُ الصَّمَدُ',en:'Allah, the Eternal Refuge.'},
    {ar:'لَمْ يَلِدْ وَلَمْ يُولَدْ',en:'He neither begets nor is born.'},
    {ar:'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',en:'Nor is there to Him any equivalent.'},
  ],
  113:[
    {ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',en:'In the name of Allah, the Entirely Merciful, the Especially Merciful.'},
    {ar:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',en:'Say: I seek refuge in the Lord of daybreak.'},
    {ar:'مِن شَرِّ مَا خَلَقَ',en:'From the evil of that which He created.'},
    {ar:'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',en:'And from the evil of darkness when it settles.'},
    {ar:'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',en:'And from the evil of the blowers in knots.'},
    {ar:'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',en:'And from the evil of an envier when he envies.'},
  ],
  114:[
    {ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',en:'In the name of Allah, the Entirely Merciful, the Especially Merciful.'},
    {ar:'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',en:'Say: I seek refuge in the Lord of mankind.'},
    {ar:'مَلِكِ النَّاسِ',en:'The Sovereign of mankind.'},
    {ar:'إِلَٰهِ النَّاسِ',en:'The God of mankind.'},
    {ar:'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',en:'From the evil of the retreating whisperer.'},
    {ar:'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',en:'Who whispers in the breasts of mankind.'},
    {ar:'مِنَ الْجِنَّةِ وَالنَّاسِ',en:'From among the jinn and mankind.'},
  ],
};

const NAMES = [
  {n:1,ar:'الرَّحْمَنُ',tr:'Ar-Rahman',en:'The Most Gracious',source:'Quran 1:3'},
  {n:2,ar:'الرَّحِيمُ',tr:'Ar-Raheem',en:'The Most Merciful',source:'Quran 1:3'},
  {n:3,ar:'الْمَلِكُ',tr:'Al-Malik',en:'The King',source:'Quran 59:23'},
  {n:4,ar:'الْقُدُّوسُ',tr:'Al-Quddus',en:'The Most Holy',source:'Quran 59:23'},
  {n:5,ar:'السَّلَامُ',tr:'As-Salam',en:'The Source of Peace',source:'Quran 59:23'},
  {n:6,ar:'الْمُؤْمِنُ',tr:"Al-Mu'min",en:'The Guardian of Faith',source:'Quran 59:23'},
  {n:7,ar:'الْمُهَيْمِنُ',tr:'Al-Muhaymin',en:'The Protector',source:'Quran 59:23'},
  {n:8,ar:'الْعَزِيزُ',tr:"Al-'Aziz",en:'The Almighty',source:'Quran 59:23'},
  {n:9,ar:'الْجَبَّارُ',tr:'Al-Jabbar',en:'The Compeller',source:'Quran 59:23'},
  {n:10,ar:'الْمُتَكَبِّرُ',tr:'Al-Mutakabbir',en:'The Supreme',source:'Quran 59:23'},
  {n:11,ar:'الْخَالِقُ',tr:'Al-Khaliq',en:'The Creator',source:'Quran 59:24'},
  {n:12,ar:'الْبَارِئُ',tr:"Al-Bari'",en:'The Originator',source:'Quran 59:24'},
  {n:13,ar:'الْمُصَوِّرُ',tr:'Al-Musawwir',en:'The Fashioner',source:'Quran 59:24'},
  {n:14,ar:'الْغَفَّارُ',tr:'Al-Ghaffar',en:'The Forgiving',source:'Quran 20:82'},
  {n:15,ar:'الْقَهَّارُ',tr:'Al-Qahhar',en:'The Subduer',source:'Quran 13:16'},
  {n:16,ar:'الْوَهَّابُ',tr:'Al-Wahhab',en:'The Bestower',source:'Quran 3:8'},
  {n:17,ar:'الرَّزَّاقُ',tr:'Ar-Razzaq',en:'The Provider',source:'Quran 51:58'},
  {n:18,ar:'الْفَتَّاحُ',tr:'Al-Fattah',en:'The Opener',source:'Quran 34:26'},
  {n:19,ar:'الْعَلِيمُ',tr:"Al-'Alim",en:'The All-Knowing',source:'Quran 2:158'},
  {n:20,ar:'الْقَابِضُ',tr:'Al-Qabid',en:'The Withholder',source:'Quran 2:245'},
  {n:21,ar:'الْبَاسِطُ',tr:'Al-Basit',en:'The Extender',source:'Quran 2:245'},
  {n:26,ar:'السَّمِيعُ',tr:"As-Sami'",en:'The All-Hearing',source:'Quran 2:127'},
  {n:27,ar:'الْبَصِيرُ',tr:'Al-Basir',en:'The All-Seeing',source:'Quran 4:58'},
  {n:30,ar:'اللَّطِيفُ',tr:'Al-Latif',en:'The Subtle One',source:'Quran 6:103'},
  {n:31,ar:'الْخَبِيرُ',tr:'Al-Khabir',en:'The All-Aware',source:'Quran 6:18'},
  {n:33,ar:'الْعَظِيمُ',tr:"Al-'Azim",en:'The Magnificent',source:'Quran 2:255'},
  {n:34,ar:'الْغَفُورُ',tr:'Al-Ghafur',en:'The All-Forgiving',source:'Quran 2:173'},
  {n:36,ar:'الْعَلِيُّ',tr:"Al-'Aliyy",en:'The Most High',source:'Quran 2:255'},
  {n:40,ar:'الْحَسِيبُ',tr:'Al-Hasib',en:'The Reckoner',source:'Quran 4:6'},
  {n:42,ar:'الْكَرِيمُ',tr:'Al-Karim',en:'The Most Generous',source:'Quran 27:40'},
  {n:43,ar:'الرَّقِيبُ',tr:'Ar-Raqib',en:'The Watchful',source:'Quran 4:1'},
  {n:46,ar:'الْحَكِيمُ',tr:'Al-Hakim',en:'The All-Wise',source:'Quran 2:129'},
  {n:47,ar:'الْوَدُودُ',tr:'Al-Wadud',en:'The Loving',source:'Quran 11:90'},
  {n:52,ar:'الْوَكِيلُ',tr:'Al-Wakil',en:'The Trustee',source:'Quran 3:173'},
  {n:56,ar:'الْحَمِيدُ',tr:'Al-Hamid',en:'The Praiseworthy',source:'Quran 2:267'},
  {n:62,ar:'الْحَيُّ',tr:'Al-Hayy',en:'The Ever-Living',source:'Quran 2:255'},
  {n:63,ar:'الْقَيُّومُ',tr:'Al-Qayyum',en:'The Self-Subsisting',source:'Quran 2:255'},
  {n:66,ar:'الْوَاحِدُ',tr:'Al-Wahid',en:'The One',source:'Quran 13:16'},
  {n:67,ar:'الأَحَدُ',tr:'Al-Ahad',en:'The Unique',source:'Quran 112:1'},
  {n:68,ar:'الصَّمَدُ',tr:'As-Samad',en:'The Eternal',source:'Quran 112:2'},
  {n:73,ar:'الأَوَّلُ',tr:'Al-Awwal',en:'The First',source:'Quran 57:3'},
  {n:74,ar:'الآخِرُ',tr:'Al-Akhir',en:'The Last',source:'Quran 57:3'},
  {n:75,ar:'الظَّاهِرُ',tr:'Az-Zahir',en:'The Manifest',source:'Quran 57:3'},
  {n:76,ar:'الْبَاطِنُ',tr:'Al-Batin',en:'The Hidden',source:'Quran 57:3'},
  {n:80,ar:'التَّوَّابُ',tr:'At-Tawwab',en:'The Acceptor of Repentance',source:'Quran 2:128'},
  {n:82,ar:'الْعَفُوُّ',tr:"Al-'Afuww",en:'The Pardoner',source:'Quran 4:99'},
  {n:83,ar:'الرَّؤُوفُ',tr:"Ar-Ra'uf",en:'The Compassionate',source:'Quran 3:30'},
  {n:88,ar:'الْغَنِيُّ',tr:'Al-Ghani',en:'The Self-Sufficient',source:'Quran 3:97'},
  {n:93,ar:'النُّورُ',tr:'An-Nur',en:'The Light',source:'Quran 24:35'},
  {n:94,ar:'الْهَادِي',tr:'Al-Hadi',en:'The Guide',source:'Quran 22:54'},
  {n:99,ar:'الصَّبُورُ',tr:'As-Sabur',en:'The Patient',source:'Hadith — Sahih'},
];

const DUAS = {
  'Morning & Evening':[
    {ar:'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',tr:'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur.',en:'O Allah, by You we enter the morning and evening, by You we live and die, and to You is the resurrection.',source:'Abu Dawud 5068 — Sahih'},
    {ar:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',tr:"A'udhu bikalimatillahit-tammati min sharri ma khalaq.",en:'I seek refuge in the perfect words of Allah from the evil of what He created.',source:'Sahih Muslim 2708'},
    {ar:'اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي',tr:"Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari.",en:'O Allah, grant me health in my body, hearing, and sight.',source:'Abu Dawud 5090 — Sahih'},
  ],
  'Before Eating':[
    {ar:'بِسْمِ اللَّهِ',tr:'Bismillah.',en:'In the name of Allah.',source:'Abu Dawud 3767 — Sahih'},
    {ar:'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',tr:'Allahumma barik lana fima razaqtana wa qina adhaban-nar.',en:'O Allah, bless what You provided us and protect us from the Fire.',source:'Ibn al-Sunni 459 — Hasan'},
  ],
  'Before Sleeping':[
    {ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',tr:'Bismika Allahumma amutu wa ahya.',en:'In Your name O Allah, I die and I live.',source:'Sahih al-Bukhari 6324'},
    {ar:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',tr:"Allahumma qini 'adhabaka yawma tab'athu 'ibadak.",en:'O Allah, protect me from Your punishment on the Day of Resurrection.',source:'Abu Dawud 5045 — Sahih'},
  ],
  'For Anxiety & Distress':[
    {ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',tr:"Hasbunallahu wa ni'mal wakil.",en:'Allah is sufficient for us and He is the best disposer of affairs.',source:'Sahih al-Bukhari 4563'},
    {ar:'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',tr:'La ilaha illa anta subhanaka inni kuntu minaz-zalimin.',en:'There is no deity except You; exalted are You. Indeed I have been of the wrongdoers.',source:'Tirmidhi 3505 — Sahih'},
    {ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحُزْنِ',tr:"Allahumma inni a'udhu bika minal-hammi wal-huzn.",en:'O Allah, I seek refuge in You from worry and grief.',source:'Sahih al-Bukhari 6369'},
  ],
  'After Prayer':[
    {ar:'أَسْتَغْفِرُ اللَّهَ × ٣',tr:'Astaghfirullah (x3)',en:'I seek forgiveness from Allah. (3 times)',source:'Sahih Muslim 591'},
    {ar:'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',tr:"Allahumma antas-salamu wa minkas-salamu tabarakta ya dhal-jalali wal-ikram.",en:'O Allah, You are As-Salam and from You is peace. Blessed are You, O Owner of Majesty and Honour.',source:'Sahih Muslim 591'},
    {ar:'سُبْحَانَ اللَّهِ ٣٣ · الْحَمْدُ لِلَّهِ ٣٣ · اللَّهُ أَكْبَرُ ٣٣',tr:'SubhanAllah x33 · Alhamdulillah x33 · Allahu Akbar x33',en:'Glory be to Allah 33 times, Praise be to Allah 33 times, Allah is Greatest 33 times.',source:'Sahih Muslim 597'},
  ],
  'Entering the Masjid':[
    {ar:'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',tr:"Allahummaf-tah li abwaba rahmatik.",en:'O Allah, open the gates of Your mercy for me.',source:'Sahih Muslim 713'},
  ],
};

const DHIKR_LIST = [
  {ar:'سُبْحَانَ اللَّهِ',en:'SubhanAllah',meaning:'Glory be to Allah',target:33,source:'Sahih Muslim 597'},
  {ar:'الْحَمْدُ لِلَّهِ',en:'Alhamdulillah',meaning:'All praise is for Allah',target:33,source:'Sahih Muslim 597'},
  {ar:'اللَّهُ أَكْبَرُ',en:'Allahu Akbar',meaning:'Allah is the Greatest',target:33,source:'Sahih Muslim 597'},
  {ar:'لَا إِلَهَ إِلَّا اللَّهُ',en:'La ilaha illallah',meaning:'None worthy of worship but Allah',target:100,source:'Sahih Muslim 2691'},
  {ar:'أَسْتَغْفِرُ اللَّهَ',en:'Astaghfirullah',meaning:'I seek forgiveness from Allah',target:100,source:'Sahih Muslim 2702'},
  {ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',en:'SubhanAllahi wa bihamdih',meaning:'Glory and praise be to Allah',target:100,source:'Sahih al-Bukhari 6405'},
];

const NEW_MUSLIM = [
  {title:'The Shahada',ar:'الشَّهَادَة',icon:'☝️',
   content:`The Shahada is the foundation of Islam:\n\n"Ashhadu an la ilaha illallah wa ashhadu anna Muhammadan rasulullah"\n\n"I bear witness that there is no god worthy of worship except Allah, and I bear witness that Muhammad ﷺ is His messenger."\n\nThis contains two parts:\n• Tawhid — the absolute oneness of Allah\n• Risalah — Muhammad ﷺ is the final messenger\n\nThe Shahada requires belief in the heart, utterance with the tongue, and actions with the limbs.`,
   source:'Sahih al-Bukhari 8, Sahih Muslim 16'},
  {title:'The Five Pillars',ar:'أَرْكَانُ الإِسْلَام',icon:'🕌',
   content:`Islam is built upon five pillars (Sahih al-Bukhari 8):\n\n1. SHAHADA — Declaration of faith\n\n2. SALAH — Five daily prayers at their prescribed times\n\n3. ZAKAH — 2.5% of eligible wealth given annually to those in need\n\n4. SAWM — Fasting the month of Ramadan from dawn to sunset\n\n5. HAJJ — Pilgrimage to Makkah once in a lifetime for those who are able`,
   source:'Sahih al-Bukhari 8'},
  {title:'The Six Articles of Faith',ar:'أَرْكَانُ الإِيمَان',icon:'💚',
   content:`A Muslim must believe in six things (Sahih Muslim 8 — Hadith of Jibril):\n\n1. ALLAH — Belief in the One God with no partners\n\n2. THE ANGELS — Created from light, they worship Allah constantly\n\n3. THE BOOKS — Torah, Injil, Psalms, and the Quran (the final preserved scripture)\n\n4. THE PROPHETS — All prophets from Adam to Muhammad ﷺ (the final prophet)\n\n5. THE LAST DAY — Day of Judgement, resurrection, heaven and hell\n\n6. DIVINE DECREE — Allah has knowledge and control of all things`,
   source:'Sahih Muslim 8'},
  {title:'How to Perform Wudu',ar:'الوُضُوء',icon:'💧',
   content:`Wudu (ablution) is required before prayer (Quran 5:6):\n\n1. Make intention in your heart\n2. Say Bismillah\n3. Wash both hands to wrists (x3)\n4. Rinse mouth (x3)\n5. Sniff water into nose and blow out (x3)\n6. Wash face from hairline to chin (x3)\n7. Wash right arm to elbow (x3), then left (x3)\n8. Wipe head — front to back and back (x1)\n9. Wipe inside and behind both ears (x1)\n10. Wash right foot to ankle (x3), then left (x3)\n\nWudu is broken by: using the toilet, passing wind, deep sleep, or loss of consciousness.`,
   source:'Quran 5:6 · Sahih al-Bukhari 164'},
  {title:'How to Perform Salah',ar:'الصَّلَاة',icon:'🙏',
   content:`The five daily prayers: Fajr (2), Dhuhr (4), Asr (4), Maghrib (3), Isha (4) rak\'ahs.\n\nBasic structure of each rak\'ah:\n1. Stand facing Qibla\n2. Takbir: "Allahu Akbar" (hands to earlobes)\n3. Recite Al-Fatihah (obligatory in every rak\'ah)\n4. Recite another surah\n5. Bow (Ruku): "SubhanAllahi Rabbil Adheem" x3\n6. Rise: "Sami\'Allahu liman hamidah, Rabbana lakal hamd"\n7. Prostrate (Sujud): "SubhanAllahi Rabbil A\'la" x3\n8. Sit briefly\n9. Prostrate again x3\n10. Final rak\'ah: sit for Tashahhud and Salawat\n11. Tasleem: "As-salamu alaykum wa rahmatullah" right then left`,
   source:'Quran 2:238 · Sahih al-Bukhari 631'},
  {title:'Islamic Character',ar:'الأَخْلَاق',icon:'⭐',
   content:`"I was sent only to perfect good character." — Al-Muwatta 2:75 (Sahih)\n\nCore character traits:\n\nHONESTY — "Truthfulness leads to righteousness." Sahih al-Bukhari 6094\n\nKINDNESS — "Allah loves kindness in all matters." Sahih al-Bukhari 6927\n\nPATIENCE — "No one has been given a better gift than patience." Sahih al-Bukhari 1469\n\nHUMILITY — "Be humble toward one another." Sahih Muslim 2865\n\nGENEROSITY — "The generous person is close to Allah." Tirmidhi 1961 (Sahih)\n\nFORGIVENESS — "Whoever forgives, Allah will forgive him." Quran 24:22`,
   source:'Various authenticated sources'},
];

const LETTERS = [
  {l:'ا',n:'Alif',s:'a/aa',e:'أَسَد (Lion)'},{l:'ب',n:'Ba',s:'b',e:'بَيت (House)'},
  {l:'ت',n:'Ta',s:'t',e:'تُفَّاح (Apple)'},{l:'ث',n:'Tha',s:'th',e:'ثَعْلَب (Fox)'},
  {l:'ج',n:'Jeem',s:'j',e:'جَمَل (Camel)'},{l:'ح',n:'Ha',s:'h (deep)',e:'حِمَار (Donkey)'},
  {l:'خ',n:'Kha',s:'kh',e:'خُبز (Bread)'},{l:'د',n:'Dal',s:'d',e:'دُبّ (Bear)'},
  {l:'ذ',n:'Dhal',s:'dh',e:'ذِئب (Wolf)'},{l:'ر',n:'Ra',s:'r',e:'رَجُل (Man)'},
  {l:'ز',n:'Zay',s:'z',e:'زَهرة (Flower)'},{l:'س',n:'Seen',s:'s',e:'سَمَكة (Fish)'},
  {l:'ش',n:'Sheen',s:'sh',e:'شَجَرة (Tree)'},{l:'ص',n:'Sad',s:'s (emphatic)',e:'صَقر (Falcon)'},
  {l:'ض',n:'Dad',s:'d (emphatic)',e:'ضِفدع (Frog)'},{l:'ط',n:'Ta',s:'t (emphatic)',e:'طَاوُوس (Peacock)'},
  {l:'ظ',n:'Dha',s:'dh (emphatic)',e:'ظَبي (Gazelle)'},{l:'ع',n:'Ayn',s:"' (deep)",e:'عَسَل (Honey)'},
  {l:'غ',n:'Ghayn',s:'gh',e:'غَزَال (Deer)'},{l:'ف',n:'Fa',s:'f',e:'فِيل (Elephant)'},
  {l:'ق',n:'Qaf',s:'q (deep)',e:'قِطّ (Cat)'},{l:'ك',n:'Kaf',s:'k',e:'كِتَاب (Book)'},
  {l:'ل',n:'Lam',s:'l',e:'لَيث (Lion)'},{l:'م',n:'Meem',s:'m',e:'مَاء (Water)'},
  {l:'ن',n:'Noon',s:'n',e:'نَجمة (Star)'},{l:'ه',n:'Ha',s:'h',e:'هِلَال (Crescent)'},
  {l:'و',n:'Waw',s:'w/oo',e:'وَرد (Rose)'},{l:'ي',n:'Ya',s:'y/ee',e:'يَد (Hand)'},
];

const HAJJ = [
  {step:1,title:'Enter Ihram',ar:'الإحرام',icon:'👕',type:'umrah',desc:"Make intention and enter Ihram at the Miqat. Men wear two white unstitched cloths. Women wear modest regular clothing. Recite the Talbiyah: 'Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.'",source:'Sahih al-Bukhari 1514'},
  {step:2,title:'Tawaf',ar:'الطَّوَاف',icon:'🕋',type:'umrah',desc:'Perform 7 circuits around the Kaaba counter-clockwise, starting and ending at the Black Stone. Men perform Raml (brisk walk) in the first 3 circuits. Touch or gesture to the Black Stone at each circuit start.',source:'Sahih al-Bukhari 1616'},
  {step:3,title:"Sa'i",ar:'السَّعي',icon:'🏃',type:'umrah',desc:"Walk 7 times between Safa and Marwa, starting at Safa. This commemorates Hajar's search for water for her son Ismail (peace be upon them). Men run in the marked green section between the two hills.",source:'Sahih al-Bukhari 1643'},
  {step:4,title:'Halq or Taqsir',ar:'الحلق أو التقصير',icon:'✂️',type:'umrah',desc:"Men shave the head (Halq — superior) or shorten hair all over (Taqsir). Women cut a fingertip-length from their hair. This completes Umrah and releases you from Ihram restrictions.",source:'Sahih al-Bukhari 1728'},
  {step:5,title:'8th Dhul Hijjah — Mina',ar:'يوم التروية',icon:'⛺',type:'hajj',desc:"Re-enter Ihram on 8 Dhul Hijjah. Travel to Mina. Spend the night there. Pray Dhuhr, Asr, Maghrib, Isha and next day's Fajr in Mina, shortening 4-rak'ah prayers to 2 without combining.",source:'Sahih Muslim 1218'},
  {step:6,title:'Stand at Arafah',ar:'الوقوف بعرفة',icon:'🌄',type:'hajj',desc:"THE MOST ESSENTIAL PILLAR OF HAJJ. Travel to Arafah after sunrise on 9 Dhul Hijjah. Stand in supplication from after Dhuhr until sunset. Make abundant dua — this is the peak of Hajj. The Prophet ﷺ said: 'Hajj is Arafah.' Abu Dawud 1949",source:'Abu Dawud 1949 — Sahih'},
  {step:7,title:'Muzdalifah',ar:'الْمُزْدَلِفَة',icon:'🌙',type:'hajj',desc:"After sunset on 9th, travel to Muzdalifah. Pray Maghrib and Isha combined. Collect 49 or 70 pebbles for the Jamarat. Spend the night. Pray Fajr early and make dua facing Qibla until it brightens.",source:'Sahih Muslim 1218'},
  {step:8,title:'Rami — Stoning',ar:'رَمي الجَمَرَات',icon:'🪨',type:'hajj',desc:"On 10th Dhul Hijjah (Eid al-Adha), stone only the large Jamarah (Aqabah) with 7 pebbles, saying 'Allahu Akbar' with each throw. Do NOT stone all three on this day.",source:'Sahih al-Bukhari 1751'},
  {step:9,title:'Sacrifice',ar:'الهَدي',icon:'🐑',type:'hajj',desc:"Slaughter a sacrificial animal or arrange it officially. This commemorates Ibrahim's willingness to sacrifice his son. Most pilgrims arrange this through official channels in Makkah.",source:'Quran 22:36 · Sahih al-Bukhari 1707'},
  {step:10,title:'Tawaf al-Ifadah',ar:'طَوَاف الإِفَاضَة',icon:'🕋',type:'hajj',desc:"Return to Makkah and perform 7 circuits of Tawaf. This is an essential pillar of Hajj. Then perform Sa'i again. This completes the major Hajj rites.",source:'Quran 22:29 · Sahih al-Bukhari 1732'},
  {step:11,title:'Days of Tashreeq',ar:'أَيَّام التَّشْرِيق',icon:'📅',type:'hajj',desc:"11th, 12th (and 13th if you stay) Dhul Hijjah: remain in Mina. Stone all three Jamarat each day with 7 pebbles each, after midday. You may leave after the 12th if you depart before sunset.",source:'Quran 2:203'},
  {step:12,title:'Tawaf al-Wada',ar:'طَوَاف الوَدَاع',icon:'👋',type:'hajj',desc:"The farewell Tawaf — the last act before leaving Makkah. Perform 7 circuits. Obligatory for all pilgrims except menstruating women according to the majority of scholars.",source:'Sahih al-Bukhari 1755'},
];

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen() {
  const now = new Date();
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = HADITHS[now.getDate() % HADITHS.length];
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroAr}>السَّلَامُ عَلَيْكُمْ</Text>
        <Text style={s.heroSub}>Peace be upon you</Text>
        <Text style={s.heroDate}>{DAYS[now.getDay()]} · {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
      </View>
      <View style={s.hadithCard}>
        <Text style={s.hadithLbl}>✦  Hadith of the Day</Text>
        <Text style={s.hadithTxt}>{h.text}</Text>
        <Text style={s.hadithSrc}>— {h.source}</Text>
      </View>
      <Text style={s.secTitle}>Features</Text>
      <View style={s.grid}>
        {[{icon:'📖',ar:'القرآن',en:'Quran'},{icon:'🕌',ar:'الصلاة',en:'Prayer'},{icon:'📿',ar:'الذكر',en:'Dhikr'},{icon:'🤲',ar:'الأدعية',en:'Duas'},{icon:'📚',ar:'تعلّم',en:'Learn'},{icon:'⚖️',ar:'الزكاة',en:'Zakat'}].map(i=>(
          <View key={i.en} style={s.gridCard}>
            <Text style={s.gridIcon}>{i.icon}</Text>
            <Text style={s.gridAr}>{i.ar}</Text>
            <Text style={s.gridEn}>{i.en}</Text>
          </View>
        ))}
      </View>
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── QURAN ─────────────────────────────────────────────────────────────────────
function QuranListScreen({navigation}) {
  const [q,setQ]=useState('');
  const f=SURAHS.filter(s=>s.en.toLowerCase().includes(q.toLowerCase())||s.ar.includes(q)||s.n.toString()===q);
  return (
    <View style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>القرآن الكريم</Text><Text style={s.pageHdrEn}>The Noble Quran · Saheeh International</Text></View>
      <View style={{padding:12}}><TextInput style={s.searchIn} placeholder="Search surah..." value={q} onChangeText={setQ} placeholderTextColor={C.gray3}/></View>
      <FlatList data={f} keyExtractor={i=>i.n.toString()} renderItem={({item:i})=>(
        <TouchableOpacity style={s.row} onPress={()=>navigation.navigate('Surah',{surah:i})}>
          <View style={s.numBadge}><Text style={s.numTxt}>{i.n}</Text></View>
          <View style={{flex:1}}><Text style={s.rowTitle}>{i.en}</Text><Text style={s.rowSub}>{i.v} verses · {i.type} · {i.meaning}</Text></View>
          <Text style={s.rowAr}>{i.ar}</Text>
          <Text style={{color:C.gray3,marginLeft:6}}>›</Text>
        </TouchableOpacity>
      )}/>
    </View>
  );
}

function SurahScreen({route}) {
  const {surah}=route.params; const ayahs=AYAHS[surah.n];
  return (
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>{surah.ar}</Text><Text style={s.pageHdrEn}>{surah.en} · {surah.v} verses</Text></View>
      {surah.n!==9&&<View style={s.bismBox}><Text style={s.bismTxt}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text></View>}
      {ayahs?ayahs.map((a,i)=>(
        <View key={i} style={s.ayahBlock}>
          <View style={{flexDirection:'row',justifyContent:'flex-end',marginBottom:6}}>
            <View style={s.ayahNumBadge}><Text style={{fontSize:10,color:C.gold}}>{i+1}</Text></View>
          </View>
          <Text style={s.ayahAr}>{a.ar}</Text>
          <Text style={s.ayahEn}>{a.en}</Text>
        </View>
      )):(
        <View style={[s.infoBox,{margin:16}]}>
          <Text style={s.infoTxt}>Full ayahs for this surah will be added in the next update when we connect to the authenticated Al-Quran Cloud API (quran.api-docs.io).</Text>
        </View>
      )}
      <View style={{height:40}}/>
    </ScrollView>
  );
}

function QuranTab() {
  return (
    <Stack.Navigator screenOptions={{headerStyle:{backgroundColor:C.emerald},headerTitleStyle:{color:'white'},headerTintColor:'white'}}>
      <Stack.Screen name="QuranList" component={QuranListScreen} options={{title:'القرآن الكريم'}}/>
      <Stack.Screen name="Surah" component={SurahScreen} options={({route})=>({title:route.params.surah.en})}/>
    </Stack.Navigator>
  );
}

// ── PRAYER ────────────────────────────────────────────────────────────────────
function PrayerScreen() {
  const [prayers,setPrayers]=useState(null);
  const [next,setNext]=useState(null);
  const [cd,setCd]=useState('');
  const [city,setCity]=useState('');
  const [qibla,setQibla]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState('');
  const [tick,setTick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setTick(x=>x+1),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(next)setCd(getCountdown(next.time));},[tick,next]);
  useEffect(()=>{
    (async()=>{
      try{
        const {status}=await Location.requestForegroundPermissionsAsync();
        if(status!=='granted'){setErr('Location permission needed.');setLoading(false);return;}
        const loc=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
        const {latitude,longitude}=loc.coords;
        try{const g=await Location.reverseGeocodeAsync({latitude,longitude});if(g?.[0])setCity(g[0].city||g[0].region||'Your Location');}catch{setCity('Your Location');}
        const coords=new Adhan.Coordinates(latitude,longitude);
        const params=Adhan.CalculationMethod.MuslimWorldLeague();
        params.madhab=Adhan.Madhab.Shafi;
        const t=new Adhan.PrayerTimes(coords,new Date(),params);
        const list=[
          {name:'Fajr',ar:'الفجر',icon:'🌄',time:t.fajr},
          {name:'Sunrise',ar:'الشروق',icon:'🌅',time:t.sunrise},
          {name:'Dhuhr',ar:'الظهر',icon:'☀️',time:t.dhuhr},
          {name:'Asr',ar:'العصر',icon:'🌤️',time:t.asr},
          {name:'Maghrib',ar:'المغرب',icon:'🌇',time:t.maghrib},
          {name:'Isha',ar:'العشاء',icon:'🌙',time:t.isha},
        ];
        setPrayers(list);
        const nx=list.find(p=>p.time>new Date())||list[0];
        setNext(nx);setCd(getCountdown(nx.time));
        setQibla(getQibla(latitude,longitude));
        setLoading(false);
      }catch(e){setErr('Could not get prayer times. Check location permissions.');setLoading(false);}
    })();
  },[]);
  if(loading)return<View style={s.centered}><ActivityIndicator size="large" color={C.emerald}/><Text style={s.loadTxt}>Calculating prayer times...</Text></View>;
  if(err)return<View style={s.centered}><Text style={{fontSize:40,marginBottom:12}}>📍</Text><Text style={s.errTxt}>{err}</Text></View>;
  return(
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      {next&&<View style={s.npHero}>
        <Text style={s.npLbl}>Next Prayer</Text>
        <Text style={{fontSize:44,marginBottom:4}}>{next.icon}</Text>
        <Text style={s.npName}>{next.name}</Text>
        <Text style={s.npAr}>{next.ar}</Text>
        <Text style={s.npTime}>{formatTime(next.time)}</Text>
        <View style={s.cdBadge}><Text style={s.cdTxt}>⏱  {cd}</Text></View>
        <Text style={s.locTxt}>📍 {city}</Text>
      </View>}
      <Text style={s.secTitle}>Today's Prayer Times</Text>
      <View style={s.prayerCard}>
        {prayers?.map((p,i)=>{
          const isNext=next?.name===p.name;
          const isPast=p.time<new Date()&&!isNext;
          return(
            <View key={p.name} style={[s.prayerRow,isNext&&s.prayerRowNext,i<5&&s.prayerRowBorder]}>
              <Text style={{fontSize:22,marginRight:12}}>{p.icon}</Text>
              <View style={{flex:1}}><Text style={[s.prayerName,isNext&&{color:C.emerald}]}>{p.name}</Text><Text style={s.prayerAr}>{p.ar}</Text></View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[s.prayerTime,isNext&&{color:C.emerald},isPast&&{color:C.gray3}]}>{formatTime(p.time)}</Text>
                {isPast&&<Text style={{fontSize:10,color:C.gray3}}>✓ done</Text>}
                {isNext&&<Text style={{fontSize:10,color:C.emerald,fontWeight:'700'}}>next</Text>}
              </View>
            </View>
          );
        })}
      </View>
      {qibla!==null&&<View style={s.qiblaCard}>
        <Text style={s.qiblaTitle}>🧭  Qibla Direction</Text>
        <Text style={s.qiblaAr}>اتِّجَاه القِبْلَة</Text>
        <Text style={{fontSize:52,marginVertical:8}}>🕋</Text>
        <Text style={{fontSize:36,fontWeight:'700',color:C.emerald}}>{qibla}°</Text>
        <Text style={{fontSize:12,color:C.gray3,marginTop:4,textAlign:'center'}}>from North · face this direction to face the Kaaba</Text>
      </View>}
      <View style={[s.infoBox,{margin:16}]}>
        <Text style={s.infoTxt}>📐 Method: Muslim World League{'\n'}🕌 Asr: Shafi\'i / Maliki / Hanbali{'\n'}📍 Based on your GPS coordinates</Text>
      </View>
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── DHIKR ─────────────────────────────────────────────────────────────────────
function DhikrScreen() {
  const [counts,setCounts]=useState({});
  const [total,setTotal]=useState(0);
  const inc=(key,target)=>setCounts(p=>{const c=(p[key]||0)+1;if(c<=target){setTotal(t=>t+1);return{...p,[key]:c}}return p});
  const reset=key=>setCounts(p=>({...p,[key]:0}));
  return(
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>الذِّكْر</Text><Text style={s.pageHdrEn}>Remembrance of Allah</Text></View>
      <View style={s.totalBadge}><Text style={s.totalTxt}>Total today: {total}</Text></View>
      {DHIKR_LIST.map(d=>{
        const count=counts[d.en]||0;const done=count>=d.target;const pct=Math.min(count/d.target,1);
        return(
          <View key={d.en} style={[s.dhikrCard,done&&s.dhikrDone]}>
            <Text style={s.dhikrAr}>{d.ar}</Text>
            <Text style={s.dhikrEn}>{d.en}</Text>
            <Text style={s.dhikrMean}>{d.meaning}</Text>
            <Text style={s.dhikrSrc}>{d.source}</Text>
            <View style={s.progBg}><View style={[s.progFill,{width:`${pct*100}%`}]}/></View>
            <View style={{flexDirection:'row',gap:8,marginTop:4}}>
              <TouchableOpacity style={[s.tapBtn,done&&s.tapBtnDone]} onPress={()=>inc(d.en,d.target)} activeOpacity={0.7}>
                <Text style={[s.tapBtnTxt,done&&{color:C.emerald}]}>{done?'✓  Complete':`${count}  /  ${d.target}`}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.resetBtn} onPress={()=>reset(d.en)}>
                <Text style={{color:C.gray3,fontSize:18}}>↺</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── DUAS ──────────────────────────────────────────────────────────────────────
const DUA_ICONS={'Morning & Evening':'🌅','Before Eating':'🍽️','Before Sleeping':'🌙','For Anxiety & Distress':'💚','After Prayer':'🤲','Entering the Masjid':'🕌'};

function DuaListScreen({navigation}) {
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>الأَدْعِيَة المَأثُورَة</Text><Text style={s.pageHdrEn}>Authenticated Duas · Hisnul Muslim</Text></View>
      <View style={[s.infoBox,{margin:16,marginBottom:4}]}><Text style={s.infoTxt}>All duas from Hisnul Muslim and authenticated hadith only. Source cited for every dua.</Text></View>
      {Object.keys(DUAS).map(cat=>(
        <TouchableOpacity key={cat} style={s.row} onPress={()=>navigation.navigate('DuaDetail',{cat})}>
          <Text style={{fontSize:24,marginRight:12}}>{DUA_ICONS[cat]||'🤲'}</Text>
          <View style={{flex:1}}><Text style={s.rowTitle}>{cat}</Text><Text style={s.rowSub}>Hisnul Muslim · Authenticated</Text></View>
          <View style={s.badge}><Text style={s.badgeTxt}>{DUAS[cat].length}</Text></View>
          <Text style={{color:C.gray3,marginLeft:8}}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DuaDetailScreen({route}) {
  const {cat}=route.params; const duas=DUAS[cat];
  const [idx,setIdx]=useState(0); const d=duas[idx];
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrEn}>{cat}</Text><Text style={{color:C.emerald3,fontSize:12}}>{idx+1} of {duas.length}</Text></View>
      <View style={s.duaCard}>
        <Text style={s.duaAr}>{d.ar}</Text>
        <View style={s.divider}/>
        <Text style={s.duaTr}>{d.tr}</Text>
        <View style={s.divider}/>
        <Text style={s.duaEn}>{d.en}</Text>
        <View style={s.srcBadge}><Text style={s.srcTxt}>📚 {d.source}</Text></View>
      </View>
      <View style={s.navRow}>
        <TouchableOpacity style={[s.navBtn,idx===0&&s.navOff]} onPress={()=>setIdx(i=>Math.max(0,i-1))}>
          <Text style={s.navTxt}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.navBtn,idx===duas.length-1&&s.navOff]} onPress={()=>setIdx(i=>Math.min(duas.length-1,i+1))}>
          <Text style={s.navTxt}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DuasTab() {
  return(
    <Stack.Navigator screenOptions={{headerStyle:{backgroundColor:C.emerald},headerTitleStyle:{color:'white'},headerTintColor:'white'}}>
      <Stack.Screen name="DuaList" component={DuaListScreen} options={{title:'Duas · الأدعية'}}/>
      <Stack.Screen name="DuaDetail" component={DuaDetailScreen} options={({route})=>({title:route.params.cat})}/>
    </Stack.Navigator>
  );
}

// ── LEARN HUB ─────────────────────────────────────────────────────────────────
function LearnHomeScreen({navigation}) {
  const items=[
    {icon:'🌱',title:'New Muslim Guide',ar:'دليل المسلم الجديد',desc:'Beliefs, pillars, prayer, character',screen:'NewMuslim'},
    {icon:'🧒',title:"Children's Quran",ar:'القرآن للأطفال',desc:'Arabic letters and short surahs',screen:'ChildrensQuran'},
    {icon:'✋',title:'99 Names of Allah',ar:'أسماء الله الحسنى',desc:'Asma ul Husna with sources',screen:'NamesOfAllah'},
    {icon:'🕋',title:'Hajj & Umrah Guide',ar:'دليل الحج والعمرة',desc:'Step by step authentic guide',screen:'HajjGuide'},
    {icon:'⚖️',title:'Zakat Calculator',ar:'حساب الزكاة',desc:'Calculate your annual Zakat',screen:'Zakat'},
  ];
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>تَعَلَّم</Text><Text style={s.pageHdrEn}>Learn Islam</Text></View>
      {items.map(i=>(
        <TouchableOpacity key={i.title} style={s.learnCard} onPress={()=>navigation.navigate(i.screen)}>
          <Text style={{fontSize:30,marginRight:14}}>{i.icon}</Text>
          <View style={{flex:1}}><Text style={s.learnTitle}>{i.title}</Text><Text style={s.learnAr}>{i.ar}</Text><Text style={s.learnDesc}>{i.desc}</Text></View>
          <Text style={{color:C.gray3}}>›</Text>
        </TouchableOpacity>
      ))}
      <View style={[s.infoBox,{margin:16}]}><Text style={s.infoTxt}>All content verified against authenticated Islamic sources. Consult a qualified scholar for personal rulings.</Text></View>
    </ScrollView>
  );
}

// ── NEW MUSLIM GUIDE ──────────────────────────────────────────────────────────
function NewMuslimScreen({navigation}) {
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>دليل المسلم الجديد</Text><Text style={s.pageHdrEn}>New Muslim Guide</Text></View>
      <View style={[s.infoBox,{margin:16,marginBottom:4}]}><Text style={s.infoTxt}>All content based on Quran and authenticated Sunnah. Sources cited.</Text></View>
      {NEW_MUSLIM.map((item,i)=>(
        <TouchableOpacity key={i} style={s.row} onPress={()=>navigation.navigate('NMLesson',{lesson:item})}>
          <View style={s.numBadge}><Text style={s.numTxt}>{i+1}</Text></View>
          <View style={{flex:1}}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.rowSub}>{item.ar}</Text></View>
          <Text style={{fontSize:20,marginRight:4}}>{item.icon}</Text>
          <Text style={{color:C.gray3}}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function NMLessonScreen({route}) {
  const {lesson}=route.params;
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={{fontSize:40,marginBottom:8}}>{lesson.icon}</Text><Text style={s.pageHdrAr}>{lesson.ar}</Text><Text style={s.pageHdrEn}>{lesson.title}</Text></View>
      <View style={s.lessonCard}><Text style={s.lessonContent}>{lesson.content}</Text><View style={s.srcBadge}><Text style={s.srcTxt}>📚 {lesson.source}</Text></View></View>
      <View style={{height:40}}/>
    </ScrollView>
  );
}

// ── CHILDREN'S QURAN ──────────────────────────────────────────────────────────
function ChildrensQuranScreen({navigation}) {
  const [tab,setTab]=useState('letters');
  const shortSurahs=SURAHS.filter(s=>[112,113,114,1].includes(s.n));
  return(
    <ScrollView style={s.screen}>
      <View style={[s.pageHdr,{backgroundColor:'#7C3AED'}]}><Text style={{fontSize:36}}>🌟</Text><Text style={[s.pageHdrAr,{color:'#FCD34D'}]}>القرآن للأطفال</Text><Text style={s.pageHdrEn}>Learn Arabic & Quran</Text></View>
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn,tab==='letters'&&s.tabActive]} onPress={()=>setTab('letters')}><Text style={[s.tabTxt,tab==='letters'&&{color:'white'}]}>Arabic Letters</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn,tab==='surahs'&&s.tabActive]} onPress={()=>setTab('surahs')}><Text style={[s.tabTxt,tab==='surahs'&&{color:'white'}]}>Short Surahs</Text></TouchableOpacity>
      </View>
      {tab==='letters'&&(
        <View style={s.letGrid}>
          {LETTERS.map((l,i)=>(
            <TouchableOpacity key={i} style={s.letCard} onPress={()=>navigation.navigate('LetterDetail',{letter:l,index:i})}>
              <Text style={s.letBig}>{l.l}</Text>
              <Text style={s.letName}>{l.n}</Text>
              <Text style={s.letSound}>{l.s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {tab==='surahs'&&(
        <View style={{padding:16}}>
          {shortSurahs.map(s2=>(
            <TouchableOpacity key={s2.n} style={s.learnCard} onPress={()=>navigation.navigate('Surah',{surah:s2})}>
              <Text style={{fontSize:28,marginRight:14}}>📖</Text>
              <View style={{flex:1}}><Text style={s.learnTitle}>{s2.en}</Text><Text style={s.learnAr}>{s2.ar}</Text><Text style={s.learnDesc}>{s2.v} verses · {s2.meaning}</Text></View>
              <Text style={{color:C.gray3}}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function LetterDetailScreen({route}) {
  const {letter:l,index:i}=route.params;
  return(
    <ScrollView style={s.screen}>
      <View style={[s.pageHdr,{backgroundColor:'#7C3AED',paddingVertical:40}]}>
        <Text style={{fontSize:80,color:'white',fontWeight:'700'}}>{l.l}</Text>
        <Text style={[s.pageHdrEn,{fontSize:18,color:'#FCD34D',marginTop:8}]}>{l.n}</Text>
        <Text style={s.pageHdrEn}>Sound: {l.s}</Text>
      </View>
      <View style={s.lessonCard}>
        <Text style={s.lessonLbl}>Letter {i+1} of 28</Text>
        <View style={{alignItems:'center',marginVertical:20}}><Text style={{fontSize:60,color:'#7C3AED'}}>{l.l}</Text></View>
        <Text style={s.lessonLbl}>Example Word</Text>
        <View style={[s.infoBox,{marginTop:8}]}><Text style={{fontSize:16,color:C.text2,textAlign:'center'}}>{l.e}</Text></View>
        <Text style={[s.lessonLbl,{marginTop:16}]}>Sound</Text>
        <View style={[s.infoBox,{marginTop:8}]}><Text style={{fontSize:16,color:C.emerald,textAlign:'center',fontWeight:'600'}}>{l.s}</Text></View>
      </View>
    </ScrollView>
  );
}

// ── 99 NAMES ──────────────────────────────────────────────────────────────────
function NamesScreen({navigation}) {
  const [q,setQ]=useState('');
  const f=NAMES.filter(n=>n.en.toLowerCase().includes(q.toLowerCase())||n.tr.toLowerCase().includes(q.toLowerCase())||n.ar.includes(q));
  return(
    <View style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>أَسْمَاءُ اللَّهِ الْحُسْنَى</Text><Text style={s.pageHdrEn}>The Beautiful Names of Allah</Text></View>
      <View style={{padding:12}}><TextInput style={s.searchIn} placeholder="Search names..." value={q} onChangeText={setQ} placeholderTextColor={C.gray3}/></View>
      <FlatList data={f} keyExtractor={i=>i.n.toString()} renderItem={({item:i})=>(
        <TouchableOpacity style={s.row} onPress={()=>navigation.navigate('NameDetail',{name:i})}>
          <View style={s.numBadge}><Text style={s.numTxt}>{i.n}</Text></View>
          <View style={{flex:1}}><Text style={s.rowTitle}>{i.tr}</Text><Text style={s.rowSub}>{i.en} · {i.source}</Text></View>
          <Text style={{fontSize:18,color:C.emerald,fontWeight:'700'}}>{i.ar}</Text>
        </TouchableOpacity>
      )}/>
    </View>
  );
}

function NameDetailScreen({route}) {
  const {name:n}=route.params;
  return(
    <ScrollView style={s.screen}>
      <View style={[s.pageHdr,{paddingVertical:36}]}>
        <Text style={[s.pageHdrAr,{fontSize:44}]}>{n.ar}</Text>
        <Text style={[s.pageHdrEn,{fontSize:22,color:'#FCD34D',marginTop:8}]}>{n.tr}</Text>
        <Text style={s.pageHdrEn}>{n.en}</Text>
      </View>
      <View style={s.lessonCard}>
        <Text style={s.lessonLbl}>Name #{n.n} of 99</Text>
        <View style={s.srcBadge}><Text style={s.srcTxt}>📚 {n.source}</Text></View>
        <View style={[s.infoBox,{marginTop:12}]}><Text style={s.infoTxt}>{"The Prophet ﷺ said: 'Allah has 99 names. Whoever preserves them will enter Paradise.'\n— Sahih al-Bukhari 7392"}</Text></View>
      </View>
    </ScrollView>
  );
}

// ── HAJJ GUIDE ────────────────────────────────────────────────────────────────
function HajjGuideScreen({navigation}) {
  const [tab,setTab]=useState('umrah');
  const display=HAJJ.filter(s=>s.type===tab);
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={{fontSize:36}}>🕋</Text><Text style={s.pageHdrAr}>دليل الحج والعمرة</Text><Text style={s.pageHdrEn}>Step-by-step · Authenticated Sunnah</Text></View>
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn,tab==='umrah'&&s.tabActive]} onPress={()=>setTab('umrah')}><Text style={[s.tabTxt,tab==='umrah'&&{color:'white'}]}>Umrah</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn,tab==='hajj'&&s.tabActive]} onPress={()=>setTab('hajj')}><Text style={[s.tabTxt,tab==='hajj'&&{color:'white'}]}>Hajj</Text></TouchableOpacity>
      </View>
      <View style={[s.infoBox,{margin:16,marginBottom:4}]}><Text style={s.infoTxt}>All steps based on authenticated Sunnah. Source cited for each step.</Text></View>
      {display.map((step,i)=>(
        <TouchableOpacity key={i} style={s.row} onPress={()=>navigation.navigate('HajjStep',{step})}>
          <View style={[s.numBadge,{backgroundColor:'#D97706'}]}><Text style={s.numTxt}>{step.step}</Text></View>
          <View style={{flex:1}}><Text style={s.rowTitle}>{step.title}</Text><Text style={s.rowSub}>{step.ar} · {step.source}</Text></View>
          <Text style={{fontSize:20,marginRight:4}}>{step.icon}</Text>
          <Text style={{color:C.gray3}}>›</Text>
        </TouchableOpacity>
      ))}
      <View style={{height:20}}/>
    </ScrollView>
  );
}

function HajjStepScreen({route}) {
  const {step}=route.params;
  return(
    <ScrollView style={s.screen}>
      <View style={[s.pageHdr,{backgroundColor:'#92400E'}]}><Text style={{fontSize:44,marginBottom:8}}>{step.icon}</Text><Text style={[s.pageHdrAr,{color:'#FCD34D'}]}>{step.ar}</Text><Text style={s.pageHdrEn}>Step {step.step}: {step.title}</Text></View>
      <View style={s.lessonCard}><Text style={s.lessonContent}>{step.desc}</Text><View style={s.srcBadge}><Text style={s.srcTxt}>📚 {step.source}</Text></View></View>
      <View style={{height:40}}/>
    </ScrollView>
  );
}

// ── ZAKAT ─────────────────────────────────────────────────────────────────────
function ZakatScreen() {
  const [cur,setCur]=useState('EUR');
  const [nisab,setNisab]=useState('gold');
  const [gp,setGp]=useState(87); const [sp,setSp]=useState(0.9);
  const [cash,setCash]=useState(''); const [bank,setBank]=useState('');
  const [goldG,setGoldG]=useState(''); const [silvG,setSilvG]=useState('');
  const [inv,setInv]=useState(''); const [crypto,setCrypto]=useState('');
  const [biz,setBiz]=useState(''); const [recv,setRecv]=useState('');
  const [debts,setDebts]=useState(''); const [res,setRes]=useState(null);
  const [loading,setLoading]=useState(false);
  const SYM={EUR:'€',GBP:'£',USD:'$',AED:'د.إ'}; const sym=SYM[cur]||'€';
  const fetchPx=async()=>{
    setLoading(true);
    try{
      const[gr,sr]=await Promise.all([fetch('https://api.gold-api.com/price/XAU').then(r=>r.json()),fetch('https://api.gold-api.com/price/XAG').then(r=>r.json())]);
      let g=parseFloat(gr.price)/31.1035,s=parseFloat(sr.price)/31.1035;
      if(cur!=='USD'){const fx=await fetch('https://open.er-api.com/v6/latest/USD').then(r=>r.json());const rate=fx.rates[cur]||1;g*=rate;s*=rate;}
      setGp(Math.round(g*100)/100);setSp(Math.round(s*10000)/10000);
    }catch(e){}
    setLoading(false);
  };
  useEffect(()=>{fetchPx();},[cur]);
  const calc=()=>{
    const n=x=>parseFloat(x||0);
    const nv=nisab==='gold'?87.48*gp:612.36*sp;
    const total=n(cash)+n(bank)+n(goldG)*gp+n(silvG)*sp+n(inv)+n(crypto)+n(biz)+n(recv);
    const net=Math.max(0,total-n(debts));
    const zakat=net>=nv?net*0.025:0;
    setRes({zakat:zakat.toFixed(2),net:net.toFixed(2),nv:nv.toFixed(2),above:net>=nv});
  };
  const F=({label,value,onChange})=>(
    <View style={{marginBottom:10}}>
      <Text style={s.fieldLbl}>{label}</Text>
      <TextInput style={s.fieldIn} value={value} onChangeText={onChange} keyboardType="numeric" placeholder={`${sym}0.00`} placeholderTextColor={C.gray3}/>
    </View>
  );
  return(
    <ScrollView style={s.screen}>
      <View style={s.pageHdr}><Text style={s.pageHdrAr}>حِسَابُ الزَّكَاة</Text><Text style={s.pageHdrEn}>Zakat Calculator</Text></View>
      <View style={{padding:16}}>
        <Text style={s.secLabel}>⚙️  Settings</Text>
        <Text style={s.fieldLbl}>Currency</Text>
        <View style={s.pillRow}>{['EUR','GBP','USD','AED'].map(c=><TouchableOpacity key={c} style={[s.pill,cur===c&&s.pillOn]} onPress={()=>setCur(c)}><Text style={[s.pillTxt,cur===c&&{color:'white'}]}>{c}</Text></TouchableOpacity>)}</View>
        <Text style={s.fieldLbl}>Nisab Standard</Text>
        <View style={s.pillRow}>
          <TouchableOpacity style={[s.pill,nisab==='gold'&&s.pillOn]} onPress={()=>setNisab('gold')}><Text style={[s.pillTxt,nisab==='gold'&&{color:'white'}]}>Gold 87.48g</Text></TouchableOpacity>
          <TouchableOpacity style={[s.pill,nisab==='silver'&&s.pillOn]} onPress={()=>setNisab('silver')}><Text style={[s.pillTxt,nisab==='silver'&&{color:'white'}]}>Silver 612.36g</Text></TouchableOpacity>
        </View>
        <View style={[s.infoBox,{marginBottom:12}]}>
          <Text style={s.infoTxt}>🥇 Gold: {sym}{gp}/g  ·  🥈 Silver: {sym}{sp}/g{'\n'}Nisab: {sym}{(nisab==='gold'?87.48*gp:612.36*sp).toFixed(2)}{loading?'  ⟳':''}</Text>
        </View>
        <Text style={s.secLabel}>💰  Cash & Savings</Text>
        <F label="Cash at home" value={cash} onChange={setCash}/>
        <F label="Bank account / savings" value={bank} onChange={setBank}/>
        <Text style={s.secLabel}>🥇  Gold & Silver</Text>
        <F label="Gold owned (grams)" value={goldG} onChange={setGoldG}/>
        <F label="Silver owned (grams)" value={silvG} onChange={setSilvG}/>
        <Text style={s.secLabel}>📈  Investments</Text>
        <F label={`Stocks / Halal investments (${sym})`} value={inv} onChange={setInv}/>
        <F label={`Crypto / digital assets (${sym})`} value={crypto} onChange={setCrypto}/>
        <Text style={s.secLabel}>🏪  Business</Text>
        <F label={`Inventory / stock for sale (${sym})`} value={biz} onChange={setBiz}/>
        <F label={`Money owed to you (${sym})`} value={recv} onChange={setRecv}/>
        <Text style={s.secLabel}>➖  Deductions</Text>
        <F label={`Debts due this year (${sym})`} value={debts} onChange={setDebts}/>
        <TouchableOpacity style={s.calcBtn} onPress={calc}><Text style={s.calcTxt}>⚖️  Calculate Zakat · احسب الزكاة</Text></TouchableOpacity>
        {res&&<View style={s.resultCard}>
          <Text style={s.resLbl}>Total Zakat Due</Text>
          <Text style={s.resAmt}>{sym}{res.zakat}</Text>
          <Text style={{fontSize:12,color:'#A7F3D0',marginBottom:8}}>Net: {sym}{res.net}  ·  Nisab: {sym}{res.nv}{'\n'}{res.above?'✓ Above nisab — Zakat is due':'✗ Below nisab — Zakat not due'}</Text>
          <Text style={{fontSize:18,color:'#FCD34D'}}>رَبَّنَا تَقَبَّلْ مِنَّا</Text>
          <Text style={{fontSize:11,color:'#A7F3D0',marginTop:2}}>Rabbana taqabbal minna — Our Lord, accept from us</Text>
        </View>}
      </View>
      <View style={{height:40}}/>
    </ScrollView>
  );
}

// ── LEARN TAB STACK ───────────────────────────────────────────────────────────
function LearnTab() {
  return(
    <Stack.Navigator screenOptions={{headerStyle:{backgroundColor:C.emerald},headerTitleStyle:{color:'white'},headerTintColor:'white'}}>
      <Stack.Screen name="LearnHome" component={LearnHomeScreen} options={{title:'Learn · تعلّم'}}/>
      <Stack.Screen name="NewMuslim" component={NewMuslimScreen} options={{title:'New Muslim Guide'}}/>
      <Stack.Screen name="NMLesson" component={NMLessonScreen} options={({route})=>({title:route.params.lesson.title})}/>
      <Stack.Screen name="ChildrensQuran" component={ChildrensQuranScreen} options={{title:"Children's Quran"}}/>
      <Stack.Screen name="LetterDetail" component={LetterDetailScreen} options={({route})=>({title:`${route.params.letter.l} · ${route.params.letter.n}`})}/>
      <Stack.Screen name="NamesOfAllah" component={NamesScreen} options={{title:'99 Names of Allah'}}/>
      <Stack.Screen name="NameDetail" component={NameDetailScreen} options={({route})=>({title:route.params.name.tr})}/>
      <Stack.Screen name="HajjGuide" component={HajjGuideScreen} options={{title:'Hajj & Umrah Guide'}}/>
      <Stack.Screen name="HajjStep" component={HajjStepScreen} options={({route})=>({title:route.params.step.title})}/>
      <Stack.Screen name="Zakat" component={ZakatScreen} options={{title:'Zakat Calculator'}}/>
      <Stack.Screen name="Surah" component={SurahScreen} options={({route})=>({title:route.params.surah.en})}/>
    </Stack.Navigator>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  return(
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={C.emerald}/>
      <Tab.Navigator screenOptions={({route})=>({
        tabBarIcon:({focused})=>{
          const icons={Home:'🏠',QuranTab:'📖',PrayerTab:'🕌',DhikrTab:'📿',DuasTab:'🤲',LearnTab:'📚'};
          return<Text style={{fontSize:focused?24:20}}>{icons[route.name]}</Text>;
        },
        tabBarActiveTintColor:C.emerald, tabBarInactiveTintColor:C.gray3,
        tabBarStyle:{backgroundColor:C.white,borderTopColor:C.gray2,borderTopWidth:1,paddingBottom:8,paddingTop:6,height:62},
        tabBarLabelStyle:{fontSize:10,fontWeight:'600'},
        headerStyle:{backgroundColor:C.emerald}, headerTitleStyle:{color:'white',fontSize:17,fontWeight:'700'},
        headerTitleAlign:'center', headerShown:false,
      })}>
        <Tab.Screen name="Home" component={HomeScreen} options={{headerShown:true,title:'هدى  Huda',tabBarLabel:'Home'}}/>
        <Tab.Screen name="QuranTab" component={QuranTab} options={{tabBarLabel:'Quran'}}/>
        <Tab.Screen name="PrayerTab" component={PrayerScreen} options={{headerShown:true,title:'Prayer · الصلاة',tabBarLabel:'Prayer'}}/>
        <Tab.Screen name="DhikrTab" component={DhikrScreen} options={{headerShown:true,title:'Dhikr · الذكر',tabBarLabel:'Dhikr'}}/>
        <Tab.Screen name="DuasTab" component={DuasTab} options={{tabBarLabel:'Duas'}}/>
        <Tab.Screen name="LearnTab" component={LearnTab} options={{tabBarLabel:'Learn'}}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#F9FAFB'},
  centered:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#F9FAFB'},
  loadTxt:{fontSize:16,color:C.emerald,fontWeight:'600',marginTop:16},
  errTxt:{fontSize:14,color:C.gray3,textAlign:'center',lineHeight:22},
  hero:{backgroundColor:C.emerald,padding:28,alignItems:'center'},
  heroAr:{fontSize:28,color:C.gold2,fontWeight:'700',marginBottom:4},
  heroSub:{fontSize:13,color:'#D1FAE5',letterSpacing:1,marginBottom:8},
  heroDate:{fontSize:12,color:'#A7F3D0'},
  hadithCard:{margin:16,padding:16,backgroundColor:'white',borderRadius:12,borderLeftWidth:4,borderLeftColor:C.gold},
  hadithLbl:{fontSize:10,letterSpacing:2,color:C.gold,fontWeight:'700',marginBottom:8,textTransform:'uppercase'},
  hadithTxt:{fontSize:15,color:C.text2,fontStyle:'italic',lineHeight:24},
  hadithSrc:{fontSize:12,color:C.gray3,marginTop:8},
  secTitle:{fontSize:11,fontWeight:'700',color:C.gray3,letterSpacing:1.5,textTransform:'uppercase',paddingHorizontal:16,marginBottom:8,marginTop:4},
  grid:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:12},
  gridCard:{width:'30%',margin:'1.5%',backgroundColor:'white',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:C.gray2},
  gridIcon:{fontSize:26,marginBottom:6},
  gridAr:{fontSize:14,color:C.emerald,fontWeight:'700',marginBottom:2},
  gridEn:{fontSize:10,color:C.gray3,letterSpacing:0.5},
  pageHdr:{backgroundColor:C.emerald,padding:20,alignItems:'center'},
  pageHdrAr:{fontSize:24,color:C.gold2,fontWeight:'700'},
  pageHdrEn:{fontSize:12,color:'#D1FAE5',letterSpacing:1,marginTop:4},
  searchIn:{backgroundColor:'white',borderWidth:1,borderColor:C.gray2,borderRadius:10,padding:12,fontSize:14,color:C.text},
  row:{flexDirection:'row',alignItems:'center',backgroundColor:'white',marginHorizontal:16,marginTop:8,padding:14,borderRadius:10,borderWidth:1,borderColor:C.gray2},
  numBadge:{width:36,height:36,borderRadius:18,backgroundColor:C.emerald,alignItems:'center',justifyContent:'center',marginRight:12},
  numTxt:{color:'white',fontSize:12,fontWeight:'700'},
  rowTitle:{fontSize:14,fontWeight:'600',color:C.text},
  rowSub:{fontSize:11,color:C.gray3,marginTop:2},
  rowAr:{fontSize:18,color:C.emerald,fontWeight:'700'},
  badge:{backgroundColor:C.emerald3,paddingHorizontal:10,paddingVertical:4,borderRadius:12},
  badgeTxt:{fontSize:12,color:C.emerald,fontWeight:'700'},
  bismBox:{backgroundColor:C.emerald3,margin:16,padding:16,borderRadius:10,alignItems:'center'},
  bismTxt:{fontSize:22,color:C.emerald,fontWeight:'700'},
  ayahBlock:{padding:16,borderBottomWidth:1,borderBottomColor:C.gray1},
  ayahNumBadge:{width:24,height:24,borderRadius:12,borderWidth:1,borderColor:C.gold,alignItems:'center',justifyContent:'center'},
  ayahAr:{fontSize:22,color:C.text,textAlign:'right',lineHeight:38,marginBottom:8},
  ayahEn:{fontSize:14,color:C.gray3,fontStyle:'italic',lineHeight:22},
  npHero:{backgroundColor:C.emerald,padding:28,alignItems:'center'},
  npLbl:{fontSize:11,color:'#A7F3D0',letterSpacing:2,textTransform:'uppercase',marginBottom:8},
  npName:{fontSize:28,color:'white',fontWeight:'700'},
  npAr:{fontSize:20,color:C.gold2,marginTop:2,marginBottom:6},
  npTime:{fontSize:36,color:'white',fontWeight:'700',marginBottom:10},
  cdBadge:{backgroundColor:'rgba(255,255,255,0.2)',paddingHorizontal:20,paddingVertical:6,borderRadius:20,marginBottom:10},
  cdTxt:{color:'white',fontSize:16,fontWeight:'600'},
  locTxt:{fontSize:12,color:'#A7F3D0'},
  prayerCard:{margin:16,backgroundColor:'white',borderRadius:12,borderWidth:1,borderColor:C.gray2,overflow:'hidden'},
  prayerRow:{flexDirection:'row',alignItems:'center',padding:14,paddingHorizontal:16},
  prayerRowBorder:{borderBottomWidth:1,borderBottomColor:C.gray1},
  prayerRowNext:{backgroundColor:'#ECFDF5'},
  prayerName:{fontSize:15,fontWeight:'600',color:C.text},
  prayerAr:{fontSize:12,color:C.gray3,marginTop:1},
  prayerTime:{fontSize:16,fontWeight:'700',color:C.text2},
  qiblaCard:{margin:16,backgroundColor:'white',borderRadius:12,padding:20,borderWidth:1,borderColor:C.gray2,alignItems:'center'},
  qiblaTitle:{fontSize:16,fontWeight:'700',color:C.text,marginBottom:4},
  qiblaAr:{fontSize:16,color:C.emerald,marginBottom:8},
  totalBadge:{alignSelf:'center',backgroundColor:C.emerald3,paddingHorizontal:20,paddingVertical:8,borderRadius:20,margin:12},
  totalTxt:{color:C.emerald,fontWeight:'700',fontSize:14},
  dhikrCard:{backgroundColor:'white',marginHorizontal:16,marginTop:10,padding:18,borderRadius:12,borderWidth:1,borderColor:C.gray2,alignItems:'center'},
  dhikrDone:{borderColor:C.emerald,backgroundColor:'#F0FDF4'},
  dhikrAr:{fontSize:22,color:C.emerald,fontWeight:'700',marginBottom:4},
  dhikrEn:{fontSize:14,color:C.text2,marginBottom:2},
  dhikrMean:{fontSize:12,color:C.gray3,marginBottom:2},
  dhikrSrc:{fontSize:11,color:C.gray3,marginBottom:10},
  progBg:{width:'100%',height:6,backgroundColor:C.gray2,borderRadius:3,marginBottom:12,overflow:'hidden'},
  progFill:{height:6,backgroundColor:C.emerald,borderRadius:3},
  tapBtn:{flex:1,backgroundColor:C.emerald,paddingVertical:12,borderRadius:10,alignItems:'center'},
  tapBtnDone:{backgroundColor:C.emerald3},
  tapBtnTxt:{color:'white',fontWeight:'700',fontSize:15},
  resetBtn:{width:44,height:44,borderRadius:22,backgroundColor:C.gray1,alignItems:'center',justifyContent:'center'},
  duaCard:{margin:16,backgroundColor:'white',borderRadius:12,padding:20,borderWidth:1,borderColor:C.gray2},
  duaAr:{fontSize:24,color:C.emerald,textAlign:'right',lineHeight:42,marginBottom:12},
  divider:{height:1,backgroundColor:C.gray1,marginVertical:12},
  duaTr:{fontSize:13,color:C.gray3,fontStyle:'italic',lineHeight:20},
  duaEn:{fontSize:14,color:C.text2,lineHeight:22},
  srcBadge:{marginTop:12,backgroundColor:C.emerald4,padding:8,borderRadius:8},
  srcTxt:{fontSize:12,color:C.emerald,fontWeight:'600'},
  navRow:{flexDirection:'row',margin:16,gap:8},
  navBtn:{flex:1,backgroundColor:C.emerald,padding:12,borderRadius:10,alignItems:'center'},
  navOff:{backgroundColor:C.gray2},
  navTxt:{color:'white',fontWeight:'600'},
  learnCard:{flexDirection:'row',backgroundColor:'white',marginHorizontal:16,marginTop:10,padding:16,borderRadius:12,borderWidth:1,borderColor:C.gray2,alignItems:'center'},
  learnTitle:{fontSize:15,fontWeight:'700',color:C.text},
  learnAr:{fontSize:13,color:C.emerald,marginTop:2,marginBottom:4},
  learnDesc:{fontSize:12,color:C.gray3,lineHeight:18},
  lessonCard:{margin:16,backgroundColor:'white',borderRadius:12,padding:20,borderWidth:1,borderColor:C.gray2},
  lessonLbl:{fontSize:10,fontWeight:'700',color:C.gray3,letterSpacing:1.5,textTransform:'uppercase',marginBottom:4},
  lessonContent:{fontSize:14,color:C.text2,lineHeight:24},
  tabRow:{flexDirection:'row',margin:16,gap:8},
  tabBtn:{flex:1,padding:10,borderRadius:8,borderWidth:1,borderColor:C.gray2,alignItems:'center',backgroundColor:'white'},
  tabActive:{backgroundColor:C.emerald,borderColor:C.emerald},
  tabTxt:{fontSize:13,fontWeight:'600',color:C.text2},
  letGrid:{flexDirection:'row',flexWrap:'wrap',padding:8},
  letCard:{width:'22%',margin:'1.5%',backgroundColor:'white',borderRadius:10,padding:10,alignItems:'center',borderWidth:1,borderColor:C.gray2},
  letBig:{fontSize:32,color:C.emerald,fontWeight:'700'},
  letName:{fontSize:10,color:C.text2,fontWeight:'600',marginTop:4},
  letSound:{fontSize:9,color:C.gray3,marginTop:1},
  secLabel:{fontSize:11,fontWeight:'700',color:C.emerald,letterSpacing:1,textTransform:'uppercase',marginTop:16,marginBottom:8,paddingBottom:4,borderBottomWidth:1,borderBottomColor:C.gray2},
  fieldLbl:{fontSize:12,color:C.gray3,marginBottom:4},
  fieldIn:{backgroundColor:'white',borderWidth:1,borderColor:C.gray2,borderRadius:8,padding:10,fontSize:14,color:C.text,marginBottom:2},
  pillRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  pill:{paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.gray2,backgroundColor:'white'},
  pillOn:{backgroundColor:C.emerald,borderColor:C.emerald},
  pillTxt:{fontSize:13,color:C.text2,fontWeight:'600'},
  calcBtn:{backgroundColor:C.emerald,padding:16,borderRadius:12,alignItems:'center',marginTop:8},
  calcTxt:{color:'white',fontSize:16,fontWeight:'700'},
  resultCard:{backgroundColor:C.emerald,borderRadius:12,padding:20,alignItems:'center',marginTop:16},
  resLbl:{fontSize:11,color:'#A7F3D0',letterSpacing:2,textTransform:'uppercase'},
  resAmt:{fontSize:36,color:C.gold2,fontWeight:'700',marginVertical:8},
  infoBox:{padding:12,backgroundColor:C.emerald4,borderRadius:8,borderWidth:1,borderColor:C.emerald3},
  infoTxt:{fontSize:12,color:'#065F46',lineHeight:18},
});