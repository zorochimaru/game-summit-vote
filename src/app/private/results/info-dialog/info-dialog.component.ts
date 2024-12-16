import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'app-info-dialog',
  imports: [JsonPipe],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoDialogComponent {
  #dialogRef = inject(DialogRef);

  protected readonly data =
    inject<Record<string, string | number>>(DIALOG_DATA);

  protected close(): void {
    this.#dialogRef.close();
  }
}
