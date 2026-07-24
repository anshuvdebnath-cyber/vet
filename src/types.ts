export type SeverityTier = 'Safe' | 'Monitor' | 'Vet Today' | 'Critical';

export type Species = 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Exotic' | 'Unknown';

export type LanguageOption = 'English' | 'Hindi' | 'Hinglish';

export interface KnowledgeBaseItem {
  key: string;
  name: string;
  aliases: string[];
  category: 'Toxic Food' | 'Plant' | 'Chemical/Corrosive' | 'Medication' | 'Bite/Sting' | 'Foreign Object' | 'Environmental';
  defaultSeverity: SeverityTier;
  speciesSpecificSeverity?: Partial<Record<Species, SeverityTier>>;
  toxicPrinciple: string;
  commonSymptoms: string[];
  immediateFirstAid: string[];
  criticalWarnings: string[];
  preTransitCare: string[];
}

export interface StructuredIntake {
  species: Species;
  weight_kg: number | null;
  identified_entity_key: string | null;
  suspected_substance_or_hazard: string;
  elapsed_time_minutes: number | null;
  symptoms: string[];
  language_detected: LanguageOption;
  is_corrosive_or_caustic?: boolean;
}

export interface TriageResult {
  intake: StructuredIntake;
  severity: SeverityTier;
  knowledgeItem: KnowledgeBaseItem | null;
  isUnidentifiedRisk: boolean;
  ruleReasoning: string;
  explanation: {
    reassuringSummary: string;
    whyThisSeverity: string;
    firstAidSteps: string[];
    warningsAndDonts: string[];
    whatToTellVet: string;
  };
  timestamp: string;
}

export interface EmergencyClinic {
  id: string;
  name: string;
  leadDoctor: string;
  doctorSpecialty: string;
  doctorQualifications?: string;
  address: string;
  city: string;
  phone: string;
  distanceKm: number;
  driveTimeMins: number;
  isOpen247: boolean;
  hasICU: boolean;
  hasEndoscopy: boolean;
  treatsExotics: boolean;
  rating: number;
  reviewsCount: number;
  lat: number;
  lng: number;
}

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  hazardOrSubstance?: string;
  severity?: SeverityTier;
  symptoms?: string[];
  reassuringSummary?: string;
  ruleReasoning?: string;
}

export interface PetProfile {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ageYears: number;
  weightKg: number;
  allergies: string[];
  chronicConditions: string[];
  vaccinations: { name: string; date: string }[];
  medicalHistory?: MedicalRecord[];
  microchipId?: string;
  emergencyContact: string;
}

export interface QRClinicalHandoff {
  petName: string;
  species: Species;
  breed: string;
  weightKg: number | null;
  suspectedHazard: string;
  elapsedTime: string;
  severity: SeverityTier;
  isUnidentifiedRisk: boolean;
  observedSymptoms: string[];
  allergies: string[];
  preExistingConditions: string[];
  emergencyContact: string;
  timestamp: string;
}
