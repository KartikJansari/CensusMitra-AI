import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidPincode,
  isValidIndianMobile,
  calculateAgeFromDob,
  validatePhase1Record,
  validatePhase2Members,
  generateCensusDigitalHash,
  COMPLIANCE_TEST_SUITE,
} from '../utils/securityAndValidation';
import { Phase1Amenities, HouseholdMember } from '../types/census';

describe('Security & Input Sanitization', () => {
  it('should neutralize XSS and script injections', () => {
    const dirty = '<script>alert("hack")</script>Hello <img src="x" onerror="steal()"/>World';
    const clean = sanitizeInput(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('</script>');
    expect(clean).not.toContain('<img');
    expect(clean).toBe('alert("hack")Hello World');
  });

  it('should trim and handle empty or null input gracefully', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('Postal Code and Mobile Number Validation', () => {
  it('should accurately validate Indian 6-digit PIN codes', () => {
    expect(isValidPincode('110001')).toBe(true); // Delhi
    expect(isValidPincode('400001')).toBe(true); // Mumbai
    expect(isValidPincode('560001')).toBe(true); // Bengaluru
    expect(isValidPincode('700001')).toBe(true); // Kolkata

    expect(isValidPincode('012345')).toBe(false); // Leading zero
    expect(isValidPincode('12345')).toBe(false); // 5 digits
    expect(isValidPincode('1234567')).toBe(false); // 7 digits
    expect(isValidPincode('ABCDEF')).toBe(false); // Letters
  });

  it('should accurately validate Indian 10-digit mobile numbers', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('8765432109')).toBe(true);
    expect(isValidIndianMobile('7654321098')).toBe(true);
    expect(isValidIndianMobile('6543210987')).toBe(true);
    expect(isValidIndianMobile('+91 98765 43210')).toBe(true);

    expect(isValidIndianMobile('5123456789')).toBe(false); // Starts with 5
    expect(isValidIndianMobile('12345')).toBe(false); // Short
    expect(isValidIndianMobile('987654321099')).toBe(false); // Too long
  });
});

describe('Census Reference Date & Age Computation', () => {
  it('should calculate precise age against Census Reference Date (Feb 9, 2027)', () => {
    // Exact birthday on reference date
    expect(calculateAgeFromDob('2000-02-09')).toBe(27);
    // Birthday later in the year
    expect(calculateAgeFromDob('2000-06-15')).toBe(26);
    // Born in 1990
    expect(calculateAgeFromDob('1990-01-01')).toBe(37);
  });

  it('should handle edge cases and invalid date inputs safely', () => {
    expect(calculateAgeFromDob('')).toBe(0);
  });
});

describe('Phase 1 Houselisting Record Validation', () => {
  const validPhase1: Phase1Amenities = {
    buildingNumber: 'B-101',
    censusHouseNumber: 'H-202',
    useOfCensusHouse: 'Residence',
    conditionOfHouse: 'Good',
    wallMaterial: 'Burnt Brick/Stone',
    roofMaterial: 'Concrete (RCC)',
    floorMaterial: 'Cement',
    ownershipStatus: 'Owned',
    numberOfDwellingRooms: 3,
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
    hasFourWheeler: true,
    hasAvailingBankingServices: true,
  };

  it('should pass for a fully compliant Phase 1 record', () => {
    const res = validatePhase1Record(validPhase1);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('should reject when building number or census house number is missing', () => {
    const invalidRecord = { ...validPhase1, buildingNumber: '', censusHouseNumber: '' };
    const res = validatePhase1Record(invalidRecord);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject invalid room count', () => {
    const invalidRecord = { ...validPhase1, numberOfDwellingRooms: 0 };
    const res = validatePhase1Record(invalidRecord);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Dwelling rooms must be at least 1.');
  });
});

describe('Phase 2 Household Demographic Validation', () => {
  const headMember: HouseholdMember = {
    id: 'm-1',
    fullName: 'Rajesh Kumar Sharma',
    relationshipToHead: 'Head of Household',
    gender: 'Male',
    dob: '1985-04-12',
    age: 41,
    maritalStatus: 'Currently Married',
    educationalAttainment: 'Post Graduate',
    literacyStatus: 'Literate',
    economicActivity: 'Main Worker (>6 months)',
    motherTongue: 'Hindi',
    otherLanguagesKnown: ['English', 'Marathi'],
    disabilityStatus: 'None',
    migrationBirthplace: 'Same District',
    migrationReason: 'Birth Place',
  };

  const spouseMember: HouseholdMember = {
    id: 'm-2',
    fullName: 'Sunita Sharma',
    relationshipToHead: 'Spouse',
    gender: 'Female',
    dob: '1988-08-20',
    age: 38,
    maritalStatus: 'Currently Married',
    educationalAttainment: 'Graduate',
    literacyStatus: 'Literate',
    economicActivity: 'Main Worker (>6 months)',
    motherTongue: 'Hindi',
    otherLanguagesKnown: ['English'],
    disabilityStatus: 'None',
    migrationBirthplace: 'Same State, Different District',
    migrationReason: 'Marriage',
  };

  it('should validate a compliant multi-member household with designated Head', () => {
    const res = validatePhase2Members([headMember, spouseMember]);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('should fail if no Head of Household is specified', () => {
    const noHeadMembers = [
      { ...headMember, relationshipToHead: 'Son / Daughter' },
      spouseMember,
    ];
    const res = validatePhase2Members(noHeadMembers);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Household must designate exactly one "Head of Household".');
  });

  it('should fail if multiple Heads of Household are declared', () => {
    const multiHeadMembers = [
      headMember,
      { ...spouseMember, relationshipToHead: 'Head of Household' },
    ];
    const res = validatePhase2Members(multiHeadMembers);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('A household cannot have more than one "Head of Household".');
  });

  it('should fail on empty member list', () => {
    const res = validatePhase2Members([]);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('At least one household member must be enumerated.');
  });
});

describe('Cryptographic Seal Generation & Audit Benchmark Suite', () => {
  it('should generate verifiable SHA-256 seal format', () => {
    const seal = generateCensusDigitalHash({
      referenceNumber: 'CEN-2027-DL-109281',
      state: 'Delhi',
      district: 'New Delhi',
      headOfHouseholdName: 'Amit Verma',
    });
    expect(seal).toMatch(/^SHA256:0X[A-F0-9]+/i);
  });

  it('should execute and pass all built-in compliance test suite benchmarks', () => {
    COMPLIANCE_TEST_SUITE.forEach((tc) => {
      const result = tc.execute();
      expect(result.passed).toBe(true);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
