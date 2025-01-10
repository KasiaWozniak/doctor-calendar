import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';


@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css'],
})
export class AvailabilityComponent {
  // Dni tygodnia
  daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  // Dane dla cyklicznej dostępności
  cyclicAvailability = {
    startDate: '',
    endDate: '',
    days: {
      Poniedziałek: false,
      Wtorek: false,
      Środa: false,
      Czwartek: false,
      Piątek: false,
      Sobota: false,
      Niedziela: false,
    } as Record<string, boolean>,
    timeRanges: [
      { start: '', end: '' }, // Poranny czas
      { start: '', end: '' }, // Popołudniowy czas
    ],
  };

  // Dane dla jednorazowej dostępności
  singleAvailability = {
    date: '',
    timeRange: { start: '', end: '' },
  };

  constructor(private dataService: DataService) {}

  updateMinEndDate() {
    // Jeśli data końcowa jest wcześniejsza niż data początkowa, resetujemy datę końcową
    if (this.cyclicAvailability.endDate < this.cyclicAvailability.startDate) {
      this.cyclicAvailability.endDate = '';
    }
  }

  updateMinMorningEndTime() {
    const morningStart = this.cyclicAvailability.timeRanges[0].start;
    const morningEnd = this.cyclicAvailability.timeRanges[0].end;
  
    if (morningEnd < morningStart) {
      this.cyclicAvailability.timeRanges[0].end = '';
    }
  }
  
  updateMinAfternoonEndTime() {
    const afternoonStart = this.cyclicAvailability.timeRanges[1].start;
    const afternoonEnd = this.cyclicAvailability.timeRanges[1].end;
  
    if (afternoonEnd < afternoonStart) {
      this.cyclicAvailability.timeRanges[1].end = '';
    }
  }

  updateAfternoonStartTime() {
    const morningEnd = this.cyclicAvailability.timeRanges[0].end;
    const afternoonStart = this.cyclicAvailability.timeRanges[1].start;
  
    if (morningEnd && afternoonStart && afternoonStart < morningEnd) {
      alert('Czas popołudniowy nie może rozpocząć się przed zakończeniem czasu porannego.');
      this.cyclicAvailability.timeRanges[1].start = '';
    }
  }
  
  updateAfternoonEndTime() {
    const afternoonStart = this.cyclicAvailability.timeRanges[1].start;
    const afternoonEnd = this.cyclicAvailability.timeRanges[1].end;
  
    if (afternoonEnd && afternoonStart && afternoonEnd < afternoonStart) {
      alert('Czas zakończenia popołudniowego musi być późniejszy niż jego początek.');
      this.cyclicAvailability.timeRanges[1].end = '';
    }
  }
  
  
  updateMinSingleEndTime() {
    // Jeśli czas końca jest wcześniejszy niż czas początku, resetujemy czas końca
    if (this.singleAvailability.timeRange.end < this.singleAvailability.timeRange.start) {
      this.singleAvailability.timeRange.end = '';
    }
  }

  absences: { startDate: string; endDate: string }[] = [];

  ngOnInit(): void {
    this.dataService.getAbsences().subscribe({
      next: (absences) => {
        this.absences = absences;
      },
      error: (error) => console.error('Błąd ładowania absencji:', error),
    });
  }
  
