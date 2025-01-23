import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Router } from '@angular/router'; // Dodano import Router


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  appointments: any[] = []; // Lista konsultacji w koszyku
  totalCost: number = 0;
  paymentDetails = {
    method: 'Karta kredytowa',
    payerName: '',
    cardNumber: '',
  };

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.calculateTotal();
  }

  loadAppointments(): void {
    this.dataService.getAppointments().subscribe({
      next: (data) => {
        // Filtruj wizyty, aby pokazywać tylko te, które nie są opłacone
        this.appointments = data.filter((appt: any) => appt.status !== 'opłacone');
        this.calculateTotal(); // Aktualizuj koszty po załadowaniu
      },
      error: (error) => {
        console.error('Błąd ładowania wizyt:', error);
      },
    });
  }

  calculateTotal(): void {
    // Przykład wyliczania kosztów: każdy slot kosztuje 100 zł
    this.totalCost = this.appointments.reduce((sum, appt) => sum + (appt.duration / 30) * 100, 0);
  }

  removeAppointment(appointmentId: string): void {
    this.dataService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        console.log(`Wizyta ${appointmentId} została usunięta.`);
        this.loadAppointments(); // Odśwież listę wizyt
      },
      error: (err) => {
        console.error('Błąd usuwania wizyty:', err);
      },
    });
  }

  isValidPayerName(name: string): boolean {
    // Walidacja: tylko litery, spacje i polskie znaki
    return /^[A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]+$/.test(name);
  }

  isValidCardNumber(): boolean {
    if (this.paymentDetails.method === 'Blik') {
      // Kod BLIK powinien mieć dokładnie 6 cyfr
      return /^\d{6}$/.test(this.paymentDetails.cardNumber);
    } else {
      // Numer karty/przelewu powinien mieć dokładnie 26 cyfr
      return /^\d{26}$/.test(this.paymentDetails.cardNumber);
    }
  }
  
  
  processPayment(): void {
    if (this.appointments.length === 0) {
      alert('Koszyk jest pusty.');
      return;
    }

    if (!this.isValidPayerName(this.paymentDetails.payerName)) {
      alert('Wprowadź poprawne dane płatnika (tylko litery).');
      return;
    }

    if (!this.isValidCardNumber()) {
      alert(
        this.paymentDetails.method === 'BLIK'
          ? 'Wprowadź poprawny 6-cyfrowy kod BLIK.'
          : 'Wprowadź poprawny 26-cyfrowy numer karty/przelewu.'
      );
      return;
    }

    if (!this.paymentDetails.payerName || !this.paymentDetails.cardNumber) {
      alert('Proszę wypełnić wszystkie dane płatności.');
      return;
    }

    // Oznacz wizyty jako opłacone
    const updatedAppointments = this.appointments.map((appt) => {
      return { ...appt, status: 'opłacone' };
    });

    console.log('Updated Appointments:', updatedAppointments); // Dodaj to logowanie


    // Zaktualizuj status wizyt w serwerze
    updatedAppointments.forEach((appt) => {
      console.log('Updating appointment with ID:', appt.id || appt._id); // Dodaj to logowanie
      if (!appt.id && !appt._id) {
        console.error('Błąd: ID wizyty jest undefined:', appt);
        return;
      }
      this.dataService.updateAppointment(appt).subscribe({
        next: () => console.log(`Wizyta ${appt.id||appt._id} została oznaczona jako opłacona.`),
        error: (err) => console.error('Błąd aktualizacji wizyty:', err),
      });
    });

    alert('Płatność została zrealizowana!');
    this.router.navigate(['/calendar']); // Przekierowanie do kalendarza
  }
}