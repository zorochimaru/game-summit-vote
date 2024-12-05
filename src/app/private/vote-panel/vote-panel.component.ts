import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import {
  FirestoreService,
  queryParamKeys,
  TypedForm,
  VoteTypes
} from '../../core';
import { CriteriaFirestore } from '../core';
import { CommonVoteItemFirestore } from '../core/interfaces/common-vote-item-firestore.interface';
import { PrivateService } from '../private.service';
import { SliderComponent } from '../shared';

interface Result {
  criteriaId: string;
  criteriaName: string;
  score: number;
}

type TResultsArray = FormArray<TypedForm<Result>>;

@Component({
  selector: 'app-vote-panel',
  imports: [
    SliderComponent,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vote-panel.component.html',
  styleUrl: './vote-panel.component.scss'
})
export class VotePanelComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #fb = inject(FormBuilder);
  readonly #dr = inject(DestroyRef);
  readonly #firestoreService = inject(FirestoreService);
  readonly #privateService = inject(PrivateService);

  protected readonly type = toSignal<VoteTypes>(
    this.#route.queryParams.pipe(map(params => params[queryParamKeys.voteType]))
  );
  protected readonly criterias = signal<CriteriaFirestore[]>([]);
  protected readonly personsList = signal<CommonVoteItemFirestore[]>([]);

  protected readonly activePerson = signal<CommonVoteItemFirestore | null>(
    null
  );

  protected readonly descriptionInfo = signal<
    { label: string; value: string }[]
  >([]);

  protected form = this.#fb.group({
    personId: this.#fb.control(''),
    personName: this.#fb.control(''),
    results: this.#fb.array<TypedForm<Result>>([])
  });

  protected get resultsControl(): TResultsArray {
    return this.form.controls.results;
  }

  public ngOnInit(): void {
    if (!this.type()) {
      this.#router.navigate(['/']);
    }
  }

  protected fetchPersons(): void {
    this.#firestoreService
      .getList<CommonVoteItemFirestore>(
        this.#privateService.mapTypeToCollection(this.type()!)
      )
      .pipe(takeUntilDestroyed(this.#dr))
      .subscribe(res => {
        this.form.patchValue({ personId: res[0].id, personName: res[0].name });
        this.activePerson.set(res[0]);

        const mappedDescription = Object.keys(res[0])
          .map(key => ({
            label: key,
            value: `${res[0][key]}`
          }))
          .filter(
            item =>
              item.label !== 'id' &&
              item.label !== 'createdAt' &&
              item.label !== 'updatedAt' &&
              item.label !== 'createdBy' &&
              item.label !== 'updatedBy' &&
              item.label !== 'order' &&
              item.label !== 'image'
          )
          .sort((a, b) => a.label.localeCompare(b.label));

        this.descriptionInfo.set(mappedDescription);
        this.personsList.set(res);
      });
  }

  protected fetchCriteria(): void {
    this.#firestoreService
      .getList<CriteriaFirestore>(
        this.#privateService.mapTypeToCriteriaCollection(this.type()!)
      )
      .subscribe(criterias => {
        const sortedCriterias = criterias.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        for (const item of sortedCriterias) {
          this.#addResultControls(item);
        }
        this.criterias.set(sortedCriterias);
      });
  }

  protected submitResults(): void {
    console.log(this.form.getRawValue());
  }

  #addResultControls(criteria: CriteriaFirestore, score = 0): void {
    this.resultsControl.push(
      this.#fb.nonNullable.group({
        criteriaId: [criteria.id],
        criteriaName: [criteria.name],
        score
      })
    );
  }
}
