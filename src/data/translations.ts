import { LanguageOption } from '../types';

export interface UIStrings {
  appTitle: string;
  appSubtitle: string;
  emergencyAlertBanner: string;
  callEmergencyVet: string;
  triageTab: string;
  mapTab: string;
  passportTab: string;
  knowledgeBaseTab: string;
  architectureTab: string;
  intakeTitle: string;
  intakeSubtitle: string;
  describeIncidentPlaceholder: string;
  uploadPhotoLabel: string;
  photoUploaded: string;
  voiceDictation: string;
  listening: string;
  selectSpecies: string;
  petWeight: string;
  unknownWeight: string;
  languageSelect: string;
  sampleScenarios: string;
  analyzeEmergencyBtn: string;
  analyzingBtn: string;
  severitySafe: string;
  severityMonitor: string;
  severityVetToday: string;
  severityCritical: string;
  unidentifiedRiskBadge: string;
  whySeverityLocked: string;
  firstAidHeader: string;
  warningsHeader: string;
  vetSummaryHeader: string;
  copySummaryBtn: string;
  summaryCopied: string;
  generateQrBtn: string;
  findNearbyVetsBtn: string;
  qrTitle: string;
  qrSubtitle: string;
  printHandoffBtn: string;
  nearestVetsHeader: string;
  filter247: string;
  filterICU: string;
  filterExotic: string;
  callNowBtn: string;
  directionsBtn: string;
  clinicAiReasoning: string;
  addPetProfile: string;
  petName: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  allergies: string;
  chronicConditions: string;
  savePetBtn: string;
}

