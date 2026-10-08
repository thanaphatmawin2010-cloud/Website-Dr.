import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HospitalStore } from '../services/hospital-store';
import { UserRole, HospitalDepartment } from '../types';
import { MasterCalendar } from './master-calendar';
import { ProcedureLogger } from './procedure-logger';
import { AttendanceWidget } from './attendance-widget';
import { CmeTracker } from './cme-tracker';
import { AuditReporting } from './audit-reporting';
import { CommandBar } from './command-bar';

@Component({
  selector: 'app-hospital-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MasterCalendar,
    ProcedureLogger,
    AttendanceWidget,
    CmeTracker,
    AuditReporting,
    CommandBar
  ],
  template: `
    <div class="min-h-screen bg-[#061426] text-[#d6e3fe] flex flex-col font-sans">
      <!-- GLOBAL TOP HEADER -->
      <header class="h-16 bg-[#0e1c2f] border-b border-white/10 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <!-- Left: Logo & Mobile Hamburger -->
        <div class="flex items-center gap-3">
          <button 
            (click)="sidebarOpen.set(!sidebarOpen())"
            class="md:hidden text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <mat-icon>{{ sidebarOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>

          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold">
              <mat-icon class="text-xl">local_hospital</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base tracking-tight text-white">AEGIS<span class="text-sky-400 font-semibold">HIS</span></span>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  JCI ACCREDITED
                </span>
              </div>
              <div class="text-[10px] text-slate-400 hidden sm:block">Clinical Operations & Credentialing Suite</div>
            </div>
          </div>
        </div>

        <!-- Center: Quick Command Palette Trigger -->
        <div class="hidden sm:flex items-center max-w-md w-full mx-4">
          <button 
            (click)="openCommandBar()"
            class="w-full bg-[#061426] hover:bg-[#132033] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 flex items-center justify-between transition-colors shadow-inner"
          >
            <span class="flex items-center gap-2">
              <mat-icon class="text-sm text-sky-400">search</mat-icon>
              <span>Quick search ICD codes, staff, or commands...</span>
            </span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-white/5 font-mono">⌘K</span>
          </button>
        </div>

        <!-- Right: Duty Status, Notifications & Clinician Profile -->
        <div class="flex items-center gap-2.5">
          <!-- Quick Duty Punch from Navbar -->
          @if (activeSession()) {
            <button 
              (click)="navigateTo('attendance')"
              class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="hidden sm:inline">On Duty:</span>
              <span class="font-mono">{{ activeSession()?.clockInTime }}</span>
            </button>
          } @else {
            <button 
              (click)="quickClockIn()"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <mat-icon class="text-xs text-sky-400">fingerprint</mat-icon>
              <span class="hidden sm:inline">Clock In</span>
            </button>
          }

          <!-- Notifications Bell Dropdown -->
          <div class="relative">
            <button 
              (click)="notifDropdownOpen.set(!notifDropdownOpen())"
              class="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Notifications"
            >
              <mat-icon class="text-sm">notifications</mat-icon>
              @if (notifications().length > 0) {
                <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
              }
            </button>

            <!-- Notification Flyout -->
            @if (notifDropdownOpen()) {
              <div class="absolute right-0 mt-2 w-80 bg-[#0e1c2f] border border-white/10 rounded-xl shadow-2xl z-50 p-3 space-y-2 text-xs">
                <div class="flex items-center justify-between pb-2 border-b border-white/10 font-bold text-white">
                  <span>Clinical Notifications</span>
                  <button (click)="clearNotifications()" class="text-[10px] text-slate-400 hover:text-white">Clear</button>
                </div>
                <div class="max-h-64 overflow-y-auto space-y-2">
                  @if (notifications().length === 0) {
                    <p class="text-slate-400 text-center py-3">No new notifications</p>
                  }
                  @for (n of notifications(); track n.id) {
                    <div class="p-2 rounded bg-[#061426] border border-white/5 space-y-0.5">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-200">{{ n.title }}</span>
                        <span class="text-[10px] text-slate-500">{{ n.timestamp }}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 leading-snug">{{ n.message }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Active Clinician Pill -->
          <div class="flex items-center gap-2 pl-2 border-l border-white/10">
            <img 
              [src]="activeStaff().avatarUrl" 
              [alt]="activeStaff().name"
              class="w-8 h-8 rounded-full object-cover border border-sky-400/40"
            />
            <div class="hidden lg:block text-left text-xs">
              <div class="font-bold text-white truncate max-w-[130px]">{{ activeStaff().name }}</div>
              <div class="text-[10px] text-sky-400 font-mono">{{ activeStaff().role }}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- MAIN APP LAYOUT (Sidebar + Main View Container) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- SIDEBAR -->
        <aside 
          [class.hidden]="!sidebarOpen()"
          class="md:flex flex-col w-64 bg-[#0e1c2f] border-r border-white/10 p-4 space-y-6 flex-shrink-0 z-30 transition-all"
        >
          <!-- 1. Department Switcher -->
          <div>
            <label for="deptSelect" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <mat-icon class="text-xs text-sky-400">domain</mat-icon> Clinical Department
            </label>
            <select 
              id="deptSelect"
              [value]="currentDepartment()"
              (change)="setDepartment($any($event.target).value)"
              class="w-full bg-[#061426] border border-white/10 rounded-lg p-2 text-xs text-slate-200 font-semibold focus:border-sky-500 focus:outline-none"
            >
              <option value="GENERAL_SURGERY">General Surgery (ศัลยศาสตร์)</option>
              <option value="ORTHOPEDICS">Orthopedic Surgery (ออร์โธปิดิกส์)</option>
              <option value="OB_GYN">Obstetrics & Gynecology (สูติ-นรี)</option>
              <option value="ANESTHESIOLOGY">Anesthesiology (วิสัญญีวิทยา)</option>
              <option value="EMERGENCY_MEDICINE">Emergency Medicine (เวชศาสตร์ฉุกเฉิน)</option>
              <option value="CARDIOTHORACIC">Cardiothoracic Surgery (ศัลยศาสตร์หัวใจ)</option>
            </select>
          </div>

          <!-- 2. Role Switcher (RBAC Engine) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="roleSelect" class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <mat-icon class="text-xs text-amber-400">shield_person</mat-icon> Role Switcher (RBAC)
              </label>
              <span class="text-[9px] text-slate-400 font-mono">Demo Mode</span>
            </div>
            <select 
              id="roleSelect"
              [value]="currentRole()"
              (change)="setRole($any($event.target).value)"
              class="w-full bg-[#061426] border border-white/10 rounded-lg p-2 text-xs text-amber-300 font-semibold focus:border-amber-500 focus:outline-none"
            >
              <option value="RESIDENT">Senior Resident (แพทย์ประจำบ้าน)</option>
              <option value="ATTENDING_PHYSICIAN">Attending Physician (อาจารย์แพทย์)</option>
              <option value="HEAD_OF_SURGERY">Head of Surgery (หัวหน้าภาควิชา)</option>
              <option value="CHARGE_NURSE">Charge Nurse (พยาบาลหัวหน้าเวร)</option>
              <option value="SUPER_ADMIN">Super Admin / Hospital Board</option>
            </select>
          </div>

          <!-- 3. Navigation Links -->
          <nav class="space-y-1 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 block">
              Clinical Modules
            </span>

            <button 
              (click)="navigateTo('calendar')"
              [class.bg-sky-500/15]="activeTab() === 'calendar'"
              [class.text-sky-300]="activeTab() === 'calendar'"
              [class.font-semibold]="activeTab() === 'calendar'"
              [class.border-sky-500/40]="activeTab() === 'calendar'"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors border border-transparent"
            >
              <span class="flex items-center gap-2.5">
                <mat-icon class="text-base text-sky-400">calendar_month</mat-icon>
                <span>Master Scheduler</span>
              </span>
              @if (conflicts().length > 0) {
                <span class="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] border border-rose-500/30">
                  {{ conflicts().length }}!
                </span>
              }
            </button>

            <button 
              (click)="navigateTo('procedure')"
              [class.bg-sky-500/15]="activeTab() === 'procedure'"
              [class.text-sky-300]="activeTab() === 'procedure'"
              [class.font-semibold]="activeTab() === 'procedure'"
              [class.border-sky-500/40]="activeTab() === 'procedure'"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors border border-transparent"
            >
              <span class="flex items-center gap-2.5">
                <mat-icon class="text-base text-teal-400">medical_services</mat-icon>
                <span>Procedure Logger</span>
              </span>
              @if (pendingEndorsements() > 0) {
                <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] border border-amber-500/30">
                  {{ pendingEndorsements() }} req
                </span>
              }
            </button>

            <button 
              (click)="navigateTo('attendance')"
              [class.bg-sky-500/15]="activeTab() === 'attendance'"
              [class.text-sky-300]="activeTab() === 'attendance'"
              [class.font-semibold]="activeTab() === 'attendance'"
              [class.border-sky-500/40]="activeTab() === 'attendance'"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors border border-transparent"
            >
              <span class="flex items-center gap-2.5">
                <mat-icon class="text-base text-emerald-400">fingerprint</mat-icon>
                <span>Duty Clock-In & OT</span>
              </span>
              @if (activeSession()) {
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              }
            </button>

            <button 
              (click)="navigateTo('cme')"
              [class.bg-sky-500/15]="activeTab() === 'cme'"
              [class.text-sky-300]="activeTab() === 'cme'"
              [class.font-semibold]="activeTab() === 'cme'"
              [class.border-sky-500/40]="activeTab() === 'cme'"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors border border-transparent"
            >
              <span class="flex items-center gap-2.5">
                <mat-icon class="text-base text-amber-400">school</mat-icon>
                <span>CME & Credentialing</span>
              </span>
              <span class="text-[10px] text-slate-400 font-mono">TMC 50h</span>
            </button>

            <button 
              (click)="navigateTo('audit')"
              [class.bg-sky-500/15]="activeTab() === 'audit'"
              [class.text-sky-300]="activeTab() === 'audit'"
              [class.font-semibold]="activeTab() === 'audit'"
              [class.border-sky-500/40]="activeTab() === 'audit'"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 transition-colors border border-transparent"
            >
              <span class="flex items-center gap-2.5">
                <mat-icon class="text-base text-indigo-400">assessment</mat-icon>
                <span>Accreditation Center</span>
              </span>
              <span class="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">JCI</span>
            </button>
          </nav>

          <!-- 4. Active Clinician Profile Box -->
          <div class="mt-auto pt-4 border-t border-white/10">
            <div class="p-3 bg-[#061426] rounded-xl border border-white/5 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Active User</span>
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-400]="activeStaff().currentStatus === 'ON_DUTY'" [class.bg-slate-500]="activeStaff().currentStatus !== 'ON_DUTY'"></span>
              </div>
              <div class="font-bold text-white text-[11px] truncate">{{ activeStaff().name }}</div>
              <div class="text-[10px] text-slate-400 font-mono">{{ activeStaff().medicalLicenseNo }}</div>
              <div class="pt-1 flex items-center justify-between text-[10px]">
                <span class="text-slate-500">CME Credits:</span>
                <span class="font-mono text-amber-400 font-bold">{{ activeStaff().completedCmeHours }} / {{ activeStaff().annualCmeTarget }}h</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- MAIN VIEW CONTENT AREA -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-[#061426]">
          <div class="max-w-7xl mx-auto space-y-6">
            @switch (activeTab()) {
              @case ('calendar') {
                <app-master-calendar />
              }
              @case ('procedure') {
                <app-procedure-logger #procedureLoggerComponent />
              }
              @case ('attendance') {
                <app-attendance-widget />
              }
              @case ('cme') {
                <app-cme-tracker />
              }
              @case ('audit') {
                <app-audit-reporting />
              }
            }
          </div>
        </main>
      </div>

      <!-- Command Palette Dialog -->
      <app-command-bar 
        #commandBarComponent
        (openProcedureLog)="onCommandOpenProcedure($event)"
        (navigateTo)="navigateTo($event)"
      />
    </div>
  `
})
export class HospitalShell {
  private store = inject(HospitalStore);

