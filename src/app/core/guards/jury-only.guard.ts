import { inject } from '@angular/core';
import {
  CanMatchFn,
  Route,
  Router,
  UrlSegment,
  UrlTree
} from '@angular/router';

import { queryParamKeys } from '../constants';
import { Roles, RouterLinks } from '../interfaces';
import { AuthService } from '../services';

export const juryOnlyGuard: CanMatchFn = (
  _route: Route,
  segments: UrlSegment[]
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const path = segments.map(segment => segment.path).join('/');
  const queryParams = window.location.search ? window.location.search : '';
  const redirectLink = `${path}${queryParams}`;

  if (auth.authUser()?.role !== Roles.user) {
    return true;
  }

  return router.createUrlTree([`/${RouterLinks.googleLogin}`], {
    queryParams: { [queryParamKeys.redirectLink]: redirectLink }
  });
};
