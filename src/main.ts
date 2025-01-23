import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TokenInterceptor } from './app/services/token.interceptor';
import { AppComponent } from './app/app.component';
import { routes} from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([TokenInterceptor])),
    provideRouter(routes),
    provideHttpClient()
  ]
}).catch(err => console.error(err));
