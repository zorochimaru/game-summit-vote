import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { AuthService, RouterLinks } from '../../core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  #authService = inject(AuthService);
  #router = inject(Router);

  protected logOut(): void {
    this.#authService
      .signOut()
      .subscribe(() => this.#router.navigate([RouterLinks.login]));
  }
}
