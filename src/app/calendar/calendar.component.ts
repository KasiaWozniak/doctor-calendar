import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { ConsultationFormComponent } from '../consultation-form/consultation-form.component';
import { forkJoin } from 'rxjs';


type VisitType = 'Pierwsza wizyta' | 'Wizyta kontrolna' | 'Choroba przewlekła' | 'Recepta';

interface TimeSlot {
  date: string; 
  time: string;
  reserved: boolean;
  type: VisitType | 'Dostępny' | 'Termin niedostępny' | 'Empty' ; 
  details?: string; 
  past: boolean; 
  available?: boolean; 
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
  duration: number; 
  patientName: string; 
  patientGender: string; 
  patientAge: number; 
  notes: string;
}


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ConsultationFormComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  today = new Date(); 
  currentWeek: Date[] = [];
  slotsPerDay: { [key: string]: TimeSlot[] } = {};
  availability: any;
  appointments: any;
  selectedDetails: string | null = null;
  absences: { startDate: string; endDate: string }[] = [];
  currentTimeMarker: { dayKey: string; slotIndex: number | null } | null = null;
  showConsultationForm: boolean = false;
  selectedSlot: {
    date: Date;
    time: string;
    reserved?: boolean;
    appointmentId?: string;
    patientName?: string;
    type?: string;
  } | null = null;
    showCancelDialog: boolean = false;


  visitTypes: Record<VisitType, string> = {
    'Pierwsza wizyta': 'blue',
    'Wizyta kontrolna': 'green',
    'Choroba przewlekła': 'orange',
    'Recepta': 'purple',
  };

  constructor(private dataService: DataService) {
  }

  openConsultationForm(day: Date, slot: TimeSlot): void {
    if (!slot) {
      console.error('Slot jest pusty.');
      return;
    }
  
    if (slot.reserved) {
      this.openCancelDialog(day, slot); 
    } else {
      this.selectedSlot = { date: new Date(day), time: slot.time, reserved: slot.reserved };
      this.showConsultationForm = true;
    }
  }
  
  
  closeConsultationForm(): void {
    this.selectedSlot = { date: new Date(), time: '' };
    this.showConsultationForm = false;
  }
  
  
  showDetails(slot: TimeSlot): void {
    this.selectedDetails = slot.details || 'Wolny termin';
  }
  
  hideDetails(): void {
    this.selectedDetails = null;
  }
  
  saveConsultation(data: any): void {
    if (!this.selectedSlot) {
        alert('Nie wybrano slotu do rezerwacji.');
        return;
    }

  if (
    !data.type ||
    !data.duration ||
    !data.patientName ||
    !data.patientGender ||
    !data.patientAge
  ) {
    alert('Proszę wypełnić wszystkie wymagane pola.');
    return;
  }

    const slotsToReserve = Math.ceil(data.duration / 30); 
    const dayKey = this.selectedSlot.date.toISOString().split('T')[0];
    const slotIndex = this.slotsPerDay[dayKey]?.findIndex(slot => slot.time === this.selectedSlot!.time);

    if (slotIndex === undefined || slotIndex < 0) {
        alert('Nie znaleziono wybranego slotu.');
        return;
    }

// Pobierz dostępność dla dnia
const dayName = this.getDayName(this.selectedSlot!.date).toLowerCase(); 
const availabilityForDay = this.availability?.find((avail: any) =>
    avail.days.map((day: string) => day.toLowerCase()).includes(dayName) && 
    new Date(avail.startDate).setHours(0, 0, 0, 0) <= this.selectedSlot!.date.getTime() &&
    new Date(avail.endDate).setHours(23, 59, 59, 999) >= this.selectedSlot!.date.getTime()
);

if (!availabilityForDay) {
    alert('Brak dostępności dla wybranego dnia.');
    return;
}


const startTime = this.selectedSlot.time;
const slotsToCheck = this.slotsPerDay[dayKey]?.slice(slotIndex, slotIndex + slotsToReserve);

if (!slotsToCheck || slotsToCheck.length < slotsToReserve) {
    alert('Wizyta wykracza poza dostępność lekarza.');
    return;
}

const hasEmptySlot = slotsToCheck.some(slot => slot.type === 'Empty');

if (hasEmptySlot) {
    alert('Wizyta wykracza poza dostępność lekarza.');
    return;
}


    const slotsInRange = this.slotsPerDay[dayKey]?.slice(slotIndex, slotIndex + slotsToReserve);
    const isAvailable = slotsInRange?.every(slot => slot && !slot.reserved && slot.available);

    if (!isAvailable) {
        const overlappingSlot = slotsInRange?.find(slot => slot.reserved || !slot.available);
        alert(
            `Wybrana długość wizyty koliduje z innymi rezerwacjami lub niedostępnymi slotami.\n` +
            `Problem występuje w slocie: ${overlappingSlot?.time}`
        );
        return;
    }

    const finalSlotEndTime = this.calculateEndTime(startTime, (slotsToReserve - 1) * 30);
    const isFinalSlotWithinAvailability = availabilityForDay.timeRanges.some((range: { start: string; end: string }) => {
        return finalSlotEndTime <= range.end;
    });

    if (!isFinalSlotWithinAvailability) {
        alert('Wizyta wykracza poza ostatni dostępny slot dnia.');
        return;
    }

    for (let i = 0; i < slotsToReserve; i++) {
        const targetSlot = this.slotsPerDay[dayKey][slotIndex + i];
        if (targetSlot) {
            targetSlot.reserved = true;
            targetSlot.type = data.type;
            targetSlot.details = `Zarezerwowane: ${data.type}`;
        }
    }

    const newAppointment = {
        date: dayKey,
        time: this.selectedSlot.time,
        type: data.type,
        status: 'zarezerwowane',
        duration: data.duration,
        patientName: data.patientName,
        patientGender: data.patientGender,
        patientAge: data.patientAge,
        notes: data.notes || '',
    };



    this.dataService.addAppointment(newAppointment).subscribe({
        next: () => {
            alert('Wizyta została pomyślnie zapisana.');
            this.loadData(); 
            this.closeConsultationForm(); 
        },
        error: (err) => {
            console.error('Błąd zapisu wizyty:', err);
            alert('Nie udało się zapisać wizyty. Spróbuj ponownie.');
        },
    });
}

  
  calculateEndTime(startTime: string, duration: number): string {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMinute + duration;
  
    const endHour = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endMinute = (totalMinutes % 60).toString().padStart(2, '0');
  
    return `${endHour}:${endMinute}`;
  }
  
  
  openCancelDialog(day: Date, slot: TimeSlot): void {
    if (slot.past) {
        alert('Nie można anulować wizyty w przeszłości.');
        return;
    }

    const appointment = this.appointments.find(
        (appt: Appointment) =>
            appt.date === day.toISOString().split('T')[0] && appt.time === slot.time
    );

    if (appointment) {
        this.selectedSlot = {
            date: new Date(day),
            time: slot.time,
            reserved: slot.reserved,
            appointmentId: appointment.id || appointment._id,
            patientName: appointment.patientName, 
            type: appointment.type, 
        };
        this.showCancelDialog = true;
    } else {
        alert('Nie można znaleźć powiązanej wizyty.');
    }
}

  
  closeCancelDialog(): void {
    this.showCancelDialog = false;
    this.selectedSlot = null;
  }
  
