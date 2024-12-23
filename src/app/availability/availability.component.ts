import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  // Obsługa cyklicznej dostępności
  defineCyclicAvailability() {
    console.log('Cykliczna dostępność:', this.cyclicAvailability);
    // TODO: Dodaj logikę zapisywania cyklicznej dostępności
  }

  // Obsługa jednorazowej dostępności
  defineSingleAvailability() {
    console.log('Jednorazowa dostępność:', this.singleAvailability);
    // TODO: Dodaj logikę zapisywania jednorazowej dostępności
  }
}
