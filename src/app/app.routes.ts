import { Routes, RouterModule } from '@angular/router';
import { CalendarComponent } from './calendar/calendar.component';
import { AvailabilityComponent } from './availability/availability.component';
import { HttpClientModule } from '@angular/common/http';
import { AbsenceComponent } from './absence/absence.component';
import { CartComponent } from './cart/cart.component';


export const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'calendar', component: CalendarComponent },
  { path: 'availability', component: AvailabilityComponent },
  { path: 'absence', component: AbsenceComponent },
  { path: 'cart', component: CartComponent },
];

export const appImports = [
  HttpClientModule,
  RouterModule.forRoot(routes), 
];