import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000'; // Podstawowy URL

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/availability`); // Jeśli dane dotyczą dostępności
  }

  saveAppointment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, data);
  }
  
  addAppointment(appointment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, appointment);
  }  

  addAvailability(availability: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/availability`, availability);
  }

  getAvailability(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/availability`); // Pobieranie dostępności
  }
  
  getAppointments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/appointments`); // Pobieranie rezerwacji
  }

  getAbsences(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/absences`);
  }
  
  addAbsence(absence: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/absences`, absence);
  }
  
  updateAppointmentStatus(appointmentId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/${appointmentId}`, { status });
  }
  
  updateAppointment(appointment: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${appointment.id}`, appointment);
  }
  
  deleteAbsence(date: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/absences/${date}`);
  }

  updateAbsence(absences: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/absences`, absences);
  }

  deleteAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/appointments/${appointmentId}`);
  }
  

}
