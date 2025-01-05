import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';

type VisitType = 'Pierwsza wizyta' | 'Wizyta kontrolna' | 'Choroba przewlekła' | 'Recepta';

interface TimeSlot {
  time: string;
  reserved: boolean;
  type: VisitType; // typ konsultacji (np. "Porada")
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

  currentTimeMarker: { dayKey: string; slotIndex: number | null } | null = null;

  ngOnInit(): void {
    this.initializeWeek(); // Zainicjalizowanie bieżącego tygodnia
    this.loadData(); // Wczytanie danych dostępności i rezerwacji

    // Inicjalizacja dynamicznego znacznika czasu
    this.updateCurrentTimeMarker();
    setInterval(() => {
      this.updateCurrentTimeMarker();
    }, 60000); // Odświeżanie co minutę
  }
  
  updateCurrentTimeMarker(): void {
    const now = new Date();
    const nowDayKey = this.getDayKey(now);
  
    // Sprawdź, czy dzisiejszy dzień jest widoczny w kalendarzu
    if (this.currentWeek.some((day) => this.getDayKey(day) === nowDayKey)) {
      const slots = this.slotsPerDay[nowDayKey] || [];
      let slotIndex: number | null = null;
  
      // Znajdź slot, w którym znajduje się bieżący czas
      slots.forEach((slot, index) => {
        const [hour, minute] = slot.time.split(':').map(Number);
        const slotStart = new Date(now);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30); // Zakładamy 30-minutowe sloty
  
        if (now >= slotStart && now < slotEnd) {
          slotIndex = index;
        }
      });
  
      this.currentTimeMarker = slotIndex !== null ? { dayKey: nowDayKey, slotIndex } : null;
    } else {
      this.currentTimeMarker = null; // Jeśli dzień nie jest widoczny
    }
  
    console.log('Aktualny znacznik czasu:', this.currentTimeMarker);
  }

  loadData(): void {
    this.dataService.getAvailability().subscribe({
      next: (availability) => {
        this.availability = availability;
        this.dataService.getAppointments().subscribe({
          next: (appointments: Appointment[]) => {
            this.appointments = appointments;
            this.generateSlots(); // Generowanie slotów po załadowaniu danych
          },
          error: (error) => console.error('Błąd ładowania rezerwacji:', error),
        });
      },
      error: (error) => console.error('Błąd ładowania dostępności:', error),
    });
  }
  
  
  saveAppointments(appointment: Appointment): void {
    this.dataService.addAppointment(appointment).subscribe({
      next: () => console.log('Rezerwacja zapisana.'),
      error: (error) => console.error('Błąd zapisu rezerwacji:', error),
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
      'niedziela',
      'poniedziałek',
      'wtorek',
      'środa',
      'czwartek',
      'piątek',
      'sobota',
    ];
    return days[date.getDay()];
  }
  
  generateSlots() {
    console.log('Generowanie slotów dla tygodnia:', this.currentWeek);
  
    this.currentWeek.forEach((date) => {
      const dayKey = this.getDayKey(date);
      const dayName = this.getDayName(date);
  
      console.log(`Przetwarzanie dnia: ${dayKey} (${dayName})`);
  
      // Filtruj dostępności na podstawie daty i dnia tygodnia
      const availabilityForDay = this.availability?.filter((avail: any) => {
        const isWithinDateRange = 
          new Date(avail.startDate) <= date &&
          new Date(avail.endDate).setHours(23, 59, 59, 999) >= date.getTime();
        const isDayIncluded = avail.days.includes(dayName);
  
        console.log(
          `- Sprawdzana dostępność:`,
          avail,
          `Zakres dat: ${isWithinDateRange}, Dzień: ${isDayIncluded}`
        );
  
        return isWithinDateRange && isDayIncluded;
      });
  
      console.log(`- Filtrowana dostępność dla dnia ${dayKey}:`, availabilityForDay);
  
      // Jeśli brak dostępności, przejdź do następnego dnia
      if (!availabilityForDay || availabilityForDay.length === 0) {
        console.log(`Brak dostępności dla dnia ${dayKey}`);
        return;
      }
  
      this.slotsPerDay[dayKey] = []; // Reset slotów dla danego dnia
  
      availabilityForDay.forEach((avail: any) => {
        avail.timeRanges.forEach((range: { start: string; end: string }) => {
          const [startHour, startMinutes] = range.start.split(':').map(Number);
          const [endHour, endMinutes] = range.end.split(':').map(Number);
  
          let currentTime = startHour * 60 + startMinutes;
          const endTime = endHour * 60 + endMinutes;
  
          while (currentTime < endTime) {
            const hour = Math.floor(currentTime / 60);
            const minutes = currentTime % 60;
            const slotTime = `${hour.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}`;
  
            const isReserved = this.appointments?.some(
              (app: any) => app.date === dayKey && app.time === slotTime
            );
  
            this.slotsPerDay[dayKey].push({
              time: slotTime,
              reserved: isReserved,
              type: isReserved
                ? this.appointments.find(
                    (app: any) => app.date === dayKey && app.time === slotTime
                  ).type
                : null,
              past: date.getTime() + currentTime * 60 * 1000 < new Date().getTime(),
            });
  
            currentTime += 30; // Sloty co 30 minut
          }
        });
      });
  
      console.log(`- Wygenerowane sloty dla dnia ${dayKey}:`, this.slotsPerDay[dayKey]);
    });
  }
  

  getRandomVisitType(): VisitType {
    const types: VisitType[] = ['Pierwsza wizyta', 'Wizyta kontrolna', 'Choroba przewlekła', 'Recepta'];
    return types[Math.floor(Math.random() * types.length)];
  }  

  reserveSlot(day: Date, slot: TimeSlot): void {
    if (this.isPastDay(day)) {
      return; // Uniemożliwienie rezerwacji
    }
    const dayKey = this.getDayKey(day);
    const targetSlot = this.slotsPerDay[dayKey]?.find((s) => s.time === slot.time);
    if (targetSlot && !targetSlot.reserved) {
      const randomType = this.getRandomVisitType();
      const newAppointment: Appointment = {
        date: dayKey,
        time: targetSlot.time,
        type: randomType,
      };
  
      targetSlot.reserved = true;
      targetSlot.type = randomType;
      targetSlot.details = `Rodzaj wizyty: ${randomType}, godzina: ${slot.time}`;
  
      this.saveAppointments(newAppointment); // Zapisz rezerwację
    }
  }
  
  

  getSlotColor(type: string | null): string {
    return type && type in this.visitTypes ? this.visitTypes[type as VisitType] : 'white';
  }
  
  getSlotType(slot: TimeSlot): VisitType {
    return slot.type;
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
    const slots = this.slotsPerDay[dayKey] || []; // Jeśli brak slotów, ustaw pustą tablicę
    return slots.filter(slot => slot.reserved).length;
  }
  
  
  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ustawienie początku dnia
    return date.getTime() < today.getTime();
  }
  
}