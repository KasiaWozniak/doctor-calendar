import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:5000'; 

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/availability`);
  }

  saveAppointment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, data);
  }
  
  addAppointment(appointment: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/appointments`, appointment, { headers });
  }

  addAvailability(availability: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/availability`, availability, { headers }).pipe(
      catchError((err) => {
        console.error('Błąd w addAvailability:', err);
        throw err;
      })
    );
  }

  getAvailability(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/availability`); 
  }
  
  getAppointments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/appointments`);
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
    const appointmentId = appointment.id || appointment._id; 
  
    if (!appointmentId) {
      console.error('Błąd: ID wizyty jest undefined:', appointment);
      return throwError(() => new Error('ID wizyty jest wymagane')); 
    }
  
    return this.http.put(`${this.apiUrl}/appointments/${appointmentId}`, appointment);
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
  
  deleteAvailability(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/availability/${id}`);
  }

  updateAvailability(id: string, availability: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/availability/${id}`, availability);
  }

  registerUser(user: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, user);
  }
  
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials);
  }
  

}
