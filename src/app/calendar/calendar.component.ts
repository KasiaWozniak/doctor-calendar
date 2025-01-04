import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';

type VisitType = 'Pierwsza wizyta' | 'Wizyta kontrolna' | 'Choroba przewlekła' | 'Recepta';

interface TimeSlot {
  time: string;
  reserved: boolean;
  type: VisitType | null; // typ konsultacji (np. "Porada")
  details?: string; // szczegóły wizyty
  past: boolean; // czy slot jest w przeszłości
  available?: boolean; // czy slot jest dostępny
}

interface Availability {
  startDate: string;
  endDate: string;
  days: string[];
  timeRanges: { start: string; end: string }[];
}

interface Appointment {
  date: string;
  time: string;
  type: VisitType;
}


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  today = new Date(); // Dodanie zmiennej z aktualną datą
  currentWeek: Date[] = [];
  slotsPerDay: { [key: string]: TimeSlot[] } = {};
  availability: any;
  appointments: any;
  selectedDetails: string | null = null;

  visitTypes: Record<VisitType, string> = {
    'Pierwsza wizyta': 'blue',
    'Wizyta kontrolna': 'green',
    'Choroba przewlekła': 'orange',
    'Recepta': 'purple',
  };

  constructor(private dataService: DataService) {
    console.log('CalendarComponent został zainicjowany.');
  }

  ngOnInit(): void {
    this.loadData(); // Wywołanie metody loadData
    console.log('Sloty czasowe po generowaniu:', this.slotsPerDay);
  }

  // Pobieranie danych z pliku JSON
  loadData(): void {
    this.dataService.getData().subscribe((data) => {
      this.availability = data.availability;
      this.appointments = data.appointments;
      console.log('Dane załadowane z pliku JSON:', data); // Debugowanie
      this.initializeWeek();
      this.generateSlots();
    });
  }
  
  initializeWeek(): void {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Poniedziałek
    this.currentWeek = Array.from({ length: 7 }, (_, i) => new Date(firstDay.getTime() + i * 24 * 60 * 60 * 1000));
    console.log('Bieżący tydzień:', this.currentWeek); // Debugowanie
  }

  getDayName(date: Date): string {
    const days = [
      'Niedziela',
      'Poniedziałek',
      'Wtorek',
      'Środa',
      'Czwartek',
      'Piątek',
      'Sobota',
    ];
    return days[date.getDay()];
  }
  
  

  generateSlots() {
    console.log('Rozpoczęcie generowania slotów...');
    this.currentWeek.forEach((date) => {
      const dayKey = this.getDayKey(date);
      const dayName = this.getDayName(date);
  
      console.log(`Przetwarzanie dnia: ${dayName} (${dayKey})`);
  
      const availabilityForDay = this.availability?.filter((avail: any) => {
        const isWithinDateRange = new Date(avail.startDate) <= date && new Date(avail.endDate) >= date;
        const isDayIncluded = avail.days.includes(dayName);
        return isWithinDateRange && isDayIncluded;
      });
  
      this.slotsPerDay[dayKey] = []; // Reset slotów dla danego dnia
  
      availabilityForDay?.forEach((avail: any) => {
        avail.timeRanges.forEach((range: { start: string; end: string }) => {
          const [startHour, startMinutes] = range.start.split(':').map(Number);
          const [endHour, endMinutes] = range.end.split(':').map(Number);
  
          let currentTime = startHour * 60 + startMinutes;
          const endTime = endHour * 60 + endMinutes;
  
          while (currentTime < endTime) {
            const hour = Math.floor(currentTime / 60);
            const minutes = currentTime % 60;
            const slotTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
            this.slotsPerDay[dayKey].push({
              time: slotTime,
              reserved: false,
              type: null,
              past: date.getTime() + currentTime * 60 * 1000 < new Date().getTime(),
            });
  
            currentTime += 30; // Dodanie 30 minut
          }
        });
      });
  
      console.log(`Wygenerowane sloty dla dnia ${dayKey}:`, this.slotsPerDay[dayKey]);
    });
  }
  
  

  reserveSlot(day: Date, slot: TimeSlot, type: VisitType): void {
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
  

  showDetails(slot: TimeSlot): void {
    this.selectedDetails = slot.details || 'Brak szczegółów';
  }

  hideDetails(): void {
    this.selectedDetails = null;
  }

  navigateWeek(direction: number): void {
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