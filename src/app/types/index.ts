export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'HEAD_OF_SURGERY' 
  | 'ATTENDING_PHYSICIAN' 
  | 'RESIDENT' 
  | 'CHARGE_NURSE';

export type HospitalDepartment = 
  | 'GENERAL_SURGERY' 
  | 'ORTHOPEDICS' 
  | 'OB_GYN' 
  | 'ANESTHESIOLOGY' 
  | 'EMERGENCY_MEDICINE' 
  | 'CARDIOTHORACIC';

export interface Clinician {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  department: HospitalDepartment;
  medicalLicenseNo: string;
  thaiCouncilId: string;
  avatarUrl: string;
  email: string;
  phone: string;
  annualCmeTarget: number;
  completedCmeHours: number;
  currentStatus: 'ON_DUTY' | 'OFF_DUTY' | 'ON_CALL' | 'IN_SURGERY';
}

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ON_CALL';

export interface ShiftDefinition {
  type: ShiftType;
  labelEn: string;
  labelTh: string;
  startTime: string; // e.g. '08:00'
  endTime: string;   // e.g. '16:00'
  durationHours: number;
  badgeClass: string;
  colorHex: string;
}

export interface ShiftAssignment {
  id: string;
  staffId: string;
  department: HospitalDepartment;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  roleInShift: string; // e.g. 'Lead OR Surgeon', '1st Trauma Responder'
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SWAP_PENDING';
  notes?: string;
}

export interface ShiftSwapRequest {
  id: string;
  requestingStaffId: string;
  targetStaffId: string;
  shiftId: string;
  targetShiftId?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  supervisorNotes?: string;
}

export interface ShiftConflict {
  id: string;
  type: 'OVERLAPPING_SHIFT' | 'INSUFFICIENT_REST' | 'EXCESSIVE_HOURS';
  severity: 'WARNING' | 'CRITICAL';
  staffId: string;
  description: string;
  affectedDates: string[];
}

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  building: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  clockInTime: string;
  clockOutTime?: string;
  status: 'ON_DUTY' | 'COMPLETED' | 'LATE' | 'MISSED';
  tardinessMinutes: number;
  overtimeHours: number;
  overtimeRate: 1.0 | 1.5 | 3.0;
  campusZone: string;
  latitude: number;
  longitude: number;
  isWithinGeofence: boolean;
  notes?: string;
}

export type OperatorRole = 
  | 'PRIMARY_SURGEON' 
  | 'FIRST_ASSISTANT' 
  | 'SECOND_ASSISTANT' 
  | 'OBSERVER_TRAINEE';

export type AnesthesiaType = 
  | 'GENERAL_ANESTHESIA' 
  | 'SPINAL_BLOCK' 
  | 'EPIDURAL' 
  | 'REGIONAL_NERVE_BLOCK' 
  | 'LOCAL_INFILTRATION' 
  | 'MONITORED_ANESTHESIA_CARE';

export type ClavienDindoGrade = 
  | 'NONE'
  | 'GRADE_I'
  | 'CLAVIEN_DINDO_I'
  | 'GRADE_II'
  | 'GRADE_III_A'
  | 'GRADE_III_B'
  | 'GRADE_IV_A'
  | 'GRADE_IV_B'
  | 'GRADE_V';

export type SupervisorEndorsementStatus = 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'REVISION_REQUIRED';

export interface IcdProcedureCode {
  code: string;
  name: string;
  category: string;
  icd10DxCode: string;
  icd10DxName: string;
  avgDurationMin: number;
}

export interface ProcedureRecord {
  id: string;
  caseNumber: string; // e.g. CAS-2026-0812
  patientHnMasked: string; // PDPA Masked e.g. HN-849-***3
  patientAge: number;
  patientGender: 'M' | 'F' | 'OTHER';
  procedureDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  orRoom: string;
  department: HospitalDepartment;
  procedureCode: string;
  procedureName: string;
  diagnosisCode: string;
  diagnosisName: string;
  operatorRole: OperatorRole;
  surgeonId: string;
  supervisorId: string;
  anesthesiologistId: string;
  scrubNurseId: string;
  anesthesiaType: AnesthesiaType;
  estimatedBloodLossMl: number;
  specimenSent: boolean;
  implantUsed: boolean;
  complicationSeverity: ClavienDindoGrade;
  complicationNotes?: string;
  supervisorEndorsement: {
    status: SupervisorEndorsementStatus;
    reviewedBy?: string;
    timestamp?: string;
    feedbackNotes?: string;
    digitalSignatureHash?: string;
  };
  pdpaConsentVerified: boolean;
  surgicalNotes: string;
}

export type CmeCategory = 
  | 'INTERNATIONAL_CONFERENCE' 
  | 'CADAVER_HANDS_ON_WORKSHOP' 
  | 'BLS_ACLS_ATLS' 
  | 'IN_SERVICE_SEMINAR' 
  | 'PEER_REVIEWED_PUBLICATION';

export interface CmeRecord {
  id: string;
  staffId: string;
  title: string;
  category: CmeCategory;
  accreditingBody: 'THAI_MEDICAL_COUNCIL' | 'ROYAL_COLLEGE_OF_SURGEONS' | 'THAI_NURSING_COUNCIL' | 'WFME_INTERNATIONAL';
  creditsEarned: number;
  completionDate: string;
  expiryDate?: string;
  certificateNumber: string;
  certificateIssuer: string;
  verificationStatus: 'ACCREDITED' | 'PENDING_VERIFICATION' | 'REJECTED';
  documentAttachmentName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  role: UserRole;
  action: string;
  resourceType: 'PROCEDURE_LOG' | 'SHIFT_ROSTER' | 'CME_RECORD' | 'ATTENDANCE_PUNCH' | 'ACCREDITATION_EXPORT' | 'USER_ACCOUNT';
  resourceId: string;
  details: string;
  clientIp: string;
  complianceTag: 'HIPAA_COMPLIANT' | 'PDPA_MASKED' | 'AUDIT_ALERT';
}

export interface ToastNotification {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}
