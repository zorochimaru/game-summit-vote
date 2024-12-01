import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { queryParamKeys } from '../../core';

@Component({
  selector: 'app-vote-panel',
  imports: [MatSliderModule, MatButtonModule, MatIconModule],

  templateUrl: './vote-panel.component.html',
  styleUrl: './vote-panel.component.scss'
})
export class VotePanelComponent {
  readonly #route = inject(ActivatedRoute);

  readonly type = toSignal(
    this.#route.queryParams.pipe(map(params => params[queryParamKeys.voteType]))
  );

  protected submitResults(): void {}
}
