import { Routes } from '@angular/router';

import { RouterLinks } from '../core';

export const privateRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./private.component').then(c => c.PrivateComponent),
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
        path: '**',
        redirectTo: RouterLinks.dashboard,
        pathMatch: 'full'
      }
    ]
  }
];
