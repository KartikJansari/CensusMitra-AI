export type LanguageCode = 
  | 'en' 
  | 'hi' 
  | 'bn' 
  | 'mr' 
  | 'te' 
  | 'ta' 
  | 'gu' 
  | 'kn' 
  | 'ml' 
  | 'pa' 
  | 'or' 
  | 'as';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  flag?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

export interface ChartDataBlock {
  chartType: 'bar' | 'pie' | 'line' | 'doughnut';
  title: string;
  description?: string;
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language?: LanguageCode;
  timestamp: string;
  chartData?: ChartDataBlock;
  actionSteps?: string[];
  suggestedPrompts?: string[];
  isAudioPlaying?: boolean;
}

export interface StateSchedule {
  id: string;
  stateName: string;
  stateNameHi: string;
  type: 'State' | 'Union Territory';
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North East' | 'UT';
  phase1Start: string;
  phase1End: string;
  phase2Start: string;
  phase2End: string;
  selfEnumPhase1Start: string;
  selfEnumPhase1End: string;
  selfEnumPhase2Start: string;
  selfEnumPhase2End: string;
  status: 'Upcoming' | 'Active Self-Enum' | 'Active Enumerator' | 'Completed';
  nodalOfficer: string;
  contactHelpline: string;
  gazetteNotification: string;
}

export interface MythFactItem {
  id: string;
  rumor: string;
  rumorHi: string;
  verdict: 'FALSE' | 'MISLEADING' | 'FACT';
  fact: string;
  factHi: string;
  legalBasis: string;
  source: string;
  category: 'Citizenship' | 'Banking & Tax' | 'Biometrics' | 'Confidentiality' | 'Legal Mandatory';
}

export interface HouseholdMember {
  id: string;
  fullName: string;
  relationshipToHead: string;
  gender: 'Male' | 'Female' | 'Transgender';
  dob: string;
  age: number;
  maritalStatus: 'Never Married' | 'Currently Married' | 'Widowed' | 'Separated/Divorced';
  educationalAttainment: string;
  literacyStatus: 'Literate' | 'Illiterate';
  economicActivity: 'Main Worker (>6 months)' | 'Marginal Worker (<6 months)' | 'Non-Worker (Student/Homemaker/Retired/Other)';
  occupationCategory?: string;
  religion?: string;
  socialCategory?: 'General' | 'OBC' | 'SC' | 'ST';
  motherTongue: string;
  otherLanguagesKnown: string[];
  disabilityStatus: 'None' | 'Locomotor' | 'Visual' | 'Hearing' | 'Speech' | 'Mental/Intellectual' | 'Multiple';
  migrationBirthplace: string;
  migrationReason: 'Birth Place' | 'Employment' | 'Business' | 'Education' | 'Marriage' | 'Family Moved' | 'Other';
}

export interface Phase1Amenities {
  buildingNumber: string;
  censusHouseNumber: string;
  useOfCensusHouse: 'Residence' | 'Residence-cum-Other' | 'Shop/Office' | 'School/College' | 'Hospital' | 'Other';
  conditionOfHouse: 'Good' | 'Livable' | 'Dilapidated';
  wallMaterial: 'Grass/Thatch/Bamboo' | 'Mud/Unburnt Brick' | 'Wood' | 'Burnt Brick/Stone' | 'Concrete/GI Sheets';
  roofMaterial: 'Grass/Thatch/Bamboo' | 'Tiles/Slate' | 'Metal/GI Sheets' | 'Brick/Stone' | 'Concrete (RCC)';
  floorMaterial: 'Mud' | 'Wood/Bamboo' | 'Brick/Stone' | 'Cement' | 'Mosaic/Tiles';
  ownershipStatus: 'Owned' | 'Rented' | 'Any Other';
  numberOfDwellingRooms: number;
  marriedCouplesInHousehold: number;
  drinkingWaterSource: 'Tap water from treated source' | 'Tap water untreated' | 'Well (Covered/Uncovered)' | 'Handpump/Tubewell' | 'Spring/River' | 'Other';
  drinkingWaterLocation: 'Within premises' | 'Near premises' | 'Away';
  lightingSource: 'Electricity' | 'Solar power' | 'Kerosene' | 'Other oil' | 'No lighting';
  latrineFacility: 'Flush/Pour-flush to piped sewer' | 'Flush to septic tank' | 'Pit latrine' | 'Community/Public toilet' | 'Open defecation';
  wasteWaterOutlet: 'Connected to closed drainage' | 'Connected to open drainage' | 'No drainage';
  bathingFacility: 'Bathroom with roof' | 'Enclosure without roof' | 'No separate bathroom';
  kitchenFacility: 'Cooking inside house with LPG/PNG' | 'Cooking inside with Firewood/Cowdung' | 'Cooking outside' | 'No cooking arrangement';
  mainCookingFuel: 'LPG/PNG' | 'Biogas' | 'Electricity' | 'Kerosene' | 'Firewood/Coal/Dung' | 'Solar';
  hasRadio: boolean;
  hasTelevision: boolean;
  hasInternetBroadband: boolean;
  hasSmartphoneOrComputer: boolean;
  hasTwoWheeler: boolean;
  hasFourWheeler: boolean;
  hasAvailingBankingServices: boolean;
}

export interface SelfEnumerationRecord {
  id: string;
  referenceNumber: string;
  state: string;
  district: string;
  subDistrictOrTehsil: string;
  townOrVillage: string;
  wardOrBlockNumber: string;
  pincode: string;
  headOfHouseholdName: string;
  mobileNumber: string;
  email?: string;
  phase1: Phase1Amenities;
  phase2Members: HouseholdMember[];
  submissionStatus: 'Draft' | 'Validated' | 'Submitted';
  submissionDate?: string;
  digitalHash?: string;
}
