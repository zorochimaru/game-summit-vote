import { Dialog, DIALOG_DATA, DialogModule } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-image-dialog',
  imports: [MatDialogContent],
  templateUrl: './image-dialog.component.html',
  styleUrl: './image-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageDialogComponent {
  protected readonly src = inject<string>(DIALOG_DATA);
}
