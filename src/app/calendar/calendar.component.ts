import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { ConsultationFormComponent } from '../consultation-form/consultation-form.component';


type VisitType = 'Pierwsza wizyta' | 'Wizyta kontrolna' | 'Choroba przewlekła' | 'Recepta';

interface TimeSlot {
  date: string; // Dodano date
  time: string;
  reserved: boolean;
  type: VisitType | 'Termin niedostępny'; // typ konsultacji (np. "Porada")
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
  status: string;
  duration: number; // Czas trwania wizyty w minutach
  patientName: string; // Imię i nazwisko pacjenta
  patientGender: string; // Płeć pacjenta ("Mężczyzna" lub "Kobieta")
  patientAge: number; // Wiek pacjenta
  notes: string; // Informacje dodatkowe dla lekarza
}


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ConsultationFormComponent],
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
  absences: { startDate: string; endDate: string }[] = [];
  currentTimeMarker: { dayKey: string; slotIndex: number | null } | null = null;
  showConsultationForm = false;
  selectedSlot: { date: Date; time: string } | null = null;

  visitTypes: Record<VisitType, string> = {
    'Pierwsza wizyta': 'blue',
    'Wizyta kontrolna': 'green',
    'Choroba przewlekła': 'orange',
    'Recepta': 'purple',
  };

  constructor(private dataService: DataService) {
    console.log('CalendarComponent został zainicjowany.');
  }

  openConsultationForm(day: Date, slot: TimeSlot): void {
    this.selectedSlot = {
      date: new Date(day), // Konwersja na obiekt Date
      time: slot.time,
    };
  }
    
  closeConsultationForm(): void {
    this.selectedSlot = null;
    this.showConsultationForm = false;
  }
    
  saveConsultation(data: any): void {
    if (!this.selectedSlot) return;
  
    const slotsToReserve = Math.ceil(data.duration / 30); // Liczba slotów (zaokrąglenie w górę)
    const dayKey = this.selectedSlot.date.toISOString().split('T')[0];
    const slotIndex = this.slotsPerDay[dayKey]?.findIndex(slot => slot.time === this.selectedSlot!.time);
  
    if (slotIndex === undefined || slotIndex < 0) {
      console.error('Nie znaleziono wybranego slotu');
      return;
    }
  
    // Sprawdź, czy wszystkie potrzebne sloty są dostępne
    const isAvailable = this.slotsPerDay[dayKey]
      ?.slice(slotIndex, slotIndex + slotsToReserve)
      .every(slot => slot && !slot.reserved);
  
    if (!isAvailable) {
      alert('Wybrana długość wizyty koliduje z innymi rezerwacjami.');
      return;
    }
  
    // Oznacz sloty jako zajęte
    for (let i = 0; i < slotsToReserve; i++) {
      const targetSlot = this.slotsPerDay[dayKey][slotIndex + i];
      if (targetSlot) {
        targetSlot.reserved = true;
        targetSlot.type = data.type;
        targetSlot.details = `Zarezerwowane: ${data.type}`;
      }
    }
  
    // Zapisz wizytę
    const newAppointment = {
      date: dayKey,
      time: this.selectedSlot.time,
      type: data.type,
      status: 'zarezerwowane',
      duration: data.duration,
      patientName: data.patientName,
      patientGender: data.patientGender,
      patientAge: data.patientAge,
      notes: data.notes,
    };
  
    this.dataService.addAppointment(newAppointment).subscribe({
      next: () => {
        console.log('Wizyta została zapisana:', newAppointment);
        this.closeConsultationForm(); // Zamknięcie formularza
        this.loadData(); // Odświeżenie kalendarza
      },
      error: (err) => {
        console.error('Błąd zapisu wizyty:', err);
        alert('Nie udało się zapisać wizyty. Spróbuj ponownie.');
      },
    });
  }
  
  
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
          next: (appointments) => {
            this.appointments = appointments;
            this.dataService.getAbsences().subscribe({
              next: (absences) => {
                this.absences = absences;
                this.checkConflictsWithAbsences(); // Sprawdź konflikty
                this.generateSlots(); // Ponownie wygeneruj sloty
              },
              error: (error) => console.error('Błąd ładowania absencji:', error),
            });
          },
          error: (error) => console.error('Błąd ładowania wizyt:', error),
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
  
  isAbsenceDay(day: Date): boolean {
    return this.absences.some(absence => {
      const startDate = new Date(absence.startDate);
      const endDate = new Date(absence.endDate);
      endDate.setHours(23, 59, 59, 999);
      return startDate <= day && endDate >= day;
    });
  }
  
  generateSlots() {
    console.log('Generowanie slotów dla tygodnia:', this.currentWeek);
  
    this.currentWeek.forEach((date) => {
      const dayKey = this.getDayKey(date);
      const dayName = this.getDayName(date);
  
      console.log(`Przetwarzanie dnia: ${dayKey} (${dayName})`);
  
      // Sprawdź, czy dzień jest dniem absencji
      const isAbsenceDay = this.absences.some((absence) => {
        const absenceStart = new Date(absence.startDate);
        const absenceEnd = new Date(absence.endDate);
        absenceEnd.setHours(23, 59, 59, 999); // Uwzględnienie całego dnia
        return absenceStart <= date && absenceEnd >= date;
      });
  
      if (isAbsenceDay) {
        console.log(`Dzień absencji: ${dayKey} - sloty nie zostaną wygenerowane.`);
        this.slotsPerDay[dayKey] = []; // Upewnij się, że dla tego dnia sloty są puste
        return;
      }
  
      // Normalne generowanie slotów dostępności
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
  
            const reservedAppointment = this.appointments?.find((app: any) => {
              return (
                app.date === dayKey &&
                app.time === slotTime &&
                (app.status === 'zarezerwowane' || app.status === 'opłacone') // Uwzględnij obydwa statusy
              );
            });
  
            const isReserved = !!reservedAppointment;
  
            // Jeżeli rezerwacja zajmuje wiele slotów, oznacz kolejne sloty jako zajęte
            if (isReserved && reservedAppointment.duration) {
              const slotsToReserve = Math.ceil(reservedAppointment.duration / 30);
              for (let i = 0; i < slotsToReserve; i++) {
                const extraSlotTime = new Date(date);
                extraSlotTime.setHours(hour, minutes + i * 30);
                const extraSlotTimeString = `${extraSlotTime
                  .getHours()
                  .toString()
                  .padStart(2, '0')}:${extraSlotTime
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`;
  
                this.slotsPerDay[dayKey].push({
                  date: dayKey,
                  time: extraSlotTimeString,
                  reserved: true,
                  type: reservedAppointment.type,
                  details: `Rodzaj wizyty: ${reservedAppointment.type} (${reservedAppointment.status})`,
                  past: date.getTime() + currentTime * 60 * 1000 < new Date().getTime(),
                  available: false,
                });
              }
              currentTime += slotsToReserve * 30; // Przesunięcie czasu o długość wizyty
            } else {
              this.slotsPerDay[dayKey].push({
                date: dayKey,
                time: slotTime,
                reserved: isReserved,
                type: reservedAppointment ? reservedAppointment.type : null,
                details: reservedAppointment
                ? `Rodzaj wizyty: ${reservedAppointment.type} (${reservedAppointment.status})`
                  : undefined,
                past: date.getTime() + currentTime * 60 * 1000 < new Date().getTime(),
                available: true,
              });
  
              currentTime += 30; // Sloty co 30 minut
            }
          }
        });
      });
  
      console.log(`- Wygenerowane sloty dla dnia ${dayKey}:`, this.slotsPerDay[dayKey]);
    });
  }
  
  // getRandomVisitType(): VisitType {
  //   const types: VisitType[] = ['Pierwsza wizyta', 'Wizyta kontrolna', 'Choroba przewlekła', 'Recepta'];
  //   return types[Math.floor(Math.random() * types.length)];
  // }  

  // reserveSlot(day: Date, slot: TimeSlot): void {
  //   if (this.isPastDay(day)) {
  //     return; // Uniemożliwienie rezerwacji
  //   }
  //   if (this.isAbsenceDay(day)) {
  //     console.warn('Nie można zarezerwować slotu w dniu absencji.');
  //     return; // Blokowanie rezerwacji w dniu absencji
  //   }

  //   const dayKey = this.getDayKey(day);
  //   const targetSlot = this.slotsPerDay[dayKey]?.find((s) => s.time === slot.time);
  //   if (targetSlot && !targetSlot.reserved) {
  //     const randomType = this.getRandomVisitType();
  //     const newAppointment: Appointment = {
  //       date: dayKey,
  //       time: targetSlot.time,
  //       type: randomType,
  //       status: 'zarezerwowane', // Domyślnie puste pole status
  //     };
  
  //     targetSlot.reserved = true;
  //     targetSlot.type = randomType;
  //     targetSlot.details = `Rodzaj wizyty: ${randomType}, godzina: ${slot.time}`;
  
  //     this.saveAppointments(newAppointment); // Zapisz rezerwację
  //   }
  // }

  getSlotColor(type: string | null): string {
    return type && type in this.visitTypes ? this.visitTypes[type as VisitType] : 'white';
  }
  
  getSlotType(slot: TimeSlot): VisitType | "Termin niedostępny" {
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
  
  // Metoda do sprawdzania konfliktów między absencjami a konsultacjami
  checkConflictsWithAbsences(): void {
    this.absences.forEach((absence) => {
      const absenceStart = new Date(absence.startDate);
      const absenceEnd = new Date(absence.endDate);
      absenceEnd.setHours(23, 59, 59, 999);
  
      this.appointments.forEach((appointment: any) => {
        const appointmentDate = new Date(appointment.date);
  
        if (appointmentDate >= absenceStart && appointmentDate <= absenceEnd) {
          // Zmień status na "odwołana", jeśli występuje konflikt z absencją
          appointment.status = 'odwołana';
  
          // Zaktualizuj w bazie danych
          this.dataService.updateAppointment(appointment).subscribe({
            next: () => console.log(`Zmieniono status wizyty: ${appointment.id}`),
            error: (err) => console.error('Błąd podczas aktualizacji wizyty:', err),
          });
        }
      });
    });
  }
  
}