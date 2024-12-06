import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, forkJoin, map, Observable, switchMap } from 'rxjs';
import { SwiperContainer } from 'swiper/element';

import {
  AuthService,
  AuthUser,
  FirestoreCollections,
  FirestoreService,
  queryParamKeys,
  TypedForm,
  VoteTypes
} from '../../core';
import {
  CommonResult,
  CommonResultFirestore,
  CriteriaFirestore,
  Score
} from '../core';
import { CommonVoteItemFirestore } from '../core/interfaces/common-vote-item-firestore.interface';
import { PrivateService } from '../private.service';
import { ConfirmDialogComponent } from '../shared';

type TResultsArray = FormArray<TypedForm<Score>>;

@Component({
  selector: 'app-vote-panel',
  imports: [
    MatButtonModule,
    MatSliderModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    TitleCasePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  readonly #authService = inject(AuthService);
  readonly #privateService = inject(PrivateService);
  readonly #dialog = inject(MatDialog);

  protected imageSwiper = viewChild<ElementRef<SwiperContainer>>('imageSwiper');
  protected previewSwiper =
    viewChild<ElementRef<SwiperContainer>>('previewSwiper');

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

  readonly #currentUserId = computed(
    () => this.#authService.authUser()?.id || ''
  );

  readonly #finalResults = signal<Map<string, CommonResult>>(
    new Map<string, CommonResult>()
  );

  protected readonly showSubmitButton = computed(() => {
    return this.#finalResults().size === this.personsList().length;
  });

  protected form = this.#fb.group({
    personId: this.#fb.control('', { nonNullable: true }),
    personName: this.#fb.control('', { nonNullable: true }),
    results: this.#fb.array<TypedForm<Score>>([])
  });

  protected get resultsControl(): TResultsArray {
    return this.form.controls.results;
  }

  public ngOnInit(): void {
    if (!this.type()) {
      this.#router.navigate(['/']);
    }

    this.#fetchData();
  }

  protected fetchPersons(): Observable<CommonVoteItemFirestore[]> {
    return this.#firestoreService.getList<CommonVoteItemFirestore>(
      this.#privateService.mapTypeToCollection(this.type()!),
      { orderBy: 'order' }
    );
  }

  protected fetchCriteria(): Observable<CriteriaFirestore[]> {
    return this.#firestoreService.getList<CriteriaFirestore>(
      this.#privateService.mapTypeToCriteriaCollection(this.type()!)
    );
  }

  protected selectActivePerson(index: number): void {
    this.imageSwiper()?.nativeElement?.swiper?.slideTo(index);
    this.onSlideChange();
  }

  protected onSlideChange(): void {
    const newPersonIndex =
      this.imageSwiper()?.nativeElement?.swiper?.activeIndex;
    const newPerson = this.personsList()[newPersonIndex!];
    this.activePerson.set(newPerson);

    const mappedDescription = this.#mapPersonDescription(newPerson);
    this.descriptionInfo.set(mappedDescription);

    this.form.patchValue({
      personId: newPerson.id,
      personName: newPerson.name
    });

    for (const group of this.resultsControl.controls) {
      const score = this.#finalResults()
        .get(newPerson.id)
        ?.results.find(c => c.criteriaId === group.value.criteriaId)?.score;
      group.patchValue({ score: score || 0 });
    }
  }

  protected submitResults(): void {
    this.#dialog
      .open(ConfirmDialogComponent)
      .afterClosed()
      .subscribe(res => {
        if (res) {
          const results = Array.from(this.#finalResults().values());

          this.#firestoreService
            .create<CommonResultFirestore>(
              this.#privateService.mapTypeToResultsCollection(this.type()!),
              { results }
            )
            .pipe(
              switchMap(() =>
                this.#firestoreService.update<AuthUser>(
                  FirestoreCollections.authUsers,
                  this.#authService.authUser()?.id!,
                  {
                    votedTypes: [
                      ...this.#authService.authUser()?.votedTypes!,
                      this.type()!
                    ]
                  }
                )
              ),
              switchMap(() =>
                this.#firestoreService.get<AuthUser>(
                  FirestoreCollections.authUsers,
                  this.#authService.authUser()!.id
                )
              ),
              filter(Boolean),
              takeUntilDestroyed(this.#dr)
            )
            .subscribe(updatedUser => {
              this.#authService.setCurrentUser(updatedUser);
              localStorage.removeItem(
                `${this.#currentUserId()}-${this.type()}-form`
              );
              this.#router.navigate(['/']);
            });
        }
      });
  }

  protected saveResult(id: string): void {
    const result = this.form.getRawValue();
    this.#finalResults.update(prev => {
      prev.set(id, result);
      return new Map(prev);
    });

    const values = Array.from(this.#finalResults().values());
    localStorage.setItem(
      `${this.#currentUserId()}-${this.type()}-form`,
      JSON.stringify(values)
    );
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

  #mapPersonDescription(
    person: CommonVoteItemFirestore
  ): { label: string; value: string }[] {
    return Object.keys(person)
      .map(key => ({
        label: key,
        value: `${person[key]}`
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
  }

  #fetchData(): void {
    forkJoin([this.fetchPersons(), this.fetchCriteria()])
      .pipe(takeUntilDestroyed(this.#dr))
      .subscribe(([persons, criterias]) => {
        const formCache = localStorage.getItem(
          `${this.#currentUserId()}-${this.type()}-form`
        );

        if (formCache) {
          const results = JSON.parse(formCache) as CommonResult[];
          for (const element of results) {
            this.#finalResults.update(map =>
              map.set(element.personId, element)
            );
          }
        }

        // Set active person
        this.form.patchValue({
          personId: persons[0].id,
          personName: persons[0].name
        });
        this.activePerson.set(persons[0]);

        // Set description info for the active person
        const mappedDescription = this.#mapPersonDescription(persons[0]);
        this.descriptionInfo.set(mappedDescription);

        // Set all persons list
        this.personsList.set(persons);

        // Set criterias
        const sortedCriterias = criterias.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        for (const criteria of sortedCriterias) {
          const score = this.#finalResults()
            .get(persons[0].id)
            ?.results.find(x => x.criteriaId === criteria.id)?.score;

          this.#addResultControls(criteria, score);
        }
        this.criterias.set(sortedCriterias);
      });
  }
}