export const TRANSLATIONS: Record<LanguageOption, UIStrings> = {
  English: {
    appTitle: 'VetLens Edge',
    appSubtitle: 'AI-Grounded Veterinary Emergency Triage',
    emergencyAlertBanner: 'EMERGENCY HOTLINE: If your pet is unresponsive or bleeding severely, go to the nearest vet hospital immediately.',
    callEmergencyVet: 'Call Emergency Vet',
    triageTab: 'Emergency Triage',
    mapTab: 'Vet Map & ICU',
    passportTab: 'Pet Passport & QR',
    knowledgeBaseTab: 'Hazard Database',
    architectureTab: 'Safety Architecture',
    intakeTitle: 'Describe the Incident or Upload Photo',
    intakeSubtitle: 'Type in English, Hindi, or Hinglish. Include what happened, species, and weight if known.',
    describeIncidentPlaceholder: 'e.g. "My 12kg Labrador ate 2 chocolate brownies 30 mins ago, now drooling and vomiting"',
    uploadPhotoLabel: 'Add Photo of Plant / Packaging / Vomit',
    photoUploaded: 'Photo attached & auto-compressed for fast transmission',
    voiceDictation: 'Speak Incident (Voice)',
    listening: 'Listening... speak clearly',
    selectSpecies: 'Pet Species',
    petWeight: 'Weight (kg)',
    unknownWeight: 'Weight unknown',
    languageSelect: 'Output Language',
    sampleScenarios: 'Quick Test Scenarios (Click to Load):',
    analyzeEmergencyBtn: 'RUN VETLENS EMERGENCY TRIAGE',
    analyzingBtn: 'Evaluating Safety Rules...',
    severitySafe: 'Safe - Low Risk',
    severityMonitor: 'Monitor at Home',
    severityVetToday: 'Vet Visit Required Today',
    severityCritical: 'CRITICAL EMERGENCY - GO TO VET NOW',
    unidentifiedRiskBadge: 'UNIDENTIFIED-RISK / UNRECOGNIZED HAZARD',
    whySeverityLocked: 'Why Verdict Was Locked by Rule Engine:',
    firstAidHeader: 'Immediate First-Aid Action Steps (DOs):',
    warningsHeader: 'CRITICAL WARNINGS (DON\'Ts):',
    vetSummaryHeader: 'Clinical Transcript for Vet Receptionist:',
    copySummaryBtn: 'Copy Transcript',
    summaryCopied: 'Copied to Clipboard!',
    generateQrBtn: 'Generate Clinical QR Handoff',
    findNearbyVetsBtn: 'Find Open Emergency Vets',
    qrTitle: 'Clinical Handoff QR Code',
    qrSubtitle: 'Show this QR code to the vet clinic receptionist for instant 2-second intake registration without re-interviewing.',
    printHandoffBtn: 'Print / Download Handoff Summary',
    nearestVetsHeader: 'Nearby Emergency Vet Hospitals & ICUs',
    filter247: '24/7 Open Only',
    filterICU: 'Has ICU Facility',
    filterExotic: 'Exotic Pets Specialist',
    callNowBtn: 'Call Hospital Now',
    directionsBtn: 'Get Directions',
    clinicAiReasoning: 'AI Facility Recommendation:',
    addPetProfile: 'Add / Edit Pet Profile',
    petName: 'Pet Name',
    species: 'Species',
    breed: 'Breed',
    age: 'Age (Years)',
    weight: 'Weight (kg)',
    allergies: 'Known Allergies',
    chronicConditions: 'Pre-existing Conditions',
    savePetBtn: 'Save Pet Profile'
  },
  Hindi: {
    appTitle: 'VetLens Edge',
    appSubtitle: 'एआई-आधारित पशु आपातकालीन प्राथमिक सहायता',
    emergencyAlertBanner: 'आपातकालीन चेतावनी: यदि आपका पालतू पशु बेहोश है या अत्यधिक रक्तस्राव हो रहा है, तो तुरंत निकटतम अस्पताल जाएँ।',
    callEmergencyVet: 'आपातकालीन डॉक्टर को कॉल करें',
    triageTab: 'आपातकालीन जांच',
    mapTab: 'नजदीकी अस्पताल व आईसीयू',
    passportTab: 'पेट पासपोर्ट और क्यूआर',
    knowledgeBaseTab: 'विषैलता डेटाबेस',
    architectureTab: 'सुरक्षा वास्तुकला',
    intakeTitle: 'घटना का विवरण दें या फोटो अपलोड करें',
    intakeSubtitle: 'अंग्रेजी, हिंदी या हिंग्लिश में लिखें। क्या खाया, प्रजाति और वजन दर्ज करें।',
    describeIncidentPlaceholder: 'जैसे: "मेरे 12kg लेब्राडोर ने 30 मिनट पहले चॉकलेट केक खाया, अब मुंह से लार आ रही है"',
    uploadPhotoLabel: 'पौधे / पैकेट / उल्टी की फोटो जोड़ें',
    photoUploaded: 'फोटो संलग्न और स्वचालित रूप से कंप्रेस की गई',
    voiceDictation: 'बोलकर बताएं (आवाज)',
    listening: 'सुन रहे हैं... स्पष्ट बोलें',
    selectSpecies: 'पालतू जीव की प्रजाति',
    petWeight: 'वजन (किग्रा)',
    unknownWeight: 'वजन अज्ञात',
    languageSelect: 'उत्तर की भाषा',
    sampleScenarios: 'त्वरित परीक्षण परिदृश्य (क्लिक करें):',
    analyzeEmergencyBtn: 'आपातकालीन जांच शुरू करें',
    analyzingBtn: 'सुरक्षा नियमों की जांच जारी...',
    severitySafe: 'सुरक्षित - कम जोखिम',
    severityMonitor: 'घर पर निगरानी रखें',
    severityVetToday: 'आज ही डॉक्टर को दिखाएं',
    severityCritical: 'अत्यंत गंभीर - तुरंत अस्पताल जाएं',
    unidentifiedRiskBadge: 'अज्ञात पदार्थ - उच्च सतर्कता',
    whySeverityLocked: 'सुरक्षा नियम द्वारा निर्णय क्यों लिया गया:',
    firstAidHeader: 'तत्काल प्राथमिक उपचार के कदम (क्या करें):',
    warningsHeader: 'गंभीर चेतावनियां (क्या न करें):',
    vetSummaryHeader: 'डॉक्टर/रिसेप्शनिस्ट के लिए सारांश:',
    copySummaryBtn: 'सारांश कॉपी करें',
    summaryCopied: 'कॉपी हो गया!',
    generateQrBtn: 'क्लिनिकल क्यूआर कोड बनाएं',
    findNearbyVetsBtn: 'निकटतम आपातकालीन डॉक्टर खोजें',
    qrTitle: 'क्लिनिकल हैंडऑफ क्यूआर कोड',
    qrSubtitle: 'अस्पताल रिसेप्शनिस्ट को यह क्यूआर कोड दिखाएं ताकि बिना समय गंवाए पंजीकरण हो सके।',
    printHandoffBtn: 'हैंडऑफ रिपोर्ट प्रिंट/डाउनलोड करें',
    nearestVetsHeader: 'निकटतम 24/7 आपातकालीन पशु अस्पताल',
    filter247: 'केवल 24/7 खुले',
    filterICU: 'आईसीयू सुविधा उपलब्ध',
    filterExotic: 'दुर्लभ पशु विशेषज्ञ',
    callNowBtn: 'अस्पताल को कॉल करें',
    directionsBtn: 'दिशा-निर्देश प्राप्त करें',
    clinicAiReasoning: 'एआई अस्पताल की सिफारिश:',
    addPetProfile: 'पालतू पशु की जानकारी जोड़ें/संपादित करें',
    petName: 'पालतू पशु का नाम',
    species: 'प्रजाति',
    breed: 'नस्ल',
    age: 'आयु (वर्ष)',
    weight: 'वजन (किग्रा)',
    allergies: 'एलर्जी',
    chronicConditions: 'पुरानी बीमारियां',
    savePetBtn: 'प्रोफाइल सहेजें'
  },
  Hinglish: {
    appTitle: 'VetLens Edge',
    appSubtitle: 'AI-Grounded Veterinary Emergency Support',
    emergencyAlertBanner: 'EMERGENCY ALERT: Agar pet responsive nahi hai ya severe bleeding hai, toh turant paas ke emergency vet clinic jaayein.',
    callEmergencyVet: 'Call Emergency Vet',
    triageTab: 'Emergency Triage',
    mapTab: 'Vet Map & ICU',
    passportTab: 'Pet Passport & QR',
    knowledgeBaseTab: 'Hazard Database',
    architectureTab: 'Safety Architecture',
    intakeTitle: 'Incident Describe Karein Ya Photo Upload Karein',
    intakeSubtitle: 'English, Hindi, ya Hinglish me likhein. Kya khaya, species, aur weight batayein.',
    describeIncidentPlaceholder: 'e.g. "Mera 12kg Labrador ne 30 min pehle chocolate cake khaya tha, ab vomiting kar raha hai"',
    uploadPhotoLabel: 'Plant / Package / Vomit ki Photo Add Karein',
    photoUploaded: 'Photo attach ho gayi aur auto-compress ho gayi',
    voiceDictation: 'Bol kar batayein (Voice)',
    listening: 'Sun rahe hain... bolen',
    selectSpecies: 'Pet Ki Species',
    petWeight: 'Weight (kg)',
    unknownWeight: 'Weight unknown',
    languageSelect: 'Output Language',
    sampleScenarios: 'Sample Test Cases (Click to load):',
    analyzeEmergencyBtn: 'RUN EMERGENCY TRIAGE',
    analyzingBtn: 'Evaluating Safety Rules...',
    severitySafe: 'Safe - Low Risk',
    severityMonitor: 'Ghar Par Monitor Karein',
    severityVetToday: 'Aaj Hi Vet Ko Dikhayein',
    severityCritical: 'CRITICAL EMERGENCY - TURANT VET KE PAAS JAAYEIN',
    unidentifiedRiskBadge: 'UNIDENTIFIED-RISK / UNRECOGNIZED HAZARD',
    whySeverityLocked: 'Rule Engine Ne Verdict Kyun Lock Kiya:',
    firstAidHeader: 'Immediate First-Aid Steps (Kya Karein):',
    warningsHeader: 'CRITICAL WARNINGS (Kya BILKUL Na Karein):',
    vetSummaryHeader: 'Vet Receptionist Ke Liye Clinical Summary:',
    copySummaryBtn: 'Transcript Copy Karein',
    summaryCopied: 'Copied to Clipboard!',
    generateQrBtn: 'Clinical QR Handoff Banayein',
    findNearbyVetsBtn: 'Nearby Emergency Vets Dhoondhein',
    qrTitle: 'Clinical Handoff QR Code',
    qrSubtitle: 'Vet clinic receptionist ko yeh QR code dikhayein instant registration ke liye.',
    printHandoffBtn: 'Print / Download Summary',
    nearestVetsHeader: 'Nearby Emergency Vet Hospitals & ICUs',
    filter247: 'Only 24/7 Open',
    filterICU: 'Has ICU Facility',
    filterExotic: 'Exotic Pets Specialist',
    callNowBtn: 'Call Hospital Now',
    directionsBtn: 'Get Directions',
    clinicAiReasoning: 'AI Hospital Recommendation:',
    addPetProfile: 'Add / Edit Pet Profile',
    petName: 'Pet Name',
    species: 'Species',
    breed: 'Breed',
    age: 'Age (Years)',
    weight: 'Weight (kg)',
    allergies: 'Known Allergies',
    chronicConditions: 'Pre-existing Conditions',
    savePetBtn: 'Save Profile'
  }
};
