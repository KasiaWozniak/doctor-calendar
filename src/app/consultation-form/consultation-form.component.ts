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
  @Input() slot!: { date: Date; time: string }; 
  @Output() close = new EventEmitter<void>(); 
  @Output() save = new EventEmitter<any>(); 

  consultationDetails = {
    duration: 30, 
    type: '',
    patientName: '',
    patientGender: '',
    patientAge: null,
    notes: ''
  };

  visitTypes: string[] = ['Pierwsza wizyta', 'Wizyta kontrolna', 'Choroba przewlekła', 'Recepta'];

  onClose(): void {
    this.close.emit();
  }

  saveConsultation(): void {
    this.save.emit(this.consultationDetails);
    this.close.emit(); 
  }

  onSubmit(): void {
    this.save.emit({}); 
  }
}
