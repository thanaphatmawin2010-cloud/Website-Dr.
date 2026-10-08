import { Injectable, signal, computed } from '@angular/core';
import {
  UserRole,
  HospitalDepartment,
  Clinician,
  ShiftAssignment,
  ShiftSwapRequest,
  ShiftConflict,
  AttendanceRecord,
  ProcedureRecord,
  CmeRecord,
  AuditLogEntry,
  ToastNotification,
  SupervisorEndorsementStatus
} from '../types';
import {
  CLINICIANS_DATA,
  INITIAL_PROCEDURES,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_SHIFT_SWAPS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_CME_RECORDS,
  INITIAL_AUDIT_LOGS,
  GEOFENCE_CAMPUS_ZONES
} from '../lib/mock-data';

@Injectable({
  providedIn: 'root'
})
export class HospitalStore {
  // Session & Access States
  readonly currentRole = signal<UserRole>('RESIDENT');
  readonly currentDepartment = signal<HospitalDepartment>('GENERAL_SURGERY');
  readonly currentStaffId = signal<string>('DOC-004'); // Dr. Thanaphat Mawin (Senior Resident)

  // Datasets
  readonly clinicians = signal<Clinician[]>(CLINICIANS_DATA);
  readonly procedures = signal<ProcedureRecord[]>(INITIAL_PROCEDURES);
  readonly shifts = signal<ShiftAssignment[]>(INITIAL_SHIFT_ASSIGNMENTS);
  readonly shiftSwaps = signal<ShiftSwapRequest[]>(INITIAL_SHIFT_SWAPS);
  readonly attendanceRecords = signal<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  readonly cmeRecords = signal<CmeRecord[]>(INITIAL_CME_RECORDS);
  readonly auditLogs = signal<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Notifications
  readonly notifications = signal<ToastNotification[]>([
    {
      id: 'NOTIF-1',
      type: 'INFO',
      title: 'Duty Schedule Reconciled',
      message: 'October 2026 surgical roster verified against Thai Medical Council rest rules.',
      timestamp: '10 min ago'
    },
    {
      id: 'NOTIF-2',
      type: 'WARNING',
      title: 'Shift Conflict Flagged',
      message: 'Rest interval alert detected between Night Shift (10-08) & Morning Shift (10-09).',
      timestamp: '1 hr ago'
    }
  ]);

  // Interactive Geofence Simulation
  readonly simulatedGeofence = signal<{
    latitude: number;
    longitude: number;
    zoneName: string;
    isInsideCampus: boolean;
    accuracyMeters: number;
  }>({
    latitude: 13.76672,
    longitude: 100.52831,
    zoneName: 'Surgical Pavilion & Operating Theater Suite (8F)',
    isInsideCampus: true,
    accuracyMeters: 4.8
  });

  // Active User Clinician
  readonly activeStaff = computed(() => {
    const list = this.clinicians();
    return list.find(c => c.id === this.currentStaffId()) || list[0];
  });

  // Active On-Duty Clock-In record for the active staff
  readonly currentDutySession = computed(() => {
    const staffId = this.currentStaffId();
    return this.attendanceRecords().find(
      r => r.staffId === staffId && r.status === 'ON_DUTY'
    );
  });

  // Departmental Staff list
  readonly departmentStaff = computed(() => {
    const dept = this.currentDepartment();
    return this.clinicians().filter(c => c.department === dept);
  });

  // Filtered Procedures for the current view
  readonly departmentProcedures = computed(() => {
    const dept = this.currentDepartment();
    return this.procedures().filter(p => p.department === dept);
  });

