import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dataUrl = 'assets/data.json'; // Ścieżka do pliku JSON

  constructor(private http: HttpClient) {
    console.log('DataService został zainicjowany.');
  }

  getData(): Observable<any> {
    return this.http.get(this.dataUrl);
  }
}
