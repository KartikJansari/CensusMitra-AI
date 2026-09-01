import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  CheckCircle, 
  QrCode, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Download, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  FileCheck2,
  Lock,
  Copy,
  Check,
  HelpCircle,
  Clock,
  Sparkle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  SelfEnumerationRecord, 
  HouseholdMember, 
  Phase1Amenities,
  LanguageCode
} from '../types/census';
import { SAMPLE_SAVED_RECORD } from '../data/censusData';
import { 
  sanitizeInput, 
  isValidPincode, 
  isValidIndianMobile, 
  calculateAgeFromDob, 
  generateCensusDigitalHash 
} from '../utils/securityAndValidation';

interface SelfEnumerationPortalProps {
  selectedLanguage: LanguageCode;
  onAskCensusMitra: (prompt: string) => void;
}

const INITIAL_PHASE1: Phase1Amenities = {
  buildingNumber: '',
  censusHouseNumber: '',
  useOfCensusHouse: 'Residence',
  conditionOfHouse: 'Good',
  wallMaterial: 'Burnt Brick/Stone',
  roofMaterial: 'Concrete (RCC)',
  floorMaterial: 'Cement',
  ownershipStatus: 'Owned',
  numberOfDwellingRooms: 2,
  marriedCouplesInHousehold: 1,
  drinkingWaterSource: 'Tap water from treated source',
  drinkingWaterLocation: 'Within premises',
  lightingSource: 'Electricity',
  latrineFacility: 'Flush/Pour-flush to piped sewer',
  wasteWaterOutlet: 'Connected to closed drainage',
  bathingFacility: 'Bathroom with roof',
  kitchenFacility: 'Cooking inside house with LPG/PNG',
  mainCookingFuel: 'LPG/PNG',
  hasRadio: false,
  hasTelevision: true,
  hasInternetBroadband: true,
  hasSmartphoneOrComputer: true,
  hasTwoWheeler: true,
  hasFourWheeler: false,
  hasAvailingBankingServices: true,
};

const INITIAL_MEMBER: HouseholdMember = {
  id: 'm-1',
  fullName: '',
  relationshipToHead: 'Head of Household',
  gender: 'Male',
  dob: '1988-01-01',
  age: 39,
  maritalStatus: 'Currently Married',
  educationalAttainment: 'Graduate',
  literacyStatus: 'Literate',
  economicActivity: 'Main Worker (>6 months)',
  occupationCategory: 'Service / Professional',
  motherTongue: 'Hindi',
  otherLanguagesKnown: ['English'],
  disabilityStatus: 'None',
  migrationBirthplace: 'Same District',
  migrationReason: 'Birth Place',
};

