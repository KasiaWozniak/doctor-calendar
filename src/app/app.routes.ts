import { Routes, RouterModule } from '@angular/router';
import { CalendarComponent } from './calendar/calendar.component';
import { AvailabilityComponent } from './availability/availability.component';
import { HttpClientModule } from '@angular/common/http';
import { AbsenceComponent } from './absence/absence.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './services/auth.guard';


export const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'availability', component: AvailabilityComponent, canActivate: [AuthGuard]  },
  { path: 'absence', component: AbsenceComponent, canActivate: [AuthGuard]  },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard]  },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard]  },

];

export const appImports = [
  HttpClientModule,
  RouterModule.forRoot(routes), 
];