import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-private',
  imports: [RouterOutlet],
  templateUrl: './private.component.html',
  styleUrl: './private.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateComponent {}
