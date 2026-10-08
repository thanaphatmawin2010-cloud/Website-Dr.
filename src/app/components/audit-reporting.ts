import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';

@Component({
  selector: 'app-audit-reporting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-[#0e1c2f] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <mat-icon class="text-sky-400">assessment</mat-icon>
            Hospital Backoffice & JCI / HA Accreditation Audit Center
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Executive clinical governance, quality indices, HIPAA/PDPA audit logs & one-click survey packet generation.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button 
            (click)="showInspectionModal.set(true)"
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="text-sm text-sky-400">print</mat-icon> Inspection Preview
          </button>

          <button 
            (click)="exportCsv()"
            class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-950/40 transition-colors"
          >
            <mat-icon class="text-sm">download</mat-icon> EXPORT JCI AUDIT CSV
          </button>
        </div>
      </div>

      <!-- Executive KPI Cards Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- KPI 1 -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4 shadow-lg">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Procedures</span>
            <mat-icon class="text-sm text-sky-400">medical_information</mat-icon>
          </div>
          <div class="text-2xl font-bold text-white font-mono mt-2">
            {{ metrics().totalProcedures }}
          </div>
          <div class="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <mat-icon class="text-xs">check</mat-icon> 100% Documented
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4 shadow-lg">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Endorsement Compliance</span>
            <mat-icon class="text-sm text-emerald-400">verified</mat-icon>
          </div>
          <div class="text-2xl font-bold text-emerald-400 font-mono mt-2">
            {{ metrics().endorsementRate }}%
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ metrics().endorsedProcedures }} of {{ metrics().totalProcedures }} endorsed
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4 shadow-lg">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Complication Rate</span>
            <mat-icon class="text-sm text-amber-400">medical_services</mat-icon>
          </div>
          <div class="text-2xl font-bold font-mono mt-2" [class.text-emerald-400]="Number(metrics().complicationRate) < 5" [class.text-amber-400]="Number(metrics().complicationRate) >= 5">
            {{ metrics().complicationRate }}%
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            Benchmark Target: &lt; 2.5%
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4 shadow-lg">
          <div class="flex items-center justify-between text-slate-400 text-xs">
            <span>Duty Rest Rule Violations</span>
            <mat-icon class="text-sm text-rose-400">gavel</mat-icon>
          </div>
          <div class="text-2xl font-bold text-rose-400 font-mono mt-2">
            {{ metrics().restRuleViolations }}
          </div>
          <div class="text-[11px] text-rose-300/80 mt-1">
            Active Roster Conflicts
          </div>
        </div>
      </div>

      <!-- Audit Breakdown Tables: JCI Standards Alignment -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Standards Card -->
        <div class="lg:col-span-1 bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 class="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <mat-icon class="text-sky-400 text-sm">rule</mat-icon> JCI Standard Compliance
            </h3>
            <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              AUDIT READY
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-lg bg-[#061426] border border-white/5 space-y-1">
              <div class="flex items-center justify-between font-semibold text-slate-200">
                <span>COP.3 (Care of Surgical Patients)</span>
                <span class="text-emerald-400">Compliant</span>
              </div>
              <p class="text-[11px] text-slate-400">
                100% of procedures log EBL, anesthesia modality, and Clavien-Dindo grading.
              </p>
            </div>

            <div class="p-3 rounded-lg bg-[#061426] border border-white/5 space-y-1">
              <div class="flex items-center justify-between font-semibold text-slate-200">
                <span>SQE.8 (Clinical Privileging & CME)</span>
                <span class="text-emerald-400">Compliant</span>
              </div>
              <p class="text-[11px] text-slate-400">
                Resident surgical logs require attending supervisor digital sign-off with SHA-256 validation.
              </p>
            </div>

            <div class="p-3 rounded-lg bg-[#061426] border border-white/5 space-y-1">
              <div class="flex items-center justify-between font-semibold text-slate-200">
                <span>GLD.11 (Staff Safety & Rest Rules)</span>
                <span class="text-amber-400">Under Review</span>
              </div>
              <p class="text-[11px] text-slate-400">
                Automated scheduler detects 8-hour rest-interval violations before roster publication.
              </p>
            </div>
          </div>
        </div>

        <!-- Live Audit Trail Log -->
        <div class="lg:col-span-2 bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-slate-400 text-sm">security</mat-icon>
                <h3 class="font-bold text-white text-xs uppercase tracking-wider">
                  HIPAA & Thailand PDPA Audit Trail Logs
                </h3>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">
                Immutable Ledger • Section 26
              </span>
            </div>

            <div class="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-white/10 bg-[#061426]/70 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th class="py-2 px-2.5">Timestamp</th>
                    <th class="py-2 px-2.5">Actor</th>
                    <th class="py-2 px-2.5">Action</th>
                    <th class="py-2 px-2.5">Details</th>
                    <th class="py-2 px-2.5">Compliance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 font-normal text-[11px]">
                  @for (log of auditLogs(); track log.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-2 px-2.5 font-mono text-slate-400 whitespace-nowrap">
                        {{ log.timestamp.slice(11, 19) }}
                      </td>
                      <td class="py-2 px-2.5 whitespace-nowrap">
                        <div class="font-medium text-slate-200">{{ log.actorName }}</div>
                        <div class="text-[9px] text-slate-400 font-mono">{{ log.role }}</div>
                      </td>
                      <td class="py-2 px-2.5 font-mono text-sky-400 whitespace-nowrap">
                        {{ log.action }}
                      </td>
                      <td class="py-2 px-2.5 text-slate-300 truncate max-w-[280px]" [title]="log.details">
                        {{ log.details }}
                      </td>
                      <td class="py-2 px-2.5 whitespace-nowrap">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {{ log.complianceTag }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Terminal IP: 10.240.18.42 (Encrypted TLS 1.3)</span>
            <span>All read/write operations hash-logged</span>
          </div>
        </div>
      </div>

      <!-- PRINTABLE INSPECTION REPORT MODAL -->
      @if (showInspectionModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <mat-icon class="text-sky-400">description</mat-icon> JCI & HA Accreditation Survey Summary
              </h3>
              <button (click)="showInspectionModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Hospital Letterhead Document Preview -->
            <div class="bg-[#061426] p-8 rounded-xl border border-white/10 space-y-6 text-xs text-slate-300">
              <!-- Hospital Header -->
              <div class="border-b border-white/15 pb-4 flex justify-between items-start">
                <div>
                  <h1 class="text-base font-bold text-white uppercase tracking-wider">
                    AEGIS CLINICAL MEDICAL CENTER
                  </h1>
                  <p class="text-[11px] text-slate-400">Department of Surgery & Clinical Governance Division</p>
                  <p class="text-[11px] text-slate-400">Joint Commission International (JCI) 8th Edition Quality Audit</p>
                </div>
                <div class="text-right font-mono text-[11px] text-slate-400">
                  <div>Date: 2026-10-07</div>
                  <div>Report Ref: JCI-SURV-2026-Q3</div>
                </div>
              </div>

              <!-- Executive Quality Statement -->
              <div>
                <h4 class="font-bold text-sky-300 uppercase tracking-wider text-[11px] mb-1">
                  1. Executive Quality & Safety Summary
                </h4>
                <p class="leading-relaxed text-slate-300">
                  This report certifies that all recorded surgical procedures within the General Surgery and allied surgical specialties meet hospital clinical credentialing bylaws. Operating surgeons maintained active CME re-certification and mandatory life-support credentials.
                </p>
              </div>

              <!-- Metric Table -->
              <div>
                <h4 class="font-bold text-sky-300 uppercase tracking-wider text-[11px] mb-2">
                  2. Surgical Governance Metrics
                </h4>
                <div class="grid grid-cols-3 gap-3 font-mono text-[11px]">
                  <div class="p-2.5 bg-slate-900/60 rounded border border-white/5">
                    <span class="text-slate-400 block">Procedures Logged:</span>
                    <span class="text-base font-bold text-white">{{ metrics().totalProcedures }} cases</span>
                  </div>
                  <div class="p-2.5 bg-slate-900/60 rounded border border-white/5">
                    <span class="text-slate-400 block">Supervisor Endorsement:</span>
                    <span class="text-base font-bold text-emerald-400">{{ metrics().endorsementRate }}%</span>
                  </div>
                  <div class="p-2.5 bg-slate-900/60 rounded border border-white/5">
                    <span class="text-slate-400 block">Complication Incidence:</span>
                    <span class="text-base font-bold text-amber-400">{{ metrics().complicationRate }}%</span>
                  </div>
                </div>
              </div>

              <!-- Sign-off Block -->
              <div class="pt-6 border-t border-white/15 grid grid-cols-2 gap-8 text-center text-[11px]">
                <div>
                  <div class="font-serif italic text-slate-300 text-sm mb-1">Kittisak Chaiyaporn, MD</div>
                  <div class="border-t border-slate-600 pt-1 font-semibold text-slate-200">Prof. Dr. Kittisak Chaiyaporn, MD, FRCS</div>
                  <div class="text-slate-400">Chief Medical Officer & Hospital Auditor</div>
                </div>
                <div>
                  <div class="font-serif italic text-slate-300 text-sm mb-1">Somchai Prasertsuk, MD</div>
                  <div class="border-t border-slate-600 pt-1 font-semibold text-slate-200">Prof. Dr. Somchai Prasertsuk, MD, FRCST</div>
                  <div class="text-slate-400">Chairman, Department of Surgery</div>
                </div>
              </div>
            </div>

            <div class="flex justify-between pt-2">
              <button 
                (click)="exportCsv()"
                class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <mat-icon class="text-sm">download</mat-icon> Download Raw Inspection Dataset (CSV)
              </button>
              <button 
                (click)="showInspectionModal.set(false)"
                class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AuditReporting {
  private store = inject(HospitalStore);

  readonly metrics = this.store.complianceMetrics;
  readonly auditLogs = this.store.auditLogs;
  readonly procedures = this.store.procedures;

  readonly showInspectionModal = signal(false);

  Number = Number;

  exportCsv() {
    const list = this.procedures();
    const headers = [
      'CaseNumber',
      'Date',
      'PatientHnMasked',
      'Age',
      'Gender',
      'Theater',
      'ProcedureCode',
      'ProcedureName',
      'DiagnosisCode',
      'OperatorRole',
      'EBL_mL',
      'DurationMinutes',
      'ComplicationSeverity',
      'EndorsementStatus',
      'ReviewedBy'
    ];

    const rows = list.map(p => [
      p.caseNumber,
      p.procedureDate,
      p.patientHnMasked,
      p.patientAge,
      p.patientGender,
      `"${p.orRoom}"`,
      p.procedureCode,
      `"${p.procedureName}"`,
      p.diagnosisCode,
      p.operatorRole,
      p.estimatedBloodLossMl,
      p.durationMinutes,
      p.complicationSeverity,
      p.supervisorEndorsement.status,
      `"${p.supervisorEndorsement.reviewedBy || 'Pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JCI_Hospital_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.store.notify('SUCCESS', 'CSV Exported', 'Audit compliance records downloaded successfully.');
  }
}