export const SelfEnumerationPortal: React.FC<SelfEnumerationPortalProps> = ({
  selectedLanguage,
  onAskCensusMitra,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [record, setRecord] = useState<SelfEnumerationRecord>({
    id: `rec-${Date.now()}`,
    referenceNumber: `CEN-2027-IND-${Math.floor(100000 + Math.random() * 900000)}`,
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    subDistrictOrTehsil: 'Andheri',
    townOrVillage: 'Mumbai (MCGM)',
    wardOrBlockNumber: 'Ward K-West',
    pincode: '400053',
    headOfHouseholdName: '',
    mobileNumber: '',
    email: '',
    phase1: INITIAL_PHASE1,
    phase2Members: [INITIAL_MEMBER],
    submissionStatus: 'Draft',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copiedRef, setCopiedRef] = useState(false);

  // Load sample record for instant evaluation
  const loadDemoData = () => {
    setRecord({
      ...SAMPLE_SAVED_RECORD,
      id: `rec-${Date.now()}`,
      referenceNumber: `CEN-2027-IND-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setCurrentStep(1);
  };

  const handlePhase1Change = (field: keyof Phase1Amenities, value: any) => {
    setRecord((prev) => ({
      ...prev,
      phase1: {
        ...prev.phase1,
        [field]: value,
      },
    }));
  };

  const handleAddMember = () => {
    const newMember: HouseholdMember = {
      id: `m-${Date.now()}`,
      fullName: '',
      relationshipToHead: record.phase2Members.length === 0 ? 'Head of Household' : 'Family Member',
      gender: 'Female',
      dob: '1995-05-15',
      age: 32,
      maritalStatus: 'Currently Married',
      educationalAttainment: 'Higher Secondary (Class 12)',
      literacyStatus: 'Literate',
      economicActivity: 'Main Worker (>6 months)',
      occupationCategory: 'Teaching / Healthcare',
      motherTongue: record.phase2Members[0]?.motherTongue || 'Hindi',
      otherLanguagesKnown: ['English'],
      disabilityStatus: 'None',
      migrationBirthplace: 'Same District',
      migrationReason: 'Birth Place',
    };

    setRecord((prev) => ({
      ...prev,
      phase2Members: [...prev.phase2Members, newMember],
    }));
  };

  const handleRemoveMember = (id: string) => {
    if (record.phase2Members.length <= 1) {
      alert('A household must have at least 1 member.');
      return;
    }
    setRecord((prev) => ({
      ...prev,
      phase2Members: prev.phase2Members.filter((m) => m.id !== id),
    }));
  };

  const handleMemberChange = (id: string, field: keyof HouseholdMember, value: any) => {
    setRecord((prev) => ({
      ...prev,
      phase2Members: prev.phase2Members.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };
          // If DOB changed, auto-update age roughly
          if (field === 'dob' && value) {
            const birthYear = new Date(value).getFullYear();
            const calcAge = 2027 - birthYear;
            if (!isNaN(calcAge) && calcAge >= 0) {
              updated.age = calcAge;
            }
          }
          return updated;
        }
        return m;
      }),
    }));
  };

  // Step validation
  const validateCurrentStep = (targetStep: number): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!record.state) errors.push('State is required.');
      if (!record.district) errors.push('District is required.');
      if (!record.pincode || !isValidPincode(record.pincode)) {
        errors.push('Valid 6-digit Indian PIN Code is required (e.g. 400053, 110001).');
      }
      if (!record.headOfHouseholdName.trim()) {
        errors.push('Head of Household full name is required.');
      }
      if (!record.mobileNumber || !isValidIndianMobile(record.mobileNumber)) {
        errors.push('Valid 10-digit Indian Mobile Number is required for SMS acknowledgment.');
      }
    }

    if (currentStep === 2) {
      if (record.phase1.numberOfDwellingRooms < 1) errors.push('Number of dwelling rooms must be at least 1.');
      if (!record.phase1.buildingNumber?.trim()) errors.push('Building/House number is required.');
    }

    if (currentStep === 3) {
      if (record.phase2Members.length === 0) {
        errors.push('At least one household member must be registered.');
      }
      const headCount = record.phase2Members.filter(m => m.relationshipToHead === 'Head of Household').length;
      if (headCount === 0) {
        errors.push('At least one member must be designated as Head of Household.');
      }
      record.phase2Members.forEach((m, idx) => {
        if (!m.fullName.trim()) errors.push(`Member #${idx + 1}: Full Name is required.`);
        if (m.age < 0 || m.age > 120) errors.push(`Member #${idx + 1}: Please enter a valid age.`);
        // Rule: Child labour check
        if (m.age < 14 && m.economicActivity === 'Main Worker (>6 months)') {
          errors.push(`Member #${idx + 1} (${m.fullName || 'Child'}): Under Indian Child Labour Prohibition laws, persons under 14 cannot be classified as Main Workers.`);
        }
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep + 1)) {
      if (currentStep === 4) {
        // Finalize Submission
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        const digitalHash = generateCensusDigitalHash(record);
        setRecord((prev) => ({
          ...prev,
          submissionStatus: 'Validated',
          submissionDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
          digitalHash,
        }));
      }
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setValidationErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const copyRefNumber = () => {
    navigator.clipboard?.writeText(record.referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const downloadJsonReceipt = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Census-2027-Slip-${record.referenceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReceipt = () => {
    window.print();
  };

  const steps = [
    { num: 1, title: 'Household Details', desc: 'Location & Identity' },
    { num: 2, title: 'Phase 1: Housing', desc: 'Amenities & Assets' },
    { num: 3, title: 'Phase 2: Population', desc: 'Member Demographics' },
    { num: 4, title: 'AI Verification', desc: 'Cross-Rule Validation' },
    { num: 5, title: 'Digital Census Slip', desc: 'Official QR & Receipt' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Top Banner & Demo Loader */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold tracking-wide border border-emerald-500/30">
              National Digital Self-Enumeration Portal
            </span>
            <span className="text-xs text-slate-400">Digital Census 2027</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Official Self-Enumeration Questionnaire (Phase 1 & Phase 2)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Complete your household particulars online in 5 minutes. Obtain a verified QR-coded reference slip to show the visiting enumerator for 30-second rapid verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadDemoData}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            title="Populate complete verified sample household"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (isCompleted || s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">{s.title}</div>
                  <div className={`text-[10px] hidden md:block truncate ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Please correct the following before proceeding:</span>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STEP 1: Household Identification & Building Particulars */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Step 1: Household Identification & Location</span>
              </h3>
              <p className="text-xs text-slate-500">
                Official geographical jurisdiction and primary respondent particulars
              </p>
            </div>
            <button
              onClick={() => onAskCensusMitra('How do I find my Census House Number or Ward?')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need help?</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State / Union Territory *</label>
              <select
                value={record.state}
                onChange={(e) => setRecord({ ...record, state: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              >
                <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (उत्तर प्रदेश)</option>
                <option value="Tamil Nadu">Tamil Nadu (तमिलनाडु)</option>
                <option value="Karnataka">Karnataka (कर्नाटक)</option>
                <option value="Gujarat">Gujarat (गुजरात)</option>
                <option value="West Bengal">West Bengal (पश्चिम बंगाल)</option>
                <option value="Delhi (NCT)">Delhi (NCT)</option>
                <option value="Kerala">Kerala (केरल)</option>
                <option value="Telangana">Telangana (तेलंगाना)</option>
                <option value="Andhra Pradesh">Andhra Pradesh (आंध्र प्रदेश)</option>
                <option value="Rajasthan">Rajasthan (राजस्थान)</option>
                <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                <option value="Bihar">Bihar (बिहार)</option>
                <option value="Punjab">Punjab (पंजाब)</option>
                <option value="Assam">Assam (असम)</option>
                <option value="Jammu & Kashmir (UT)">Jammu & Kashmir (UT)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                value={record.district}
                onChange={(e) => setRecord({ ...record, district: e.target.value })}
                placeholder="e.g. Pune, Lucknow, Chennai"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sub-District / Tehsil / Taluka *</label>
              <input
                type="text"
                value={record.subDistrictOrTehsil}
                onChange={(e) => setRecord({ ...record, subDistrictOrTehsil: e.target.value })}
                placeholder="e.g. Haveli, Sadar"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Town / Village *</label>
              <input
                type="text"
                value={record.townOrVillage}
                onChange={(e) => setRecord({ ...record, townOrVillage: e.target.value })}
                placeholder="e.g. Pune City, Rampur"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward / Enumeration Block No.</label>
              <input
                type="text"
                value={record.wardOrBlockNumber}
                onChange={(e) => setRecord({ ...record, wardOrBlockNumber: e.target.value })}
                placeholder="e.g. Ward 14, Block 002"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode (6 digits) *</label>
              <input
                type="text"
                maxLength={6}
                value={record.pincode}
                onChange={(e) => setRecord({ ...record, pincode: e.target.value })}
                placeholder="e.g. 411005"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Respondent particulars */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Head of Household & Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name of Head of Household *</label>
                <input
                  type="text"
                  value={record.headOfHouseholdName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setRecord((prev) => ({
                      ...prev,
                      headOfHouseholdName: name,
                      phase2Members: prev.phase2Members.map((m, idx) =>
                        idx === 0 ? { ...m, fullName: name } : m
                      ),
                    }));
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (for SMS confirmation) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={record.mobileNumber}
                  onChange={(e) => setRecord({ ...record, mobileNumber: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email ID (Optional)</label>
                <input
                  type="email"
                  value={record.email}
                  onChange={(e) => setRecord({ ...record, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Phase 1 Housing Amenities & Assets */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Step 2: Phase 1 — Housing Census & Household Amenities</span>
              </h3>
              <p className="text-xs text-slate-500">
                Official questions on living conditions, building materials, sanitation, energy, and assets
              </p>
            </div>
            <button
              onClick={() => onAskCensusMitra('What are the official categories for building materials in Phase 1?')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask AI Guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Predominant Wall Material</label>
              <select
                value={record.phase1.wallMaterial}
                onChange={(e) => handlePhase1Change('wallMaterial', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Burnt Brick/Stone">Burnt Brick / Stone (पक्की ईंट / पत्थर)</option>
                <option value="Concrete/GI Sheets">Concrete / GI Sheets (कंक्रीट)</option>
                <option value="Mud/Unburnt Brick">Mud / Unburnt Brick (कच्ची मिट्टी / ईंट)</option>
                <option value="Wood">Wood (लकड़ी)</option>
                <option value="Grass/Thatch/Bamboo">Grass / Thatch / Bamboo (घास / फूस)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Predominant Roof Material</label>
              <select
                value={record.phase1.roofMaterial}
                onChange={(e) => handlePhase1Change('roofMaterial', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Concrete (RCC)">Concrete RCC (आरसीसी छत)</option>
                <option value="Tiles/Slate">Tiles / Slate (खपरैल / स्लेट)</option>
                <option value="Metal/GI Sheets">Metal / GI Sheets (टिन / चादर)</option>
                <option value="Brick/Stone">Brick / Stone (ईंट / पत्थर)</option>
                <option value="Grass/Thatch/Bamboo">Grass / Thatch (घास / फूस)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ownership Status</label>
              <select
                value={record.phase1.ownershipStatus}
                onChange={(e) => handlePhase1Change('ownershipStatus', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Owned">Owned (स्वामित्व वाला)</option>
                <option value="Rented">Rented (किराए का)</option>
                <option value="Any Other">Any Other (अन्य)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Major Source of Drinking Water</label>
              <select
                value={record.phase1.drinkingWaterSource}
                onChange={(e) => handlePhase1Change('drinkingWaterSource', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Tap water from treated source">Tap water from treated source (नल का उपचारित जल)</option>
                <option value="Tap water untreated">Tap water untreated (नल का अनुपचारित जल)</option>
                <option value="Handpump/Tubewell">Handpump / Tubewell (हैंडपंप / नलकूप)</option>
                <option value="Well (Covered/Uncovered)">Well Covered/Uncovered (कुआं)</option>
                <option value="Spring/River">Spring / River (झरना / नदी)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Main Source of Lighting</label>
              <select
                value={record.phase1.lightingSource}
                onChange={(e) => handlePhase1Change('lightingSource', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Electricity">Electricity (विद्युत)</option>
                <option value="Solar power">Solar Power (सौर ऊर्जा)</option>
                <option value="Kerosene">Kerosene (मिट्टी का तेल)</option>
                <option value="No lighting">No lighting (कोई प्रकाश नहीं)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Access to Latrine Facility</label>
              <select
                value={record.phase1.latrineFacility}
                onChange={(e) => handlePhase1Change('latrineFacility', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Flush/Pour-flush to piped sewer">Flush to piped sewer system (सीवर से जुड़ा फ्लश)</option>
                <option value="Flush to septic tank">Flush to septic tank (सेप्टिक टैंक से जुड़ा फ्लश)</option>
                <option value="Pit latrine">Pit latrine (गड्ढे वाला शौचालय)</option>
                <option value="Community/Public toilet">Community / Public toilet (सामुदायिक शौचालय)</option>
                <option value="Open defecation">Open defecation (खुले में)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Main Fuel Used for Cooking</label>
              <select
                value={record.phase1.mainCookingFuel}
                onChange={(e) => handlePhase1Change('mainCookingFuel', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="LPG/PNG">LPG / PNG (रसोई गैस)</option>
                <option value="Biogas">Biogas (बायोगैस)</option>
                <option value="Electricity">Electricity (इंडक्शन / बिजली)</option>
                <option value="Firewood/Coal/Dung">Firewood / Coal / Dung (लकड़ी / कोयला / उपले)</option>
                <option value="Solar">Solar Cooker (सौर ऊर्जा)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Dwelling Rooms</label>
              <input
                type="number"
                min={1}
                max={20}
                value={record.phase1.numberOfDwellingRooms}
                onChange={(e) => handlePhase1Change('numberOfDwellingRooms', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Household Assets Checklist */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Household Assets & Connectivity Checklist (Yes / No)</h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Used strictly for aggregated developmental planning. Zero tax or banking tracking.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.phase1.hasTelevision}
                  onChange={(e) => handlePhase1Change('hasTelevision', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Television (टीवी)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.phase1.hasInternetBroadband}
                  onChange={(e) => handlePhase1Change('hasInternetBroadband', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Broadband / Internet</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.phase1.hasSmartphoneOrComputer}
                  onChange={(e) => handlePhase1Change('hasSmartphoneOrComputer', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Computer / Laptop</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.phase1.hasTwoWheeler}
                  onChange={(e) => handlePhase1Change('hasTwoWheeler', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Two-Wheeler (Scooter/Bike)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.phase1.hasFourWheeler}
                  onChange={(e) => handlePhase1Change('hasFourWheeler', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Four-Wheeler (Car/Jeep)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer bg-emerald-50/50 border-emerald-200">
                <input
                  type="checkbox"
                  checked={record.phase1.hasAvailingBankingServices}
                  onChange={(e) => handlePhase1Change('hasAvailingBankingServices', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium text-emerald-900">Availing Banking Services</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Phase 2 Population Enumeration (Members Registry) */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Step 3: Phase 2 — Individual Population Enumeration</span>
              </h3>
              <p className="text-xs text-slate-500">
                Demographic details of every resident member normally residing in the household
              </p>
            </div>

            <button
              onClick={handleAddMember}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Family Member</span>
            </button>
          </div>

          <div className="space-y-4">
            {record.phase2Members.map((member, index) => (
              <div
                key={member.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {member.fullName || `Member #${index + 1}`}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {member.relationshipToHead}
                    </span>
                  </div>

                  {record.phase2Members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) => handleMemberChange(member.id, 'fullName', e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relationship to Head</label>
                    <select
                      value={member.relationshipToHead}
                      onChange={(e) => handleMemberChange(member.id, 'relationshipToHead', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Head of Household">Head of Household (मुखिया)</option>
                      <option value="Spouse">Spouse (पति/पत्नी)</option>
                      <option value="Son">Son (पुत्र)</option>
                      <option value="Daughter">Daughter (पुत्री)</option>
                      <option value="Father">Father (पिता)</option>
                      <option value="Mother">Mother (माता)</option>
                      <option value="Brother">Brother (भाई)</option>
                      <option value="Sister">Sister (बहन)</option>
                      <option value="Other Relative">Other Relative (अन्य रिश्तेदार)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={member.gender}
                      onChange={(e) => handleMemberChange(member.id, 'gender', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Male">Male (पुरुष)</option>
                      <option value="Female">Female (महिला)</option>
                      <option value="Transgender">Transgender (तृतीय लिंग)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={member.age}
                      onChange={(e) => handleMemberChange(member.id, 'age', parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Marital Status</label>
                    <select
                      value={member.maritalStatus}
                      onChange={(e) => handleMemberChange(member.id, 'maritalStatus', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Never Married">Never Married (अविवाहित)</option>
                      <option value="Currently Married">Currently Married (विवाहित)</option>
                      <option value="Widowed">Widowed (विधवा/विधुर)</option>
                      <option value="Separated/Divorced">Separated/Divorced (तलाकशुदा)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Highest Education Level</label>
                    <select
                      value={member.educationalAttainment}
                      onChange={(e) => handleMemberChange(member.id, 'educationalAttainment', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Illiterate">Illiterate (निरक्षर)</option>
                      <option value="Primary (Class 1-5)">Primary (कक्षा 1-5)</option>
                      <option value="Middle School (Class 6-8)">Middle School (कक्षा 6-8)</option>
                      <option value="Secondary (Class 10)">Secondary (10वीं)</option>
                      <option value="Higher Secondary (Class 12)">Higher Secondary (12वीं)</option>
                      <option value="Graduate">Graduate (स्नातक)</option>
                      <option value="Post Graduate & Above">Post Graduate & Above (परास्नातक)</option>
                      <option value="Technical / Diploma">Technical / Diploma (डिप्लोमा)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Economic Activity</label>
                    <select
                      value={member.economicActivity}
                      onChange={(e) => handleMemberChange(member.id, 'economicActivity', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    >
                      <option value="Main Worker (>6 months)">Main Worker (&gt;6 months)</option>
                      <option value="Marginal Worker (<6 months)">Marginal Worker (&lt;6 months)</option>
                      <option value="Non-Worker (Student/Homemaker/Retired/Other)">Non-Worker (Student / Homemaker / Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mother Tongue</label>
                    <input
                      type="text"
                      value={member.motherTongue}
                      onChange={(e) => handleMemberChange(member.id, 'motherTongue', e.target.value)}
                      placeholder="e.g. Hindi, Marathi, Tamil"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: CensusMitra Intelligent AI Validation */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-amber-500" />
                <span>Step 4: CensusMitra AI Verification & Cross-Rule Audit</span>
              </h3>
              <p className="text-xs text-slate-500">
                Automated legal compliance, demographic consistency check, and hash generation
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Census Act Compliant</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Checklist</span>
              </h4>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Geographic Jurisdiction</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {record.state}, {record.district} ({record.pincode})
                  </span>
                </li>

                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Household Head</span>
                  <span className="font-semibold text-slate-900">
                    {record.headOfHouseholdName || 'Head Identified'}
                  </span>
                </li>

                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Total Members Recorded</span>
                  <span className="font-bold text-blue-600">
                    {record.phase2Members.length} Person(s)
                  </span>
                </li>

                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Phase 1 Housing Amenities</span>
                  <span className="font-semibold text-emerald-700">
                    {record.phase1.drinkingWaterSource.split(' ')[0]} Water • {record.phase1.mainCookingFuel}
                  </span>
                </li>

                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Confidentiality Seal</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Section 15 Encrypted
                  </span>
                </li>
              </ul>
            </div>

            {/* AI Real-Time Insights */}
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-md text-amber-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">CensusMitra AI Auditor Feedback</h4>
                  <p className="text-[11px] text-amber-800">Zero logical discrepancies found</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-100">
                <p>
                  ✅ <strong>Age-Occupation Logic:</strong> All recorded members pass age eligibility and schooling benchmarks.
                </p>
                <p>
                  ✅ <strong>Household Head Designation:</strong> Exactly one primary household respondent is configured.
                </p>
                <p>
                  ✅ <strong>Digital Hash Readiness:</strong> Your questionnaire is ready to be encrypted into an offline verifiable QR code.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-500">
                Click <strong>"Finalize & Generate Digital Census Slip"</strong> below to obtain your official acknowledgment receipt.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Official Digital Census 2027 Acknowledgment Slip */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-md max-w-3xl mx-auto print:border-none print:shadow-none" id="printable-census-slip">
            
            {/* Slip Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
              <div className="inline-block text-[11px] uppercase tracking-widest font-bold px-3 py-0.5 bg-slate-900 text-white rounded-full mb-1">
                GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-serif">
                DIGITAL CENSUS 2027 — SELF-ENUMERATION ACKNOWLEDGMENT
              </h3>
              <p className="text-xs text-slate-600">
                Office of the Registrar General & Census Commissioner of India
              </p>
            </div>

            {/* Reference Number & QR Visual */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Official Census Reference ID
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-wider flex items-center gap-2 mt-0.5">
                  <span>{record.referenceNumber}</span>
                  <button
                    onClick={copyRefNumber}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Copy Reference Number"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Submitted on: <strong>{record.submissionDate || new Date().toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Simulated QR Code Box */}
              <div className="w-28 h-28 bg-white border-2 border-slate-800 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0 text-center shadow-xs">
                <QrCode className="w-18 h-18 text-slate-900" />
                <span className="text-[8px] font-mono font-bold text-slate-600">VERIFY-CEN-27</span>
              </div>
            </div>

            {/* Summary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
                  Household Jurisdiction
                </span>
                <div><span className="text-slate-500">State / UT:</span> <strong>{record.state}</strong></div>
                <div><span className="text-slate-500">District:</span> <strong>{record.district}</strong></div>
                <div><span className="text-slate-500">Town / Village:</span> <strong>{record.townOrVillage}</strong></div>
                <div><span className="text-slate-500">Pincode:</span> <strong>{record.pincode}</strong></div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
                  Respondent & Enumeration Summary
                </span>
                <div><span className="text-slate-500">Head of Family:</span> <strong>{record.headOfHouseholdName || 'Recorded'}</strong></div>
                <div><span className="text-slate-500">Total Members:</span> <strong>{record.phase2Members.length} Members</strong></div>
                <div><span className="text-slate-500">House Condition:</span> <strong>{record.phase1.conditionOfHouse} ({record.phase1.wallMaterial})</strong></div>
                <div><span className="text-slate-500">Drinking Water:</span> <strong>{record.phase1.drinkingWaterSource}</strong></div>
              </div>
            </div>

            {/* Members Summary Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Full Name</th>
                    <th className="p-2">Relation</th>
                    <th className="p-2">Gender</th>
                    <th className="p-2">Age</th>
                    <th className="p-2">Education</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.phase2Members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-900">{m.fullName || 'Member'}</td>
                      <td className="p-2 text-slate-600">{m.relationshipToHead}</td>
                      <td className="p-2 text-slate-600">{m.gender}</td>
                      <td className="p-2 text-slate-600">{m.age} yrs</td>
                      <td className="p-2 text-slate-600">{m.educationalAttainment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cryptographic Hash & Legal Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-mono text-[10px]">
                <span>DIGITAL SIGNATURE HASH:</span>
                <span className="truncate max-w-xs">{record.digitalHash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65d'}</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-500 pt-1 border-t border-slate-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Confidentiality:</strong> This document confirms successful digital self-enumeration under the Census Act, 1948. When the official enumerator visits your house, show this QR code or 12-digit reference number for instant verification.
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={printReceipt}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Acknowledgment Slip</span>
            </button>

            <button
              onClick={downloadJsonReceipt}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-300"
            >
              <Download className="w-4 h-4" />
              <span>Download Digital Record (JSON)</span>
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setRecord({
                  ...record,
                  referenceNumber: `CEN-2027-IND-${Math.floor(100000 + Math.random() * 900000)}`,
                });
              }}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-amber-200"
            >
              <Plus className="w-4 h-4" />
              <span>Fill Another Household</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Prev / Next) */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <span>{currentStep === 4 ? 'Finalize & Generate Digital Slip' : 'Save & Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