  private getDatesInRange(startDate: Date, endDate: Date, daysOfWeek: string[] = []): string[] {
    const dates: string[] = [];
    let currentDate = new Date(startDate);
  
    while (currentDate <= endDate) {
      const dayName = currentDate
        .toLocaleDateString('pl-PL', { weekday: 'long' })
        .toLowerCase();
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayName)) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return dates;
  }
  

  saveCyclicAvailability(): void {
    const availability = {
      startDate: this.cyclicAvailability.startDate,
      endDate: this.cyclicAvailability.endDate,
      days: Object.keys(this.cyclicAvailability.days)
        .filter((day) => this.cyclicAvailability.days[day])
        .map((day) => day.toLowerCase()), // Zamiana dni na małe litery
      timeRanges: [...this.cyclicAvailability.timeRanges],
    };
  
    // Sprawdź kolizje z absencjami
    this.dataService.getAbsences().subscribe({
      next: (absences) => {
        const newAvailabilityDates = this.getDatesInRange(
          new Date(availability.startDate),
          new Date(availability.endDate),
          availability.days
        );
  
        // Usuń kolidujące absencje
        absences.forEach((absence: { startDate: string; endDate: string }) => {
          const absenceDates = this.getDatesInRange(
            new Date(absence.startDate),
            new Date(absence.endDate)
          );
  
          const overlappingDates = absenceDates.filter((date) =>
            newAvailabilityDates.includes(date)
          );
  
          overlappingDates.forEach((date) => {
            // Usuń absencję
            this.dataService.deleteAbsence(date).subscribe(() => {
              console.log(`Usunięto absencję dla dnia ${date}`);
            });
  
            // Przywróć rezerwacje dla dnia
            this.dataService.getAppointments().subscribe((appointments) => {
              appointments
                .filter((appointment: any) => appointment.date === date)
                .forEach((appointment: any) => {
                  if (appointment.status === 'odwołana') {
                    appointment.status = 'zarezerwowane';
                    this.dataService.updateAppointment(appointment).subscribe(() => {
                      console.log(
                        `Przywrócono rezerwację dla dnia ${appointment.date} o godzinie ${appointment.time}`
                      );
                    });
                  }
                });
            });
          });
        });
  
        // Zapisz nową dostępność
        this.dataService.addAvailability(availability).subscribe({
          next: () => {
            console.log('Cykliczna dostępność zapisana.');
            alert('Dostępność została zapisana.');
          },
          error: (err) => {
            console.error('Błąd zapisu dostępności:', err);
          },
        });
      },
      error: (err) => {
        console.error('Błąd pobierania absencji:', err);
      },
    });
  }
  
  saveSingleAvailability(): void {
    const availability = {
      startDate: this.singleAvailability.date,
      endDate: this.singleAvailability.date,
      days: [new Date(this.singleAvailability.date).toLocaleDateString('pl-PL', { weekday: 'long' }).toLowerCase()],
      timeRanges: [this.singleAvailability.timeRange],
    };
  
    // Usuń konfliktującą absencję i przywróć rezerwacje
    const singleDay = this.singleAvailability.date;
    this.dataService.getAbsences().subscribe({
      next: (absences) => {
        const targetAbsence = absences.find((absence: { startDate: string; endDate: string }) => {
          const absenceStart = new Date(absence.startDate);
          const absenceEnd = new Date(absence.endDate);
          absenceEnd.setHours(23, 59, 59, 999);
          return absenceStart <= new Date(singleDay) && absenceEnd >= new Date(singleDay);
        });
  
        if (targetAbsence) {
          const absenceStart = new Date(targetAbsence.startDate);
          const absenceEnd = new Date(targetAbsence.endDate);
  
          if (absenceStart.toISOString().split('T')[0] === absenceEnd.toISOString().split('T')[0]) {
            // Absencja tylko na ten dzień – usuń całą absencję
            this.dataService.deleteAbsence(targetAbsence.id).subscribe(() => {
              console.log('Usunięto absencję pokrywającą się z jednorazową dostępnością.');
            });
          } else if (absenceStart.toISOString().split('T')[0] === singleDay) {
            // Jeśli to początek absencji, przesuń początek absencji
            targetAbsence.startDate = new Date(new Date(singleDay).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            this.dataService.updateAbsence(targetAbsence).subscribe(() => {
              console.log('Zaktualizowano początek absencji.');
            });
          } else if (absenceEnd.toISOString().split('T')[0] === singleDay) {
            // Jeśli to koniec absencji, przesuń koniec absencji
            targetAbsence.endDate = new Date(new Date(singleDay).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            this.dataService.updateAbsence(targetAbsence).subscribe(() => {
              console.log('Zaktualizowano koniec absencji.');
            });
          } else {
            // Jeśli dzień jest w środku absencji, podziel absencję na dwie części
            const newAbsence = {
              ...targetAbsence,
              startDate: new Date(new Date(singleDay).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
            targetAbsence.endDate = new Date(new Date(singleDay).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            this.dataService.updateAbsence(targetAbsence).subscribe(() => {
              console.log('Zaktualizowano koniec oryginalnej absencji.');
              this.dataService.addAbsence(newAbsence).subscribe(() => {
                console.log('Dodano nową absencję.');
              });
            });
          }
        }
  
        // Przywróć odwołane rezerwacje
        this.dataService.getAppointments().subscribe((appointments) => {
          appointments
            .filter((appointment: any) => appointment.date === singleDay && appointment.status === 'odwołana')
            .forEach((appointment: any) => {
              appointment.status = 'zarezerwowane';
              this.dataService.updateAppointment(appointment).subscribe(() => {
                console.log(
                  `Przywrócono rezerwację dla dnia ${appointment.date} o godzinie ${appointment.time}`
                );
              });
            });
        });
  
        // Zapisz dostępność jednorazową
        this.dataService.addAvailability(availability).subscribe({
          next: () => {
            console.log('Jednorazowa dostępność zapisana.');
            alert('Dostępność została zapisana.');
          },
          error: (err) => {
            console.error('Błąd zapisu dostępności:', err);
          },
        });
      },
      error: (err) => {
        console.error('Błąd pobierania absencji:', err);
      },
    });
  }
  

    // Metoda do obsługi przesyłania formularza
    addAvailability(): void {
      this.dataService.addAvailability(this.cyclicAvailability).subscribe(response => {
        console.log('Nowa dostępność została zapisana:', response);
        alert('Dostępność została zapisana!');
      });
    }
}