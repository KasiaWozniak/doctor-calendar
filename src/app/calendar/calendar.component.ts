import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type VisitType = 'Pierwsza wizyta' | 'Wizyta kontrolna' | 'Choroba przewlekła' | 'Recepta';

interface TimeSlot {
  time: string;
  reserved: boolean;
  type: VisitType | null; // typ konsultacji (np. "Porada")
  details?: string; // szczegóły wizyty
  past: boolean; // czy slot jest w przeszłości
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule], // Dodanie CommonModule
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  today = new Date(); // Dodanie zmiennej z aktualną datą
  currentWeek: Date[] = [];
  selectedDetails: string | null = null;

  visitTypes: Record<VisitType, string> = {
    'Pierwsza wizyta': 'blue',
    'Wizyta kontrolna': 'green',
    'Choroba przewlekła': 'orange',
    'Recepta': 'purple',
  };

  slotsPerDay: { [key: string]: TimeSlot[] } = {};

  constructor() {
    this.initializeWeek();
    this.generateSlots();
  }

  initializeWeek() {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Poniedziałek
    this.currentWeek = Array.from({ length: 7 }, (_, i) => new Date(firstDay.setDate(firstDay.getDate() + (i ? 1 : 0))));
  }

  generateSlots() {
    this.currentWeek.forEach((date) => {
      const dayKey = date.toISOString().split('T')[0];
      this.slotsPerDay[dayKey] = [];
      for (let i = 8; i < 14; i += 0.5) { // 8:00 - 14:00 (6 godzin)
        const hour = Math.floor(i);
        const minutes = i % 1 === 0 ? '00' : '30';
        const slotTime = `${hour}:${minutes}`;
        this.slotsPerDay[dayKey].push({
          time: slotTime,
          reserved: false,
          type: null,
          past: new Date().getTime() > date.getTime() + hour * 60 * 60 * 1000,
        });
      }
    });
  }

  reserveSlot(day: Date, slot: TimeSlot, type: VisitType) {
    if (this.isPastDay(day)) {
      return; // Uniemożliwienie rezerwacji
    }
    const dayKey = this.getDayKey(day);
    const slots = this.slotsPerDay[dayKey];
    const targetSlot = slots.find((s) => s.time === slot.time);
    if (targetSlot) {
      targetSlot.reserved = true;
      targetSlot.type = type;
      targetSlot.details = `Rodzaj wizyty: ${type}, godzina: ${slot.time}`;
    }
  }

  getSlotColor(type: string | null): string {
    return type && type in this.visitTypes ? this.visitTypes[type as VisitType] : 'white';
  }
  

  showDetails(slot: TimeSlot) {
    this.selectedDetails = slot.details || 'Brak szczegółów';
  }

  hideDetails() {
    this.selectedDetails = null;
  }

  navigateWeek(direction: number) {
    this.currentWeek.forEach((_, i) => {
      this.currentWeek[i] = new Date(this.currentWeek[i].setDate(this.currentWeek[i].getDate() + 7 * direction));
    });
    this.generateSlots();
  }

  getDayKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  getReservedSlotsCount(day: Date): number {
    const dayKey = this.getDayKey(day);
    return this.slotsPerDay[dayKey].filter(slot => slot.reserved).length;
  }
  
  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ustawienie początku dnia
    return date.getTime() < today.getTime();
  }
  
}