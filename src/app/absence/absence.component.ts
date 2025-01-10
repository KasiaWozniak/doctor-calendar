import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-absence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './absence.component.html',
  styleUrls: ['./absence.component.css'],
})
export class AbsenceComponent implements OnInit {
  absences: { startDate: string; endDate: string }[] = [];
  newAbsence: { startDate: string; endDate: string } = { startDate: '', endDate: '' };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadAbsences();
  }

  loadAbsences(): void {
    this.dataService.getAbsences().subscribe({
      next: (absences) => (this.absences = absences),
      error: (error) => console.error('Błąd ładowania absencji:', error),
    });
  }

  // absence.component.ts
addAbsence(): void {
  if (this.newAbsence.startDate && this.newAbsence.endDate) {
    this.dataService.addAbsence(this.newAbsence).subscribe({
      next: () => {
        this.absences.push(this.newAbsence);
        this.newAbsence = { startDate: '', endDate: '' };
      },
      error: (error) => console.error('Błąd dodawania absencji:', error),
    });
  }
}
  
}
