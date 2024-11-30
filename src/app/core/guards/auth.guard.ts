import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '@core';
import { Observable } from 'rxjs';

export const authGuard: CanMatchFn = (): Observable<boolean> => {
  const auth = inject(AuthService);

  return auth.isAuthenticated$;
};
