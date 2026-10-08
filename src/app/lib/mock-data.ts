import {
  Clinician,
  ShiftDefinition,
  ShiftAssignment,
  ShiftSwapRequest,
  GeofenceZone,
  AttendanceRecord,
  IcdProcedureCode,
  ProcedureRecord,
  CmeRecord,
  AuditLogEntry
} from '../types';

export const SHIFT_DEFINITIONS: Record<string, ShiftDefinition> = {
  MORNING: {
    type: 'MORNING',
    labelEn: 'Morning Shift',
    labelTh: 'เวรเช้า',
    startTime: '08:00',
    endTime: '16:00',
    durationHours: 8,
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
    colorHex: '#10B981'
  },
  AFTERNOON: {
    type: 'AFTERNOON',
    labelEn: 'Afternoon Shift',
    labelTh: 'เวรบ่าย',
    startTime: '16:00',
    endTime: '24:00',
    durationHours: 8,
    badgeClass: 'bg-sky-950/80 text-sky-400 border border-sky-500/30',
    colorHex: '#0EA5E9'
  },
  NIGHT: {
    type: 'NIGHT',
    labelEn: 'Night Shift',
    labelTh: 'เวรดึก',
    startTime: '00:00',
    endTime: '08:00',
    durationHours: 8,
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30',
    colorHex: '#6366F1'
  },
  ON_CALL: {
    type: 'ON_CALL',
    labelEn: 'On-Call Standby',
    labelTh: 'เวรตามตัว',
    startTime: '08:00',
    endTime: '08:00',
    durationHours: 24,
    badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-500/30',
    colorHex: '#F59E0B'
  }
};

export const CLINICIANS_DATA: Clinician[] = [
  {
    id: 'DOC-001',
    name: 'Prof. Dr. Kittisak Chaiyaporn, MD, FRCS',
    title: 'Chief Medical Officer & Hospital Board Auditor',
    role: 'SUPER_ADMIN',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'MD-TH-18492',
    thaiCouncilId: 'TMC-2004-9841',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    email: 'kittisak.cha@aegishospital.ac.th',
    phone: '+66 2 201 1001',
    annualCmeTarget: 50,
    completedCmeHours: 52,
    currentStatus: 'ON_DUTY'
  },
  {
    id: 'DOC-002',
    name: 'Prof. Dr. Somchai Prasertsuk, MD, FRCST',
    title: 'Department Chair & Senior HPB Surgeon',
    role: 'HEAD_OF_SURGERY',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'MD-TH-22109',
    thaiCouncilId: 'TMC-2007-4491',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    email: 'somchai.pra@aegishospital.ac.th',
    phone: '+66 2 201 2410',
    annualCmeTarget: 50,
    completedCmeHours: 46.5,
    currentStatus: 'ON_DUTY'
  },
  {
    id: 'DOC-003',
    name: 'Assoc. Prof. Dr. Natthawut Siripong, MD',
    title: 'Attending Surgeon, Minimally Invasive Unit',
    role: 'ATTENDING_PHYSICIAN',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'MD-TH-31842',
    thaiCouncilId: 'TMC-2012-7819',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    email: 'natthawut.sir@aegishospital.ac.th',
    phone: '+66 2 201 3190',
    annualCmeTarget: 50,
    completedCmeHours: 39,
    currentStatus: 'IN_SURGERY'
  },
  {
    id: 'DOC-004',
    name: 'Dr. Thanaphat Mawin, MD',
    title: 'General Surgery Senior Resident (R3)',
    role: 'RESIDENT',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'MD-TH-48910',
    thaiCouncilId: 'TMC-2022-1928',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    email: 'thanaphat.maw@aegishospital.ac.th',
    phone: '+66 8 1923 4410',
    annualCmeTarget: 50,
    completedCmeHours: 34.5,
    currentStatus: 'ON_DUTY'
  },
  {
    id: 'DOC-005',
    name: 'Dr. Chutima Ruengsak, MD',
    title: 'Surgical Resident (R2)',
    role: 'RESIDENT',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'MD-TH-51203',
    thaiCouncilId: 'TMC-2023-8812',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813583-0599c95d3148?w=150&auto=format&fit=crop&q=80',
    email: 'chutima.rue@aegishospital.ac.th',
    phone: '+66 8 9412 8871',
    annualCmeTarget: 50,
    completedCmeHours: 28,
    currentStatus: 'OFF_DUTY'
  },
  {
    id: 'NURSE-001',
    name: 'RN Supaporn Wongsuwan, MSN',
    title: 'Chief Operating Room Scrub Sister & Staffing Lead',
    role: 'CHARGE_NURSE',
    department: 'GENERAL_SURGERY',
    medicalLicenseNo: 'RN-TH-94182',
    thaiCouncilId: 'TNC-2010-5512',
    avatarUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80',
    email: 'supaporn.won@aegishospital.ac.th',
    phone: '+66 2 201 4890',
    annualCmeTarget: 30,
    completedCmeHours: 29,
    currentStatus: 'ON_DUTY'
  },
  {
    id: 'DOC-006',
    name: 'Dr. Worapol Thanarat, MD',
    title: 'Consultant Anesthesiologist',
    role: 'ATTENDING_PHYSICIAN',
    department: 'ANESTHESIOLOGY',
    medicalLicenseNo: 'MD-TH-29401',
    thaiCouncilId: 'TMC-2011-3094',
    avatarUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=150&auto=format&fit=crop&q=80',
    email: 'worapol.tha@aegishospital.ac.th',
    phone: '+66 2 201 5591',
    annualCmeTarget: 50,
    completedCmeHours: 44,
    currentStatus: 'ON_CALL'
  }
];

