import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { queryParamKeys } from '../../core';
import { CriteriaFirestore } from '../core';

@Component({
  selector: 'app-vote-panel',
  imports: [
    MatSliderModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule
  ],

  templateUrl: './vote-panel.component.html',
  styleUrl: './vote-panel.component.scss'
})
export class VotePanelComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #fb = inject(FormBuilder);

  protected readonly type = toSignal(
    this.#route.queryParams.pipe(map(params => params[queryParamKeys.voteType]))
  );
  protected readonly criterias = signal<CriteriaFirestore[]>([]);

  protected form = this.#fb.group({
    personId: this.#fb.control(''),
    personName: this.#fb.control(''),
    results: this.#fb.array([])
  });

  protected submitResults(): void {}
}
