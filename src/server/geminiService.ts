import { GoogleGenAI } from '@google/genai';
import { ALL_STATES_SCHEDULES, MYTH_BUSTER_DATABASE, DEMOGRAPHIC_STATS_2027 } from '../data/censusData';

let aiClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const CENSUS_SYSTEM_INSTRUCTION = `You are "CensusMitra AI (जनगणना मित्र)", the advanced intelligent copilot for India's Digital Census 2027 and comprehensive civic, demographic, and general knowledge assistant.

Your Core Capabilities & Principles:
1. UNIVERSAL QUESTION ANSWERING: You can answer ANY question the user asks—whether about India's Digital Census 2027, historical censuses (1872 to 2011), demographics, state/UT schedules, household amenities, legal rights (Census Act 1948), privacy & DPDP compliance, caste/SECC, migration, language, religion, gender, housing, technology, mobile app navigation, as well as general knowledge, civics, geography, statistics, science, or general inquiries.
2. NO RESTRICTIONS ON QUESTION TYPES: Never restrict yourself to "fixed questions". Answer whatever the user asks with deep accuracy, rich detail, and helpfulness.
3. MULTILINGUAL & SCRIPT AGNOSTIC: Respond fluently in whatever language or script the user writes in (Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Hinglish, English, etc.).
4. CLEAR STRUCTURE & CIVIC TONE:
   - Direct, clear, authoritative yet warm and empathetic explanation.
   - Provide concrete, numbered or bulleted actionable steps where helpful.
   - When discussing data, comparisons, state rankings, timelines, or statistics, include an interactive chart JSON block formatted as:
\`\`\`json
{
  "chartType": "bar" | "pie" | "line" | "doughnut",
  "title": "Descriptive Chart Title",
  "description": "Short explanation of the chart metric",
  "labels": ["Label 1", "Label 2", "Label 3"],
  "datasets": [
    {
      "label": "Metric Name",
      "data": [10, 20, 30],
      "backgroundColor": ["#0284c7", "#059669", "#d97706"]
    }
  ]
}
\`\`\`

5. CENSUS 2027 KNOWLEDGE REPOSITORY:
   - Phase 1 (Houselisting & Housing Census): April to June 2026 (45-day active window per state/UT). 31 questions on housing construction, floor/wall/roof material, ownership, drinking water source, lighting, toilet type, drainage, kitchen/LPG, TV/radio, internet, vehicle (bicycle/scooter/car), and access to banking.
   - Phase 2 (Population Enumeration): February 9 to 28, 2027 (Revision round: March 1-5, 2027). In snow-bound areas (J&K, Ladakh, Himachal, Uttarakhand), September 2026. 28 questions on individual demographics, relationship to head, age, gender, marital status, SC/ST social category, mother tongue, other known languages, literacy & education level, economic activity/occupation, migration reason & duration, disability, and fertility.
   - Digital Self-Enumeration: Open 15-30 days prior to enumerator visits via Census Portal & Mobile App. Produces a 12-digit Census Reference ID and QR Code for instant 30-second enumerator validation.
   - Privacy Law & Legal Shield: Section 15 of Census Act 1948 guarantees 100% individual confidentiality. Census records cannot be used as evidence in courts, cannot be shared with Income Tax, Police, or UIDAI, and are separate from NRC/voter lists.
   - Toll-Free National Helpline: 1800-11-2027.
   - Special Cases: Tenants/Renters are counted where they normally reside; Students/Hostelers counted at place of study; Migrants counted at usual place of residence (6+ months); Homeless persons enumerated on the night of February 28; NRIs/Foreigners staying 6+ months counted.`;

export interface ChatResponsePayload {
  replyText: string;
  chartData?: any;
  actionSteps?: string[];
  suggestedPrompts?: string[];
  detectedLanguage?: string;
}

