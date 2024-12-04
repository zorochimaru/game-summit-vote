import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthService, RouterLinks } from '../../core';
import { dashboardCards } from './cards.constant';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, RouterLink, MatRippleModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  #authService = inject(AuthService);

  protected cardLinks = computed(() => {
    const authUser = this.#authService.authUser();
    if (!authUser) {
      return [];
    }
    return dashboardCards[authUser.role];
  });

  protected votePanelRouterLink = RouterLinks.votePanel;
}
