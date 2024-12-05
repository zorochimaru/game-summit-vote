import { Routes } from '@angular/router';

import { RouterLinks } from '../core';
import { PrivateService } from './private.service';

export const privateRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./private.component').then(c => c.PrivateComponent),
    providers: [PrivateService],
    children: [
      {
        path: RouterLinks.dashboard,
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            c => c.DashboardComponent
          )
      },
      {
        path: RouterLinks.votePanel,
        loadComponent: () =>
          import('./vote-panel/vote-panel.component').then(
            c => c.VotePanelComponent
          )
      },
      {
        path: RouterLinks.adminPanel,
        loadComponent: () =>
          import('./admin-panel/admin-panel.component').then(
            c => c.AdminPanelComponent
          )
      },
      {
        path: '**',
        redirectTo: RouterLinks.dashboard,
        pathMatch: 'full'
      }
    ]
  }
];
