import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { AuthService } from '../core';

@Component({
  selector: 'app-login',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  #authService = inject(AuthService);
  #dr = inject(DestroyRef);
  #router = inject(Router);

  protected modeControl = new FormControl(true, { nonNullable: true });

  protected form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true
    })
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    if (this.modeControl.getRawValue()) {
      this.#onSignIn(email, password);
    } else {
      this.#onSignUp(email, password);
    }
  }

  protected toggleMode(): void {
    this.modeControl.patchValue(!this.modeControl.getRawValue());
  }

  #onSignUp(email: string, password: string): void {
    this.#authService
      .signUp(email, password)
      .pipe(takeUntilDestroyed(this.#dr))
      .subscribe(() => {
        this.form.reset();
      });
  }

  #onSignIn(email: string, password: string): void {
    this.#authService
      .signIn(email, password)
      .pipe(takeUntilDestroyed(this.#dr))
      .subscribe(() => {
        this.#router.navigate(['/']);
      });
  }
}
