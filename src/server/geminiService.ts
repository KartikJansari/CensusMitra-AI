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

export const CENSUS_SYSTEM_INSTRUCTION = `You are "CensusMitra AI (जनगणना मित्र)", the official intelligent assistant for India's Digital Census 2027, under the Office of the Registrar General & Census Commissioner, Ministry of Home Affairs, Government of India.

Your core mission:
1. Guide citizens of India through digital self-enumeration with empathy, clarity, and precision.
2. Provide verified census schedules, official notification statuses, and district timelines for Phase 1 (Houselisting & Housing Census) and Phase 2 (Population Enumeration).
3. Reassure citizens regarding data confidentiality under Section 15 of the Census Act, 1948 (End-to-End Encryption, data immunity in courts, no linkage with NRC/citizenship cancellation/bank accounts).
4. Actively identify and debunk false rumors, WhatsApp misinformation, and scams.
5. Multilingual Communication: ALWAYS detect the user's input language (Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, English, etc.) and respond natively in that exact language with a warm, respectful, civic, and authoritative tone.

REQUIRED OUTPUT STRUCTURE:
When responding, always follow this structure:
1. **Direct Explanation / Guidance:** Plain text localized in the user's detected language. Warm, clear, respectful civic tone.
2. **Actionable Steps:** Use bullet points starting with - for easy citizen execution (e.g. step 1, step 2, required documents, verification checklist).
3. **Data/Chart JSON Block (Mandatory when queried about demographics, statistics, state schedules, gender ratio, literacy, or comparative data):**
Enclose a valid JSON block inside triple backticks with json tag:
\`\`\`json
{
  "chartType": "bar" | "pie" | "line" | "doughnut",
  "title": "Clear English / Localized Title",
  "description": "Short 1-line description of the metric",
  "labels": ["Label 1", "Label 2", "Label 3"],
  "datasets": [
    {
      "label": "Metric Name",
      "data": [45, 78, 92],
      "backgroundColor": ["#0284c7", "#059669", "#d97706"]
    }
  ]
}
\`\`\`

CENSUS SCHEDULE & FACTUAL GROUNDING:
- Phase 1 (Houselisting & Housing Census): April 2026 – June 2026 (State-specific 45-day window). Covers building material, ownership, drinking water, electricity, toilet, drainage, LPG, TV/internet/vehicle/banking access.
- Phase 2 (Population Enumeration): 9th to 28th February 2027 across most states (Revision round: 1st-5th March 2027). In snow-bound areas (J&K, Ladakh, Himachal, Uttarakhand), enumeration takes place in September 2026. Covers age, gender, marital status, religion/social category, mother tongue, literacy, occupation, migration, and disability.
- Self-Enumeration facility is open 15-30 days prior to enumerator home visits through the official Census 2027 portal/app.
- Helpline: Toll-free National Census Helpline 1800-11-2027.
- Always provide clear, fact-checked reassurance when citizens express doubts about privacy or government misuse.`;

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
    try {
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contents,
        config: {
          systemInstruction: CENSUS_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const rawText = response.text || '';
      return parseModelResponse(rawText, userMessage);
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to civic knowledge engine:', err.message);
    }
  }

  // Fallback civic engine if API key is not yet set or during offline testing
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

  // Hindi queries
  if (/[\u0900-\u097F]/.test(userMessage)) {
    if (lower.includes('शेड्यूल') || lower.includes('तारीख') || lower.includes('कब')) {
      return {
        replyText: `नमस्ते! भारत की डिजिटल जनगणना 2027 दो प्रमुख चरणों में आयोजित की जा रही है:

**चरण 1 (मकान सूचीकरण और आवास गणना):**
अप्रैल 2026 से जून 2026 के बीच (प्रत्येक राज्य के लिए 45 दिनों की अवधि)। इसमें घर की स्थिति, पीने का पानी, बिजली, शौचालय और एलपीजी जैसी सुविधाओं की गणना होगी।

**चरण 2 (जनसंख्या गणना):**
9 फरवरी से 28 फरवरी 2027 (संशोधन दौर 1-5 मार्च 2027)। इसमें प्रत्येक नागरिक की आयु, लिंग, शिक्षा, व्यवसाय और मातृभाषा दर्ज की जाएगी।

**नागरिकों के लिए आवश्यक कदम:**
- स्व-गणना पोर्टल खुलने पर अपने मोबाइल नंबर से लॉगिन करें।
- परिवार के मुखिया और सभी सदस्यों का विवरण दर्ज करें।
- संदर्भ संख्या (Reference Slip) सुरक्षित रखें।`,
        actionSteps: [
          'अपने राज्य का आधिकारिक गजट शेड्यूल चेक करें',
          'मकान सूचीकरण हेतु बुनियादी जानकारी तैयार रखें',
          'डिजिटल स्व-गणना संदर्भ पर्ची संभाल कर रखें',
          'किसी भी संदेह पर 1800-11-2027 पर संपर्क करें'
        ],
        chartData: {
          chartType: 'bar',
          title: 'जनगणना 2027 मुख्य चरण समय-सारणी',
          description: 'चरण 1 और चरण 2 के समय अंतराल (महीने)',
          labels: ['चरण 1: मकान सूचीकरण', 'चरण 1: स्व-गणना विंडो', 'चरण 2: जनसंख्या गणना', 'चरण 2: संशोधन दौर'],
          datasets: [
            {
              label: 'अवधि (दिन)',
              data: [45, 30, 20, 5],
              backgroundColor: ['#0284c7', '#059669', '#d97706', '#dc2626']
            }
          ]
        },
        suggestedPrompts: [
          'क्या मेरी बैंक जानकारी मांगी जाएगी?',
          'चरण 1 फॉर्म भरने की प्रक्रिया समझाएं',
          'महाराष्ट्र का शेड्यूल क्या है?'
        ]
      };
    }
  }

  // Schedule Query
  if (lower.includes('schedule') || lower.includes('date') || lower.includes('timeline') || lower.includes('when')) {
    return {
      replyText: `Digital Census 2027 is structured into two mandatory nationwide phases under the Registrar General and Census Commissioner of India:

**Phase 1: Houselisting & Housing Census (April – June 2026)**
- Focuses on housing structures, amenities (piped water, electricity, sanitation, clean cooking fuel, and household assets).
- Digital Self-Enumeration window opens 15 days prior to official enumerator field visits.

**Phase 2: Population Enumeration (February 9 to 28, 2027)**
- Comprehensive enumeration of every resident individual across all 28 States and 8 UTs.
- Captures demographics, age, gender, literacy, employment sector, mother tongue, and migration details.
- Revision round: March 1 to 5, 2027.`,
      actionSteps: [
        'Select your state from the Schedule Explorer tab to view exact district dates.',
        'Use the Digital Self-Enumeration portal during the open window to avoid queueing.',
        'Obtain and preserve your 12-digit Census Acknowledgment Slip & QR code.',
        'Show the QR code to the visiting enumerator for instant 30-second verification.'
      ],
      chartData: {
        chartType: 'bar',
        title: 'Digital Census 2027 Phase Timelines (Days Allocation)',
        description: 'Duration allocated per phase across States and Union Territories',
        labels: ['Phase 1 Self-Enum', 'Phase 1 Enumerator', 'Phase 2 Self-Enum', 'Phase 2 Enumeration', 'Revision Round'],
        datasets: [
          {
            label: 'Duration (Days)',
            data: [30, 45, 25, 20, 5],
            backgroundColor: ['#0284c7', '#2563eb', '#10b981', '#059669', '#f59e0b']
          }
        ]
      },
      suggestedPrompts: [
        'Show schedule for Tamil Nadu and Maharashtra',
        'Is digital self-enumeration safe from data leaks?',
        'Show 2027 vs 2011 demographic comparison'
      ]
    };
  }

  // Privacy and Myth check
  if (lower.includes('privacy') || lower.includes('bank') || lower.includes('nrc') || lower.includes('citizenship') || lower.includes('tax') || lower.includes('safe') || lower.includes('biometric')) {
    return {
      replyText: `**Official Confidentiality Guarantee under Census Act, 1948:**

All information collected in Census 2027 is **100% confidential and protected by law**.
- **Section 15 Protection:** Individual census answers are completely confidential and are legally barred from being produced as evidence in any court of law or accessed by tax authorities, police, or private entities.
- **No Citizenship/NRC Linkage:** Census is an administrative statistical survey of residents. It does not cancel citizenship, remove names from voter rolls, or confiscate ration cards.
- **Zero Financial Queries:** The Census NEVER asks for Bank Account Numbers, UPI PINs, Credit Card Details, OTPs, or PAN cards.
- **No Biometrics:** No fingerprint or iris scans are gathered during the Census.`,
      actionSteps: [
        'Never share OTPs or banking passwords with anyone claiming to be a census officer.',
        'Verify the visiting enumerator’s official photo badge and ORGI QR-coded authorization.',
        'Report any fraudulent calls or phishing links immediately to 1800-11-2027.',
        'Self-enumerate securely through our official encrypted portal.'
      ],
      chartData: {
        chartType: 'doughnut',
        title: 'Census 2027 Data Security Architecture',
        description: 'Multi-layer security protocol safeguarding citizen answers',
        labels: ['Census Act Sec 15 Legal Immunity', '256-bit End-to-End Encryption', 'Anonymized Aggregation Only', 'Zero Biometric/Banking Data'],
        datasets: [
          {
            label: 'Security Distribution',
            data: [30, 30, 25, 15],
            backgroundColor: ['#059669', '#0284c7', '#6366f1', '#d97706']
          }
        ]
      },
      suggestedPrompts: [
        'How do I complete digital self-enumeration?',
        'What questions are asked in Phase 1 Houselisting?',
        'Show literacy and sex ratio projections for 2027'
      ]
    };
  }

  // Demographics and Statistics Query
  if (lower.includes('stat') || lower.includes('demograph') || lower.includes('literacy') || lower.includes('population') || lower.includes('sex ratio') || lower.includes('chart') || lower.includes('trend')) {
    return {
      replyText: `Here is the comprehensive demographic comparison for India's Digital Census 2027 projections compared to Census 2011 benchmarks:

- **Projected Population:** 1.458 Billion (vs 1.210 Billion in 2011)
- **Estimated Overall Literacy:** 82.4% (Male: 88.6%, Female: 77.8% — narrowing the gender gap to 10.8% compared to 16.3% in 2011)
- **Projected Sex Ratio:** 954 females per 1,000 males (up from 940 in 2011)
- **Urbanization Rate:** 38.2% (projected 557 Million urban population)
- **Household Digital Connectivity:** 84.6% of households with internet access (up from 9.2% in 2011)`,
      actionSteps: [
        'Review the projected age dividend: 65.6% of India’s population is in the prime working age (15-59).',
        'Explore state-level sex ratio progressions in the Analytics Visualizer.',
        'Self-enumerate your household members to help update real demographic records.'
      ],
      chartData: DEMOGRAPHIC_STATS_2027.populationByAgeGroup,
      suggestedPrompts: [
        'Show literacy trends chart from 1991 to 2027',
        'Show housing amenities 2011 vs 2027',
        'Guide me through Phase 1 Self-Enumeration'
      ]
    };
  }

  // Default Guidance
  return {
    replyText: `Welcome to **CensusMitra AI (जनगणना मित्र)**, your official intelligent assistant for India's Digital Census 2027.

I am here to assist you in English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), or Assamese (অসমীয়া).

How may I assist you today?
- **Digital Self-Enumeration:** Step-by-step guidance for Phase 1 (Housing Amenities) and Phase 2 (Population & Members).
- **Verified Schedules:** Check exact dates, self-enumeration windows, and nodal helplines for your State/UT.
- **Privacy & Legal Protections:** Review Section 15 Census Act confidentiality and DPDP compliance.
- **Anti-Misinformation:** Real-time fact-checking of viral rumors and scams.
- **Demographic Visualizations:** Interactive statistical charts of projected population, literacy, and amenities.`,
    actionSteps: [
      'Click "Start Self-Enumeration" to begin your household form.',
      'Type your question in any Indian language or click the microphone to speak.',
      'Use the Schedule Explorer to check your district’s active census window.'
    ],
    suggestedPrompts: [
      'Check census schedule for my state',
      'What questions are asked in Phase 1 Housing Census?',
      'Is my census data shared with income tax or police?',
      'Show 2027 demographic & literacy charts'
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

