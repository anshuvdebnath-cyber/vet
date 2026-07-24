import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { evaluateEmergencyRules, buildFallbackExplanation } from './src/lib/ruleEngine';
import { KNOWLEDGE_BASE } from './src/data/knowledgeBase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Primary model preference: Gemma 2B (gemma-2-2b-it)
  const PRIMARY_MODEL = process.env.GEMMA_MODEL || 'gemma-2-2b-it';
  const BACKUP_MODEL = 'gemini-3.6-flash';

  /**
   * Helper to execute AI model calls strictly using Gemma as primary, with seamless fallback
   */
  async function generateContentWithFallback(options: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }) {
    const config: any = {};
    if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
    if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
    if (options.responseSchema) config.responseSchema = options.responseSchema;

    try {
      // Attempt 1: Strict Google Gemma Model (gemma-2-2b-it)
      return await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined
      });
    } catch (gemmaErr: any) {
      console.warn(`[Gemma AI] Primary model '${PRIMARY_MODEL}' call failed or parameter incompatible: ${gemmaErr?.message || gemmaErr}. Retrying with backup '${BACKUP_MODEL}'...`);
      // Attempt 2: Backup model (gemini-3.6-flash)
      return await ai.models.generateContent({
        model: BACKUP_MODEL,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined
      });
    }
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'VetLens Edge Server' });
  });

  // Knowledge base keys for Gemma extraction matching
  const knownKeys = KNOWLEDGE_BASE.map(k => k.key);

  /**
   * STEP 1: GEMMA STRUCTURING LAYER (/api/triage/parse)
   * Gemma parses messy human text / image into a strict JSON schema.
   * Safety constraint: Gemma DOES NOT assign severity.
   */
  app.post('/api/triage/parse', async (req, res) => {
    try {
      const { textInput, species, weightKg, language = 'English', imageBase64 } = req.body;

      const systemInstruction = `
You are Gemma 4 NLU, a specialized veterinary emergency intake parsing agent.
Your ONLY job is to convert messy unstructured user descriptions or photos into a strict JSON object.
CRITICAL SAFETY BOUNDARY: You are STRICTLY PROHIBITED from deciding or guessing medical severity (Safe/Critical/etc.). Missing fields must be null.

Knowledge Base Entity Keys to match if applicable:
[${knownKeys.join(', ')}]

Rules:
1. Extract 'species' ('Dog', 'Cat', 'Bird', 'Rabbit', 'Exotic', or 'Unknown').
2. Extract 'weight_kg' if mentioned or provided, else null.
3. Identify 'identified_entity_key': match to one of [${knownKeys.join(', ')}] if clearly applicable, else null.
4. Extract 'suspected_substance_or_hazard': clean name of the ingested/exposed substance or plant or incident (e.g., 'Chocolate', 'Dettol', 'Sago Palm', 'Insect Bite', 'String').
5. Extract 'elapsed_time_minutes': number of minutes elapsed if mentioned, else null.
6. Extract 'symptoms': array of observed clinical symptoms (e.g., ['Vomiting', 'Drooling']).
7. Extract 'language_detected': 'English', 'Hindi', or 'Hinglish'.
8. Extract 'is_corrosive_or_caustic': boolean (true if substance is floor cleaner, acid, bleach, Dettol, Lizol, disinfectant, alkali).
`;

      const parts: any[] = [];
      if (imageBase64) {
        // Strip data url header if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
      }

      const promptText = `User Description: "${textInput || 'Photo uploaded for emergency triage inspection.'}"
Provided Species context: "${species || 'Unknown'}"
Provided Weight context: "${weightKg ? weightKg + 'kg' : 'Unknown'}"
Requested Language: "${language}"`;

      parts.push({ text: promptText });

      const response = await generateContentWithFallback({
        contents: { parts },
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            species: { type: Type.STRING },
            weight_kg: { type: Type.NUMBER, nullable: true },
            identified_entity_key: { type: Type.STRING, nullable: true },
            suspected_substance_or_hazard: { type: Type.STRING },
            elapsed_time_minutes: { type: Type.INTEGER, nullable: true },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            language_detected: { type: Type.STRING },
            is_corrosive_or_caustic: { type: Type.BOOLEAN }
          },
          required: ['species', 'suspected_substance_or_hazard', 'symptoms', 'language_detected']
        }
      });

      const jsonText = response.text || '{}';
      const parsedIntake = JSON.parse(jsonText);

      // Default fallback values if fields were missed
      const structuredIntake = {
        species: (parsedIntake.species as any) || species || 'Unknown',
        weight_kg: parsedIntake.weight_kg !== undefined ? parsedIntake.weight_kg : (weightKg || null),
        identified_entity_key: parsedIntake.identified_entity_key || null,
        suspected_substance_or_hazard: parsedIntake.suspected_substance_or_hazard || textInput || 'Unknown Hazard',
        elapsed_time_minutes: parsedIntake.elapsed_time_minutes !== undefined ? parsedIntake.elapsed_time_minutes : null,
        symptoms: Array.isArray(parsedIntake.symptoms) ? parsedIntake.symptoms : [],
        language_detected: parsedIntake.language_detected || language || 'English',
        is_corrosive_or_caustic: Boolean(parsedIntake.is_corrosive_or_caustic)
      };

      // STEP 2: DETERMINISTIC RULE ENGINE EXECUTION
      // Code decides severity, not LLM!
      const ruleResult = evaluateEmergencyRules(structuredIntake);

      res.json({
        success: true,
        intake: structuredIntake,
        severity: ruleResult.severity,
        knowledgeItem: ruleResult.knowledgeItem,
        isUnidentifiedRisk: ruleResult.isUnidentifiedRisk,
        ruleReasoning: ruleResult.ruleReasoning
      });
    } catch (err: any) {
      console.warn('Gemini API parse failed or rate-limited, engaging offline/local rule engine parser fallback:', err?.message || err);

      const { textInput = '', species = 'Unknown', weightKg = null, language = 'Hinglish' } = req.body;
      const lowerText = textInput.toLowerCase();

      // Local keyword species detection
      let detectedSpecies = species || 'Unknown';
      if (detectedSpecies === 'Unknown' || !detectedSpecies) {
        if (/dog|puppy|kutte|kutta|labrador|pomeranian|golden|street dog/i.test(lowerText)) detectedSpecies = 'Dog';
        else if (/cat|kitten|billi|persian/i.test(lowerText)) detectedSpecies = 'Cat';
        else if (/bird|parrot|pigeon|tota/i.test(lowerText)) detectedSpecies = 'Bird';
        else if (/rabbit|khargosh/i.test(lowerText)) detectedSpecies = 'Rabbit';
      }

      // Local weight extraction
      let detectedWeight = weightKg ? Number(weightKg) : null;
      if (!detectedWeight) {
        const weightMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilograms)/i);
        if (weightMatch) detectedWeight = parseFloat(weightMatch[1]);
      }

      // Local elapsed time extraction
      let detectedElapsed: number | null = null;
      const timeMatch = lowerText.match(/(\d+)\s*(?:min|mins|minute|minutes|hr|hrs|hour|hours)/i);
      if (timeMatch) {
        let val = parseInt(timeMatch[1], 10);
        if (/hr|hour/i.test(timeMatch[0])) val *= 60;
        detectedElapsed = val;
      }

      // Local entity matching against KNOWLEDGE_BASE
      let matchedKey: string | null = null;
      let matchedSubstanceName = textInput || 'Ingested Hazard';

      for (const item of KNOWLEDGE_BASE) {
        const itemKey = item.key.toLowerCase();
        const itemName = item.name.toLowerCase();
        const aliasMatch = item.aliases.some(a => lowerText.includes(a.toLowerCase()));
        if (lowerText.includes(itemKey) || lowerText.includes(itemName) || aliasMatch) {
          matchedKey = item.key;
          matchedSubstanceName = item.name;
          break;
        }
      }

      // Check corrosiveness
      const isCorrosive = /dettol|lizol|harpic|bleach|acid|cleaner|disinfectant|caustic|phenyl/i.test(lowerText);

      // Symptom extraction
      const symptomsList: string[] = [];
      if (/vomit|ulti|vomiting/i.test(lowerText)) symptomsList.push('Vomiting');
      if (/drool|saliva|laar/i.test(lowerText)) symptomsList.push('Hypersalivation / Drooling');
      if (/letharg|dull|weak|unresponsive/i.test(lowerText)) symptomsList.push('Lethargy');
      if (/bleed|khun|blood/i.test(lowerText)) symptomsList.push('Bleeding');
      if (/seizure|fits|chakkar/i.test(lowerText)) symptomsList.push('Seizures');

      const fallbackIntake = {
        species: detectedSpecies,
        weight_kg: detectedWeight,
        identified_entity_key: matchedKey,
        suspected_substance_or_hazard: matchedSubstanceName,
        elapsed_time_minutes: detectedElapsed,
        symptoms: symptomsList,
        language_detected: language || 'Hinglish',
        is_corrosive_or_caustic: isCorrosive
      };

      const ruleResult = evaluateEmergencyRules(fallbackIntake);

      res.json({
        success: true,
        intake: fallbackIntake,
        severity: ruleResult.severity,
        knowledgeItem: ruleResult.knowledgeItem,
        isUnidentifiedRisk: ruleResult.isUnidentifiedRisk,
        ruleReasoning: `${ruleResult.ruleReasoning} (Parsed via Local Edge Rule Engine - Rate Limit Fallback)`
      });
    }
  });

  /**
   * STEP 3: GEMMA EXPLANATION LAYER (/api/triage/explain)
   * Invoked ONLY after the deterministic rule engine severity verdict is locked.
   * Phrased calmly in English, Hindi, or Hinglish.
   */
  app.post('/api/triage/explain', async (req, res) => {
    try {
      const { intake, severity, knowledgeItem, isUnidentifiedRisk, targetLanguage = 'English' } = req.body;

      const prompt = `
You are Gemma 4 Veterinary Emergency Explanation Agent.
The deterministic rule engine has LOCKED the emergency verdict to: "${severity}".
Is Unidentified Risk: ${isUnidentifiedRisk}
Hazard Item: "${knowledgeItem?.name || intake.suspected_substance_or_hazard}"
Species: ${intake.species}, Weight: ${intake.weight_kg ? intake.weight_kg + 'kg' : 'Unknown'}
Elapsed Time: ${intake.elapsed_time_minutes ? intake.elapsed_time_minutes + ' mins' : 'Unknown'}
Observed Symptoms: ${intake.symptoms?.join(', ') || 'None reported'}

Target Language: "${targetLanguage}" (English, Hindi, or Hinglish - e.g. Hinglish: "Aap bilkul mat ghabraiye. Pehle yeh karein...").

Your task:
Generate a calm, highly reassuring, clear, step-by-step emergency explanation natively in ${targetLanguage}.

Rules:
1. Reassure the panicked owner in the very first sentence.
2. Explain clearly why the verdict "${severity}" was locked by the safety engine.
3. List actionable, step-by-step first aid DOs based on the verified medical guidance:
   ${JSON.stringify(knowledgeItem?.immediateFirstAid || [])}
4. List critical DON'Ts and RED FLAGS (especially if corrosive: DO NOT induce vomiting!):
   ${JSON.stringify(knowledgeItem?.criticalWarnings || [])}
5. Provide a crisp 2-sentence clinical handoff summary for the vet receptionist.
`;

      const response = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reassuringSummary: { type: Type.STRING },
            whyThisSeverity: { type: Type.STRING },
            firstAidSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            warningsAndDonts: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatToTellVet: { type: Type.STRING }
          },
          required: ['reassuringSummary', 'whyThisSeverity', 'firstAidSteps', 'warningsAndDonts', 'whatToTellVet']
        }
      });

      const explanation = JSON.parse(response.text || '{}');

      res.json({
        success: true,
        explanation
      });
    } catch (err: any) {
      console.error('Error in /api/triage/explain:', err);
      // Fallback explanation if API fails or offline
      const { intake, severity, knowledgeItem, isUnidentifiedRisk, targetLanguage } = req.body;
      const fallback = buildFallbackExplanation(intake, severity, knowledgeItem, isUnidentifiedRisk, targetLanguage);
      res.json({
        success: true,
        explanation: fallback,
        isFallback: true
      });
    }
  });

  /**
   * STEP 4: MAP & CLINIC AI REASONING (/api/map/clinic-reasoning)
   * Generates AI reasoning explaining why a specific hospital is recommended based on case severity.
   */
  app.post('/api/map/clinic-reasoning', async (req, res) => {
    try {
      const { clinic, severity, species, hazard } = req.body;

      const prompt = `
Explain in 2 concise sentences why ${clinic.name} (${clinic.distanceKm}km, ${clinic.driveTimeMins} mins drive, 24/7 ICU: ${clinic.hasICU}) is prioritized for a ${species} with a ${severity} severity case involving ${hazard}.
Language: English.
`;

      const response = await generateContentWithFallback({
        contents: prompt
      });

      res.json({
        success: true,
        reasoning: response.text?.trim() || `${clinic.name} offers 24/7 emergency care and is only ${clinic.driveTimeMins} minutes away for urgent ${severity} management.`
      });
    } catch (err: any) {
      res.json({
        success: true,
        reasoning: 'Prioritized based on proximity and 24/7 emergency critical care capabilities.'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VetLens Edge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
