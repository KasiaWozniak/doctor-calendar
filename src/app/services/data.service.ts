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
}
