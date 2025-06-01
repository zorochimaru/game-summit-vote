import { Routes } from '@angular/router';

import { adminGuard, AuthService, juryOnlyGuard, RouterLinks } from '../core';
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
        providers: [AuthService],
        canMatch: [juryOnlyGuard],
        loadComponent: () =>
          import('./vote-panel/vote-panel.component').then(
            c => c.VotePanelComponent
          )
      },
      {
        path: RouterLinks.starsVotePanel,
        loadComponent: () =>
          import('./star-vote-panel/star-vote-panel.component').then(
            c => c.StarVotePanelComponent
          )
      },
      {
        path: RouterLinks.adminPanel,
        providers: [AuthService],
        canMatch: [juryOnlyGuard, adminGuard],
        loadComponent: () =>
          import('./admin-panel/admin-panel.component').then(
            c => c.AdminPanelComponent
          )
      },
      {
        path: RouterLinks.results,
        providers: [AuthService],
        canMatch: [juryOnlyGuard],
        loadComponent: () =>
          import('./results/results.component').then(c => c.ResultsComponent)
      },
      {
        path: '**',
        redirectTo: RouterLinks.dashboard,
        pathMatch: 'full'
      }
    ]
  }
];
