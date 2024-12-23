import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar.component';
import { AvailabilityComponent } from './availability/availability.component';


export const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'calendar', component: CalendarComponent },
  { path: 'availability', component: AvailabilityComponent },
];
