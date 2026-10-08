import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';
import { 
  ProcedureRecord, 
  OperatorRole, 
  AnesthesiaType, 
  ClavienDindoGrade 
} from '../types';
import { ICD_PROCEDURES_CATALOG } from '../lib/mock-data';

@Component({
  selector: 'app-procedure-logger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Section Header & Filter Controls -->
      <div class="bg-[#0e1c2f] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <mat-icon class="text-sky-400">medical_services</mat-icon>
            Comprehensive Clinical & Surgical Procedure Logger (หัตถการ & เคสผ่าตัด)
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            ICD-9/10 standardized logging, Clavien-Dindo complication stratification & cryptographic supervisor endorsement.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Log Procedure Button -->
          <button 
            (click)="openModal()"
            class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-950/50 transition-colors"
          >
            <mat-icon class="text-sm">add_circle</mat-icon> LOG NEW PROCEDURE CASE
          </button>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0e1c2f] p-3.5 rounded-xl border border-white/10 text-xs">
        <!-- Search Input -->
        <div class="relative md:col-span-1">
          <mat-icon class="absolute left-2.5 top-2.5 text-slate-400 text-sm">search</mat-icon>
          <input 
            type="text"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            placeholder="Search procedure, ICD code, patient HN..."
            class="w-full bg-[#061426] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <!-- Role Filter -->
        <div>
          <select 
            [value]="roleFilter()"
            (change)="roleFilter.set($any($event.target).value)"
            class="w-full bg-[#061426] border border-white/10 rounded-lg p-2 text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Operator Roles</option>
            <option value="PRIMARY_SURGEON">Primary Surgeon (แพทย์ผู้ผ่าตัดหลัก)</option>
            <option value="FIRST_ASSISTANT">1st Assistant (ผู้ช่วยผ่าตัดที่ 1)</option>
            <option value="SECOND_ASSISTANT">2nd Assistant</option>
            <option value="OBSERVER_TRAINEE">Observer / Trainee</option>
          </select>
        </div>

        <!-- Endorsement Status Filter -->
        <div>
          <select 
            [value]="endorsementFilter()"
            (change)="endorsementFilter.set($any($event.target).value)"
            class="w-full bg-[#061426] border border-white/10 rounded-lg p-2 text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Endorsement Statuses</option>
            <option value="PENDING_REVIEW">Pending Supervisor Review</option>
            <option value="APPROVED">Supervisor Approved</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
          </select>
        </div>

        <!-- Complication Filter -->
        <div>
          <select 
            [value]="complicationFilter()"
            (change)="complicationFilter.set($any($event.target).value)"
            class="w-full bg-[#061426] border border-white/10 rounded-lg p-2 text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Complication Outcomes</option>
            <option value="NONE">Uncomplicated (None)</option>
            <option value="COMPLICATION">Any Complication (Clavien-Dindo I-V)</option>
          </select>
        </div>
      </div>

      <!-- Procedure Logbook Table -->
      <div class="bg-[#0e1c2f] rounded-xl border border-white/10 shadow-xl overflow-hidden">
        <div class="p-3 bg-[#132033]/70 border-b border-white/10 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white uppercase tracking-wider text-[11px]">Procedural Logbook Records</span>
            <span class="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-mono text-[10px] border border-sky-500/30">
              {{ filteredProcedures().length }} Entries
            </span>
          </div>
          <div class="text-[11px] text-slate-400">
            *Patient Identifiers masked in compliance with Thailand PDPA Section 26
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-[#061426]/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th class="py-2.5 px-3">Case ID</th>
                <th class="py-2.5 px-3">Date & OR</th>
                <th class="py-2.5 px-3">Patient HN</th>
                <th class="py-2.5 px-3">Procedure & ICD-9/10</th>
                <th class="py-2.5 px-3">Role</th>
                <th class="py-2.5 px-3">EBL / Time</th>
                <th class="py-2.5 px-3">Complication</th>
                <th class="py-2.5 px-3">Supervisor Endorsement</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-normal">
              @if (filteredProcedures().length === 0) {
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-500 italic">
                    No clinical cases matching selected criteria.
                  </td>
                </tr>
              }

              @for (proc of filteredProcedures(); track proc.id) {
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="py-3 px-3 font-mono font-bold text-sky-400">
                    {{ proc.caseNumber }}
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-mono text-slate-300">{{ proc.procedureDate }}</div>
                    <div class="text-[10px] text-slate-400">{{ proc.orRoom }}</div>
                  </td>
                  <td class="py-3 px-3 font-mono text-slate-300">
                    <div>{{ proc.patientHnMasked }}</div>
                    <div class="text-[10px] text-slate-400">{{ proc.patientAge }}y • {{ proc.patientGender }}</div>
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-medium text-white flex items-center gap-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-[10px] border border-sky-500/30 font-bold">
                        {{ proc.procedureCode }}
                      </span>
                      <span>{{ proc.procedureName }}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      Dx: {{ proc.diagnosisCode }} - {{ proc.diagnosisName }}
                    </div>
                  </td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-white/5">
                      {{ proc.operatorRole.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono text-slate-300">
                    <div>{{ proc.estimatedBloodLossMl }} mL</div>
                    <div class="text-[10px] text-slate-400">{{ proc.durationMinutes }} mins</div>
                  </td>
                  <td class="py-3 px-3">
                    @if (proc.complicationSeverity === 'NONE') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        None
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {{ proc.complicationSeverity.replace('GRADE_', 'Gr.') }}
                      </span>
                    }
                  </td>
                  <td class="py-3 px-3">
                    @if (proc.supervisorEndorsement.status === 'APPROVED') {
                      <div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <mat-icon class="text-xs">verified</mat-icon> APPROVED
                        </span>
                        <div class="text-[9px] text-slate-400 mt-0.5 truncate max-w-[140px]" [title]="proc.supervisorEndorsement.reviewedBy || ''">
                          {{ proc.supervisorEndorsement.reviewedBy }}
                        </div>
                      </div>
                    } @else if (proc.supervisorEndorsement.status === 'PENDING_REVIEW') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit animate-pulse">
                        <mat-icon class="text-xs">hourglass_empty</mat-icon> PENDING REVIEW
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 w-fit">
                        REVISION REQ.
                      </span>
                    }
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        (click)="selectProcedure(proc)"
                        class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded text-[11px] font-medium transition-colors"
                      >
                        Details
                      </button>

                      <!-- Quick Endorse Button for Attending / Head -->
                      @if (proc.supervisorEndorsement.status === 'PENDING_REVIEW' && isSupervisor()) {
                        <button 
                          (click)="quickEndorse(proc.id)"
                          class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Sign with supervisor credential"
                        >
                          <mat-icon class="text-xs">draw</mat-icon> Sign
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- PROCEDURE DETAIL SLIDEOVER / MODAL -->
      @if (selectedProc()) {
        @let p = selectedProc()!;
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div class="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold text-white font-mono">{{ p.caseNumber }}</span>
                  <span class="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30 font-mono text-xs">
                    {{ p.procedureCode }}
                  </span>
                </div>
                <h3 class="text-base font-semibold text-sky-300 mt-1">{{ p.procedureName }}</h3>
              </div>
              <button (click)="selectedProc.set(null)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#061426] p-3 rounded-lg border border-white/5">
              <div>
                <span class="text-slate-400 block">Patient HN</span>
                <span class="font-mono font-bold text-slate-200">{{ p.patientHnMasked }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Age / Gender</span>
                <span class="text-slate-200">{{ p.patientAge }} yrs • {{ p.patientGender }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Theater & Time</span>
                <span class="text-slate-200">{{ p.orRoom }} ({{ p.durationMinutes }}m)</span>
              </div>
              <div>
                <span class="text-slate-400 block">Estimated Blood Loss</span>
                <span class="font-bold text-amber-400 font-mono">{{ p.estimatedBloodLossMl }} mL</span>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Pre/Post-Operative Diagnosis</span>
                <p class="text-slate-200 font-mono mt-0.5">{{ p.diagnosisCode }} - {{ p.diagnosisName }}</p>
              </div>

              <div>
                <span class="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Operative Findings & Surgical Technique</span>
                <div class="bg-[#061426] p-3 rounded border border-white/5 text-slate-300 font-mono text-[11px] whitespace-pre-wrap mt-1 leading-relaxed">
                  {{ p.surgicalNotes }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="bg-[#061426] p-2.5 rounded border border-white/5">
                  <span class="text-slate-400 text-[10px] block uppercase">Anesthesia Modality</span>
                  <span class="font-semibold text-slate-200">{{ p.anesthesiaType.replace('_', ' ') }}</span>
                </div>
                <div class="bg-[#061426] p-2.5 rounded border border-white/5">
                  <span class="text-slate-400 text-[10px] block uppercase">Complication Stratification</span>
                  <span class="font-semibold" [class.text-emerald-400]="p.complicationSeverity === 'NONE'" [class.text-amber-400]="p.complicationSeverity !== 'NONE'">
                    {{ p.complicationSeverity }} {{ p.complicationNotes ? '• ' + p.complicationNotes : '' }}
                  </span>
                </div>
              </div>

              <!-- Supervisor Endorsement Section -->
              <div class="p-4 rounded-xl border border-sky-500/20 bg-sky-950/20 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                    <mat-icon class="text-sm">verified</mat-icon> Digital Supervisor Endorsement Record
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase"
                    [class.bg-emerald-500/20]="p.supervisorEndorsement.status === 'APPROVED'"
                    [class.text-emerald-400]="p.supervisorEndorsement.status === 'APPROVED'"
                    [class.border-emerald-500/30]="p.supervisorEndorsement.status === 'APPROVED'"
                    [class.bg-amber-500/20]="p.supervisorEndorsement.status === 'PENDING_REVIEW'"
                    [class.text-amber-400]="p.supervisorEndorsement.status === 'PENDING_REVIEW'"
                    [class.border-amber-500/30]="p.supervisorEndorsement.status === 'PENDING_REVIEW'"
                  >
                    {{ p.supervisorEndorsement.status }}
                  </span>
                </div>

                @if (p.supervisorEndorsement.status === 'APPROVED') {
                  <div class="text-[11px] text-slate-300 space-y-1">
                    <div>Attending Signer: <strong>{{ p.supervisorEndorsement.reviewedBy }}</strong></div>
                    <div class="text-slate-400">Timestamp: {{ p.supervisorEndorsement.timestamp }}</div>
                    @if (p.supervisorEndorsement.feedbackNotes) {
                      <div class="text-emerald-300 italic">"{{ p.supervisorEndorsement.feedbackNotes }}"</div>
                    }
                    <div class="text-[9px] font-mono text-slate-500 truncate">
                      Cryptographic Hash: {{ p.supervisorEndorsement.digitalSignatureHash }}
                    </div>
                  </div>
                } @else if (isSupervisor()) {
                  <div class="pt-2 border-t border-sky-500/20 space-y-2">
                    <label for="supFeedbackInput" class="block text-[11px] text-slate-300">Supervisor Clinical Feedback:</label>
                    <input 
                      #feedbackInput
                      id="supFeedbackInput"
                      type="text" 
                      placeholder="e.g. Good anatomical exposure and suture tension" 
                      class="w-full bg-[#061426] border border-white/10 rounded p-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                    <div class="flex justify-end gap-2 pt-1">
                      <button 
                        (click)="rejectProcedure(p.id, feedbackInput.value)"
                        class="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded text-xs font-semibold"
                      >
                        Request Revision
                      </button>
                      <button 
                        (click)="endorseProcedure(p.id, feedbackInput.value)"
                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <mat-icon class="text-xs">check</mat-icon> Sign & Approve
                      </button>
                    </div>
                  </div>
                } @else {
                  <p class="text-[11px] text-amber-400 italic">
                    Awaiting digital review from assigned attending surgeon (Prof. Dr. Somchai or Assoc. Prof. Natthawut).
                  </p>
                }
              </div>
            </div>

            <div class="flex justify-end pt-3 border-t border-white/10">
              <button 
                (click)="selectedProc.set(null)"
                class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: MULTI-STEP LOG NEW PROCEDURE -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <!-- Modal Header with Steps Indicator -->
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="font-bold text-white text-base flex items-center gap-2">
                  <mat-icon class="text-sky-400">add_task</mat-icon> Log Clinical Procedure Case
                </h3>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                  <span [class.text-sky-400]="formStep() === 1" [class.font-bold]="formStep() === 1">1. Patient & OR</span>
                  <span>→</span>
                  <span [class.text-sky-400]="formStep() === 2" [class.font-bold]="formStep() === 2">2. ICD-10 Selection</span>
                  <span>→</span>
                  <span [class.text-sky-400]="formStep() === 3" [class.font-bold]="formStep() === 3">3. Operative & Endorsement</span>
                </div>
              </div>
              <button (click)="showModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="procForm" (ngSubmit)="submitProcedure()" class="space-y-4 text-xs">
              <!-- STEP 1: PATIENT & OR METADATA -->
              @if (formStep() === 1) {
                <div class="space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label for="procPatientHn" class="block text-slate-300 font-medium mb-1">Patient Hospital Number (HN Masked)</label>
                      <input 
                        id="procPatientHn"
                        type="text"
                        formControlName="patientHnMasked"
                        placeholder="HN-892-***4 (PDPA format)"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label for="procPatientAge" class="block text-slate-300 font-medium mb-1">Age</label>
                        <input 
                          id="procPatientAge"
                          type="number"
                          formControlName="patientAge"
                          class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="procPatientGender" class="block text-slate-300 font-medium mb-1">Gender</label>
                        <select 
                          id="procPatientGender"
                          formControlName="patientGender"
                          class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label for="procDate" class="block text-slate-300 font-medium mb-1">Procedure Date</label>
                      <input 
                        id="procDate"
                        type="date"
                        formControlName="procedureDate"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label for="procOrRoom" class="block text-slate-300 font-medium mb-1">Operating Theater Suite</label>
                      <select 
                        id="procOrRoom"
                        formControlName="orRoom"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="OR Suite 1 (Hybrid Suite)">OR Suite 1 (Hybrid Suite)</option>
                        <option value="OR Suite 2 (Emergency Trauma)">OR Suite 2 (Emergency Trauma)</option>
                        <option value="OR Suite 3 (General Laparoscopy)">OR Suite 3 (General Laparoscopy)</option>
                        <option value="OR Suite 4 (Lap Tower Alpha)">OR Suite 4 (Lap Tower Alpha)</option>
                        <option value="OR Suite 5 (Day Surgery)">OR Suite 5 (Day Surgery)</option>
                        <option value="Bedside Surgical ICU">Bedside Surgical ICU</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="procStartTime" class="block text-slate-300 font-medium mb-1">Start Time</label>
                      <input 
                        id="procStartTime"
                        type="time"
                        formControlName="startTime"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label for="procEndTime" class="block text-slate-300 font-medium mb-1">End Time</label>
                      <input 
                        id="procEndTime"
                        type="time"
                        formControlName="endTime"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="flex justify-end pt-3">
                    <button 
                      type="button"
                      (click)="formStep.set(2)"
                      class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      Next: ICD-10 Selection <mat-icon class="text-sm">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <!-- STEP 2: ICD-10 & OPERATIVE ROLE -->
              @if (formStep() === 2) {
                <div class="space-y-3">
                  <div>
                    <label for="procIndexSelect" class="block text-slate-300 font-medium mb-1">Select Procedure from ICD-9 / ICD-10 Catalog</label>
                    <select 
                      id="procIndexSelect"
                      formControlName="procedureIndex"
                      (change)="onIcdSelect($any($event.target).value)"
                      class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      @for (icd of icdCatalog; track icd.code; let idx = $index) {
                        <option [value]="idx">
                          {{ icd.code }} - {{ icd.name }} (Dx: {{ icd.icd10DxCode }})
                        </option>
                      }
                    </select>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label for="procOpRole" class="block text-slate-300 font-medium mb-1">Your Operator Role</label>
                      <select 
                        id="procOpRole"
                        formControlName="operatorRole"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="PRIMARY_SURGEON">Primary Surgeon (แพทย์ผู้ผ่าตัดหลัก)</option>
                        <option value="FIRST_ASSISTANT">1st Assistant (ผู้ช่วยผ่าตัดที่ 1)</option>
                        <option value="SECOND_ASSISTANT">2nd Assistant</option>
                        <option value="OBSERVER_TRAINEE">Observer / Trainee</option>
                      </select>
                    </div>

                    <div>
                      <label for="procSupervisorSelect" class="block text-slate-300 font-medium mb-1">Assigned Supervising Attending</label>
                      <select 
                        id="procSupervisorSelect"
                        formControlName="supervisorId"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="DOC-002">Prof. Dr. Somchai Prasertsuk, MD, FRCST</option>
                        <option value="DOC-003">Assoc. Prof. Dr. Natthawut Siripong, MD</option>
                        <option value="DOC-001">Prof. Dr. Kittisak Chaiyaporn, MD, FRCS</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label for="procAnesthesiaType" class="block text-slate-300 font-medium mb-1">Anesthesia Type</label>
                      <select 
                        id="procAnesthesiaType"
                        formControlName="anesthesiaType"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="GENERAL_ANESTHESIA">General Anesthesia (GA)</option>
                        <option value="SPINAL_BLOCK">Spinal Block</option>
                        <option value="EPIDURAL">Epidural Anesthesia</option>
                        <option value="REGIONAL_NERVE_BLOCK">Regional Nerve Block</option>
                        <option value="LOCAL_INFILTRATION">Local Infiltration</option>
                        <option value="MONITORED_ANESTHESIA_CARE">Monitored Anesthesia Care (MAC)</option>
                      </select>
                    </div>

                    <div>
                      <label for="procEbl" class="block text-slate-300 font-medium mb-1">Estimated Blood Loss (mL)</label>
                      <input 
                        id="procEbl"
                        type="number"
                        formControlName="estimatedBloodLossMl"
                        class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div class="flex justify-between pt-3">
                    <button 
                      type="button"
                      (click)="formStep.set(1)"
                      class="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-lg"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      (click)="formStep.set(3)"
                      class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      Next: Notes & Complications <mat-icon class="text-sm">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <!-- STEP 3: COMPLICATIONS & SURGICAL NOTES -->
              @if (formStep() === 3) {
                <div class="space-y-3">
                  <div>
                    <label for="procComplicationSelect" class="block text-slate-300 font-medium mb-1">Complication Classification (Clavien-Dindo)</label>
                    <select 
                      id="procComplicationSelect"
                      formControlName="complicationSeverity"
                      class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="NONE">None - Uncomplicated Procedure</option>
                      <option value="GRADE_I">Grade I - Any deviation, antiemetics/analgesics allowed</option>
                      <option value="GRADE_II">Grade II - Requiring pharmacological treatments (antibiotics, blood transfusion)</option>
                      <option value="GRADE_III_A">Grade III-a - Intervention not under GA</option>
                      <option value="GRADE_III_B">Grade III-b - Intervention under general anesthesia</option>
                      <option value="GRADE_IV_A">Grade IV-a - Single organ dysfunction (ICU)</option>
                      <option value="GRADE_IV_B">Grade IV-b - Multi-organ dysfunction</option>
                      <option value="GRADE_V">Grade V - Death</option>
                    </select>
                  </div>

                  <div>
                    <label for="procSurgicalNotes" class="block text-slate-300 font-medium mb-1">Operative Technique & Surgical Findings</label>
                    <textarea 
                      id="procSurgicalNotes"
                      formControlName="surgicalNotes"
                      rows="4"
                      placeholder="Detailed operative technique, incision, findings, anatomical variations, and closure..."
                      class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none font-mono text-[11px]"
                    ></textarea>
                  </div>

                  <div class="flex items-center gap-2 p-2.5 bg-[#061426] rounded-lg border border-white/5">
                    <input 
                      type="checkbox"
                      formControlName="pdpaConsentVerified"
                      id="pdpaConsent"
                      class="rounded text-sky-500 focus:ring-0"
                    />
                    <label for="pdpaConsent" class="text-[11px] text-slate-300">
                      I certify that patient identifiers have been masked in accordance with Thailand PDPA and hospital accreditation standards.
                    </label>
                  </div>

                  <div class="flex justify-between pt-3 border-t border-white/10">
                    <button 
                      type="button"
                      (click)="formStep.set(2)"
                      class="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-lg"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      [disabled]="procForm.invalid"
                      class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg"
                    >
                      <mat-icon class="text-sm">verified</mat-icon> Submit for Supervisor Endorsement
                    </button>
                  </div>
                </div>
              }
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProcedureLogger {
  private store = inject(HospitalStore);

  readonly procedures = this.store.procedures;
  readonly activeStaff = this.store.activeStaff;
  readonly currentRole = this.store.currentRole;
  readonly currentDepartment = this.store.currentDepartment;

  readonly icdCatalog = ICD_PROCEDURES_CATALOG;

  readonly showModal = signal(false);
  readonly formStep = signal(1);
  readonly selectedProc = signal<ProcedureRecord | null>(null);

  // Filter signals
  readonly searchQuery = signal('');
  readonly roleFilter = signal('ALL');
  readonly endorsementFilter = signal('ALL');
  readonly complicationFilter = signal('ALL');

  readonly isSupervisor = computed(() => {
    const role = this.currentRole();
    return role === 'ATTENDING_PHYSICIAN' || role === 'HEAD_OF_SURGERY' || role === 'SUPER_ADMIN';
  });

  // Filtered procedures computed
  readonly filteredProcedures = computed(() => {
    const list = this.procedures();
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const endo = this.endorsementFilter();
    const comp = this.complicationFilter();

    return list.filter(p => {
      // Query filter
      if (q) {
        const matchesQ = 
          p.caseNumber.toLowerCase().includes(q) ||
          p.procedureName.toLowerCase().includes(q) ||
          p.procedureCode.toLowerCase().includes(q) ||
          p.patientHnMasked.toLowerCase().includes(q) ||
          p.diagnosisName.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // Role filter
      if (role !== 'ALL' && p.operatorRole !== role) return false;

      // Endorsement filter
      if (endo !== 'ALL' && p.supervisorEndorsement.status !== endo) return false;

      // Complication filter
      if (comp === 'NONE' && p.complicationSeverity !== 'NONE') return false;
      if (comp === 'COMPLICATION' && p.complicationSeverity === 'NONE') return false;

      return true;
    });
  });

  // Reactive Form
  readonly procForm = new FormGroup({
    patientHnMasked: new FormControl('HN-642-***7', { nonNullable: true, validators: [Validators.required] }),
    patientAge: new FormControl(38, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    patientGender: new FormControl<'M' | 'F' | 'OTHER'>('F', { nonNullable: true }),
    procedureDate: new FormControl('2026-10-07', { nonNullable: true, validators: [Validators.required] }),
    startTime: new FormControl('10:00', { nonNullable: true, validators: [Validators.required] }),
    endTime: new FormControl('11:20', { nonNullable: true, validators: [Validators.required] }),
    orRoom: new FormControl('OR Suite 3 (General Laparoscopy)', { nonNullable: true, validators: [Validators.required] }),
    procedureIndex: new FormControl(0, { nonNullable: true }),
    operatorRole: new FormControl<OperatorRole>('PRIMARY_SURGEON', { nonNullable: true }),
    supervisorId: new FormControl('DOC-003', { nonNullable: true, validators: [Validators.required] }),
    anesthesiaType: new FormControl<AnesthesiaType>('GENERAL_ANESTHESIA', { nonNullable: true }),
    estimatedBloodLossMl: new FormControl(20, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    complicationSeverity: new FormControl<ClavienDindoGrade>('NONE', { nonNullable: true }),
    surgicalNotes: new FormControl(
      'Clean dissection planes identified. Critical View of Safety (CVS) achieved. Hemostasis verified under 12 mmHg pneumoperitoneum.', 
      { nonNullable: true, validators: [Validators.required] }
    ),
    pdpaConsentVerified: new FormControl(true, { nonNullable: true, validators: [Validators.requiredTrue] })
  });

  openModal(preselectedIcdCode?: string) {
    let idx = 0;
    if (preselectedIcdCode) {
      const foundIdx = this.icdCatalog.findIndex(i => i.code === preselectedIcdCode);
      if (foundIdx >= 0) idx = foundIdx;
    }

    this.procForm.patchValue({
      procedureIndex: idx,
      procedureDate: '2026-10-07',
      operatorRole: 'PRIMARY_SURGEON',
      supervisorId: 'DOC-003',
      estimatedBloodLossMl: 25,
      complicationSeverity: 'NONE',
      pdpaConsentVerified: true
    });

    this.formStep.set(1);
    this.showModal.set(true);
  }

  onIcdSelect(idxStr: string) {
    const idx = Number(idxStr);
    const cat = this.icdCatalog[idx];
    if (cat) {
      this.procForm.patchValue({
        surgicalNotes: `Standard technique performed for ${cat.name}. Indication: ${cat.icd10DxName}. Hemostasis achieved without complication.`
      });
    }
  }

  selectProcedure(proc: ProcedureRecord) {
    this.selectedProc.set(proc);
  }

  quickEndorse(id: string) {
    this.store.endorseProcedure(
      id, 
      'APPROVED', 
      'Surgical case reviewed and verified for logbook accreditation.', 
      this.activeStaff().name
    );
  }

  endorseProcedure(id: string, notes?: string) {
    this.store.endorseProcedure(id, 'APPROVED', notes || 'Approved by supervisor', this.activeStaff().name);
    this.selectedProc.set(null);
  }

  rejectProcedure(id: string, notes?: string) {
    this.store.endorseProcedure(id, 'REVISION_REQUIRED', notes || 'Please revise operative findings description', this.activeStaff().name);
    this.selectedProc.set(null);
  }

  submitProcedure() {
    if (this.procForm.invalid) return;

    const v = this.procForm.getRawValue();
    const icd = this.icdCatalog[v.procedureIndex] || this.icdCatalog[0];

    const [sH, sM] = v.startTime.split(':').map(Number);
    const [eH, eM] = v.endTime.split(':').map(Number);
    let dur = (eH * 60 + eM) - (sH * 60 + sM);
    if (dur <= 0) dur = icd.avgDurationMin || 75;

    this.store.addProcedure({
      patientHnMasked: v.patientHnMasked,
      patientAge: v.patientAge,
      patientGender: v.patientGender,
      procedureDate: v.procedureDate,
      startTime: v.startTime,
      endTime: v.endTime,
      durationMinutes: dur,
      orRoom: v.orRoom,
      department: this.currentDepartment(),
      procedureCode: icd.code,
      procedureName: icd.name,
      diagnosisCode: icd.icd10DxCode,
      diagnosisName: icd.icd10DxName,
      operatorRole: v.operatorRole,
      surgeonId: this.activeStaff().id,
      supervisorId: v.supervisorId,
      anesthesiologistId: 'DOC-006',
      scrubNurseId: 'NURSE-001',
      anesthesiaType: v.anesthesiaType,
      estimatedBloodLossMl: v.estimatedBloodLossMl,
      specimenSent: true,
      implantUsed: false,
      complicationSeverity: v.complicationSeverity,
      complicationNotes: v.complicationSeverity !== 'NONE' ? 'Mild event noted and documented' : undefined,
      supervisorEndorsement: {
        status: 'PENDING_REVIEW'
      },
      pdpaConsentVerified: v.pdpaConsentVerified,
      surgicalNotes: v.surgicalNotes
    });

    this.showModal.set(false);
  }
}
