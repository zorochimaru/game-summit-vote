import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';

import {
  AuthService,
  AuthUser,
  FirestoreCollections,
  FirestoreService,
  RouterLinks
} from '../../core';
import { CardLink } from './card-link.interface';
import { dashboardCards } from './cards.constant';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, RouterLink, MatRippleModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  #authService = inject(AuthService);
  #firestoreService = inject(FirestoreService);
  #dr = inject(DestroyRef);

  protected cardLinks = signal<CardLink[]>([]);

  protected votePanelRouterLink = RouterLinks.votePanel;

  public ngOnInit(): void {
    this.#authService.currentUser$
      .pipe(
        filter(Boolean),
        switchMap(user =>
          this.#firestoreService.get<AuthUser>(
            FirestoreCollections.authUsers,
            user.uid
          )
        ),
        filter(Boolean),
        takeUntilDestroyed(this.#dr)
      )
      .subscribe(user => {
        const role = user.role;
        this.cardLinks.set(dashboardCards[role]);
      });
  }
}
