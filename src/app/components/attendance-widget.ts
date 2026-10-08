import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';

@Component({
  selector: 'app-attendance-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="bg-[#0e1c2f] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <mat-icon class="text-emerald-400">fingerprint</mat-icon>
            Clinician Duty Clock-In & Reconciliation Engine
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Automated biometric & GPS geofencing punch verification, duty reconciliation, overtime (OT) accrual & tardiness auditing.
          </p>
        </div>

        <!-- Campus Simulation Toggle Buttons -->
        <div class="flex items-center gap-2 bg-[#061426] p-1.5 rounded-lg border border-white/10 text-xs">
          <span class="text-slate-400 text-[11px] px-2 font-medium flex items-center gap-1">
            <mat-icon class="text-xs text-sky-400">satellite_alt</mat-icon> GPS Simulator:
          </span>
          <button 
            (click)="setInsideZone('Surgical Pavilion & Operating Theater Suite (8F)')"
            [class.bg-emerald-600]="geofence().isInsideCampus && geofence().zoneName.includes('Operating')"
            [class.text-white]="geofence().isInsideCampus && geofence().zoneName.includes('Operating')"
            [class.text-slate-400]="!(geofence().isInsideCampus && geofence().zoneName.includes('Operating'))"
            class="px-2.5 py-1 rounded font-medium transition-colors"
          >
            Inside OR Suite
          </button>
          <button 
            (click)="setInsideZone('Emergency Trauma Center & Resuscitation Bay')"
            [class.bg-emerald-600]="geofence().isInsideCampus && geofence().zoneName.includes('Trauma')"
            [class.text-white]="geofence().isInsideCampus && geofence().zoneName.includes('Trauma')"
            [class.text-slate-400]="!(geofence().isInsideCampus && geofence().zoneName.includes('Trauma'))"
            class="px-2.5 py-1 rounded font-medium transition-colors"
          >
            Inside Trauma ER
          </button>
          <button 
            (click)="setOutsideCampus()"
            [class.bg-rose-700]="!geofence().isInsideCampus"
            [class.text-white]="!geofence().isInsideCampus"
            [class.text-slate-400]="geofence().isInsideCampus"
            class="px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
          >
            <mat-icon class="text-xs">location_off</mat-icon> Out of Bounds (Test Reject)
          </button>
        </div>
      </div>

      <!-- Live Clock & Punch Station Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Card 1: Live Punch Station & Duty Controls -->
        <div class="lg:col-span-2 bg-[#0e1c2f] rounded-xl border border-white/10 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <!-- Background glowing radar accent -->
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-sky-500/5 blur-3xl pointer-events-none"></div>

          <div>
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Clinician Identity
                </span>
                <div class="flex items-center gap-3 mt-1.5">
                  <img 
                    [src]="activeStaff().avatarUrl" 
                    [alt]="activeStaff().name"
                    class="w-12 h-12 rounded-full object-cover border-2 border-sky-400/40"
                  />
                  <div>
                    <h3 class="text-base font-bold text-white">{{ activeStaff().name }}</h3>
                    <p class="text-xs text-sky-400 font-mono">{{ activeStaff().title }} • {{ activeStaff().medicalLicenseNo }}</p>
                  </div>
                </div>
              </div>

              <!-- Active Status Badge -->
              <div>
                @if (activeSession()) {
                  <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    ACTIVE ON DUTY
                  </span>
                } @else {
                  <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-white/10 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-slate-500"></span>
                    OFF DUTY / STANDBY
                  </span>
                }
              </div>
            </div>

            <!-- Active Shift Stats Matrix -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div class="bg-[#061426] p-3 rounded-lg border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Today's Shift</span>
                <span class="text-sm font-bold text-white mt-1 block">Morning (เวรเช้า)</span>
                <span class="text-[10px] text-slate-500 font-mono">08:00 - 16:00 (8h)</span>
              </div>
              <div class="bg-[#061426] p-3 rounded-lg border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Clock-In Time</span>
                <span class="text-sm font-bold text-emerald-400 mt-1 block font-mono">
                  {{ activeSession() ? activeSession()?.clockInTime : '07:52' }}
                </span>
                <span class="text-[10px] text-emerald-500/80">Within 15m Grace</span>
              </div>
              <div class="bg-[#061426] p-3 rounded-lg border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Elapsed Shift</span>
                <span class="text-sm font-bold text-sky-400 mt-1 block font-mono">
                  {{ activeSession() ? '5h 18m' : '0h 00m' }}
                </span>
                <span class="text-[10px] text-slate-500">Scheduled: 8.0h</span>
              </div>
              <div class="bg-[#061426] p-3 rounded-lg border border-white/5">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Accrued OT</span>
                <span class="text-sm font-bold text-amber-400 mt-1 block font-mono">
                  {{ activeSession() ? '0.0h' : '+2.25h' }}
                </span>
                <span class="text-[10px] text-amber-400/80">Rate: 1.5x Approved</span>
              </div>
            </div>
          </div>

          <!-- Clock In / Out Buttons -->
          <div class="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs text-slate-400 flex items-center gap-2">
              <mat-icon class="text-slate-500 text-sm">schedule</mat-icon>
              <span>Current Time: <strong class="text-white font-mono">13:10:45 ICT</strong></span>
            </div>

            <div class="flex items-center gap-2.5">
              @if (!activeSession()) {
                <button 
                  (click)="handleClockIn()"
                  [disabled]="!geofence().isInsideCampus"
                  class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <mat-icon class="text-base">fingerprint</mat-icon>
                  PUNCH DUTY CLOCK-IN
                </button>
              } @else {
                <button 
                  (click)="handleClockOut()"
                  class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
                >
                  <mat-icon class="text-base">logout</mat-icon>
                  CLOCK-OUT & RECONCILE SHIFT
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Card 2: Campus Geofence Radar Telemetry -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 class="font-bold text-white text-xs flex items-center gap-2 uppercase tracking-wider">
                <mat-icon class="text-sky-400 text-sm">radar</mat-icon>
                Hospital Campus Geofence Radar
              </h3>
              <span 
                [class.bg-emerald-500/20]="geofence().isInsideCampus"
                [class.text-emerald-400]="geofence().isInsideCampus"
                [class.border-emerald-500/30]="geofence().isInsideCampus"
                [class.bg-rose-500/20]="!geofence().isInsideCampus"
                [class.text-rose-400]="!geofence().isInsideCampus"
                [class.border-rose-500/30]="!geofence().isInsideCampus"
                class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider"
              >
                {{ geofence().isInsideCampus ? 'Verified In-Bounds' : 'Geofence Breach' }}
              </span>
            </div>

            <!-- Visual Simulated Radar Diagram -->
            <div class="mt-4 p-4 rounded-xl bg-[#061426] border border-white/5 relative overflow-hidden text-center">
              <div class="w-32 h-32 mx-auto rounded-full border border-sky-500/30 flex items-center justify-center relative">
                <!-- Inner circle -->
                <div class="w-20 h-20 rounded-full border border-dashed border-teal-500/40 flex items-center justify-center">
                  <!-- Blip -->
                  <div 
                    [class.bg-emerald-400]="geofence().isInsideCampus"
                    [class.shadow-emerald-400]="geofence().isInsideCampus"
                    [class.bg-rose-500]="!geofence().isInsideCampus"
                    [class.shadow-rose-500]="!geofence().isInsideCampus"
                    class="w-3.5 h-3.5 rounded-full shadow-lg animate-ping"
                  ></div>
                </div>
                <div class="absolute inset-0 border border-sky-500/10 rounded-full animate-spin" style="animation-duration: 8s;"></div>
              </div>

              <div class="mt-3 text-left space-y-1.5 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-400">Current Zone:</span>
                  <span class="font-semibold text-slate-200 text-right truncate max-w-[170px]" [title]="geofence().zoneName">
                    {{ geofence().zoneName }}
                  </span>
                </div>
                <div class="flex justify-between font-mono">
                  <span class="text-slate-400">GPS Coordinates:</span>
                  <span class="text-sky-400">{{ geofence().latitude.toFixed(4) }}°N, {{ geofence().longitude.toFixed(4) }}°E</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Signal Accuracy:</span>
                  <span class="text-emerald-400 font-mono">±{{ geofence().accuracyMeters }} meters</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Campus Radius:</span>
                  <span class="text-slate-300 font-mono">250m Authorization Bound</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 text-[10px] text-slate-500 italic">
            *Compliance Note: In accordance with JCI Human Resource Management (SQE) standards, time punches are cryptographically tied to hospital physical access points.
          </div>
        </div>
      </div>

      <!-- Shift Reconciliation Matrix Table -->
      <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-sky-400">balance</mat-icon>
            <h3 class="font-bold text-white text-sm">Shift Reconciliation & Overtime Accrual Matrix</h3>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            Grace Period: 15 mins • Standard OT Rate: 1.5x • Holiday Rate: 3.0x
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-[#132033]/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th class="py-2.5 px-3">Date</th>
                <th class="py-2.5 px-3">Clinician</th>
                <th class="py-2.5 px-3">Scheduled</th>
                <th class="py-2.5 px-3">Actual Punch</th>
                <th class="py-2.5 px-3">Tardiness</th>
                <th class="py-2.5 px-3">Overtime (OT)</th>
                <th class="py-2.5 px-3">Verified Zone</th>
                <th class="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-normal">
              @for (rec of attendanceRecords(); track rec.id) {
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="py-2.5 px-3 font-mono text-slate-300">{{ rec.date }}</td>
                  <td class="py-2.5 px-3">
                    <div class="font-medium text-white">{{ getStaffName(rec.staffId) }}</div>
                  </td>
                  <td class="py-2.5 px-3 font-mono text-slate-400">
                    {{ rec.scheduledStart }} - {{ rec.scheduledEnd }}
                  </td>
                  <td class="py-2.5 px-3 font-mono">
                    <span class="text-emerald-400">{{ rec.clockInTime }}</span>
                    @if (rec.clockOutTime) {
                      <span class="text-slate-500"> → </span>
                      <span class="text-sky-400">{{ rec.clockOutTime }}</span>
                    } @else {
                      <span class="text-amber-400"> (In Progress)</span>
                    }
                  </td>
                  <td class="py-2.5 px-3">
                    @if (rec.tardinessMinutes > 0) {
                      <span class="text-rose-400 font-semibold font-mono">+{{ rec.tardinessMinutes }} min</span>
                    } @else {
                      <span class="text-emerald-400 font-mono">On Time</span>
                    }
                  </td>
                  <td class="py-2.5 px-3">
                    @if (rec.overtimeHours > 0) {
                      <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono border border-amber-500/30">
                        +{{ rec.overtimeHours }}h ({{ rec.overtimeRate }}x)
                      </span>
                    } @else {
                      <span class="text-slate-500 font-mono">0.0h</span>
                    }
                  </td>
                  <td class="py-2.5 px-3 text-slate-300 truncate max-w-[200px]" [title]="rec.campusZone">
                    {{ rec.campusZone }}
                  </td>
                  <td class="py-2.5 px-3">
                    @if (rec.status === 'ON_DUTY') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ON DUTY
                      </span>
                    } @else if (rec.status === 'COMPLETED') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        RECONCILED
                      </span>
                    } @else if (rec.status === 'LATE') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        LATE ARRIVAL
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                        {{ rec.status }}
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AttendanceWidget {
  private store = inject(HospitalStore);

  readonly geofence = this.store.simulatedGeofence;
  readonly activeStaff = this.store.activeStaff;
  readonly activeSession = this.store.currentDutySession;
  readonly attendanceRecords = this.store.attendanceRecords;
  readonly clinicians = this.store.clinicians;

  setInsideZone(zoneName: string) {
    this.store.setSimulatedCampusLocation(true, zoneName);
  }

  setOutsideCampus() {
    this.store.setSimulatedCampusLocation(false);
  }

  handleClockIn() {
    this.store.clockIn(undefined, 'Clocked in via hospital mobile terminal');
  }

  handleClockOut() {
    this.store.clockOut('Shift finalized and verified by duty supervisor');
  }

  getStaffName(staffId: string): string {
    const c = this.clinicians().find(cl => cl.id === staffId);
    return c ? c.name : staffId;
  }
}
