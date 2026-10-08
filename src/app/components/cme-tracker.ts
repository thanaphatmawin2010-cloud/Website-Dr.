import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';
import { CmeRecord, CmeCategory } from '../types';

@Component({
  selector: 'app-cme-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="bg-[#0e1c2f] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <mat-icon class="text-amber-400">school</mat-icon>
            CME & Professional Training Credit Tracker (หน่วยกิตการศึกษาต่อเนื่อง)
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Thai Medical Council (แพทยสภา) & Nursing Council annual license re-validation and credentialing repository.
          </p>
        </div>

        <button 
          (click)="showAddModal.set(true)"
          class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
        >
          <mat-icon class="text-sm">upload_file</mat-icon> LOG CME CREDIT & CERTIFICATE
        </button>
      </div>

      <!-- Credentialing Progress Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Annual Target Radial & Bar Progress -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Annual CME Quota</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Cycle 2026-2027
              </span>
            </div>

            <!-- Radial visualization -->
            <div class="my-4 flex items-center justify-center gap-6">
              <div class="relative w-28 h-28 flex items-center justify-center">
                <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" stroke-width="8" fill="none"></circle>
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#F59E0B" 
                    stroke-width="8" 
                    fill="none"
                    stroke-dasharray="251.2"
                    [attr.stroke-dashoffset]="strokeOffset()"
                    stroke-linecap="round"
                    class="transition-all duration-700 ease-out"
                  ></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="text-2xl font-extrabold text-white font-mono">{{ progressPercent() }}%</span>
                  <span class="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Verified</span>
                </div>
              </div>

              <div class="space-y-1.5 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase">Earned Credits</span>
                  <span class="text-xl font-bold text-emerald-400 font-mono">{{ totalCreditsEarned() }}</span>
                  <span class="text-slate-500 text-[11px]"> / {{ activeStaff().annualCmeTarget }} hrs</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase">Remaining Required</span>
                  <span class="text-sm font-semibold text-amber-300 font-mono">{{ remainingCredits() }} hrs</span>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full bg-[#061426] h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              class="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
              [style.width.%]="progressPercent()"
            ></div>
          </div>
        </div>

        <!-- Card 2: Regulatory Body Requirements -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Accreditation Standards</span>
              <mat-icon class="text-xs text-sky-400">verified</mat-icon>
            </div>

            <div class="mt-3 space-y-3 text-xs">
              <div class="p-2.5 rounded-lg bg-[#061426] border border-white/5">
                <div class="flex justify-between font-semibold text-slate-200">
                  <span>Medical Council of Thailand</span>
                  <span class="text-emerald-400 font-mono">50 Credits / Year</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">
                  Mandatory for annual license re-certification & surgical privileges renewal.
                </p>
              </div>

              <div class="p-2.5 rounded-lg bg-[#061426] border border-white/5">
                <div class="flex justify-between font-semibold text-slate-200">
                  <span>Royal College of Surgeons (RCST)</span>
                  <span class="text-sky-400 font-mono">15 Surgery-Specific</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">
                  Minimum hands-on cadaveric / simulator procedural hours.
                </p>
              </div>
            </div>
          </div>

          <div class="text-[10px] text-slate-500 italic mt-2">
            Automated synchronization with Thai Medical Council CME Gateway API.
          </div>
        </div>

        <!-- Card 3: Active Certifications Status -->
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Life-Support Status</span>
              <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <mat-icon class="text-xs">check_circle</mat-icon> Current
              </span>
            </div>

            <div class="mt-3 space-y-2 text-xs">
              <div class="flex items-center justify-between p-2 rounded bg-[#061426] border border-white/5">
                <span class="text-slate-200 font-medium">ATLS (Trauma Life Support)</span>
                <span class="text-[10px] text-emerald-400 font-mono">Valid thru 2030</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded bg-[#061426] border border-white/5">
                <span class="text-slate-200 font-medium">ACLS / BLS Provider</span>
                <span class="text-[10px] text-emerald-400 font-mono">Valid thru 2028</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded bg-[#061426] border border-white/5">
                <span class="text-slate-200 font-medium">Laparoscopic Cadaveric Credential</span>
                <span class="text-[10px] text-sky-400 font-mono">Accredited</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Audit Readiness:</span>
            <span class="font-bold text-emerald-400 font-mono">100% Compliant</span>
          </div>
        </div>
      </div>

      <!-- CME Records & Certificates Table -->
      <div class="bg-[#0e1c2f] rounded-xl border border-white/10 shadow-xl overflow-hidden">
        <div class="p-3 bg-[#132033]/70 border-b border-white/10 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white uppercase tracking-wider text-[11px]">Accredited Activity Repository</span>
            <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono text-[10px] border border-amber-500/30">
              {{ myCmeRecords().length }} Records
            </span>
          </div>
          <span class="text-[11px] text-slate-400">
            Official Thai Medical Council Accreditation Certificates
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-[#061426]/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th class="py-2.5 px-3">Date</th>
                <th class="py-2.5 px-3">Academic Program / Course Title</th>
                <th class="py-2.5 px-3">Category</th>
                <th class="py-2.5 px-3">Accrediting Body</th>
                <th class="py-2.5 px-3">Credits</th>
                <th class="py-2.5 px-3">Certificate Ref</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-normal">
              @for (rec of myCmeRecords(); track rec.id) {
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="py-3 px-3 font-mono text-slate-300">{{ rec.completionDate }}</td>
                  <td class="py-3 px-3">
                    <div class="font-medium text-white">{{ rec.title }}</div>
                    <div class="text-[11px] text-slate-400">{{ rec.certificateIssuer }}</div>
                  </td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/5">
                      {{ rec.category.replace(/_/g, ' ') }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-slate-300 font-mono text-[11px]">
                    {{ rec.accreditingBody.replace(/_/g, ' ') }}
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-amber-400">
                    +{{ rec.creditsEarned }} CME
                  </td>
                  <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {{ rec.certificateNumber }}
                  </td>
                  <td class="py-3 px-3">
                    @if (rec.verificationStatus === 'ACCREDITED') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACCREDITED
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        PENDING
                      </span>
                    }
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button 
                      (click)="previewCertificate(rec)"
                      class="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-400 border border-sky-500/30 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ml-auto"
                    >
                      <mat-icon class="text-xs">visibility</mat-icon> View Cert
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- CERTIFICATE PREVIEW MODAL -->
      @if (selectedCertificate()) {
        @let c = selectedCertificate()!;
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <mat-icon class="text-amber-400">workspace_premium</mat-icon> Accreditation Certificate Document
              </h3>
              <button (click)="selectedCertificate.set(null)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Official Styled Certificate Preview Card -->
            <div class="p-8 bg-[#061426] border-4 border-double border-amber-500/40 rounded-xl text-center space-y-4 relative overflow-hidden">
              <div class="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                Royal College of Surgeons & Medical Council of Thailand
              </div>
              <h2 class="text-xl font-serif font-bold text-white tracking-wide">
                CERTIFICATE OF CONTINUING MEDICAL EDUCATION
              </h2>
              <p class="text-xs text-slate-400">This is to officially certify that</p>
              <div class="text-lg font-bold text-sky-300 font-serif border-b border-white/10 pb-2 max-w-md mx-auto">
                {{ activeStaff().name }}
              </div>
              <p class="text-xs text-slate-300 max-w-lg mx-auto">
                has successfully participated in and satisfied all clinical requirements for
                <br /><strong class="text-white text-sm">"{{ c.title }}"</strong>
              </p>
              <div class="flex justify-center gap-8 text-xs font-mono pt-4 border-t border-white/10">
                <div>
                  <span class="text-slate-500 block text-[10px]">CME CREDITS ACCREDITED</span>
                  <span class="text-base font-bold text-amber-400">{{ c.creditsEarned }} Hours</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-[10px]">CERTIFICATE NUMBER</span>
                  <span class="text-slate-200">{{ c.certificateNumber }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-[10px]">COMPLETION DATE</span>
                  <span class="text-slate-200">{{ c.completionDate }}</span>
                </div>
              </div>
            </div>

            <div class="flex justify-between pt-2">
              <span class="text-xs text-slate-400 flex items-center gap-1">
                <mat-icon class="text-xs text-emerald-400">lock</mat-icon> Cryptographically Signed Document
              </span>
              <button 
                (click)="selectedCertificate.set(null)"
                class="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ADD CME CREDIT MODAL -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <mat-icon class="text-amber-400">post_add</mat-icon> Log CME Credit Activity
              </h3>
              <button (click)="showAddModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="cmeForm" (ngSubmit)="submitCme()" class="space-y-3 text-xs">
              <div>
                <label for="cmeTitle" class="block text-slate-300 font-medium mb-1">Course / Seminar Title</label>
                <input 
                  id="cmeTitle"
                  type="text"
                  formControlName="title"
                  placeholder="e.g. Advanced Laparoscopic Colorectal Masterclass"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label for="cmeCategory" class="block text-slate-300 font-medium mb-1">Academic Category</label>
                <select 
                  id="cmeCategory"
                  formControlName="category"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="INTERNATIONAL_CONFERENCE">International / National Conference</option>
                  <option value="CADAVER_HANDS_ON_WORKSHOP">Cadaveric / Simulator Hands-on Workshop</option>
                  <option value="BLS_ACLS_ATLS">Life-Support Certification (BLS/ACLS/ATLS)</option>
                  <option value="IN_SERVICE_SEMINAR">Hospital In-Service Seminar</option>
                  <option value="PEER_REVIEWED_PUBLICATION">Peer-Reviewed Medical Publication</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="cmeCredits" class="block text-slate-300 font-medium mb-1">Credits Earned (Hours)</label>
                  <input 
                    id="cmeCredits"
                    type="number"
                    step="0.5"
                    formControlName="creditsEarned"
                    class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label for="cmeDate" class="block text-slate-300 font-medium mb-1">Completion Date</label>
                  <input 
                    id="cmeDate"
                    type="date"
                    formControlName="completionDate"
                    class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label for="cmeCertNo" class="block text-slate-300 font-medium mb-1">Certificate Number</label>
                <input 
                  id="cmeCertNo"
                  type="text"
                  formControlName="certificateNumber"
                  placeholder="e.g. TMC-CME-2026-9921"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label for="cmeIssuer" class="block text-slate-300 font-medium mb-1">Certificate Issuer</label>
                <input 
                  id="cmeIssuer"
                  type="text"
                  formControlName="certificateIssuer"
                  placeholder="e.g. Royal College of Surgeons of Thailand"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button 
                  type="button"
                  (click)="showAddModal.set(false)"
                  class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  [disabled]="cmeForm.invalid"
                  class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <mat-icon class="text-sm">save</mat-icon> Save CME Record
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CmeTracker {
  private store = inject(HospitalStore);

  readonly cmeRecords = this.store.cmeRecords;
  readonly activeStaff = this.store.activeStaff;

  readonly showAddModal = signal(false);
  readonly selectedCertificate = signal<CmeRecord | null>(null);

  readonly myCmeRecords = computed(() => {
    const id = this.activeStaff().id;
    return this.cmeRecords().filter(c => c.staffId === id);
  });

  readonly totalCreditsEarned = computed(() => {
    return this.myCmeRecords().reduce((sum, r) => sum + r.creditsEarned, 0);
  });

  readonly remainingCredits = computed(() => {
    const target = this.activeStaff().annualCmeTarget || 50;
    const diff = target - this.totalCreditsEarned();
    return diff > 0 ? diff : 0;
  });

  readonly progressPercent = computed(() => {
    const target = this.activeStaff().annualCmeTarget || 50;
    const pct = Math.round((this.totalCreditsEarned() / target) * 100);
    return pct > 100 ? 100 : pct;
  });

  readonly strokeOffset = computed(() => {
    const totalCircumference = 251.2;
    const pct = this.progressPercent();
    return totalCircumference - (totalCircumference * pct) / 100;
  });

  readonly cmeForm = new FormGroup({
    title: new FormControl('Advanced Robotic & Laparoscopic Hernia Surgery Masterclass', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<CmeCategory>('CADAVER_HANDS_ON_WORKSHOP', { nonNullable: true }),
    creditsEarned: new FormControl(8.0, { nonNullable: true, validators: [Validators.required, Validators.min(0.5)] }),
    completionDate: new FormControl('2026-10-06', { nonNullable: true, validators: [Validators.required] }),
    certificateNumber: new FormControl('RCST-HERNIA-2026-8812', { nonNullable: true, validators: [Validators.required] }),
    certificateIssuer: new FormControl('Royal College of Surgeons of Thailand', { nonNullable: true, validators: [Validators.required] })
  });

  previewCertificate(rec: CmeRecord) {
    this.selectedCertificate.set(rec);
  }

  submitCme() {
    if (this.cmeForm.invalid) return;
    const v = this.cmeForm.getRawValue();

    this.store.addCmeRecord({
      staffId: this.activeStaff().id,
      title: v.title,
      category: v.category,
      accreditingBody: 'ROYAL_COLLEGE_OF_SURGEONS',
      creditsEarned: v.creditsEarned,
      completionDate: v.completionDate,
      certificateNumber: v.certificateNumber,
      certificateIssuer: v.certificateIssuer,
      verificationStatus: 'ACCREDITED'
    });

    this.showAddModal.set(false);
  }
}