export const GEOFENCE_CAMPUS_ZONES: GeofenceZone[] = [
  {
    id: 'ZONE-OR',
    name: 'Surgical Pavilion & Operating Theater Suite (8F)',
    latitude: 13.7667,
    longitude: 100.5283,
    radiusMeters: 250,
    building: 'Bldg A - Siriraj/Chula Medical Tower'
  },
  {
    id: 'ZONE-TRAUMA',
    name: 'Emergency Trauma Center & Resuscitation Bay',
    latitude: 13.7669,
    longitude: 100.5280,
    radiusMeters: 180,
    building: 'Bldg B - Ground Floor ER'
  },
  {
    id: 'ZONE-SURG-WARD',
    name: 'Inpatient Surgical Ward 9C & Surgical ICU',
    latitude: 13.7665,
    longitude: 100.5286,
    radiusMeters: 220,
    building: 'Bldg A - Inpatient Tower'
  }
];

export const ICD_PROCEDURES_CATALOG: IcdProcedureCode[] = [
  {
    code: '47.01',
    name: 'Laparoscopic Appendectomy',
    category: 'Abdominal / Gastrointestinal',
    icd10DxCode: 'K35.80',
    icd10DxName: 'Acute appendicitis, other and unspecified',
    avgDurationMin: 65
  },
  {
    code: '51.23',
    name: 'Laparoscopic Cholecystectomy',
    category: 'Hepatobiliary',
    icd10DxCode: 'K80.00',
    icd10DxName: 'Calculus of gallbladder with acute cholecystitis',
    avgDurationMin: 80
  },
  {
    code: '53.05',
    name: 'Repair of Inguinal Hernia with Mesh (TAPP/TEP)',
    category: 'Abdominal Wall',
    icd10DxCode: 'K40.90',
    icd10DxName: 'Unilateral inguinal hernia, without obstruction or gangrene',
    avgDurationMin: 75
  },
  {
    code: '38.93',
    name: 'Venous Catheterization (Internal Jugular / Subclavian Central Line)',
    category: 'Vascular Access',
    icd10DxCode: 'Z99.89',
    icd10DxName: 'Dependence on other enabling machines and devices',
    avgDurationMin: 35
  },
  {
    code: '45.73',
    name: 'Right Hemicolectomy with Ileocolic Anastomosis',
    category: 'Colorectal',
    icd10DxCode: 'C18.0',
    icd10DxName: 'Malignant neoplasm of cecum',
    avgDurationMin: 175
  },
  {
    code: '54.11',
    name: 'Exploratory Laparotomy for Hemoperitoneum',
    category: 'Trauma / Acute Care',
    icd10DxCode: 'S36.031A',
    icd10DxName: 'Major laceration of spleen, initial encounter',
    avgDurationMin: 120
  },
  {
    code: '06.2',
    name: 'Total Thyroidectomy with Recurrent Laryngeal Nerve Monitoring',
    category: 'Endocrine Surgery',
    icd10DxCode: 'C73',
    icd10DxName: 'Malignant neoplasm of thyroid gland',
    avgDurationMin: 110
  },
  {
    code: '81.51',
    name: 'Total Hip Arthroplasty (Minimally Invasive Posterior Approach)',
    category: 'Orthopedic Joint Reconstruction',
    icd10DxCode: 'M16.11',
    icd10DxName: 'Unilateral primary osteoarthritis, right hip',
    avgDurationMin: 105
  }
];

