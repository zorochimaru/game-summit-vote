import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'app-image-dialog',
  imports: [],
  templateUrl: './image-dialog.component.html',
  styleUrl: './image-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageDialogComponent {
  #dialogRef = inject(DialogRef);

  protected readonly src = inject<string>(DIALOG_DATA);

  protected close(): void {
    this.#dialogRef.close();
  }
}
