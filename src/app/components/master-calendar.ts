import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';
import { ShiftType, ShiftAssignment } from '../types';
import { SHIFT_DEFINITIONS } from '../lib/mock-data';

@Component({
  selector: 'app-master-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Header Bar with View Controls & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1c2f] p-4 rounded-xl border border-white/10">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <mat-icon class="text-sky-400">calendar_month</mat-icon>
              Department Master Roster & Scheduler
            </h2>
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-400 border border-sky-500/30">
              {{ currentDepartment() }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Real-time multi-tier shift reconciliation with automated 8-hour rest-interval & JCI compliance validation.
          </p>
        </div>

        <!-- Controls: View Mode & Action Buttons -->
        <div class="flex items-center flex-wrap gap-2.5">
          <!-- View Mode Toggle -->
          <div class="flex bg-[#061426] p-1 rounded-lg border border-white/10">
            <button 
              (click)="viewMode.set('WEEK')"
              [class.bg-sky-500]="viewMode() === 'WEEK'"
              [class.text-white]="viewMode() === 'WEEK'"
              [class.text-slate-400]="viewMode() !== 'WEEK'"
              class="px-3 py-1 text-xs font-medium rounded transition-all"
            >
              Week Grid
            </button>
            <button 
              (click)="viewMode.set('MONTH')"
              [class.bg-sky-500]="viewMode() === 'MONTH'"
              [class.text-white]="viewMode() === 'MONTH'"
              [class.text-slate-400]="viewMode() !== 'MONTH'"
              class="px-3 py-1 text-xs font-medium rounded transition-all"
            >
              Month Matrix
            </button>
            <button 
              (click)="viewMode.set('GANTT')"
              [class.bg-sky-500]="viewMode() === 'GANTT'"
              [class.text-white]="viewMode() === 'GANTT'"
              [class.text-slate-400]="viewMode() !== 'GANTT'"
              class="px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1"
            >
              <mat-icon class="text-xs">view_timeline</mat-icon> Staff Gantt
            </button>
          </div>

          <!-- Add Shift Button (for supervisors/admin) -->
          @if (isSupervisorOrAdmin()) {
            <button 
              (click)="openAddShiftModal()"
              class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <mat-icon class="text-sm">add_circle</mat-icon> Assign Shift
            </button>
          }

          <!-- Shift Swap Request Button -->
          <button 
            (click)="openSwapModal()"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="text-sm text-amber-400">swap_horiz</mat-icon> Request Shift Swap
          </button>
        </div>
      </div>

      <!-- Live Conflict Detection Banner -->
      @if (conflicts().length > 0) {
        <div class="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200">
          <div class="flex items-center justify-between gap-2 font-bold text-rose-400 mb-2">
            <span class="flex items-center gap-2">
              <mat-icon class="text-rose-400 animate-pulse">warning</mat-icon>
              CRITICAL ROSTER CONFLICTS DETECTED ({{ conflicts().length }} VIOLATIONS)
            </span>
            <span class="text-[10px] uppercase tracking-wider bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              Mandatory Hospital Council Rules
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            @for (c of conflicts(); track c.id) {
              <div class="bg-rose-900/20 border border-rose-500/20 rounded p-2 flex items-start gap-2.5">
                <mat-icon class="text-rose-400 text-sm mt-0.5">error_outline</mat-icon>
                <div>
                  <div class="font-semibold text-rose-300">
                    {{ getStaffName(c.staffId) }} • {{ c.type.replace('_', ' ') }}
                  </div>
                  <div class="text-[11px] text-rose-200/80 mt-0.5">{{ c.description }}</div>
                  <div class="text-[10px] text-rose-400 mt-1 font-mono">Dates: {{ c.affectedDates.join(', ') }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Shift Type Legend -->
      <div class="flex flex-wrap items-center gap-3 bg-[#061426] p-3 rounded-xl border border-white/5 text-xs text-slate-400">
        <span class="font-semibold text-slate-300 flex items-center gap-1">
          <mat-icon class="text-xs text-slate-400">info</mat-icon> Standard Shift Codes:
        </span>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span>Morning (เวรเช้า 08:00 - 16:00)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-sky-500"></span>
          <span>Afternoon (เวรบ่าย 16:00 - 24:00)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-indigo-500"></span>
          <span>Night (เวรดึก 00:00 - 08:00)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-amber-500"></span>
          <span>On-Call Standby (เวรตามตัว 24h)</span>
        </div>
      </div>

      <!-- MAIN VIEW: 1. WEEK GRID VIEW -->
      @if (viewMode() === 'WEEK') {
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 overflow-hidden shadow-lg">
          <div class="grid grid-cols-7 border-b border-white/10 bg-[#132033]/80 text-center text-xs font-semibold text-slate-300">
            @for (day of weekDays; track day.dateStr) {
              <div 
                [class.bg-sky-500/10]="day.dateStr === '2026-10-07'"
                class="py-3 px-2 border-r border-white/10 last:border-r-0"
              >
                <div class="text-[11px] text-slate-400 uppercase tracking-wider">{{ day.name }}</div>
                <div 
                  [class.text-sky-400]="day.dateStr === '2026-10-07'"
                  [class.font-bold]="day.dateStr === '2026-10-07'"
                  class="text-sm mt-0.5 font-mono"
                >
                  {{ day.formatted }}
                </div>
                @if (day.dateStr === '2026-10-07') {
                  <span class="inline-block mt-1 px-1.5 py-0.2 bg-sky-500/20 text-sky-400 rounded text-[9px]">
                    Today
                  </span>
                }
              </div>
            }
          </div>

          <div class="grid grid-cols-7 min-h-[460px] divide-x divide-white/10">
            @for (day of weekDays; track day.dateStr) {
              <div 
                [class.bg-sky-950/15]="day.dateStr === '2026-10-07'"
                class="p-2 space-y-2.5 overflow-y-auto"
              >
                @let dayShifts = getShiftsForDate(day.dateStr);
                @if (dayShifts.length === 0) {
                  <div class="text-[11px] text-slate-600 text-center py-8 italic">
                    No shifts rostered
                  </div>
                }

                @for (shift of dayShifts; track shift.id) {
                  <div 
                    [class]="getShiftColorClass(shift.shiftType)"
                    class="rounded-lg p-2.5 text-xs border relative group transition-all hover:scale-[1.02]"
                  >
                    <!-- Header -->
                    <div class="flex items-center justify-between gap-1 mb-1.5">
                      <span class="font-bold tracking-tight text-[11px] flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="getShiftHex(shift.shiftType)"></span>
                        {{ shift.shiftType }}
                      </span>
                      <span class="text-[10px] opacity-80 font-mono">
                        {{ getShiftTime(shift.shiftType) }}
                      </span>
                    </div>

                    <!-- Clinician Name & Avatar -->
                    @let clinician = getClinician(shift.staffId);
                    <div class="flex items-center gap-2 my-1">
                      <img 
                        [src]="clinician?.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'" 
                        [alt]="clinician?.name || 'Staff'" 
                        class="w-5 h-5 rounded-full object-cover border border-white/20"
                      />
                      <div class="font-medium text-white truncate text-[11px]" [title]="clinician?.name || ''">
                        {{ clinician?.name }}
                      </div>
                    </div>

                    <!-- Role inside Shift -->
                    <div class="text-[10px] opacity-75 truncate">
                      {{ shift.roleInShift }}
                    </div>

                    <!-- Status Tags -->
                    <div class="mt-2 flex items-center justify-between">
                      @if (shift.status === 'SWAP_PENDING') {
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-semibold border border-amber-500/30">
                          Swap Pending
                        </span>
                      } @else if (shift.status === 'IN_PROGRESS') {
                        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                          Active Now
                        </span>
                      } @else {
                        <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]">
                          Scheduled
                        </span>
                      }

                      @if (isSupervisorOrAdmin()) {
                        <button 
                          (click)="removeShift(shift.id)"
                          class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 text-xs transition-opacity"
                          title="Remove shift"
                        >
                          <mat-icon class="text-xs">delete</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- MAIN VIEW: 2. GANTT VIEW -->
      @if (viewMode() === 'GANTT') {
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4 overflow-x-auto shadow-lg">
          <div class="min-w-[800px]">
            <!-- Gantt Header Days -->
            <div class="grid grid-cols-8 border-b border-white/10 pb-3 text-xs font-semibold text-slate-300">
              <div class="col-span-1 text-slate-400">Clinician Resource</div>
              @for (day of weekDays; track day.dateStr) {
                <div class="text-center">
                  <div>{{ day.name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ day.formatted }}</div>
                </div>
              }
            </div>

            <!-- Gantt Rows per Clinician -->
            <div class="divide-y divide-white/5">
              @for (staff of clinicians(); track staff.id) {
                <div class="grid grid-cols-8 py-3 items-center text-xs">
                  <!-- Staff Info -->
                  <div class="col-span-1 pr-2 flex items-center gap-2">
                    <img [src]="staff.avatarUrl" [alt]="staff.name" class="w-7 h-7 rounded-full object-cover border border-white/10" />
                    <div class="truncate">
                      <div class="font-medium text-slate-200 truncate" [title]="staff.name">{{ staff.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono">{{ staff.role }}</div>
                    </div>
                  </div>

                  <!-- 7 Day Slots for Staff -->
                  @for (day of weekDays; track day.dateStr) {
                    @let staffShift = getShiftForStaffAndDate(staff.id, day.dateStr);
                    <div class="px-1 text-center">
                      @if (staffShift) {
                        <div 
                          [class]="getShiftColorClass(staffShift.shiftType)"
                          class="py-1 px-1.5 rounded text-[10px] font-semibold border truncate"
                          [title]="staffShift.roleInShift + ' (' + staffShift.shiftType + ')'"
                        >
                          {{ staffShift.shiftType }}
                        </div>
                      } @else {
                        <span class="text-slate-700 text-xs">—</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- MAIN VIEW: 3. MONTH MATRIX VIEW -->
      @if (viewMode() === 'MONTH') {
        <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-4">
          <div class="text-center font-bold text-slate-200 mb-3 text-sm flex items-center justify-center gap-2">
            <mat-icon class="text-sky-400 text-sm">event</mat-icon> October 2026 - Master Operational Roster
          </div>
          <div class="grid grid-cols-7 gap-2">
            @for (d of monthDaysList; track d.dateStr) {
              <div 
                [class.bg-sky-950/20]="d.dateStr === '2026-10-07'"
                [class.border-sky-500/40]="d.dateStr === '2026-10-07'"
                class="min-h-[90px] bg-[#061426] border border-white/5 rounded-lg p-1.5 flex flex-col justify-between"
              >
                <div class="flex items-center justify-between text-[11px] font-mono">
                  <span [class.text-sky-400]="d.dateStr === '2026-10-07'" [class.font-bold]="d.dateStr === '2026-10-07'">
                    {{ d.dayNum }}
                  </span>
                  @if (d.dateStr === '2026-10-07') {
                    <span class="text-[8px] bg-sky-500 text-white px-1 rounded">Today</span>
                  }
                </div>
                <div class="space-y-1 mt-1">
                  @for (s of getShiftsForDate(d.dateStr); track s.id) {
                    <div 
                      [class]="getShiftColorClass(s.shiftType)"
                      class="text-[9px] px-1 py-0.5 rounded truncate font-medium border"
                    >
                      {{ s.shiftType.slice(0,3) }}: {{ getStaffLastName(s.staffId) }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Shift Swap & Cover Requests Panel -->
      <div class="bg-[#0e1c2f] rounded-xl border border-white/10 p-5 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-400">sync_alt</mat-icon>
            <h3 class="font-bold text-white text-sm">Inter-Staff Shift Swap & Coverage Requests</h3>
          </div>
          <span class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/10 font-mono">
            {{ shiftSwaps().length }} Requests Logged
          </span>
        </div>

        @if (shiftSwaps().length === 0) {
          <div class="text-xs text-slate-400 text-center py-4 italic">No pending shift swaps.</div>
        } @else {
          <div class="divide-y divide-white/5">
            @for (swap of shiftSwaps(); track swap.id) {
              <div class="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-200">
                      {{ getStaffName(swap.requestingStaffId) }}
                    </span>
                    <mat-icon class="text-xs text-slate-400">arrow_forward</mat-icon>
                    <span class="font-semibold text-slate-300">
                      {{ getStaffName(swap.targetStaffId) }}
                    </span>
                    <span 
                      [class.bg-amber-500/20]="swap.status === 'PENDING'"
                      [class.text-amber-400]="swap.status === 'PENDING'"
                      [class.border-amber-500/30]="swap.status === 'PENDING'"
                      [class.bg-emerald-500/20]="swap.status === 'APPROVED'"
                      [class.text-emerald-400]="swap.status === 'APPROVED'"
                      [class.border-emerald-500/30]="swap.status === 'APPROVED'"
                      [class.bg-rose-500/20]="swap.status === 'REJECTED'"
                      [class.text-rose-400]="swap.status === 'REJECTED'"
                      [class.border-rose-500/30]="swap.status === 'REJECTED'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase"
                    >
                      {{ swap.status }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-1">
                    Reason: <span class="italic text-slate-300">"{{ swap.reason }}"</span>
                  </div>
                  @if (swap.reviewedBy) {
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      Reviewed by {{ swap.reviewedBy }} • {{ swap.supervisorNotes }}
                    </div>
                  }
                </div>

                <!-- Supervisor Action Buttons for Pending Swaps -->
                @if (swap.status === 'PENDING' && isSupervisorOrAdmin()) {
                  <div class="flex items-center gap-2">
                    <button 
                      (click)="reviewSwap(swap.id, true)"
                      class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <mat-icon class="text-xs">check</mat-icon> Approve Swap
                    </button>
                    <button 
                      (click)="reviewSwap(swap.id, false)"
                      class="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <mat-icon class="text-xs">close</mat-icon> Reject
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- MODAL: ADD SHIFT ASSIGNMENT -->
      @if (showAddShiftModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <mat-icon class="text-sky-400">add_task</mat-icon> Assign Duty Shift
              </h3>
              <button (click)="showAddShiftModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="addShiftForm" (ngSubmit)="submitAddShift()" class="space-y-3 text-xs">
              <div>
                <label for="addShiftStaff" class="block text-slate-300 font-medium mb-1">Clinician / Staff Member</label>
                <select 
                  id="addShiftStaff"
                  formControlName="staffId"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  @for (c of clinicians(); track c.id) {
                    <option [value]="c.id">{{ c.name }} ({{ c.role }})</option>
                  }
                </select>
              </div>

              <div>
                <label for="addShiftDate" class="block text-slate-300 font-medium mb-1">Date</label>
                <input 
                  id="addShiftDate"
                  type="date"
                  formControlName="date"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label for="addShiftType" class="block text-slate-300 font-medium mb-1">Shift Type</label>
                <select 
                  id="addShiftType"
                  formControlName="shiftType"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="MORNING">Morning (เวรเช้า 08:00 - 16:00)</option>
                  <option value="AFTERNOON">Afternoon (เวรบ่าย 16:00 - 24:00)</option>
                  <option value="NIGHT">Night (เวรดึก 00:00 - 08:00)</option>
                  <option value="ON_CALL">On-Call Standby (เวรตามตัว 24h)</option>
                </select>
              </div>

              <div>
                <label for="addShiftRole" class="block text-slate-300 font-medium mb-1">Role / Assigned Duty in Shift</label>
                <input 
                  id="addShiftRole"
                  type="text"
                  formControlName="roleInShift"
                  placeholder="e.g. Lead OR Surgeon, Triage Supervisor"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button 
                  type="button"
                  (click)="showAddShiftModal.set(false)"
                  class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  [disabled]="addShiftForm.invalid"
                  class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                >
                  <mat-icon class="text-sm">save</mat-icon> Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: REQUEST SHIFT SWAP -->
      @if (showSwapModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div class="bg-[#0e1c2f] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="font-bold text-white text-base flex items-center gap-2">
                <mat-icon class="text-amber-400">swap_horiz</mat-icon> Request Shift Swap / Coverage
              </h3>
              <button (click)="showSwapModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <form [formGroup]="swapForm" (ngSubmit)="submitSwapRequest()" class="space-y-3 text-xs">
              <div>
                <label for="swapShiftSelect" class="block text-slate-300 font-medium mb-1">Select Your Shift to Swap</label>
                <select 
                  id="swapShiftSelect"
                  formControlName="shiftId"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  @for (s of myShifts(); track s.id) {
                    <option [value]="s.id">
                      {{ s.date }} • {{ s.shiftType }} ({{ s.roleInShift }})
                    </option>
                  }
                </select>
                @if (myShifts().length === 0) {
                  <p class="text-[11px] text-amber-400 mt-1">No scheduled shifts found for current staff identity.</p>
                }
              </div>

              <div>
                <label for="swapTargetStaff" class="block text-slate-300 font-medium mb-1">Request Coverage From Colleague</label>
                <select 
                  id="swapTargetStaff"
                  formControlName="targetStaffId"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  @for (c of otherClinicians(); track c.id) {
                    <option [value]="c.id">{{ c.name }} ({{ c.title }})</option>
                  }
                </select>
              </div>

              <div>
                <label for="swapReason" class="block text-slate-300 font-medium mb-1">Clinical / Personal Reason</label>
                <textarea 
                  id="swapReason"
                  formControlName="reason"
                  rows="3"
                  placeholder="e.g. Attending mandatory Surgical Royal College CME cadaveric symposium"
                  class="w-full bg-[#061426] border border-white/10 rounded-lg p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                ></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button 
                  type="button"
                  (click)="showSwapModal.set(false)"
                  class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  [disabled]="swapForm.invalid"
                  class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                >
                  <mat-icon class="text-sm">send</mat-icon> Dispatch Swap Request
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class MasterCalendar {
  private store = inject(HospitalStore);

  readonly viewMode = signal<'WEEK' | 'MONTH' | 'GANTT'>('WEEK');
  readonly showAddShiftModal = signal(false);
  readonly showSwapModal = signal(false);

  readonly shifts = this.store.shifts;
  readonly clinicians = this.store.clinicians;
  readonly shiftSwaps = this.store.shiftSwaps;
  readonly conflicts = this.store.shiftConflicts;
  readonly currentDepartment = this.store.currentDepartment;
  readonly currentRole = this.store.currentRole;
  readonly activeStaff = this.store.activeStaff;

  readonly isSupervisorOrAdmin = computed(() => {
    const role = this.currentRole();
    return role === 'SUPER_ADMIN' || role === 'HEAD_OF_SURGERY' || role === 'ATTENDING_PHYSICIAN';
  });

  readonly myShifts = computed(() => {
    const id = this.activeStaff().id;
    return this.shifts().filter(s => s.staffId === id);
  });

  readonly otherClinicians = computed(() => {
    const currentId = this.activeStaff().id;
    return this.clinicians().filter(c => c.id !== currentId);
  });

  readonly weekDays = [
    { name: 'Mon', formatted: 'Oct 05', dateStr: '2026-10-05' },
    { name: 'Tue', formatted: 'Oct 06', dateStr: '2026-10-06' },
    { name: 'Wed', formatted: 'Oct 07', dateStr: '2026-10-07' },
    { name: 'Thu', formatted: 'Oct 08', dateStr: '2026-10-08' },
    { name: 'Fri', formatted: 'Oct 09', dateStr: '2026-10-09' },
    { name: 'Sat', formatted: 'Oct 10', dateStr: '2026-10-10' },
    { name: 'Sun', formatted: 'Oct 11', dateStr: '2026-10-11' }
  ];

  readonly monthDaysList = Array.from({ length: 31 }, (_, i) => {
    const d = i + 1;
    const dateStr = `2026-10-${String(d).padStart(2, '0')}`;
    return { dayNum: d, dateStr };
  });

  // Reactive Forms
  readonly addShiftForm = new FormGroup({
    staffId: new FormControl('DOC-004', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl('2026-10-08', { nonNullable: true, validators: [Validators.required] }),
    shiftType: new FormControl<ShiftType>('MORNING', { nonNullable: true, validators: [Validators.required] }),
    roleInShift: new FormControl('Trauma Surgery Active Coverage', { nonNullable: true, validators: [Validators.required] })
  });

  readonly swapForm = new FormGroup({
    shiftId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    targetStaffId: new FormControl('DOC-005', { nonNullable: true, validators: [Validators.required] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] })
  });

  getShiftsForDate(dateStr: string): ShiftAssignment[] {
    return this.shifts().filter(s => s.date === dateStr);
  }

  getShiftForStaffAndDate(staffId: string, dateStr: string): ShiftAssignment | undefined {
    return this.shifts().find(s => s.staffId === staffId && s.date === dateStr);
  }

  getClinician(staffId: string) {
    return this.clinicians().find(c => c.id === staffId);
  }

  getStaffName(staffId: string): string {
    const c = this.getClinician(staffId);
    return c ? c.name : staffId;
  }

  getStaffLastName(staffId: string): string {
    const name = this.getStaffName(staffId);
    const parts = name.split(' ');
    return parts[parts.length - 1] || name;
  }

  getShiftColorClass(type: ShiftType): string {
    return SHIFT_DEFINITIONS[type]?.badgeClass || 'bg-slate-800 text-slate-300';
  }

  getShiftHex(type: ShiftType): string {
    return SHIFT_DEFINITIONS[type]?.colorHex || '#94a3b8';
  }

  getShiftTime(type: ShiftType): string {
    const def = SHIFT_DEFINITIONS[type];
    return def ? `${def.startTime}-${def.endTime}` : '';
  }

  openAddShiftModal() {
    this.addShiftForm.patchValue({
      staffId: this.clinicians()[0]?.id || 'DOC-004',
      date: '2026-10-08',
      shiftType: 'MORNING',
      roleInShift: 'Specialty Coverage'
    });
    this.showAddShiftModal.set(true);
  }

  submitAddShift() {
    if (this.addShiftForm.invalid) return;
    const v = this.addShiftForm.getRawValue();
    this.store.addShiftAssignment({
      staffId: v.staffId,
      department: this.currentDepartment(),
      date: v.date,
      shiftType: v.shiftType,
      roleInShift: v.roleInShift,
      status: 'SCHEDULED'
    });
    this.showAddShiftModal.set(false);
  }

  removeShift(id: string) {
    this.store.deleteShiftAssignment(id);
  }

  openSwapModal() {
    const mine = this.myShifts();
    if (mine.length > 0) {
      this.swapForm.patchValue({
        shiftId: mine[0].id,
        targetStaffId: this.otherClinicians()[0]?.id || 'DOC-005',
        reason: 'Academic CME Conference Attendance'
      });
    }
    this.showSwapModal.set(true);
  }

  submitSwapRequest() {
    if (this.swapForm.invalid) return;
    const v = this.swapForm.getRawValue();
    this.store.requestShiftSwap(v.shiftId, v.targetStaffId, v.reason);
    this.showSwapModal.set(false);
  }

  reviewSwap(swapId: string, approved: boolean) {
    this.store.reviewShiftSwap(swapId, approved, approved ? 'Endorsed by Clinical Supervisor' : 'Denied due to staffing quotas');
  }
}