export const INITIAL_PROCEDURES: ProcedureRecord[] = [
  {
    id: 'PR-2026-0842',
    caseNumber: 'CAS-2026-0842',
    patientHnMasked: 'HN-892-***4',
    patientAge: 42,
    patientGender: 'F',
    procedureDate: '2026-10-06',
    startTime: '09:15',
    endTime: '10:45',
    durationMinutes: 90,
    orRoom: 'OR Suite 4 (Lap Tower Alpha)',
    department: 'GENERAL_SURGERY',
    procedureCode: '51.23',
    procedureName: 'Laparoscopic Cholecystectomy',
    diagnosisCode: 'K80.00',
    diagnosisName: 'Calculus of gallbladder with acute cholecystitis',
    operatorRole: 'PRIMARY_SURGEON',
    surgeonId: 'DOC-004',
    supervisorId: 'DOC-003',
    anesthesiologistId: 'DOC-006',
    scrubNurseId: 'NURSE-001',
    anesthesiaType: 'GENERAL_ANESTHESIA',
    estimatedBloodLossMl: 25,
    specimenSent: true,
    implantUsed: false,
    complicationSeverity: 'NONE',
    supervisorEndorsement: {
      status: 'APPROVED',
      reviewedBy: 'Assoc. Prof. Dr. Natthawut Siripong, MD',
      timestamp: '2026-10-06T13:40:00+07:00',
      feedbackNotes: 'Exemplary critical view of safety (CVS) dissection demonstrated. Calot triangle safely isolated.',
      digitalSignatureHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    pdpaConsentVerified: true,
    surgicalNotes: '4-trocar standard technique. Gallbladder tensely distended, decompressed via needle aspiration. Cystic duct and artery doubly clipped.'
  },
  {
    id: 'PR-2026-0839',
    caseNumber: 'CAS-2026-0839',
    patientHnMasked: 'HN-417-***8',
    patientAge: 29,
    patientGender: 'M',
    procedureDate: '2026-10-05',
    startTime: '22:30',
    endTime: '23:40',
    durationMinutes: 70,
    orRoom: 'OR Suite 2 (Emergency Trauma)',
    department: 'GENERAL_SURGERY',
    procedureCode: '47.01',
    procedureName: 'Laparoscopic Appendectomy',
    diagnosisCode: 'K35.80',
    diagnosisName: 'Acute gangrenous appendicitis with localized peritonitis',
    operatorRole: 'PRIMARY_SURGEON',
    surgeonId: 'DOC-004',
    supervisorId: 'DOC-002',
    anesthesiologistId: 'DOC-006',
    scrubNurseId: 'NURSE-001',
    anesthesiaType: 'GENERAL_ANESTHESIA',
    estimatedBloodLossMl: 15,
    specimenSent: true,
    implantUsed: false,
    complicationSeverity: 'NONE',
    supervisorEndorsement: {
      status: 'PENDING_REVIEW',
      reviewedBy: undefined,
      feedbackNotes: undefined
    },
    pdpaConsentVerified: true,
    surgicalNotes: 'Retrocecal inflamed appendix dissected with harmonic scalpel. Endoloop base ligation x2. Peritoneal irrigation with 1000ml warm saline.'
  },
  {
    id: 'PR-2026-0831',
    caseNumber: 'CAS-2026-0831',
    patientHnMasked: 'HN-312-***9',
    patientAge: 67,
    patientGender: 'M',
    procedureDate: '2026-10-04',
    startTime: '08:30',
    endTime: '11:45',
    durationMinutes: 195,
    orRoom: 'OR Suite 1 (Hybrid Suite)',
    department: 'GENERAL_SURGERY',
    procedureCode: '45.73',
    procedureName: 'Right Hemicolectomy with Ileocolic Anastomosis',
    diagnosisCode: 'C18.0',
    diagnosisName: 'Malignant neoplasm of cecum (cT3N1M0)',
    operatorRole: 'FIRST_ASSISTANT',
    surgeonId: 'DOC-002',
    supervisorId: 'DOC-002',
    anesthesiologistId: 'DOC-006',
    scrubNurseId: 'NURSE-001',
    anesthesiaType: 'GENERAL_ANESTHESIA',
    estimatedBloodLossMl: 120,
    specimenSent: true,
    implantUsed: false,
    complicationSeverity: 'CLAVIEN_DINDO_I',
    complicationNotes: 'Minor superficial serosal tear repaired primarily with 3-0 Silk; no leak.',
    supervisorEndorsement: {
      status: 'APPROVED',
      reviewedBy: 'Prof. Dr. Somchai Prasertsuk, MD, FRCST',
      timestamp: '2026-10-04T15:00:00+07:00',
      feedbackNotes: 'Satisfactory medial-to-lateral mesocolic mobilization by Dr. Mawin under supervision.',
      digitalSignatureHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
    },
    pdpaConsentVerified: true,
    surgicalNotes: 'Complete mesocolic excision (CME) with central vascular ligation (CVL) of ileocolic vessels. Extracorporeal side-to-side stapled anastomosis.'
  },
  {
    id: 'PR-2026-0820',
    caseNumber: 'CAS-2026-0820',
    patientHnMasked: 'HN-901-***1',
    patientAge: 58,
    patientGender: 'F',
    procedureDate: '2026-10-02',
    startTime: '14:00',
    endTime: '15:20',
    durationMinutes: 80,
    orRoom: 'OR Suite 5',
    department: 'GENERAL_SURGERY',
    procedureCode: '53.05',
    procedureName: 'Repair of Inguinal Hernia with Mesh (TAPP)',
    diagnosisCode: 'K40.90',
    diagnosisName: 'Right indirect inguinal hernia',
    operatorRole: 'PRIMARY_SURGEON',
    surgeonId: 'DOC-004',
    supervisorId: 'DOC-003',
    anesthesiologistId: 'DOC-006',
    scrubNurseId: 'NURSE-001',
    anesthesiaType: 'GENERAL_ANESTHESIA',
    estimatedBloodLossMl: 10,
    specimenSent: false,
    implantUsed: true,
    complicationSeverity: 'NONE',
    supervisorEndorsement: {
      status: 'APPROVED',
      reviewedBy: 'Assoc. Prof. Dr. Natthawut Siripong, MD',
      timestamp: '2026-10-02T17:15:00+07:00',
      feedbackNotes: 'Safe parietalization of cord elements and adequate mesh overlap of Myopectineal Orifice of Fruchaud.',
      digitalSignatureHash: 'SHA256:1a8565a9dae4b4b918b524114f6ec219f41861277a501958c3f6e59f21f06a8d'
    },
    pdpaConsentVerified: true,
    surgicalNotes: 'Parietal peritoneum opened. Hernial sac reduced from internal ring. Prolene mesh 10x15cm placed, peritoneal flap closed with barbed suture.'
  },
  {
    id: 'PR-2026-0815',
    caseNumber: 'CAS-2026-0815',
    patientHnMasked: 'HN-771-***5',
    patientAge: 71,
    patientGender: 'M',
    procedureDate: '2026-09-30',
    startTime: '16:45',
    endTime: '17:30',
    durationMinutes: 45,
    orRoom: 'ICU Bed 4 Bedside',
    department: 'GENERAL_SURGERY',
    procedureCode: '38.93',
    procedureName: 'Venous Catheterization (Right Internal Jugular Line)',
    diagnosisCode: 'Z99.89',
    diagnosisName: 'Septic shock requiring vasopressor infusion',
    operatorRole: 'PRIMARY_SURGEON',
    surgeonId: 'DOC-004',
    supervisorId: 'DOC-003',
    anesthesiologistId: 'DOC-006',
    scrubNurseId: 'NURSE-001',
    anesthesiaType: 'LOCAL_INFILTRATION',
    estimatedBloodLossMl: 5,
    specimenSent: false,
    implantUsed: true,
    complicationSeverity: 'NONE',
    supervisorEndorsement: {
      status: 'APPROVED',
      reviewedBy: 'Assoc. Prof. Dr. Natthawut Siripong, MD',
      timestamp: '2026-09-30T19:00:00+07:00',
      feedbackNotes: 'Point-of-care ultrasound guidance well utilized. Post-procedure CXR confirmed carinal tip position without pneumothorax.',
      digitalSignatureHash: 'SHA256:2b74052e4b49463273e91d5952d43105ff51dfd2e30f143714b647f6cfb1ef92'
    },
    pdpaConsentVerified: true,
    surgicalNotes: 'Ultrasound guided puncture of right IJV. Triple-lumen 7Fr catheter placed via Seldinger technique. All ports aspirated dark blood smoothly.'
  }
];

export const INITIAL_SHIFT_ASSIGNMENTS: ShiftAssignment[] = [
  // Today's Date is 2026-10-07
  {
    id: 'SFT-1001',
    staffId: 'DOC-004', // Dr. Thanaphat (Resident)
    department: 'GENERAL_SURGERY',
    date: '2026-10-07',
    shiftType: 'MORNING',
    roleInShift: 'Lead OR Resident & Ward Rounds',
    status: 'IN_PROGRESS',
    notes: 'Morning OR case list review with Prof. Somchai'
  },
  {
    id: 'SFT-1002',
    staffId: 'DOC-002', // Prof. Somchai
    department: 'GENERAL_SURGERY',
    date: '2026-10-07',
    shiftType: 'MORNING',
    roleInShift: 'Attending OR Director & Faculty Clinic',
    status: 'IN_PROGRESS'
  },
  {
    id: 'SFT-1003',
    staffId: 'DOC-003', // Assoc. Prof. Natthawut
    department: 'GENERAL_SURGERY',
    date: '2026-10-07',
    shiftType: 'AFTERNOON',
    roleInShift: 'On-Call Laparoscopic Surgery Lead',
    status: 'SCHEDULED'
  },
  {
    id: 'SFT-1004',
    staffId: 'DOC-005', // Dr. Chutima (Resident)
    department: 'GENERAL_SURGERY',
    date: '2026-10-07',
    shiftType: 'AFTERNOON',
    roleInShift: 'Surgical ICU Cross-Cover & ER Consults',
    status: 'SCHEDULED'
  },
  {
    id: 'SFT-1005',
    staffId: 'NURSE-001', // RN Supaporn
    department: 'GENERAL_SURGERY',
    date: '2026-10-07',
    shiftType: 'MORNING',
    roleInShift: 'Main Operating Suite Charge Sister',
    status: 'IN_PROGRESS'
  },
  {
    id: 'SFT-1006',
    staffId: 'DOC-006', // Dr. Worapol
    department: 'ANESTHESIOLOGY',
    date: '2026-10-07',
    shiftType: 'ON_CALL',
    roleInShift: 'Senior Anesthesia Consultant 24h',
    status: 'IN_PROGRESS'
  },

  // Tomorrow 2026-10-08
  {
    id: 'SFT-1007',
    staffId: 'DOC-004', // Dr. Thanaphat
    department: 'GENERAL_SURGERY',
    date: '2026-10-08',
    shiftType: 'NIGHT',
    roleInShift: 'Emergency OR Trauma Lead',
    status: 'SCHEDULED'
  },
  {
    id: 'SFT-1008',
    staffId: 'DOC-005', // Dr. Chutima
    department: 'GENERAL_SURGERY',
    date: '2026-10-08',
    shiftType: 'MORNING',
    roleInShift: 'General Surgery Inpatient Rounds',
    status: 'SCHEDULED'
  },
  {
    id: 'SFT-1009',
    staffId: 'DOC-003',
    department: 'GENERAL_SURGERY',
    date: '2026-10-08',
    shiftType: 'MORNING',
    roleInShift: 'Laparoscopic Case Consultations',
    status: 'SCHEDULED'
  },

  // 2026-10-09: Potential Conflict scenario seeded for the demo!
  // Dr. Thanaphat has NIGHT shift ending at 08:00, then has another shift at 08:00!
  {
    id: 'SFT-1010',
    staffId: 'DOC-004',
    department: 'GENERAL_SURGERY',
    date: '2026-10-09',
    shiftType: 'MORNING',
    roleInShift: 'Grand Ward Rounds & Post-op Clinic',
    status: 'SCHEDULED',
    notes: 'Triggering Rest-Interval Conflict rule (<8h rest after 10-08 Night Shift)'
  },
  {
    id: 'SFT-1011',
    staffId: 'DOC-002',
    department: 'GENERAL_SURGERY',
    date: '2026-10-09',
    shiftType: 'ON_CALL',
    roleInShift: 'Attending HPB Emergency Cover',
    status: 'SCHEDULED'
  },

  // 2026-10-10
  {
    id: 'SFT-1012',
    staffId: 'DOC-005',
    department: 'GENERAL_SURGERY',
    date: '2026-10-10',
    shiftType: 'MORNING',
    roleInShift: 'Weekend Trauma Resuscitation Lead',
    status: 'SCHEDULED'
  },
  {
    id: 'SFT-1013',
    staffId: 'DOC-004',
    department: 'GENERAL_SURGERY',
    date: '2026-10-10',
    shiftType: 'AFTERNOON',
    roleInShift: 'SICU On-Duty Doctor',
    status: 'SWAP_PENDING'
  }
];

export const INITIAL_SHIFT_SWAPS: ShiftSwapRequest[] = [
  {
    id: 'SWAP-891',
    requestingStaffId: 'DOC-004', // Dr. Thanaphat
    targetStaffId: 'DOC-005', // Dr. Chutima
    shiftId: 'SFT-1013',
    reason: 'Attending Mandatory Thai Royal College Laparoscopic Suturing Advanced Workshop',
    status: 'PENDING',
    requestedAt: '2026-10-06T14:20:00+07:00'
  },
  {
    id: 'SWAP-884',
    requestingStaffId: 'DOC-005',
    targetStaffId: 'DOC-004',
    shiftId: 'SFT-1004',
    reason: 'Family urgent medical emergency',
    status: 'APPROVED',
    requestedAt: '2026-10-03T11:00:00+07:00',
    reviewedAt: '2026-10-03T16:30:00+07:00',
    reviewedBy: 'Prof. Dr. Somchai Prasertsuk, MD, FRCST',
    supervisorNotes: 'Approved with requirement that resident rest interval does not exceed 16 consecutive hours.'
  }
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'ATT-2026-1001',
    staffId: 'DOC-004',
    shiftId: 'SFT-1001',
    date: '2026-10-07',
    scheduledStart: '08:00',
    scheduledEnd: '16:00',
    clockInTime: '07:52',
    clockOutTime: undefined, // Currently on duty
    status: 'ON_DUTY',
    tardinessMinutes: 0,
    overtimeHours: 0,
    overtimeRate: 1.0,
    campusZone: 'Surgical Pavilion & Operating Theater Suite (8F)',
    latitude: 13.76672,
    longitude: 100.52831,
    isWithinGeofence: true,
    notes: 'Clocked in at OR scrubbing bay terminal'
  },
  {
    id: 'ATT-2026-0994',
    staffId: 'DOC-004',
    shiftId: 'SFT-0994',
    date: '2026-10-06',
    scheduledStart: '08:00',
    scheduledEnd: '16:00',
    clockInTime: '07:55',
    clockOutTime: '18:15',
    status: 'COMPLETED',
    tardinessMinutes: 0,
    overtimeHours: 2.25,
    overtimeRate: 1.5,
    campusZone: 'Surgical Pavilion & Operating Theater Suite (8F)',
    latitude: 13.7667,
    longitude: 100.5283,
    isWithinGeofence: true,
    notes: 'Emergency laparoscopic appendectomy case ran over scheduled roster shift. OT pre-authorized.'
  },
  {
    id: 'ATT-2026-0988',
    staffId: 'DOC-004',
    shiftId: 'SFT-0988',
    date: '2026-10-05',
    scheduledStart: '16:00',
    scheduledEnd: '24:00',
    clockInTime: '16:18',
    clockOutTime: '00:05',
    status: 'LATE',
    tardinessMinutes: 18,
    overtimeHours: 0.1,
    overtimeRate: 1.5,
    campusZone: 'Emergency Trauma Center & Resuscitation Bay',
    latitude: 13.7669,
    longitude: 100.5280,
    isWithinGeofence: true,
    notes: 'Traffic delay on Expressway. Grace period exceeded by 3 min. Acknowledged by charge resident.'
  }
];

