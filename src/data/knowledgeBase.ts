import { KnowledgeBaseItem, SeverityTier } from '../types';
import hazardDataRaw from './hazards.json';

interface RawHazard {
  display_name: string;
  severity: string;
  first_aid_steps: string[];
  mechanism_explanation: string;
}

const hazardDataMap = hazardDataRaw as Record<string, RawHazard>;

function mapSeverity(sev: string): SeverityTier {
  const s = sev.toLowerCase().trim();
  if (s === 'critical') return 'Critical';
  if (s === 'vet_today') return 'Vet Today';
  if (s === 'monitor') return 'Monitor';
  if (s === 'low' || s === 'safe') return 'Safe';
  return 'Critical';
}

function inferCategory(key: string, displayName: string): KnowledgeBaseItem['category'] {
  const k = key.toLowerCase();
  const d = displayName.toLowerCase();

  if (
    k.includes('lily') || k.includes('palm') || k.includes('plant') || k.includes('crocus') ||
    k.includes('foxglove') || k.includes('dieffenbachia') || k.includes('aloe') || k.includes('poinsettia') ||
    k.includes('philodendron') || k.includes('ivy') || k.includes('hyacinth') || k.includes('chrysanthemum') ||
    k.includes('bean') || k.includes('cyclamen') || k.includes('kalanchoe') || k.includes('yew') ||
    k.includes('berry') || k.includes('tomato') || k.includes('rhubarb') || k.includes('azalea') ||
    k.includes('tulip') || k.includes('oleander') || k.includes('pothos') || d.includes('plant')
  ) {
    return 'Plant';
  }

  if (
    k.includes('sting') || k.includes('bite') || k.includes('snake') || k.includes('scorpion') ||
    k.includes('spider') || k.includes('tick') || k.includes('toad') || k.includes('centipede') ||
    k.includes('jellyfish') || k.includes('ant') || d.includes('sting') || d.includes('bite')
  ) {
    return 'Bite/Sting';
  }

  if (
    k.includes('paracetamol') || k.includes('nsaid') || k.includes('aspirin') || k.includes('ssri') ||
    k.includes('adhd') || k.includes('blocker') || k.includes('vitamin') || k.includes('iron') ||
    k.includes('benzodiazepine') || k.includes('steroid') || k.includes('insulin') || k.includes('inhibitor') ||
    k.includes('pill') || k.includes('ibuprofen') || k.includes('medication') || d.includes('medication') ||
    d.includes('pill')
  ) {
    return 'Medication';
  }

  if (
    k.includes('battery') || k.includes('foreign') || k.includes('hook') || k.includes('choking') ||
    k.includes('cob') || k.includes('cord') || k.includes('silica') || k.includes('glue') ||
    d.includes('foreign') || d.includes('obstruction')
  ) {
    return 'Foreign Object';
  }

  if (
    k.includes('heatstroke') || k.includes('hypothermia') || k.includes('smoke') || k.includes('trauma') ||
    k.includes('burn') || k.includes('drowning') || k.includes('shock') || k.includes('anaphylaxis') ||
    d.includes('trauma') || d.includes('heatstroke')
  ) {
    return 'Environmental';
  }

  if (
    k.includes('poison') || k.includes('bleach') || k.includes('kerosene') || k.includes('pesticide') ||
    k.includes('mothballs') || k.includes('acid') || k.includes('fertilizer') || k.includes('antifreeze') ||
    k.includes('cleaner') || k.includes('detergent') || k.includes('sanitizer') || k.includes('solvent') ||
    k.includes('oil') || k.includes('chlorine') || k.includes('deet') || k.includes('dettol') ||
    k.includes('phenyl') || d.includes('cleaner') || d.includes('chemical')
  ) {
    return 'Chemical/Corrosive';
  }

  return 'Toxic Food';
}

function generateAliases(key: string, displayName: string): string[] {
  const set = new Set<string>();
  set.add(key.toLowerCase().replace(/_/g, ' '));
  set.add(key.toLowerCase());

  // Split display name by punctuation
  const tokens = displayName.toLowerCase().split(/[\/(),\-&]/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed.length > 2) {
      set.add(trimmed);
    }
  }

  set.add(displayName.toLowerCase().trim());
  return Array.from(set);
}

// Map raw JSON entries to KnowledgeBaseItem objects
const JSON_KNOWLEDGE_ITEMS: KnowledgeBaseItem[] = Object.entries(hazardDataMap).map(([key, raw]) => {
  const category = inferCategory(key, raw.display_name);
  const defaultSeverity = mapSeverity(raw.severity);
  const aliases = generateAliases(key, raw.display_name);

  return {
    key,
    name: raw.display_name,
    aliases,
    category,
    defaultSeverity,
    toxicPrinciple: raw.mechanism_explanation,
    commonSymptoms: [
      'Vomiting',
      'Drooling / Salivation',
      'Lethargy / Weakness',
      'Loss of appetite',
      'Restlessness'
    ],
    immediateFirstAid: raw.first_aid_steps,
    criticalWarnings: [
      'DO NOT induce vomiting unless specifically instructed by a licensed veterinarian.',
      'Bring packaging, product container, or plant/vomit sample to the emergency clinic.',
      'Seek immediate professional veterinary triage if any symptoms progress.'
    ],
    preTransitCare: [
      'Keep pet warm, calm, and resting comfortably during transit.',
      'Avoid giving home remedies or human medications.'
    ]
  };
});

