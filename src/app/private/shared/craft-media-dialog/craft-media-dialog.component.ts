import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SwiperContainer } from 'swiper/element';

import { CraftMedia } from '../../core';

export interface CraftMediaDialogData {
  media: CraftMedia[];
  title: string;
}

@Component({
  selector: 'app-craft-media-dialog',
  imports: [MatIcon, MatIconButton],
  templateUrl: './craft-media-dialog.component.html',
  styleUrl: './craft-media-dialog.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CraftMediaDialogComponent implements OnDestroy {
  readonly #dialogRef = inject(DialogRef);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly data = inject<CraftMediaDialogData>(DIALOG_DATA);
  protected readonly currentIndex = signal(0);

  public constructor() {
    this.#dialogRef.closed
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.#pauseAllVideos());
  }

  public ngOnDestroy(): void {
    this.#pauseAllVideos();
  }

  protected close(): void {
    this.#dialogRef.close();
  }

  protected onSlideChange(event: Event): void {
    this.#pauseAllVideos();
    const swiper = (event.target as SwiperContainer).swiper;
    this.currentIndex.set(swiper.activeIndex);
  }

  #pauseAllVideos(): void {
    this.#host.nativeElement
      .querySelectorAll('video')
      .forEach(video => video.pause());
  }
}
