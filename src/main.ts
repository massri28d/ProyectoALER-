import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// Ionicons
import { addIcons } from 'ionicons';
import { informationCircleOutline, camera, cameraOutline } from 'ionicons/icons';

// registra solo una vez los que uses en la app
addIcons({
  'information-circle-outline': informationCircleOutline,
  'camera': camera,
  'camera-outline': cameraOutline,
});


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(), 
  ],
});