export async function processCensusChat(userMessage: string, history: Array<{ role: string; text: string }> = []): Promise<ChatResponsePayload> {
  const ai = getGenAIClient();

  if (ai) {
    // Build conversation contents
    const contents = [];
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Try primary model, then fallback model with quick backoff retry for transient 503 spikes
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of candidateModels) {
      let attempts = 0;
      while (attempts < 2) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: CENSUS_SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });

          const rawText = response.text || '';
          if (rawText.trim()) {
            return parseModelResponse(rawText, userMessage);
          }
          break;
        } catch (err: any) {
          attempts++;
          const is503OrUnavailable = err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 'UNAVAILABLE' || err?.code === 503;
          if (is503OrUnavailable && attempts < 2) {
            // Brief backoff before retry or switching model
            await new Promise((res) => setTimeout(res, 600));
            continue;
          }
          console.warn(`Model ${modelName} call failed (attempt ${attempts}):`, err?.message || err);
          break; // move to candidate fallback model
        }
      }
    }
  }

  // Fallback civic engine if API key is not yet set or during upstream capacity spikes
  return generateCivicFallbackResponse(userMessage);
}

function parseModelResponse(rawText: string, userMessage: string): ChatResponsePayload {
  let chartData: any = undefined;
  let cleanText = rawText;

  // Extract JSON chart block if present
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = rawText.match(jsonRegex);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && parsed.labels && parsed.datasets) {
        chartData = parsed;
        cleanText = rawText.replace(jsonRegex, '').trim();
      }
    } catch (e) {
      console.warn('Failed to parse chart JSON from model output:', e);
    }
  }

  // Extract action steps if formatted with bullet points
  const actionSteps: string[] = [];
  const lines = cleanText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      if (trimmed.length > 5 && trimmed.length < 180) {
        actionSteps.push(trimmed.replace(/^[-*]\s+|\d+\.\s+/, ''));
      }
    }
  }

  return {
    replyText: cleanText,
    chartData: chartData,
    actionSteps: actionSteps.length > 0 ? actionSteps.slice(0, 6) : undefined,
    suggestedPrompts: generateDynamicSuggestions(userMessage)
  };
}

function generateDynamicSuggestions(input: string): string[] {
  const lower = input.toLowerCase();
  if (lower.includes('schedule') || lower.includes('date') || lower.includes('timeline') || lower.includes('तारीख')) {
    return [
      'What is the schedule for Maharashtra?',
      'How to do digital self-enumeration?',
      'Is census data shared with tax authorities?'
    ];
  }
  if (lower.includes('phase 1') || lower.includes('houselisting') || lower.includes('amenities')) {
    return [
      'What questions are asked in Phase 1?',
      'How do I record drinking water and LPG?',
      'What documents do I need to keep ready?'
    ];
  }
  if (lower.includes('privacy') || lower.includes('rumor') || lower.includes('bank') || lower.includes('nrc') || lower.includes('citizenship')) {
    return [
      'What is Census Act Section 15?',
      'Will enumerators ask for bank account PIN?',
      'Show demographic trends for India 2027'
    ];
  }
  return [
    'Check census schedule for my state',
    'Start Phase 1 self-enumeration guide',
    'Show projected 2027 population & literacy stats',
    'Fact-check common rumors'
  ];
}

