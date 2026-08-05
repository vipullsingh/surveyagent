import { AngleCoverage, ClaimType, GuidedAngle, Media, WizardCompleteness } from '../types';

/**
 * Compulsory angle prompts per claim type (Requirement 4.2 - Guided Photo Wizard).
 * The surveyor is walked through these in order; required slots gate report sign-off.
 */
const MOTOR_ANGLES: GuidedAngle[] = [
  { id: 'front_bumper', label: 'Front Bumper', hint: 'Square-on, full bumper width in frame', required: true },
  { id: 'rear_bumper', label: 'Rear Bumper', hint: 'Square-on, include tail lamps', required: true },
  { id: 'left_profile', label: 'Left Side Profile', hint: 'Full length of vehicle, driver side', required: true },
  { id: 'right_profile', label: 'Right Side Profile', hint: 'Full length of vehicle, passenger side', required: true },
  { id: 'chassis_vin', label: 'Chassis VIN Plate', hint: 'All 17 characters legible', required: true },
  { id: 'dashboard_odometer', label: 'Dashboard Odometer', hint: 'Ignition on, reading legible', required: true },
  { id: 'damage_closeup', label: 'Damage Close-Up', hint: 'Point of impact, within 1 metre', required: true },
  { id: 'underbody_leak', label: 'Underbody / Fluid Leak', hint: 'Ground under engine bay', required: false },
  { id: 'tyres', label: 'Tyre Condition', hint: 'Tread depth on the damaged axle', required: false },
];

const FIRE_ANGLES: GuidedAngle[] = [
  { id: 'building_frontage', label: 'Building Frontage', hint: 'Full elevation with street context', required: true },
  { id: 'seat_of_fire', label: 'Seat of Fire Origin', hint: 'Deepest charring / V-pattern base', required: true },
  { id: 'ceiling_roof', label: 'Roof & Ceiling Damage', hint: 'Look up from the affected room', required: true },
  { id: 'electrical_panel', label: 'Electrical Distribution Panel', hint: 'Breakers and incoming supply', required: true },
  { id: 'contents_damage', label: 'Contents / Stock Damage', hint: 'Salvage laid out where possible', required: true },
  { id: 'adjacent_property', label: 'Adjacent Property', hint: 'Spread exposure to neighbours', required: false },
  { id: 'firefighting_equipment', label: 'Firefighting Equipment', hint: 'Extinguishers, hydrants, sprinkler heads', required: false },
];

const PROPERTY_ANGLES: GuidedAngle[] = [
  { id: 'property_frontage', label: 'Property Frontage', hint: 'Full elevation with door number visible', required: true },
  { id: 'damage_overview', label: 'Damage Overview', hint: 'Whole affected room from the doorway', required: true },
  { id: 'damage_closeup', label: 'Damage Close-Up', hint: 'Within 1 metre of the affected surface', required: true },
  { id: 'water_ingress', label: 'Water Ingress / Source Point', hint: 'Trace back to the failed component', required: true },
  { id: 'contents_damage', label: 'Contents Damage', hint: 'Affected furnishings and fittings', required: true },
  { id: 'roof_exterior', label: 'Roof / Exterior Envelope', hint: 'From ground level, note missing elements', required: false },
];

const MARINE_ANGLES: GuidedAngle[] = [
  { id: 'container_exterior', label: 'Container / Vessel Exterior', hint: 'Include the container or hull number', required: true },
  { id: 'seal_number', label: 'Seal Number', hint: 'Seal intact or broken, digits legible', required: true },
  { id: 'cargo_stow', label: 'Cargo Stowage', hint: 'As-found, before any destuffing', required: true },
  { id: 'packaging_condition', label: 'Packaging Condition', hint: 'Crushing, wetting or tearing of outers', required: true },
  { id: 'damaged_goods', label: 'Damaged Goods Close-Up', hint: 'Individual affected units', required: true },
  { id: 'water_ingress', label: 'Water Ingress Point', hint: 'Roof, door gasket or floor of container', required: false },
  { id: 'shipping_docs', label: 'Bill of Lading / Packing List', hint: 'Flat, all four corners in frame', required: false },
];