  readonly commandBar = viewChild<CommandBar>('commandBarComponent');
  readonly procLogger = viewChild<ProcedureLogger>('procedureLoggerComponent');

  readonly activeTab = signal<'calendar' | 'procedure' | 'attendance' | 'cme' | 'audit'>('calendar');
  readonly sidebarOpen = signal(true);
  readonly notifDropdownOpen = signal(false);

  readonly currentRole = this.store.currentRole;
  readonly currentDepartment = this.store.currentDepartment;
  readonly activeStaff = this.store.activeStaff;
  readonly activeSession = this.store.currentDutySession;
  readonly notifications = this.store.notifications;
  readonly conflicts = this.store.shiftConflicts;
  readonly pendingEndorsements = this.store.pendingEndorsementCount;

  navigateTo(tab: string) {
    if (tab === 'calendar' || tab === 'procedure' || tab === 'attendance' || tab === 'cme' || tab === 'audit') {
      this.activeTab.set(tab);
    }
  }

  setRole(role: UserRole) {
    this.store.setRole(role);
  }

  setDepartment(dept: HospitalDepartment) {
    this.store.setDepartment(dept);
  }

  quickClockIn() {
    this.store.clockIn(undefined, 'Quick punch via navbar');
    this.navigateTo('attendance');
  }

  clearNotifications() {
    this.store.clearAllNotifications();
    this.notifDropdownOpen.set(false);
  }

  openCommandBar() {
    this.commandBar()?.open();
  }

  onCommandOpenProcedure(code?: string) {
    this.activeTab.set('procedure');
    // slight delay for DOM mount
    setTimeout(() => {
      this.procLogger()?.openModal(code);
    }, 50);
  }
}
