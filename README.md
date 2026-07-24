# 🐾 VetLens Edge

> **Safety-Grounded, Two-Pass Decision-Support Engine for Veterinary Emergencies.**
> Empowering pet owners with native-language first-aid guidance within the critical first 5 minutes—without trusting AI to determine safety-critical medical severity.

---

## 💡 Inspiration

Every pet owner knows the sheer terror of a late-night emergency—a puppy chewing on an Easter Lily, a dog licking a bottle of Dettol / Phenyl, or ingesting Rat Poison at 11 PM. In regions like India, emergency vet clinics outside Tier-1 cities are sparse, and panicked owners usually type frantic queries in mixed Hinglish (*"puppy ne balcony me rakha plant khaya, drooling ho raha hai"*).

Existing solutions fail in dangerous ways: generic AI chatbots confidently hallucinate inaccurate advice (e.g., dangerously recommending inducing vomiting on corrosive chemicals like Dettol, which causes severe esophageal mucosal burns), while static PDFs are unreadable in a crisis.

We built **VetLens Edge** not as another open-ended chatbot, but as a **safety-grounded, two-pass decision-support engine**. It helps a panicked owner execute the right first-aid actions within the first 5 minutes in their native language—without ever trusting an LLM to make the safety-critical medical decision.

---

## 🛠️ How We Built It

### 1. Core AI Architecture: Gemma 4 Two-Pass Pipeline
We enforced a hard boundary: **Gemma 4 structures and explains; deterministic local code decides.**

```
[ User Input ] (Text / Hinglish / Voice / Photo)
       │
       ▼
[ Pass 1: Gemma 4 NLU Structuring ] ──► Extracts Species, Weight, Hazard Key, Elapsed Time, Symptoms (JSON)
       │
       ▼
[ Pass 2: Local Rule Engine ]       ──► Evaluates against Knowledge Base (TypeScript Code Decides Tier)
       │                              Tiers: 🟢 Safe | 🟡 Monitor | 🟠 Vet Today | 🔴 Critical
       ▼
[ Pass 3: Gemma 4 Multilingual ]    ──► Phrased native explanation in English / Hindi / Hinglish
```

* **Pass 1: NLU Structuring Layer (Gemma 4 API):** Parses messy, unstructured input (text in English, Hindi, or Hinglish, voice notes via Web Speech API, or photos) into a strict JSON schema (`species`, `weight`, `substance_key`, `elapsed_time`, `symptoms`). Missing values default to `null` rather than guessing.
* **Pass 2: Deterministic Rule Engine (Code Decides):** A local TypeScript/JSON rule engine evaluates the structured payload against `knowledgeBase.ts`. It is the only component authorized to assign severity tiers:
  * 🟢 **Safe**
  * 🟡 **Monitor**
  * 🟠 **Vet Today**
  * 🔴 **Critical**
  * *Unrecognized Fallback:* If a substance cannot be identified, the system immediately defaults to High Alert (Critical) with an explicit `UNIDENTIFIED-RISK` banner and pre-transit first-aid safety steps.
* **Pass 3: Multilingual Explanation Layer (Gemma 4 API):** Only after the severity tier is locked by code, Gemma 4 is invoked a second time to calmly translate and phrase first-aid steps natively in English, Hindi, or Hinglish.

---

### 2. Key Application Modules & Tech Stack

* 🚨 **Emergency Triage Engine:** Supports quick-test scenario loading, voice-to-text input (Speak Incident), species/weight selection, and native language output toggles.
* 🖼️ **Client-Side Image Compression:** Handles packaging/plant/vomit photos on weak 2G/3G networks using HTML5 Canvas API compression (max 1024px JPEG 0.7), reducing payload size by ~85% to prevent network timeouts mid-emergency.
* 🗺️ **Vet Map & ICU Discovery:** Uses GPS location detection (`22.583, 88.421`), real-time distance matrix calculations, and filtering for *24/7 Open Only*, *ICU Trauma Wards*, and *Exotic Pets*. Gemma provides reasoning for why a specific critical care hospital is prioritized.
* 📋 **Pet Passport & Clinical Handoff QR:** Maintains local pet profiles (species, breed, age, weight, known allergies like Dust Mites, chronic conditions, vaccination logs). Generates an unencrypted, plain-text Clinical Handoff QR Code for 2-second receptionist intake scanning without login delays.
* 📚 **Offline Hazard Database:** A curated toxicology database searchable by category (*Toxic Food*, *Plant*, *Chemical/Corrosive*, *Medication*, *Bite/Sting*, *Foreign Object*) covering high-risk hazards like Dettol/Phenyl, Zinc Phosphide, Anticoagulants, and Paracetamol/Crocin/Dolo.


---

## 📸 The Prototype

* 🎥 **Demo Video:** [Insert Link to your 2-minute Demo Video here]
* 💻 **Repository / Notebook:** [Insert Link to your Kaggle Notebook / GitHub Repo here]

---

## 🚧 Challenges We Ran Into

* **Preventing AI Safety Boundary Leakage:**
  The hardest coding challenge was preventing Gemma's confident outputs from bypassing the local logic. We strictly isolated Gemma to outputting an `identified_entity_key` only. All severity logic, first-aid protocols, and fallback banners remain locked behind local code execution.

* **Parsing Messy, High-Stress Hinglish Inputs:**
  Panicked inputs lack standardized formatting and often omit units or misspell chemical names. Prompting Gemma to default missing parameters to `null` (rather than guessing weight or elapsed time) was critical—guessing a pet's weight could silently corrupt downstream dosage severity.

* **Handling High-Latency Cloud Dependencies in Emergencies:**
  While architecturally an offline-first tool is ideal, building local multi-modal inference within a 24-hour deadline was a scope risk. We utilized the Google AI Studio Gemma 4 API while keeping the core decision layer 100% local, adding client-side Canvas image compression to keep cloud payloads lightweight on poor mobile connections.

* **Frictionless 2 AM ER Intake Design:**
  Designing the QR handoff required balancing data privacy with emergency utility. We intentionally chose plain-text unencrypted QR payloads so ER receptionists can instantly scan intake data without authenticating or decrypting files during a life-or-death arrival.
