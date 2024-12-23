import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  weekDays = [
    { date: new Date(), reservedCount: 3, timeSlots: this.generateTimeSlots() },
    // Dodaj pozostałe dni
  ];
  selectedDetails: any;
  detailsVisible = false;

  generateTimeSlots() {
    const slots = [];
    for (let i = 8; i < 14; i += 0.5) {
      slots.push({ time: `${Math.floor(i)}:${i % 1 === 0 ? '00' : '30'}`, reserved: false, type: null });
    }
    return slots;
  }

  showDetails(slot: any) {
    this.selectedDetails = slot;
    this.detailsVisible = true;
  }

  hideDetails() {
    this.detailsVisible = false;
  }
}
