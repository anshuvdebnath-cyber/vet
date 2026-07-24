import { KnowledgeBaseItem, StructuredIntake, SeverityTier, TriageResult } from '../types';
import { KNOWLEDGE_BASE, UNIDENTIFIED_RISK_ITEM } from '../data/knowledgeBase';

export function evaluateEmergencyRules(intake: StructuredIntake): {
  severity: SeverityTier;
  knowledgeItem: KnowledgeBaseItem;
  isUnidentifiedRisk: boolean;
  ruleReasoning: string;
} {
  const normalizedKey = (intake.identified_entity_key || '').toLowerCase().trim();
  const normalizedSubstance = (intake.suspected_substance_or_hazard || '').toLowerCase().trim();

  // Try exact key match
  let matchedItem = KNOWLEDGE_BASE.find(item => item.key === normalizedKey);

  // If no exact key match, search by aliases or names
  if (!matchedItem && (normalizedKey || normalizedSubstance)) {
    const searchText = `${normalizedKey} ${normalizedSubstance}`;
    matchedItem = KNOWLEDGE_BASE.find(item => {
      const nameMatch = item.name.toLowerCase().includes(searchText) || searchText.includes(item.name.toLowerCase());
      const aliasMatch = item.aliases.some(alias => searchText.includes(alias.toLowerCase()));
      return nameMatch || aliasMatch;
    });
  }

  // UNIDENTIFIED HAZARD FALLBACK
  if (!matchedItem) {
    return {
      severity: 'Critical',
      knowledgeItem: UNIDENTIFIED_RISK_ITEM,
      isUnidentifiedRisk: true,
      ruleReasoning: `UNIDENTIFIED-RISK LOCK: Hazard "${intake.suspected_substance_or_hazard || 'Unspecified Hazard'}" has no verified match in the local medical knowledge base. The safety rule engine enforced High Alert (Critical) protocol to protect against unverified toxic hazards.`
    };
  }

  // DETERMINISTIC SEVERITY CALCULATION
  let severity: SeverityTier = matchedItem.defaultSeverity;

  // Check species override
  if (matchedItem.speciesSpecificSeverity && intake.species in matchedItem.speciesSpecificSeverity) {
    const speciesOverride = matchedItem.speciesSpecificSeverity[intake.species];
    if (speciesOverride) {
      severity = speciesOverride;
    }
  }

  // Corrosive/Caustic override
  if (intake.is_corrosive_or_caustic || matchedItem.category === 'Chemical/Corrosive') {
    severity = 'Critical';
  }

  // Elapsed time elevation
  if (intake.elapsed_time_minutes && intake.elapsed_time_minutes > 120 && severity === 'Vet Today') {
    // If symptoms are already present after 2+ hours, elevate to Critical
    if (intake.symptoms && intake.symptoms.length > 0) {
      severity = 'Critical';
    }
  }

  let reasoning = `LOCKED VERDICT: Matched knowledge base entry "${matchedItem.name}". `;
  if (matchedItem.speciesSpecificSeverity?.[intake.species]) {
    reasoning += `Applied species-specific rule for ${intake.species} (${severity}). `;
  } else {
    reasoning += `Base severity assigned (${severity}). `;
  }

  if (intake.is_corrosive_or_caustic) {
    reasoning += `Corrosive/chemical exposure detected — forced Critical tier to prohibit vomiting. `;
  }

  return {
    severity,
    knowledgeItem: matchedItem,
    isUnidentifiedRisk: false,
    ruleReasoning: reasoning.trim()
  };
}

