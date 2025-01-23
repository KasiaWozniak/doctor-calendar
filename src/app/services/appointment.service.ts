// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { throwError } from 'rxjs';

// @Injectable({
//     providedIn: 'root',
// })
// export class AppointmentService {
//     private apiUrl = 'http://localhost:5000/appointments';

//     constructor(private http: HttpClient) {}

//     getAppointments(): Observable<any> {
//         return this.http.get(this.apiUrl).pipe(
//             catchError((error) => {
//                 console.error('Error fetching appointments:', error);
//                 return throwError(() => error);
//             })
//         );
//     }

//     addAppointment(data: any): Observable<any> {
//         return this.http.post(this.apiUrl, data).pipe(
//             catchError((error) => {
//                 console.error('Error adding appointment:', error);
//                 return throwError(() => error);
//             })
//         );
//     }
    

//     deleteAppointment(id: string): Observable<any> {
//         return this.http.delete(`${this.apiUrl}/${id}`);
//     }
// }