// Hand-crafted curated items with species-specific rules
const HAND_CRAFTED_ITEMS: KnowledgeBaseItem[] = [
  {
    key: 'chocolate',
    name: 'Chocolate / Cocoa',
    aliases: ['chocolate', 'cocoa', 'chocolates', 'dark chocolate', 'brownie', 'cocoa powder', 'chocolate cake'],
    category: 'Toxic Food',
    defaultSeverity: 'Vet Today',
    speciesSpecificSeverity: {
      Dog: 'Vet Today',
      Cat: 'Critical',
      Rabbit: 'Critical',
    },
    toxicPrinciple: 'Theobromine & Caffeine (Methylxanthines). Causes central nervous system stimulation and cardiac arrhythmias.',
    commonSymptoms: ['Vomiting', 'Diarrhea', 'Panting', 'Restlessness', 'Increased heart rate', 'Seizures'],
    immediateFirstAid: [
      'Identify chocolate type (Dark/Baker\'s chocolate is far more toxic than milk chocolate).',
      'Note exact weight consumed and time elapsed.',
      'Provide fresh drinking water if pet is conscious and not vomiting.'
    ],
    criticalWarnings: [
      'DO NOT induce vomiting if pet is lethargic, unresponsive, or experiencing seizures.',
      'DO NOT give home remedies like hydrogen peroxide without direct vet instruction.'
    ],
    preTransitCare: [
      'Keep the original chocolate wrapper to show the vet for cocoa percentage calculation.',
      'Keep pet cool and quiet in the car to reduce cardiac stress.'
    ]
  },
  {
    key: 'xylitol',
    name: 'Xylitol / Birch Sugar',
    aliases: ['xylitol', 'birch sugar', 'sugar free gum', 'sugarfree gum', 'orbit gum', 'chewing gum', 'diet peanut butter'],
    category: 'Toxic Food',
    defaultSeverity: 'Critical',
    toxicPrinciple: 'Causes massive, rapid insulin release in dogs, leading to severe, life-threatening hypoglycemia and acute liver necrosis.',
    commonSymptoms: ['Vomiting', 'Sudden weakness / collapse', 'Staggering / loss of coordination', 'Lethargy', 'Seizures', 'Jaundice'],
    immediateFirstAid: [
      'Triage immediately as a RED ALERT critical emergency.',
      'If pet is conscious and staggering, rub a small drop of honey or sugar syrup on gums while heading to the emergency clinic.'
    ],
    criticalWarnings: [
      'DO NOT DELAY. Xylitol can cause fatal low blood sugar in as little as 15 to 30 minutes.',
      'DO NOT induce vomiting if the pet is showing weakness or neurological signs.'
    ],
    preTransitCare: [
      'Bring gum/sweetener packaging with ingredient list.',
      'Keep pet wrapped in a warm blanket.'
    ]
  },
  {
    key: 'lilies',
    name: 'Lilies (True Lilies / Daylilies)',
    aliases: ['lily', 'lilies', 'easter lily', 'tiger lily', 'daylily', 'stargazer lily', 'peace lily'],
    category: 'Plant',
    defaultSeverity: 'Critical',
    speciesSpecificSeverity: {
      Cat: 'Critical',
      Dog: 'Monitor',
    },
    toxicPrinciple: 'In cats, ALL parts of true lilies (pollen, stem, petals, water in vase) cause acute, irreversible renal failure within 12-72 hours.',
    commonSymptoms: ['Vomiting', 'Drooling', 'Loss of appetite', 'Lethargy', 'Decreased urination or excessive drinking', 'Kidney failure'],
    immediateFirstAid: [
      'For cats: Wash any pollen off fur immediately with warm water so they do not lick it off.',
      'Collect sample of the plant or take a clear photograph.'
    ],
    criticalWarnings: [
      'FOR CATS: Even licking a single grain of lily pollen is a FATAL EMERGENCY.',
      'DO NOT wait for symptoms to appear before going to the clinic.'
    ],
    preTransitCare: [
      'Transport cat immediately to a 24/7 emergency clinic with IV fluid therapy capabilities.'
    ]
  }
];

// Combine JSON items with hand-crafted items without duplicate keys
const itemMap = new Map<string, KnowledgeBaseItem>();

// Add JSON items first
JSON_KNOWLEDGE_ITEMS.forEach(item => {
  itemMap.set(item.key, item);
});

// Override or add hand-crafted items (preserves species-specific rules)
HAND_CRAFTED_ITEMS.forEach(item => {
  itemMap.set(item.key, item);
});

export const KNOWLEDGE_BASE: KnowledgeBaseItem[] = Array.from(itemMap.values());

export const UNIDENTIFIED_RISK_ITEM: KnowledgeBaseItem = {
  key: 'unidentified_hazard',
  name: 'Unrecognized Hazard / Unidentified Substance',
  aliases: [],
  category: 'Environmental',
  defaultSeverity: 'Critical',
  toxicPrinciple: 'Unverified chemical, plant, or toxin. Safety boundary requires High Alert protocol to prevent fatal delayed toxicity.',
  commonSymptoms: ['Unknown / Variable symptoms', 'Salivation', 'Vomiting', 'Neurological changes'],
  immediateFirstAid: [
    'Take a photo of the unknown substance, plant, or container.',
    'Keep pet in a safe, quiet, well-ventilated space.',
    'Gently check inside mouth for chemical burns or discoloration without risking a bite.'
  ],
  criticalWarnings: [
    'DO NOT INDUCE VOMITING on unknown substances. If corrosive or hydrocarbon, vomiting causes severe esophageal and pulmonary aspiration damage.',
    'DO NOT feed milk, oil, or home concoctions.'
  ],
  preTransitCare: [
    'Bring the object, plant specimen, vomit sample, or container in a sealed bag to the emergency vet.',
    'Proceed directly to the nearest emergency veterinary facility.'
  ]
};
