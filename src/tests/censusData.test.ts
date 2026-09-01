import { describe, it, expect } from 'vitest';
import {
  ALL_STATES_SCHEDULES,
  SUPPORTED_LANGUAGES,
  VERIFIED_MYTH_FACTS,
  DEMOGRAPHIC_STATS_2027,
} from '../data/censusData';

describe('Census 2027 Schedule Data Integrity', () => {
  it('should include all 36 States and Union Territories of India', () => {
    expect(ALL_STATES_SCHEDULES.length).toBe(36);
  });

  it('should contain valid date ranges for Phase 1 and Phase 2 in all state records', () => {
    ALL_STATES_SCHEDULES.forEach((state) => {
      expect(state.id).toBeDefined();
      expect(state.stateName).toBeTruthy();
      expect(state.phase1Start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(state.phase1End).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(state.phase2Start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(state.phase2End).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(state.gazetteNotification).toMatch(/^GOI-MHA-CEN-2026/);
      expect(state.contactHelpline).toBeTruthy();
      expect(state.nodalOfficer).toBeTruthy();
    });
  });

  it('should support the official 8th Schedule Indian languages in UI selector', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(12);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('mr');
    expect(codes).toContain('ta');
    expect(codes).toContain('te');
    expect(codes).toContain('bn');
    expect(codes).toContain('gu');
  });

  it('should provide verified fact-check and rumor debunking data cards', () => {
    expect(VERIFIED_MYTH_FACTS.length).toBeGreaterThanOrEqual(6);
    VERIFIED_MYTH_FACTS.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.rumor).toBeTruthy();
      expect(item.fact).toBeTruthy();
      expect(item.legalBasis).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.verdict).toBeTruthy();
    });
  });

  it('should contain complete 2027 demographic projection datasets', () => {
    expect(DEMOGRAPHIC_STATS_2027.populationByAgeGroup).toBeDefined();
    expect(DEMOGRAPHIC_STATS_2027.populationByAgeGroup.labels.length).toBeGreaterThan(0);
    expect(DEMOGRAPHIC_STATS_2027.literacyTrend1991_2027).toBeDefined();
    expect(DEMOGRAPHIC_STATS_2027.amenitiesComparison).toBeDefined();
  });
});