export const INITIAL_CME_RECORDS: CmeRecord[] = [
  {
    id: 'CME-001',
    staffId: 'DOC-004',
    title: 'Advanced Trauma Life Support (ATLS 10th Ed) Provider Course',
    category: 'BLS_ACLS_ATLS',
    accreditingBody: 'ROYAL_COLLEGE_OF_SURGEONS',
    creditsEarned: 16,
    completionDate: '2026-04-18',
    expiryDate: '2030-04-18',
    certificateNumber: 'ATLS-TH-2026-0991',
    certificateIssuer: 'American College of Surgeons Thailand Chapter',
    verificationStatus: 'ACCREDITED',
    documentAttachmentName: 'ATLS_Certificate_Thanaphat_2026.pdf'
  },
  {
    id: 'CME-002',
    staffId: 'DOC-004',
    title: 'Hands-on Cadaveric Laparoscopic Inguinal & Ventral Hernia Workshop',
    category: 'CADAVER_HANDS_ON_WORKSHOP',
    accreditingBody: 'ROYAL_COLLEGE_OF_SURGEONS',
    creditsEarned: 12.5,
    completionDate: '2026-07-22',
    certificateNumber: 'HERNIA-WS-7712',
    certificateIssuer: 'Thai Hernia Society & Siriraj Simulation Center',
    verificationStatus: 'ACCREDITED',
    documentAttachmentName: 'Laparoscopic_Hernia_Cadaver_Workshop.pdf'
  },
  {
    id: 'CME-003',
    staffId: 'DOC-004',
    title: 'Annual Scientific Congress of the Royal College of Surgeons of Thailand (RCST 2026)',
    category: 'INTERNATIONAL_CONFERENCE',
    accreditingBody: 'THAI_MEDICAL_COUNCIL',
    creditsEarned: 6,
    completionDate: '2026-08-15',
    certificateNumber: 'RCST-ANN-2026-4401',
    certificateIssuer: 'Royal College of Surgeons of Thailand',
    verificationStatus: 'ACCREDITED',
    documentAttachmentName: 'RCST_Congress_Attendance_2026.pdf'
  },
  {
    id: 'CME-004',
    staffId: 'DOC-004',
    title: 'Hospital Infection Control & Antimicrobial Stewardship In-Service',
    category: 'IN_SERVICE_SEMINAR',
    accreditingBody: 'THAI_MEDICAL_COUNCIL',
    creditsEarned: 3,
    completionDate: '2026-09-10',
    certificateNumber: 'HA-IC-2026-1182',
    certificateIssuer: 'Aegis Hospital Infection Control Committee',
    verificationStatus: 'PENDING_VERIFICATION',
    documentAttachmentName: 'Hospital_Infection_Control_Seminar.pdf'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-9901',
    timestamp: '2026-10-07T08:01:14+07:00',
    actorId: 'DOC-004',
    actorName: 'Dr. Thanaphat Mawin, MD',
    role: 'RESIDENT',
    action: 'BIOMETRIC_DUTY_CLOCK_IN',
    resourceType: 'ATTENDANCE_PUNCH',
    resourceId: 'ATT-2026-1001',
    details: 'Verified campus geofence inside OR Pavilion Zone (13.7667°N, 100.5283°E). Terminal: OR-Station-04.',
    clientIp: '10.240.18.42',
    complianceTag: 'HIPAA_COMPLIANT'
  },
  {
    id: 'AUD-9902',
    timestamp: '2026-10-06T13:40:02+07:00',
    actorId: 'DOC-003',
    actorName: 'Assoc. Prof. Dr. Natthawut Siripong, MD',
    role: 'ATTENDING_PHYSICIAN',
    action: 'PROCEDURE_SUPERVISOR_ENDORSEMENT',
    resourceType: 'PROCEDURE_LOG',
    resourceId: 'PR-2026-0842',
    details: 'Digitally signed case CAS-2026-0842 (Laparoscopic Cholecystectomy) with cryptographic hash sha256.',
    clientIp: '10.240.12.105',
    complianceTag: 'HIPAA_COMPLIANT'
  },
  {
    id: 'AUD-9903',
    timestamp: '2026-10-06T10:50:33+07:00',
    actorId: 'DOC-004',
    actorName: 'Dr. Thanaphat Mawin, MD',
    role: 'RESIDENT',
    action: 'LOG_PROCEDURE_CASE',
    resourceType: 'PROCEDURE_LOG',
    resourceId: 'PR-2026-0842',
    details: 'Masked Patient Identifier recorded as HN-892-***4 in accordance with Thailand PDPA Section 26.',
    clientIp: '10.240.18.42',
    complianceTag: 'PDPA_MASKED'
  },
  {
    id: 'AUD-9904',
    timestamp: '2026-10-06T14:21:00+07:00',
    actorId: 'DOC-004',
    actorName: 'Dr. Thanaphat Mawin, MD',
    role: 'RESIDENT',
    action: 'REQUEST_SHIFT_SWAP',
    resourceType: 'SHIFT_ROSTER',
    resourceId: 'SWAP-891',
    details: 'Requested shift swap for 2026-10-10 Afternoon shift to Dr. Chutima Ruengsak.',
    clientIp: '10.240.18.42',
    complianceTag: 'HIPAA_COMPLIANT'
  },
  {
    id: 'AUD-9905',
    timestamp: '2026-10-05T09:00:00+07:00',
    actorId: 'DOC-001',
    actorName: 'Prof. Dr. Kittisak Chaiyaporn, MD, FRCS',
    role: 'SUPER_ADMIN',
    action: 'EXPORT_JCI_ACCREDITATION_REPORT',
    resourceType: 'ACCREDITATION_EXPORT',
    resourceId: 'JCI-AUDIT-2026-Q3',
    details: 'Quarterly surgical logbook and credentialing report compiled for Hospital Accreditation (HA) survey committee.',
    clientIp: '10.240.1.5',
    complianceTag: 'HIPAA_COMPLIANT'
  }
];
