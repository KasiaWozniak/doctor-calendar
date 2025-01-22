import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css']
})
export class ConsultationFormComponent {
  @Input() slot!: { date: Date; time: string }; // Dane o wybranym slocie
  @Output() close = new EventEmitter<void>(); // Wyemitowanie zdarzenia zamknięcia
  @Output() save = new EventEmitter<any>(); // Wyemitowanie zdarzenia zapisu danych

  // Przykładowe pola formularza
  consultationDetails = {
    duration: 30, // Domyślnie 30 minut
    type: '',
    patientName: '',
    patientGender: '',
    patientAge: null,
    notes: ''
  };

  // Lista dostępnych typów wizyt
  visitTypes: string[] = ['Pierwsza wizyta', 'Wizyta kontrolna', 'Choroba przewlekła', 'Recepta'];

  // Obsługa zamknięcia formularza
  onClose(): void {
    this.close.emit();
  }

  // Obsługa zapisu rezerwacji
  saveConsultation(): void {
    // Emituj dane konsultacji, aby zapisać
    this.save.emit(this.consultationDetails);
    this.close.emit(); // Zamknij formularz po zapisaniu
  }

  onSubmit(): void {
    this.save.emit({}); // Emituj dane formularza
  }
}