// calendar.component.ts
confirmCancelAppointment(): void {
  if (this.selectedSlot?.appointmentId) {
    this.dataService.deleteAppointment(this.selectedSlot.appointmentId).subscribe({
      next: () => {
        alert('Wizyta została anulowana.');
        this.showCancelDialog = false;
        this.loadData(); 
      },
      error: (err) => {
        console.error('Błąd podczas anulowania wizyty:', err);
        alert('Nie udało się anulować wizyty.');
      },
    });
  } else {
    console.error('Brak ID wizyty do anulowania.');
  }
}
  
ngOnInit(): void {
  this.initializeWeek();
  this.loadData(); 

  setTimeout(() => {
      this.updateCurrentTimeMarker(); 
  }, 100); 

  setInterval(() => {
      this.updateCurrentTimeMarker();
  }, 60000);
}


updateCurrentTimeMarker(): void {
  const now = new Date();
  const nowDayKey = this.getDayKey(now);

  if (!this.currentWeek.some(day => this.getDayKey(day) === nowDayKey)) {
      this.currentTimeMarker = null; 
      return;
  }

  const slots = this.slotsPerDay[nowDayKey] || [];
  let slotIndex: number | null = null;

  slots.forEach((slot, index) => {
      const [hour, minute] = slot.time.split(':').map(Number);
      const slotStart = new Date(now);
      slotStart.setHours(hour, minute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30); 

      if (now >= slotStart && now < slotEnd) {
          slotIndex = index;
      }
  });

  if (slotIndex !== null) {
      this.currentTimeMarker = { dayKey: nowDayKey, slotIndex };
  } else {
      this.currentTimeMarker = null;
  }
}


  loadData(): void {
    forkJoin({
        availability: this.dataService.getAvailability(),
        appointments: this.dataService.getAppointments(),
        absences: this.dataService.getAbsences(),
    }).subscribe({
        next: (data) => {
            console.log('Dane dostępności:', data.availability);
            console.log('Dane rezerwacji:', data.appointments);
            console.log('Dane absencji:', data.absences);
            this.availability = data.availability;
            this.appointments = data.appointments;
            this.absences = data.absences;
            this.generateSlots();
        },
        error: (error) => {
            console.error('Error loading data:', error);
        },
    });
}

  
  
  saveAppointments(appointment: Appointment): void {
    this.dataService.addAppointment(appointment).subscribe({
      error: (error) => console.error('Błąd zapisu rezerwacji:', error),
    });
  }
  
  initializeWeek(): void {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Poniedziałek
    this.currentWeek = Array.from({ length: 7 }, (_, i) => new Date(firstDay.getTime() + i * 24 * 60 * 60 * 1000));
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

    this.currentWeek.forEach((date) => {
        const dayKey = this.getDayKey(date);
        const dayName = this.getDayName(date);


        const isAbsenceDay = this.absences.some((absence) => {
            const absenceStart = new Date(absence.startDate);
            const absenceEnd = new Date(absence.endDate);
            absenceEnd.setHours(23, 59, 59, 999);
            return absenceStart <= date && absenceEnd >= date;
        });

        if (isAbsenceDay) {
            this.slotsPerDay[dayKey] = [];
            return;
        }

        const availabilityForDay = this.availability?.filter((avail: any) => {
          const isWithinDateRange =
              new Date(avail.startDate) <= date &&
              new Date(avail.endDate).setHours(23, 59, 59, 999) >= date.getTime();
          const isDayIncluded = avail.days.includes(dayName);
          return isWithinDateRange && isDayIncluded;
      });
      console.log('Dostępność dla dnia:', availabilityForDay);


        if (!availabilityForDay || availabilityForDay.length === 0) {
            this.slotsPerDay[dayKey] = this.getSlotsBetween('08:00', '20:30').map((time) =>
                this.createEmptySlot(dayKey, time)
            );
            return;
        }

        this.slotsPerDay[dayKey] = [];

        let lastEnd = '08:00';
        availabilityForDay.forEach((avail: any) => {
            avail.timeRanges.forEach((range: { start: string; end: string }) => {
                if (lastEnd < range.start) {
                    const emptySlots = this.getSlotsBetween(lastEnd, range.start);
                    emptySlots.forEach((time) => {
                        this.slotsPerDay[dayKey].push(this.createEmptySlot(dayKey, time));
                    });
                }

                const availableSlots = this.getSlotsBetween(range.start, range.end);
                availableSlots.forEach((time) => {
                    const slotDate = new Date(date);
                    const [hour, minute] = time.split(':').map(Number);
                    slotDate.setHours(hour, minute, 0, 0);
                    this.slotsPerDay[dayKey].push({
                        date: dayKey,
                        time,
                        reserved: false,
                        type: 'Dostępny',
                        details: undefined,
                        past: slotDate < new Date(), 
                        available: true,
                    });
                });

                lastEnd = range.end; 
            });
        });

        const emptySlotsAfterLastRange = this.getSlotsBetween(lastEnd, '20:30');
        emptySlotsAfterLastRange.forEach((time) => {
            this.slotsPerDay[dayKey].push(this.createEmptySlot(dayKey, time));
        });

        this.appointments?.forEach((appointment: Appointment) => {
            if (appointment.date === dayKey) {
                const slotsToReserve = Math.ceil(appointment.duration / 30);
                const startMinutes = this.convertTimeToMinutes(appointment.time);

                for (let i = 0; i < slotsToReserve; i++) {
                    const slotTime = this.getTimeAfter(appointment.time, i * 30);
                    const slot = this.slotsPerDay[dayKey].find((s) => s.time === slotTime);

                    if (slot) {
                        slot.reserved = true;
                        slot.type = appointment.type;
                        slot.details = `
Rodzaj: ${appointment.type} (${appointment.status})
Termin: ${appointment.date} ${appointment.time} (${appointment.duration} minut)
Pacjent: ${appointment.patientName}, wiek: ${appointment.patientAge} (${appointment.patientGender})
                        `;
                        slot.available = false; 
                    }
                }
            }
        });
        console.log('Sloty dla dnia:', this.slotsPerDay[dayKey]);
    });
}


  isTimeWithinAppointment(appointment: Appointment, slotTime: string): boolean {
    const appointmentStart = this.convertTimeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + appointment.duration;
    const slotStart = this.convertTimeToMinutes(slotTime);
  
    return slotStart >= appointmentStart && slotStart < appointmentEnd;
  }
  
  isSlotAlreadyAdded(dayKey: string, time: string): boolean {
    return this.slotsPerDay[dayKey]?.some(slot => slot.time === time);
  }
  
  
  isSlotCoveredByLongVisit(appointment: Appointment, slotTime: string): boolean {
    const appointmentStart = this.convertTimeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + appointment.duration;
    const slotStart = this.convertTimeToMinutes(slotTime);
  
    return slotStart >= appointmentStart && slotStart < appointmentEnd;
  }
  
  addLongVisitSlots(appointment: Appointment, dayKey: string, date: Date): void {
    const slotsToReserve = Math.ceil(appointment.duration / 30);
    const startMinutes = this.convertTimeToMinutes(appointment.time);
  
    for (let i = 0; i < slotsToReserve; i++) {
      const slotTime = this.getTimeAfter(appointment.time, i * 30);
      if (!this.isSlotAlreadyAdded(dayKey, slotTime)) {
        this.slotsPerDay[dayKey].push({
          date: dayKey,
          time: slotTime,
          reserved: true,
          type: appointment.type,
          details: `
  Rodzaj: ${appointment.type} (${appointment.status})
  Termin: ${appointment.date} ${appointment.time} (${appointment.duration} minut)
  Pacjent: ${appointment.patientName}, wiek: ${appointment.patientAge} (${appointment.patientGender})
          `,
          past: date.getTime() < new Date().getTime(),
          available: false,
        });
      }
    }
  }
  
  
  getTimeAfter(startTime: string, minutesToAdd: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
  
    const endHour = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endMinute = (totalMinutes % 60).toString().padStart(2, '0');
  
    return `${endHour}:${endMinute}`;
  }

  createEmptySlot(dayKey: string, time: string): TimeSlot {
    return {
      date: dayKey,
      time,
      reserved: false,
      type: 'Empty',
      details: undefined,
      past: this.convertTimeToMinutes(time) < this.convertTimeToMinutes(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })),
      available: false,
    };
  }  
  
  convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  getSlotsBetween(start: string, end: string): string[] {
    const startMinutes = this.convertTimeToMinutes(start);
    const endMinutes = this.convertTimeToMinutes(end);
    const slots = [];
  
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
      const minute = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  
    return slots;
  }
  
  cancelConsultation(appointmentId: string | undefined): void {
    if (!appointmentId) {
      alert('Nie można odwołać tej konsultacji, brak ID.');
      return;
    }
  
    if (confirm('Czy na pewno chcesz odwołać tę konsultację?')) {
      this.dataService.deleteAppointment(appointmentId).subscribe({
        next: () => {
          alert('Konsultacja została odwołana.');
          this.loadData(); // Odśwież dane kalendarza po odwołaniu
        },
        error: (err) => {
          console.error('Błąd podczas odwoływania konsultacji:', err);
          alert('Nie udało się odwołać konsultacji.');
        },
      });
    }
  }
  

  getSlotColor(type: string | null): string {
    return type && type in this.visitTypes ? this.visitTypes[type as VisitType] : 'white';
  }
  
  getSlotType(slot: TimeSlot): VisitType | 'Dostępny' | "Termin niedostępny" | "Empty" {
    return slot.type;
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
    today.setHours(0, 0, 0, 0); 
    return date.getTime() < today.getTime();
  }
  
  checkConflictsWithAbsences(): void {
    this.absences.forEach((absence) => {
      const absenceStart = new Date(absence.startDate);
      const absenceEnd = new Date(absence.endDate);
      absenceEnd.setHours(23, 59, 59, 999);
  
      this.appointments.forEach((appointment: any) => {
        const appointmentDate = new Date(appointment.date);
  
        if (appointmentDate >= absenceStart && appointmentDate <= absenceEnd) {
          appointment.status = 'odwołana';
  
          this.dataService.updateAppointment(appointment).subscribe({
            error: (err) => console.error('Błąd podczas aktualizacji wizyty:', err),
          });
        }
      });
    });
  }
  
}