  // Shift Conflict Detection Engine
  readonly shiftConflicts = computed<ShiftConflict[]>(() => {
    const allShifts = this.shifts();
    const conflicts: ShiftConflict[] = [];

    // Group shifts by staff
    const byStaff = new Map<string, ShiftAssignment[]>();
    for (const s of allShifts) {
      const arr = byStaff.get(s.staffId) || [];
      arr.push(s);
      byStaff.set(s.staffId, arr);
    }

    byStaff.forEach((staffShifts, staffId) => {
      // Sort chronologically
      staffShifts.sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 0; i < staffShifts.length; i++) {
        const cur = staffShifts[i];

        // 1. Same-day multiple shifts check
        for (let j = i + 1; j < staffShifts.length; j++) {
          const next = staffShifts[j];
          if (cur.date === next.date) {
            conflicts.push({
              id: `CONF-${cur.id}-${next.id}`,
              type: 'OVERLAPPING_SHIFT',
              severity: 'CRITICAL',
              staffId,
              description: `Duplicate shift assignment on ${cur.date} (${cur.shiftType} & ${next.shiftType})`,
              affectedDates: [cur.date]
            });
          }
        }

        // 2. Mandatory 8-hour Rest-Interval Rule: Night Shift ending at 08:00 immediately followed by Morning shift at 08:00 next day
        if (cur.shiftType === 'NIGHT') {
          const nextDay = this.getNextDateString(cur.date);
          const nextDayShift = staffShifts.find(s => s.date === nextDay);
          if (nextDayShift && (nextDayShift.shiftType === 'MORNING' || nextDayShift.shiftType === 'ON_CALL')) {
            conflicts.push({
              id: `CONF-REST-${cur.id}-${nextDayShift.id}`,
              type: 'INSUFFICIENT_REST',
              severity: 'CRITICAL',
              staffId,
              description: `Mandatory 8-hour Rest Interval Violation: Night shift on ${cur.date} followed directly by ${nextDayShift.shiftType} on ${nextDay}`,
              affectedDates: [cur.date, nextDay]
            });
          }
        }
      }
    });

    return conflicts;
  });

  // Pending Supervisor Endorsements count
  readonly pendingEndorsementCount = computed(() => {
    return this.procedures().filter(
      p => p.supervisorEndorsement.status === 'PENDING_REVIEW'
    ).length;
  });

  // Pending Shift Swap Requests
  readonly pendingSwapCount = computed(() => {
    return this.shiftSwaps().filter(s => s.status === 'PENDING').length;
  });

  // Executive Compliance KPIs
  readonly complianceMetrics = computed(() => {
    const procs = this.procedures();
    const total = procs.length;
    const endorsed = procs.filter(p => p.supervisorEndorsement.status === 'APPROVED').length;
    const withComplications = procs.filter(p => p.complicationSeverity !== 'NONE').length;
    const severeComplications = procs.filter(
      p => p.complicationSeverity === 'GRADE_III_A' ||
           p.complicationSeverity === 'GRADE_III_B' ||
           p.complicationSeverity === 'GRADE_IV_A' ||
           p.complicationSeverity === 'GRADE_IV_B' ||
           p.complicationSeverity === 'GRADE_V'
    ).length;

    const atts = this.attendanceRecords();
    const totalOtHours = atts.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const lateArrivals = atts.filter(r => r.status === 'LATE').length;

    const endorsementRate = total > 0 ? Math.round((endorsed / total) * 100) : 100;
    const complicationRate = total > 0 ? ((withComplications / total) * 100).toFixed(1) : '0.0';

    return {
      totalProcedures: total,
      endorsedProcedures: endorsed,
      endorsementRate,
      withComplications,
      complicationRate,
      severeComplications,
      totalOtHours: totalOtHours.toFixed(1),
      lateArrivals,
      restRuleViolations: this.shiftConflicts().length
    };
  });

  // Role switching
  setRole(newRole: UserRole) {
    this.currentRole.set(newRole);

    // Auto switch to a representative staff member if role changes
    const matchingStaff = this.clinicians().find(c => c.role === newRole);
    if (matchingStaff) {
      this.currentStaffId.set(matchingStaff.id);
    }

    this.notify(
      'INFO',
      'Role Context Updated',
      `Switched identity to ${newRole.replace(/_/g, ' ')} (${matchingStaff?.name || 'Staff'})`
    );

    this.logAudit(
      'SWITCH_USER_ROLE',
      'USER_ACCOUNT',
      this.currentStaffId(),
      `Switched simulated role context to ${newRole}`,
      'HIPAA_COMPLIANT'
    );
  }

  // Department switching
  setDepartment(dept: HospitalDepartment) {
    this.currentDepartment.set(dept);
    this.notify(
      'INFO',
      'Department Changed',
      `Active division switched to ${dept.replace(/_/g, ' ')}`
    );
  }

  // Staff switching
  setStaff(staffId: string) {
    const staff = this.clinicians().find(c => c.id === staffId);
    if (staff) {
      this.currentStaffId.set(staff.id);
      this.currentRole.set(staff.role);
      this.currentDepartment.set(staff.department);
      this.notify(
        'SUCCESS',
        'Clinician Selected',
        `Active user: ${staff.name} (${staff.title})`
      );
    }
  }

  // Geofence toggle simulation
  setSimulatedCampusLocation(isInside: boolean, zoneName?: string) {
    if (isInside) {
      const zone = zoneName || GEOFENCE_CAMPUS_ZONES[0].name;
      const ref = GEOFENCE_CAMPUS_ZONES.find(z => z.name === zone) || GEOFENCE_CAMPUS_ZONES[0];
      this.simulatedGeofence.set({
        latitude: ref.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: ref.longitude + (Math.random() - 0.5) * 0.0001,
        zoneName: ref.name,
        isInsideCampus: true,
        accuracyMeters: 4.2
      });
      this.notify('SUCCESS', 'Geofence Validated', `Terminal located inside: ${ref.name}`);
    } else {
      this.simulatedGeofence.set({
        latitude: 13.8124,
        longitude: 100.5612,
        zoneName: 'Off-Campus (Phahonyothin Rd, Out of Boundary)',
        isInsideCampus: false,
        accuracyMeters: 45.0
      });
      this.notify('WARNING', 'Geofence Warning', 'Current coordinates are OUTSIDE hospital campus bounds (3.8 km away).');
    }
  }

  // Duty Clock-In
  clockIn(shiftId?: string, notes?: string): boolean {
    const geo = this.simulatedGeofence();
    if (!geo.isInsideCampus) {
      this.notify(
        'ERROR',
        'Geofence Check Failed',
        'Biometric punch rejected: device is outside authorized hospital campus perimeter.'
      );
      return false;
    }

    const staffId = this.currentStaffId();
    const existing = this.attendanceRecords().find(
      r => r.staffId === staffId && r.status === 'ON_DUTY'
    );
    if (existing) {
      this.notify('WARNING', 'Already On Duty', 'You already have an active shift in progress.');
      return false;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = this.getTodayDateString();

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      staffId,
      shiftId: shiftId || `SFT-AUTO-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      scheduledStart: '08:00',
      scheduledEnd: '16:00',
      clockInTime: timeStr,
      status: 'ON_DUTY',
      tardinessMinutes: 0,
      overtimeHours: 0,
      overtimeRate: 1.0,
      campusZone: geo.zoneName,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isWithinGeofence: true,
      notes: notes || 'Biometrically verified clock-in via campus terminal'
    };

    this.attendanceRecords.update(prev => [newRecord, ...prev]);

    // Update clinician status
    this.clinicians.update(list =>
      list.map(c => c.id === staffId ? { ...c, currentStatus: 'ON_DUTY' } : c)
    );

    this.notify('SUCCESS', 'Duty Started', `Clocked in successfully at ${timeStr} (${geo.zoneName})`);

    this.logAudit(
      'DUTY_CLOCK_IN',
      'ATTENDANCE_PUNCH',
      newRecord.id,
      `Clocked in at ${timeStr} with GPS verified within ${geo.zoneName}`,
      'HIPAA_COMPLIANT'
    );

    return true;
  }

  // Duty Clock-Out
  clockOut(notes?: string): boolean {
    const staffId = this.currentStaffId();
    const active = this.currentDutySession();

    if (!active) {
      this.notify('ERROR', 'No Active Shift', 'Cannot clock out: no active on-duty session found.');
      return false;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Calculate approximate duration and OT
    const [inH, inM] = active.clockInTime.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    let workedMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (workedMinutes < 0) workedMinutes += 24 * 60; // crossover
    const workedHours = workedMinutes / 60;
    const scheduledHours = 8.0;
    const otHours = workedHours > scheduledHours ? Number((workedHours - scheduledHours).toFixed(2)) : 0;

    this.attendanceRecords.update(prev =>
      prev.map(r => {
        if (r.id === active.id) {
          return {
            ...r,
            clockOutTime: timeStr,
            status: 'COMPLETED',
            overtimeHours: otHours,
            overtimeRate: otHours > 0 ? 1.5 : 1.0,
            notes: notes || r.notes
          };
        }
        return r;
      })
    );

    // Update clinician status
    this.clinicians.update(list =>
      list.map(c => c.id === staffId ? { ...c, currentStatus: 'OFF_DUTY' } : c)
    );

    this.notify(
      'SUCCESS',
      'Duty Completed',
      `Clocked out at ${timeStr}. Total worked: ${workedHours.toFixed(1)} hrs (OT: ${otHours} hrs)`
    );

    this.logAudit(
      'DUTY_CLOCK_OUT',
      'ATTENDANCE_PUNCH',
      active.id,
      `Clocked out at ${timeStr}. Calculated OT: ${otHours}h`,
      'HIPAA_COMPLIANT'
    );

    return true;
  }

  // Procedure Logging
  addProcedure(data: Omit<ProcedureRecord, 'id' | 'caseNumber'>): ProcedureRecord {
    const id = `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const caseNumber = `CAS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProc: ProcedureRecord = {
      ...data,
      id,
      caseNumber
    };

    this.procedures.update(prev => [newProc, ...prev]);

    this.notify(
      'SUCCESS',
      'Procedure Logged',
      `Case ${caseNumber} (${newProc.procedureName}) submitted for supervisor endorsement.`
    );

    this.logAudit(
      'LOG_PROCEDURE_CASE',
      'PROCEDURE_LOG',
      id,
      `Logged procedure ${newProc.procedureCode} - ${newProc.procedureName}. Patient ${newProc.patientHnMasked}`,
      'PDPA_MASKED'
    );

    return newProc;
  }

  // Supervisor Endorsement
  endorseProcedure(
    id: string,
    status: SupervisorEndorsementStatus,
    feedbackNotes?: string,
    supervisorName?: string
  ) {
    const actor = supervisorName || this.activeStaff().name;
    const nowIso = new Date().toISOString();
    const hash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    this.procedures.update(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            supervisorEndorsement: {
              status,
              reviewedBy: actor,
              timestamp: nowIso,
              feedbackNotes,
              digitalSignatureHash: status === 'APPROVED' ? hash : undefined
            }
          };
        }
        return p;
      })
    );

    const title = status === 'APPROVED' ? 'Case Endorsed' : 'Revision Requested';
    this.notify(
      status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      title,
      `Case ${id} reviewed by ${actor} with status: ${status}`
    );

    this.logAudit(
      'SUPERVISOR_ENDORSEMENT',
      'PROCEDURE_LOG',
      id,
      `Endorsement status updated to ${status} by ${actor}. Signature hash: ${hash.slice(0, 16)}...`,
      'HIPAA_COMPLIANT'
    );
  }

  // Shift Swap Request Workflow
  requestShiftSwap(shiftId: string, targetStaffId: string, reason: string): boolean {
    const reqStaffId = this.currentStaffId();
    const targetStaff = this.clinicians().find(c => c.id === targetStaffId);

    const newSwap: ShiftSwapRequest = {
      id: `SWAP-${Date.now().toString().slice(-4)}`,
      requestingStaffId: reqStaffId,
      targetStaffId,
      shiftId,
      reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    this.shiftSwaps.update(prev => [newSwap, ...prev]);

    // Mark shift as SWAP_PENDING
    this.shifts.update(list =>
      list.map(s => s.id === shiftId ? { ...s, status: 'SWAP_PENDING' } : s)
    );

    this.notify(
      'SUCCESS',
      'Swap Request Dispatched',
      `Shift swap submitted to ${targetStaff?.name || 'Colleague'} awaiting head approval.`
    );

    this.logAudit(
      'REQUEST_SHIFT_SWAP',
      'SHIFT_ROSTER',
      newSwap.id,
      `Requested shift swap to ${targetStaff?.name} for shift ${shiftId}`,
      'HIPAA_COMPLIANT'
    );

    return true;
  }

  // Supervisor Reviews Shift Swap
  reviewShiftSwap(swapId: string, approved: boolean, supervisorNotes?: string) {
    const swap = this.shiftSwaps().find(s => s.id === swapId);
    if (!swap) return;

    const reviewer = this.activeStaff().name;
    const status = approved ? 'APPROVED' : 'REJECTED';

    this.shiftSwaps.update(prev =>
      prev.map(s => {
        if (s.id === swapId) {
          return {
            ...s,
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewer,
            supervisorNotes
          };
        }
        return s;
      })
    );

    // If approved, transfer shift ownership
    if (approved) {
      this.shifts.update(list =>
        list.map(s => {
          if (s.id === swap.shiftId) {
            return {
              ...s,
              staffId: swap.targetStaffId,
              status: 'SCHEDULED',
              notes: `Covered for ${this.clinicians().find(c => c.id === swap.requestingStaffId)?.name}`
            };
          }
          return s;
        })
      );
    } else {
      // Revert shift status
      this.shifts.update(list =>
        list.map(s => s.id === swap.shiftId ? { ...s, status: 'SCHEDULED' } : s)
      );
    }

    this.notify(
      approved ? 'SUCCESS' : 'INFO',
      `Swap ${status}`,
      `Shift swap request #${swapId} has been ${status.toLowerCase()} by ${reviewer}.`
    );

    this.logAudit(
      'REVIEW_SHIFT_SWAP',
      'SHIFT_ROSTER',
      swapId,
      `Shift swap ${status} by ${reviewer}. Notes: ${supervisorNotes || 'None'}`,
      'HIPAA_COMPLIANT'
    );
  }

  // Add new shift assignment
  addShiftAssignment(data: Omit<ShiftAssignment, 'id'>) {
    const id = `SFT-${Date.now().toString().slice(-4)}`;
    const newShift: ShiftAssignment = { ...data, id };
    this.shifts.update(prev => [...prev, newShift]);

    this.notify('SUCCESS', 'Shift Scheduled', `Assigned ${data.shiftType} on ${data.date}`);
    this.logAudit(
      'CREATE_SHIFT',
      'SHIFT_ROSTER',
      id,
      `Scheduled ${data.shiftType} on ${data.date} for staff ${data.staffId}`,
      'HIPAA_COMPLIANT'
    );
  }

  // Delete shift assignment
  deleteShiftAssignment(id: string) {
    this.shifts.update(prev => prev.filter(s => s.id !== id));
    this.notify('INFO', 'Shift Removed', 'Duty shift assignment was cleared.');
    this.logAudit('DELETE_SHIFT', 'SHIFT_ROSTER', id, 'Deleted shift assignment', 'HIPAA_COMPLIANT');
  }

  // Add CME Record
  addCmeRecord(data: Omit<CmeRecord, 'id'>) {
    const id = `CME-${Date.now().toString().slice(-4)}`;
    const newRecord: CmeRecord = { ...data, id };
    this.cmeRecords.update(prev => [newRecord, ...prev]);

    // Update clinician's completed CME hours
    this.clinicians.update(list =>
      list.map(c => {
        if (c.id === data.staffId) {
          return {
            ...c,
            completedCmeHours: Number((c.completedCmeHours + data.creditsEarned).toFixed(1))
          };
        }
        return c;
      })
    );

    this.notify('SUCCESS', 'CME Credit Logged', `Accredited +${data.creditsEarned} credits for "${data.title}"`);
    this.logAudit('ADD_CME_CREDIT', 'CME_RECORD', id, `Added ${data.creditsEarned} CME credits: ${data.title}`, 'HIPAA_COMPLIANT');
  }

  // Notifications
  notify(type: ToastNotification['type'], title: string, message: string) {
    const notif: ToastNotification = {
      id: `NOTIF-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just now'
    };
    this.notifications.update(prev => [notif, ...prev.slice(0, 9)]);
  }

  removeNotification(id: string) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }

  clearAllNotifications() {
    this.notifications.set([]);
  }

  // Audit Logging
  private logAudit(
    action: string,
    resourceType: AuditLogEntry['resourceType'],
    resourceId: string,
    details: string,
    complianceTag: AuditLogEntry['complianceTag']
  ) {
    const actor = this.activeStaff();
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      role: actor.role,
      action,
      resourceType,
      resourceId,
      details,
      clientIp: '10.240.18.42',
      complianceTag
    };
    this.auditLogs.update(prev => [entry, ...prev.slice(0, 99)]);
  }

  // Helpers
  private getTodayDateString(): string {
    return '2026-10-07';
  }

  private getNextDateString(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
}
