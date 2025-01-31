import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';

interface Absence {
  startDate: string;
  endDate: string;
}

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

addAbsence(): void {
  if (this.newAbsence.startDate && this.newAbsence.endDate) {
    this.dataService.addAbsence(this.newAbsence).subscribe({
      next: () => {
        this.absences.push(this.newAbsence);
        this.newAbsence = { startDate: '', endDate: '' };
        this.checkConflictsWithAbsences();
      },
      error: (error) => console.error('Błąd dodawania absencji:', error),
    });
  }
}

updateMinEndDate(): void {
  if (this.newAbsence.endDate < this.newAbsence.startDate) {
    this.newAbsence.endDate = '';
  }
}

checkConflictsWithAbsences(): void {
  this.dataService.getAppointments().subscribe({
    next: (appointments) => {
      this.dataService.getAbsences().subscribe({
        next: (absences) => {
          absences.forEach((absence: Absence) => {
            const absenceStart = new Date(absence.startDate);
            const absenceEnd = new Date(absence.endDate);
            absenceEnd.setHours(23, 59, 59, 999);

            appointments.forEach((appointment: any) => {
              const appointmentDate = new Date(appointment.date);

              if (appointmentDate >= absenceStart && appointmentDate <= absenceEnd) {
                appointment.status = 'odwołana';

                this.dataService.updateAppointment(appointment).subscribe({
                  next: () => console.log(`Zmieniono status wizyty: ${appointment.id}`),
                  error: (err) => console.error('Błąd aktualizacji wizyty:', err),
                });
              }
            });
          });
        },
        error: (error) => console.error('Błąd ładowania absencji:', error),
      });
    },
    error: (error) => console.error('Błąd ładowania wizyt:', error),
  });
}

  
}
