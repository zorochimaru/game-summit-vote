import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  Pipe,
  PipeTransform,
  signal
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin, map } from 'rxjs';

import { FirestoreService, VoteTypes } from '../../core';
import { CommonResultFirestore } from '../core';
import { PrivateService } from '../private.service';
import { ImageDialogComponent } from '../shared';

interface VoteTable {
  voteType: VoteTypes;
  results: PersonScore[];
}

interface PersonScore {
  personName: string;
  personImg: string;
  totalScores: { [criteriaName: string]: number };
}

@Pipe({ name: 'orderBy' })
export class OrderByPipe implements PipeTransform {
  transform(
    personScores: PersonScore[],
    sortKey: string,
    sortOrder: 'asc' | 'desc'
  ): PersonScore[] {
    return personScores.slice().sort((a, b) => {
      let valueA =
        sortKey === 'totalScore'
          ? Object.values(a.totalScores).reduce((sum, score) => sum + score, 0)
          : a.totalScores[sortKey] !== undefined
            ? a.totalScores[sortKey]
            : (a as any)[sortKey];
      let valueB =
        sortKey === 'totalScore'
          ? Object.values(b.totalScores).reduce((sum, score) => sum + score, 0)
          : b.totalScores[sortKey] !== undefined
            ? b.totalScores[sortKey]
            : (b as any)[sortKey];

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }
}

@Component({
  selector: 'app-results',
  imports: [MatTabsModule, OrderByPipe],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsComponent implements OnInit {
  readonly #fireStoreService = inject(FirestoreService);
  readonly #privateService = inject(PrivateService);
  readonly #dialog = inject(Dialog);

  protected readonly activeTable = signal<VoteTable | null>(null);

  protected allTabsData = signal<Map<VoteTypes, PersonScore[]>>(new Map());
  protected readonly tabs = computed(() => {
    return Array.from(this.allTabsData().entries())
      .filter(([_, personScores]) => personScores.length > 0)
      .map(([voteType, _]) => voteType);
  });

  protected sortKey = signal('totalScore');
  protected sortOrder = signal<'asc' | 'desc'>('desc');

  public ngOnInit(): void {
    const resultsReqs = Object.values(VoteTypes).map(voteType => {
      return this.#fireStoreService
        .getList<CommonResultFirestore>(
          this.#privateService.mapTypeToResultsCollection(voteType)
        )
        .pipe(map(res => ({ voteType, juryResults: res })));
    });

    forkJoin(resultsReqs)
      .pipe(map(res => this.mapResultsToPersonScoresByVoteType(res)))
      .subscribe(res => {
        this.allTabsData.set(new Map(res));
        this.activeTable.set({
          voteType: this.tabs()[0],
          results: res.get(this.tabs()[0]) || []
        });
      });
  }

  protected tabChanged(index: number): void {
    this.activeTable.set({
      voteType: this.tabs()[index],
      results: this.allTabsData().get(this.tabs()[index]) || []
    });
  }

  protected changeSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortOrder.update(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortOrder.set('asc');
    }
    this.activeTable.update(table => {
      if (table) {
        return {
          ...table,
          results: [...table.results] // Trigger re-evaluation of the sorted results
        };
      }
      return table;
    });
  }

  private mapResultsToPersonScoresByVoteType(
    results: any[]
  ): Map<VoteTypes, PersonScore[]> {
    const resultsMap = new Map<VoteTypes, PersonScore[]>();

    results.forEach(result => {
      if (result.juryResults) {
        const personScores = this.mapResultsToPersonScores(result.juryResults);
        resultsMap.set(result.voteType, personScores);
      }
    });

    return resultsMap;
  }

  private mapResultsToPersonScores(juryResults: any[]): PersonScore[] {
    const personScoresMap: { [personId: string]: PersonScore } = {};

    juryResults.forEach(juryResult => {
      juryResult.results.forEach((personResult: any) => {
        const personId = personResult.personId;
        const personName = personResult.personName;
        const personImg = personResult.personImg;

        if (!personScoresMap[personId]) {
          personScoresMap[personId] = {
            personName,
            personImg,
            totalScores: {}
          };
        }

        personResult.results.forEach((score: any) => {
          const criteriaName = score.criteriaName;
          if (!personScoresMap[personId].totalScores[criteriaName]) {
            personScoresMap[personId].totalScores[criteriaName] = 0;
          }
          personScoresMap[personId].totalScores[criteriaName] += score.score;
        });
      });
    });

    return Object.values(personScoresMap);
  }

  protected getCriteriaNames(personScores: PersonScore[]): string[] {
    const criteriaSet = new Set<string>();
    personScores.forEach(personScore => {
      Object.keys(personScore.totalScores).forEach(criteria => {
        criteriaSet.add(criteria);
      });
    });
    return Array.from(criteriaSet);
  }

  protected getTotalScore(person: PersonScore): number {
    return Object.values(person.totalScores).reduce((a, b) => a + b, 0);
  }

  protected openImageDialog(src: string): void {
    this.#dialog.open(ImageDialogComponent, { data: src });
  }
}