function generateCivicFallbackResponse(userMessage: string): ChatResponsePayload {
  const lower = userMessage.toLowerCase();

  // 1. State/UT Specific Schedules Lookups
  const matchedState = ALL_STATES_SCHEDULES.find(s => 
    lower.includes(s.stateName.toLowerCase()) || 
    lower.includes(s.id.toLowerCase()) ||
    (s.stateNameHi && userMessage.includes(s.stateNameHi))
  );

  if (matchedState) {
    return {
      replyText: `**Official Digital Census 2027 Schedule for ${matchedState.stateName} (${matchedState.stateNameHi}):**

- **State Code:** ${matchedState.id.toUpperCase()} (${matchedState.type.toUpperCase()}) | **Region:** ${matchedState.region}
- **Phase 1 (Houselisting & Housing Census):** ${matchedState.phase1Start} to ${matchedState.phase1End}
- **Phase 1 Self-Enumeration Window:** ${matchedState.selfEnumPhase1Start} to ${matchedState.selfEnumPhase1End}
- **Phase 2 (Population Enumeration):** ${matchedState.phase2Start} to ${matchedState.phase2End}
- **Phase 2 Self-Enumeration Window:** ${matchedState.selfEnumPhase2Start} to ${matchedState.selfEnumPhase2End}
- **Status:** ${matchedState.status} | **Gazette Notification:** ${matchedState.gazetteNotification}
- **Nodal Officer:** ${matchedState.nodalOfficer}
- **Directorate Nodal Helpline:** ${matchedState.contactHelpline}`,
      actionSteps: [
        `Complete your digital self-enumeration during ${matchedState.selfEnumPhase1Start} – ${matchedState.selfEnumPhase1End}.`,
        'Keep your 12-digit Census Reference Code and QR badge ready for verification.',
        `Contact the State Directorate Nodal Office at ${matchedState.contactHelpline} for local inquiries.`
      ],
      chartData: {
        chartType: 'bar',
        title: `${matchedState.stateName} Census 2027 Allocation`,
        description: `Timelines for ${matchedState.stateName} across phases`,
        labels: ['Phase 1 Houselisting', 'Phase 1 Self-Enum', 'Phase 2 Population', 'Phase 2 Self-Enum'],
        datasets: [{
          label: 'Days Allocated (Approx)',
          data: [45, 30, 20, 20],
          backgroundColor: ['#0284c7', '#059669', '#d97706', '#6366f1']
        }]
      },
      suggestedPrompts: [
        `What questions will be asked in ${matchedState.stateName} Phase 1?`,
        'How to fill the digital self-enumeration form?',
        'Is bank account or Aadhaar mandatory?'
      ]
    };
  }

  // 2. Caste / SECC / Social Category Questions
  if (lower.includes('caste') || lower.includes('secc') || lower.includes('जाति') || lower.includes('sc') || lower.includes('st') || lower.includes('obc') || lower.includes('sub-caste')) {
    return {
      replyText: `**Policy on Caste & Social Category in Digital Census 2027:**

- **Scheduled Castes (SC) & Scheduled Tribes (ST):** As per the Constitution (Scheduled Castes) and (Scheduled Tribes) Orders, individual specific SC and ST names notified for each State/UT are officially recorded in Phase 2 (Population Enumeration).
- **General & Other Categories:** Standard census demographic schedules record Religion, Mother Tongue, and whether the respondent belongs to SC, ST, or Other Categories.
- **Data Protection:** All social category declarations are strictly protected under Section 15 of the Census Act, 1948 and cannot be used for punitive, administrative, or non-statistical purposes.`,
      actionSteps: [
        'State your recognized social group as per official state/central gazette listings.',
        'No physical caste certificate or documentation is demanded by the enumerator at your doorstep.',
        'Self-enumerate securely to verify all household members accurately.'
      ],
      chartData: {
        chartType: 'doughnut',
        title: 'Projected Demographic Social Category Breakdown (National Estimate)',
        description: 'Estimated broad social categorization distribution',
        labels: ['General / Other Categories', 'OBC Category', 'Scheduled Castes (SC)', 'Scheduled Tribes (ST)'],
        datasets: [{
          label: 'Percentage (%)',
          data: [28, 43, 19, 10],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
        }]
      },
      suggestedPrompts: [
        'What questions are asked in Phase 2 Population Enumeration?',
        'Do I need to submit caste certificate for census?',
        'Is census data shared with other government departments?'
      ]
    };
  }

  // 3. Tenants, Renters, Hostels, Students, Migrants
  if (lower.includes('tenant') || lower.includes('rent') || lower.includes('hostel') || lower.includes('student') || lower.includes('migrant') || lower.includes('किराएदार') || lower.includes('हॉस्टल') || lower.includes('pg')) {
    return {
      replyText: `**Guidelines for Tenants, Students, PG Residents & Migrant Workers:**

- **Where are tenants enumerated?** Under Census rules, a person is enumerated at their **usual place of residence** (where they have stayed or intend to stay for 6 months or more). Tenants living in rented flats/houses are counted at their rented residence as an independent household.
- **What about Landlords?** Landlords will count only the members of their own family living with them. Rented portions are recorded separately as distinct household units.
- **Students in Hostels / PGs:** Students residing in institutional hostels, university dormitories, or paying guest accommodations are enumerated as part of that institutional household at their place of study.
- **Migrant Workers:** Seasonal or long-term migrants are counted at the place where they currently reside during the enumeration period.`,
      actionSteps: [
        'If living in a rented house for 6+ months, complete your household self-enumeration at your rented address.',
        'Do not list tenants under the landlord’s family member list.',
        'Hostel wardens / PG managers assist enumerators for institutional enumeration.'
      ],
      chartData: {
        chartType: 'pie',
        title: 'Housing Tenancy Distribution in India (Estimated)',
        description: 'Ownership vs Rented vs Institutional household distribution',
        labels: ['Owned Households', 'Rented Households', 'Institutional / Other'],
        datasets: [{
          label: 'Percentage (%)',
          data: [78.4, 18.2, 3.4],
          backgroundColor: ['#0284c7', '#059669', '#f59e0b']
        }]
      },
      suggestedPrompts: [
        'How to fill Phase 1 form for a rented flat?',
        'What if I am traveling during census visits?',
        'Are foreigners or NRIs counted in the census?'
      ]
    };
  }

  // 4. Documents & Aadhaar Requirement
  if (lower.includes('document') || lower.includes('aadhaar') || lower.includes('passport') || lower.includes('proof') || lower.includes('दस्तावेज') || lower.includes('आधार') || lower.includes('voter id')) {
    return {
      replyText: `**Official Clarification on Documents & Aadhaar in Census 2027:**

- **NO Original Documents Required:** Citizens are **NOT required** to show or submit physical documents (such as Passports, Birth Certificates, Ration Cards, Property Deeds, or Voter ID cards) to enumerators.
- **Is Aadhaar Mandatory?** **NO.** Providing Aadhaar is entirely **voluntary**. It can be used purely for quick mobile OTP authentication during digital self-enumeration, but no Aadhaar card copy or biometric is collected.
- **Verbal Self-Declaration:** In doorstep enumeration, the head of the household or an adult member verbally provides information, which is recorded digitally on the official ORGI mobile app.
- **Zero Document Seizure:** Enumerators are legally prohibited from collecting paper copies or verifying identity documents.`,
      actionSteps: [
        'Do not hand over any identity cards, photocopies, or original documents to anyone.',
        'Authenticate only via official SMS OTP received directly from "GOI-CENSUS".',
        'Report any person demanding documents or payment to the national toll-free helpline 1800-11-2027.'
      ],
      suggestedPrompts: [
        'Is digital self-enumeration safe?',
        'What questions are asked in Phase 1?',
        'What if someone is not home during enumerator visit?'
      ]
    };
  }

  // 5. Legal Mandate, Penalties & Refusal (Census Act 1948)
  if (lower.includes('penalty') || lower.includes('fine') || lower.includes('refuse') || lower.includes('mandatory') || lower.includes('law') || lower.includes('act') || lower.includes('कानून') || lower.includes('सजा')) {
    return {
      replyText: `**Legal Framework & Provisions under the Census Act, 1948:**

- **Citizen Obligation (Section 10):** Every citizen is legally bound to answer census questions truthfully to the best of their knowledge.
- **Confidentiality Shield (Section 15):** The law guarantees complete secrecy. Census records are **inadmissible as evidence in any court**, and cannot be accessed by police, tax departments, or private litigation.
- **Penalties for Refusal / False Answers:** Under Section 11, refusing to answer or intentionally giving fraudulent answers can attract a statutory fine.
- **Penalties for Enumerator Misconduct:** An enumerator who unlawfully discloses census information, falsifies records, or refuses to perform duty is punishable with imprisonment up to 3 years and a fine.`,
      actionSteps: [
        'Answer questions truthfully to support national healthcare, education, and infrastructure planning.',
        'Know your rights: Your individual answers cannot be accessed under the Right to Information (RTI) Act.',
        'Use the Digital Self-Enumeration portal for complete convenience.'
      ],
      chartData: {
        chartType: 'bar',
        title: 'Census Act 1948 Legal Safeguards',
        description: 'Key provisions balancing civic duties and citizen privacy',
        labels: ['Sec 10 Truthful Duty', 'Sec 15 Court Immunity', 'Sec 15 No RTI Disclosure', 'Sec 11 Officer Penalty'],
        datasets: [{
          label: 'Compliance Index',
          data: [100, 100, 100, 100],
          backgroundColor: ['#0284c7', '#059669', '#10b981', '#d97706']
        }]
      },
      suggestedPrompts: [
        'Is census data shared with income tax authorities?',
        'How does digital self-enumeration work?',
        'Show 2027 projected literacy rates'
      ]
    };
  }

  // 6. History & Evolution of Indian Census (1872 - 2027)
  if (lower.includes('history') || lower.includes('1872') || lower.includes('1951') || lower.includes('first census') || lower.includes('इतिहास') || lower.includes('16th')) {
    return {
      replyText: `**History & Evolution of the Census of India:**

- **1872:** The first non-synchronous census of India was conducted under British Viceroy Lord Mayo.
- **1881:** The first complete and synchronous nationwide census took place under W.C. Plowden (Census Commissioner). Since 1881, the census has been conducted without interruption every 10 years.
- **1948:** Enactment of the **Census Act, 1948** as permanent legislation.
- **1951:** First Census of Independent India (7th synchronous census).
- **2011:** 15th Census of India (Population: 1.21 Billion, Literacy: 74.04%).
- **2027:** The **16th Census of India** and the **1st Fully Digital Census**, utilizing mobile applications, cloud databases, digital self-enumeration, and QR-coded authentication.`,
      actionSteps: [
        'India’s census is the largest administrative and statistical exercise in human history.',
        'Digital Census 2027 eliminates paper schedules, speeding up data publication by 3 years.',
        'Explore historical trends in the Analytics visualizer tab.'
      ],
      chartData: {
        chartType: 'line',
        title: 'India Population Growth (1951 to 2027 Projected in Billions)',
        description: 'Decadal census counts and 2027 projection',
        labels: ['1951', '1961', '1971', '1981', '1991', '2001', '2011', '2027 (P)'],
        datasets: [{
          label: 'Population (Billions)',
          data: [0.361, 0.439, 0.548, 0.683, 0.846, 1.028, 1.210, 1.458],
          backgroundColor: ['#0284c7', '#0284c7', '#0284c7', '#0284c7', '#0284c7', '#0284c7', '#0284c7', '#059669']
        }]
      },
      suggestedPrompts: [
        'Show literacy trends from 1951 to 2027',
        'What technology is used in Digital Census 2027?',
        'How do I complete self-enumeration?'
      ]
    };
  }

  // 7. General Questions / Broad Inquiries
  if (lower.includes('technology') || lower.includes('app') || lower.includes('software') || lower.includes('qr') || lower.includes('mobile')) {
    return {
      replyText: `**Technology Architecture of Digital Census 2027:**

- **Self-Enumeration Web Portal & App:** Accessible on Android, iOS, and Web with multi-factor OTP login and 16 Indian language interfaces.
- **Enumerator Mobile App (Houselisting & Population Modules):** Works in 100% offline mode with encrypted local SQLite storage, syncing only when an internet connection is available.
- **Geographic GIS Mapping:** Census Enumeration Blocks (EBs) are mapped using Geo-referenced boundary polygons to avoid duplication or missed households.
- **Instant QR Verification:** Citizens completing self-enumeration receive an encrypted 12-digit Reference Code and QR badge, allowing enumerators to verify the household in under 30 seconds.`,
      actionSteps: [
        'Download the official Census 2027 app only from Google Play Store or Apple App Store.',
        'Verify that the app publisher is "Office of the Registrar General of India (ORGI)".',
        'Save your QR code as a PDF or screenshot after completing the form.'
      ],
      suggestedPrompts: [
        'Start Phase 1 Self-Enumeration',
        'Check schedule for my state',
        'Is my data safe from cyber threats?'
      ]
    };
  }

  // Fallback default civic guidance
  return {
    replyText: `I am **CensusMitra AI (जनगणना मित्र)**, your 24/7 intelligent assistant for India's Digital Census 2027.

I can answer any question about:
1. **State & District Schedules:** Active dates, Gazette notifications, and district timelines for all 36 States/UTs.
2. **Self-Enumeration Portal:** Step-by-step guidance for Phase 1 (Housing & Amenities) and Phase 2 (Population Demographics).
3. **Data Confidentiality & Privacy:** Legal protections under Section 15 Census Act 1948 and Digital Personal Data Protection Act 2023.
4. **Fact-Checking & Scams:** Real-time debunking of WhatsApp rumors, fake enumerators, and financial phishing.
5. **Demographic Insights & Charts:** Literacy rates, sex ratios, urban-rural distribution, and decadal trends.
6. **General Inquiries:** Rules for tenants, students, migrants, caste/SECC, homeless enumeration, and technology.

Feel free to ask me any specific question in English, हिन्दी, मराठी, বাংলা, தமிழ், తెలుగు, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, or any Indian language!`,
    actionSteps: [
      'Type any question above or click one of the suggested prompts.',
      'Check your state schedule in the State Schedules explorer tab.',
      'Start digital self-enumeration in the Self-Enumeration portal tab.'
    ],
    suggestedPrompts: [
      'What questions are asked in Phase 1 Housing Census?',
      'Check census schedule for Maharashtra and Uttar Pradesh',
      'Are tenants counted at rented flat or hometown?',
      'Is my bank account or PAN card requested?'
    ]
  };
}

/**
 * Transcribe recorded audio voice clips using Gemini Multimodal Audio
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcript: string }> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error('Gemini AI service is not initialized on server.');
  }

  // Clean base64 string if data URI header exists
  const cleanBase64 = base64Audio.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, '');

  try {
    const audioPart = {
      inlineData: {
        mimeType: (mimeType && mimeType.split(';')[0]) || 'audio/webm',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          audioPart,
          {
            text: 'You are an accurate voice transcription system for Indian Digital Census 2027. Transcribe the spoken audio verbatim in its original spoken language (such as English, Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu, etc.). Return ONLY the transcribed text. Do not add quotes, commentary, or pleasantries.',
          },
        ],
      },
    });

    const transcript = (response.text || '').trim();
    return { transcript };
  } catch (err: any) {
    console.error('Audio transcription error in Gemini service:', err);
    throw new Error(err.message || 'Failed to transcribe audio clip');
  }
}

/**
 * Generate speech audio from text using Gemini TTS
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ audioBase64: string } | null> {
  const ai = getGenAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.slice(0, 400) }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
      return { audioBase64: base64 };
    }
    return null;
  } catch (e: any) {
    console.warn('Gemini TTS generation fallback:', e.message);
    return null;
  }
}

