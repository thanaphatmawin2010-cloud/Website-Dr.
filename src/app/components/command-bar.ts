import { ChangeDetectionStrategy, Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';
import { ICD_PROCEDURES_CATALOG } from '../lib/mock-data';
import { IcdProcedureCode } from '../types';

@Component({
  selector: 'app-command-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm transition-opacity"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        (click)="closeOnBackdrop()"
        (keydown.escape)="close()"
      >
        <div 
          class="w-full max-w-2xl bg-[#0e1c2f] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
          role="document"
          tabindex="0"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <!-- Search Input Header -->
          <div class="flex items-center px-4 py-3 border-b border-white/10 bg-[#132033]/60">
            <mat-icon class="text-sky-400 mr-3 text-xl">search</mat-icon>
            <input 
              #searchInput
              type="text"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
              placeholder="Search ICD-9/10 codes, clinicians, procedures, or quick commands (e.g. 'clock in', '51.23')..."
              class="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-0"
            />
            <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/10">ESC to close</span>
          </div>

          <!-- Results Scroll Area -->
          <div class="overflow-y-auto p-2 space-y-4 max-h-[60vh]">
            <!-- Quick Actions -->
            <div>
              <div class="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5 flex items-center gap-1.5">
                <mat-icon class="text-xs text-sky-400">bolt</mat-icon> Quick Clinical Actions
              </div>
              <div class="space-y-1">
                <button 
                  (click)="handleAction('CLOCK_IN')"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-sky-500/10 hover:text-sky-300 text-slate-200 transition-colors group"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <mat-icon class="text-base">fingerprint</mat-icon>
                    </div>
                    <div>
                      <div class="font-medium text-slate-200 group-hover:text-sky-300">Biometric Campus Clock-In</div>
                      <div class="text-[11px] text-slate-400">Punch duty start at current verified GPS zone</div>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">Alt+C</span>
                </button>

                <button 
                  (click)="handleAction('LOG_PROCEDURE')"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-sky-500/10 hover:text-sky-300 text-slate-200 transition-colors group"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <mat-icon class="text-base">medical_services</mat-icon>
                    </div>
                    <div>
                      <div class="font-medium text-slate-200 group-hover:text-sky-300">Log Surgical / Clinical Procedure</div>
                      <div class="text-[11px] text-slate-400">Enter OR theater details, ICD-10 coding & team</div>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">Alt+P</span>
                </button>

                <button 
                  (click)="handleAction('EXPORT_JCI')"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-sky-500/10 hover:text-sky-300 text-slate-200 transition-colors group"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <mat-icon class="text-base">verified</mat-icon>
                    </div>
                    <div>
                      <div class="font-medium text-slate-200 group-hover:text-sky-300">Export JCI / HA Accreditation Summary</div>
                      <div class="text-[11px] text-slate-400">One-click compliance packet download</div>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">Alt+E</span>
                </button>
              </div>
            </div>

            <!-- ICD Procedures Filtered -->
            @if (filteredIcd().length > 0) {
              <div>
                <div class="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-teal-400">science</mat-icon> ICD-9 / ICD-10 Procedures Catalog
                </div>
                <div class="space-y-1">
                  @for (icd of filteredIcd(); track icd.code) {
                    <button 
                      (click)="selectIcd(icd)"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-800/80 text-slate-200 transition-colors"
                    >
                      <div class="flex items-center gap-2.5">
                        <span class="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-400 font-mono text-[11px] font-bold">
                          {{ icd.code }}
                        </span>
                        <div>
                          <div class="font-medium text-slate-100">{{ icd.name }}</div>
                          <div class="text-[11px] text-slate-400">{{ icd.category }} • Dx: {{ icd.icd10DxCode }} {{ icd.icd10DxName }}</div>
                        </div>
                      </div>
                      <span class="text-[11px] text-slate-400">~{{ icd.avgDurationMin }}m</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Clinicians Filtered -->
            @if (filteredClinicians().length > 0) {
              <div>
                <div class="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5 flex items-center gap-1.5">
                  <mat-icon class="text-xs text-indigo-400">badge</mat-icon> Hospital Staff Directory
                </div>
                <div class="space-y-1">
                  @for (c of filteredClinicians(); track c.id) {
                    <button 
                      (click)="selectClinician(c.id)"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-800/80 text-slate-200 transition-colors"
                    >
                      <div class="flex items-center gap-2.5">
                        <img [src]="c.avatarUrl" [alt]="c.name" class="w-6 h-6 rounded-full object-cover border border-white/20" />
                        <div>
                          <div class="font-medium text-slate-100">{{ c.name }}</div>
                          <div class="text-[11px] text-slate-400">{{ c.title }} • {{ c.medicalLicenseNo }}</div>
                        </div>
                      </div>
                      <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 font-mono">
                        {{ c.role }}
                      </span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer Shortcut info -->
          <div class="px-4 py-2 border-t border-white/5 bg-[#0b192c] flex items-center justify-between text-[11px] text-slate-400">
            <span>AegisHIS Command Palette</span>
            <span>Use ↑ ↓ to navigate, ESC to dismiss</span>
          </div>
        </div>
      </div>
    }
  `
})
export class CommandBar {
  private store = inject(HospitalStore);

  readonly isOpen = signal(false);
  readonly query = signal('');

  readonly openProcedureLog = output<string | undefined>();
  readonly navigateTo = output<string>();

  readonly filteredIcd = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return ICD_PROCEDURES_CATALOG.slice(0, 4);
    return ICD_PROCEDURES_CATALOG.filter(
      i => i.code.toLowerCase().includes(q) ||
           i.name.toLowerCase().includes(q) ||
           i.category.toLowerCase().includes(q) ||
           i.icd10DxCode.toLowerCase().includes(q)
    );
  });

  readonly filteredClinicians = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.store.clinicians().slice(0, 3);
    return this.store.clinicians().filter(
      c => c.name.toLowerCase().includes(q) ||
           c.title.toLowerCase().includes(q) ||
           c.medicalLicenseNo.toLowerCase().includes(q) ||
           c.department.toLowerCase().includes(q)
    );
  });

  open() {
    this.isOpen.set(true);
    this.query.set('');
  }

  close() {
    this.isOpen.set(false);
  }

  closeOnBackdrop() {
    this.close();
  }

  handleAction(action: string) {
    this.close();
    if (action === 'CLOCK_IN') {
      this.store.clockIn(undefined, 'Clocked in via global command palette');
      this.navigateTo.emit('attendance');
    } else if (action === 'LOG_PROCEDURE') {
      this.openProcedureLog.emit(undefined);
    } else if (action === 'EXPORT_JCI') {
      this.navigateTo.emit('audit');
    }
  }

  selectIcd(icd: IcdProcedureCode) {
    this.close();
    this.openProcedureLog.emit(icd.code);
  }

  selectClinician(staffId: string) {
    this.close();
    this.store.setStaff(staffId);
  }
}
