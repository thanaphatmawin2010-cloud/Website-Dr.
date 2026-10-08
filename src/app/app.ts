import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HospitalShell } from './components/hospital-shell';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [HospitalShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

