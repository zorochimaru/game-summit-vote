import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  numberAttribute,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-slider',
  imports: [MatSliderModule],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ]
})
export class SliderComponent implements ControlValueAccessor {
  public label = input('');
  public showTickMarks = input(false, { transform: booleanAttribute });
  public min = input(0, { transform: numberAttribute });
  public max = input.required({ transform: numberAttribute });
  public step = input.required({ transform: numberAttribute });
  public discrete = input(false, { transform: booleanAttribute });

  protected value = signal(0);
  protected isDisabled = signal(false);

  #changeFn?: (value: number) => void;
  #touchFn?: () => void;

  public registerOnChange(fn: (value: number) => void): void {
    this.#changeFn = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.#touchFn = fn;
  }
  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  public writeValue(score: number): void {
    this.value.set(score);
  }

  protected onTouched(): void {
    this.#touchFn?.();
  }

  protected onChange(value: number): void {
    this.#changeFn?.(value);
  }
}