const ENGINEERING_ANGLES: GuidedAngle[] = [
  { id: 'machine_nameplate', label: 'Machine Nameplate', hint: 'Make, model and serial legible', required: true },
  { id: 'site_overview', label: 'Site / Plant Overview', hint: 'Machine in its installed position', required: true },
  { id: 'breakdown_point', label: 'Breakdown Point', hint: 'Failed component, close-up', required: true },
  { id: 'control_panel', label: 'Control Panel & Fault Code', hint: 'HMI display showing the active fault', required: true },
  { id: 'lubrication', label: 'Lubrication / Oil Condition', hint: 'Sump, sight glass or drained sample', required: false },
  { id: 'foundation_mount', label: 'Foundation & Mounting', hint: 'Anchor bolts and alignment', required: false },
];

const GENERIC_ANGLES: GuidedAngle[] = [
  { id: 'site_overview', label: 'Site Overview', hint: 'Wide establishing shot of the loss location', required: true },
  { id: 'damage_overview', label: 'Damage Overview', hint: 'Whole affected area in one frame', required: true },
  { id: 'damage_closeup', label: 'Damage Close-Up', hint: 'Within 1 metre of the damage', required: true },
  { id: 'identification', label: 'Asset Identification', hint: 'Serial, registration or door number', required: true },
  { id: 'context', label: 'Surrounding Context', hint: 'Approach and adjacent property', required: false },
];

const ANGLE_TEMPLATES: Record<ClaimType, GuidedAngle[]> = {
  MOTOR: MOTOR_ANGLES,
  FIRE: FIRE_ANGLES,
  PROPERTY: PROPERTY_ANGLES,
  MARINE: MARINE_ANGLES,
  ENGINEERING: ENGINEERING_ANGLES,
  OTHER: GENERIC_ANGLES,
};

/** Free-form slot used when the surveyor captures outside the wizard sequence. */
export const AD_HOC_ANGLE: GuidedAngle = {
  id: 'ad_hoc',
  label: 'Additional Evidence',
  hint: 'Unprompted supporting photograph',
  required: false,
};

export const getGuidedAngles = (claimType: ClaimType): GuidedAngle[] =>
  ANGLE_TEMPLATES[claimType] ?? GENERIC_ANGLES;

export const findAngle = (claimType: ClaimType, angleId?: string): GuidedAngle | undefined => {
  if (!angleId) return undefined;
  if (angleId === AD_HOC_ANGLE.id) return AD_HOC_ANGLE;
  return getGuidedAngles(claimType).find(a => a.id === angleId);
};

/**
 * Scores wizard coverage for a case. Soft-deleted media never counts toward completeness.
 */
export const computeCompleteness = (claimType: ClaimType, medias: Media[]): WizardCompleteness => {
  const angles = getGuidedAngles(claimType);
  const live = medias.filter(m => !m.isDeleted && m.fileType === 'PHOTO');

  const coverage: AngleCoverage[] = angles.map(angle => ({
    angle,
    captured: live.filter(m => m.angleId === angle.id).length,
  }));

  const requiredCoverage = coverage.filter(c => c.angle.required);
  const requiredTotal = requiredCoverage.length;
  const requiredCaptured = requiredCoverage.filter(c => c.captured > 0).length;

  return {
    coverage,
    missingRequired: requiredCoverage.filter(c => c.captured === 0).map(c => c.angle),
    requiredTotal,
    requiredCaptured,
    percent: requiredTotal === 0 ? 100 : Math.round((requiredCaptured / requiredTotal) * 100),
    isComplete: requiredCaptured === requiredTotal,
  };
};

/**
 * Next uncaptured slot, preferring required ones, so the wizard always has a prompt to show.
 */
export const nextPendingAngle = (claimType: ClaimType, medias: Media[]): GuidedAngle | undefined => {
  const { coverage } = computeCompleteness(claimType, medias);
  return (
    coverage.find(c => c.angle.required && c.captured === 0)?.angle ??
    coverage.find(c => c.captured === 0)?.angle
  );
};