export function buildFallbackExplanation(
  intake: StructuredIntake,
  severity: SeverityTier,
  knowledgeItem: KnowledgeBaseItem,
  isUnidentifiedRisk: boolean,
  language: 'English' | 'Hindi' | 'Hinglish' = 'English'
) {
  const isHinglish = language === 'Hinglish';
  const isHindi = language === 'Hindi';

  if (isHinglish) {
    return {
      reassuringSummary: isUnidentifiedRisk 
        ? 'Aap bilkul mat ghabraiye. Incident note ho gaya hai. Emergency rule ke mutabiq yeh UNIDENTIFIED-RISK hai, isliye turant vet ko dikhana safe rahega.'
        : `Ghabraiye mat. Humne ${knowledgeItem.name} ka emergency rule apply kar diya hai. Current Status: ${severity}. Niche diye gaye steps follow karein.`,
      whyThisSeverity: `Verdict: ${severity}. ${isUnidentifiedRisk ? 'Unrecognized substance hone ki wajah se safety rule engine ne RED ALERT (Critical) tier locked kiya hai.' : `${knowledgeItem.name} toxic principles (${knowledgeItem.toxicPrinciple}) ki wajah se deterministic rule engine ne yeh severity lock ki hai.`}`,
      firstAidSteps: knowledgeItem.immediateFirstAid,
      warningsAndDonts: knowledgeItem.criticalWarnings,
      whatToTellVet: `Species: ${intake.species}, Weight: ${intake.weight_kg ? intake.weight_kg + 'kg' : 'Unknown'}, Suspected: ${intake.suspected_substance_or_hazard}, Elapsed: ${intake.elapsed_time_minutes ? intake.elapsed_time_minutes + ' mins' : 'Unknown'}, Symptoms: ${intake.symptoms.join(', ') || 'None reported'}, Severity Tier: ${severity}`
    };
  }

  if (isHindi) {
    return {
      reassuringSummary: isUnidentifiedRisk
        ? 'कृपया शांत रहें। घटना दर्ज की गई है। अज्ञात पदार्थ सुरक्षा नियम के तहत यह उच्च जोखिम में है, तुरंत नजदीकी पशु चिकित्सक से संपर्क करें।'
        : `कृपया घबराएं नहीं। हमने ${knowledgeItem.name} के लिए आपातकालीन नियम लागू किए हैं। स्थिति: ${severity}। नीचे दिए गए प्राथमिक उपचार चरणों का पालन करें।`,
      whyThisSeverity: `स्थिति: ${severity}। ${isUnidentifiedRisk ? 'अज्ञात पदार्थ होने के कारण सुरक्षा प्रणाली ने इसे क्रिटिकल श्रेणी में रखा है।' : `${knowledgeItem.name} के विषाक्त प्रभावों के कारण नियम इंजन द्वारा यह निर्णय लिया गया है।`}`,
      firstAidSteps: knowledgeItem.immediateFirstAid,
      warningsAndDonts: knowledgeItem.criticalWarnings,
      whatToTellVet: `प्रजाति: ${intake.species}, वजन: ${intake.weight_kg ? intake.weight_kg + 'किग्रा' : 'अज्ञात'}, संदिग्ध पदार्थ: ${intake.suspected_substance_or_hazard}, बीता समय: ${intake.elapsed_time_minutes ? intake.elapsed_time_minutes + ' मिनट' : 'अज्ञात'}, लक्षण: ${intake.symptoms.join(', ') || 'कोई नहीं'}, गंभीरता: ${severity}`
    };
  }

  return {
    reassuringSummary: isUnidentifiedRisk
      ? 'Stay calm. The incident is logged. Under safety protocols, an unrecognized substance defaults to HIGH ALERT (Critical) to prevent delayed toxicity.'
      : `Stay calm. Emergency rules applied for ${knowledgeItem.name}. Current Status: ${severity}. Follow the first-aid steps below immediately.`,
    whyThisSeverity: `Locked Status: ${severity}. ${isUnidentifiedRisk ? 'Locked as Critical by the deterministic safety engine because the substance is unverified.' : `Locked based on verified medical toxicology profiles for ${knowledgeItem.name}.`}`,
    firstAidSteps: knowledgeItem.immediateFirstAid,
    warningsAndDonts: knowledgeItem.criticalWarnings,
    whatToTellVet: `Species: ${intake.species}, Weight: ${intake.weight_kg ? intake.weight_kg + 'kg' : 'Unknown'}, Hazard: ${intake.suspected_substance_or_hazard}, Elapsed Time: ${intake.elapsed_time_minutes ? intake.elapsed_time_minutes + ' mins' : 'Unknown'}, Observed Symptoms: ${intake.symptoms.join(', ') || 'None'}, Severity Tier: ${severity}`
  };
}
