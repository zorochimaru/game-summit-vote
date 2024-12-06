import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  Pipe,
  PipeTransform,
  signal
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin, map } from 'rxjs';

import { FirestoreService, VoteTypes } from '../../core';
import { CommonResultFirestore } from '../core';
import { PrivateService } from '../private.service';

interface VoteTable {
  voteType: VoteTypes;
  results: PersonScore[];
}

interface PersonScore {
  personName: string;
  totalScores: { [criteriaName: string]: number };
}

@Pipe({ name: 'orderByTotalScore' })
export class OrderByTotalScorePipe implements PipeTransform {
  transform(personScores: PersonScore[]): PersonScore[] {
    return personScores.slice().sort((a, b) => {
      const totalA = Object.values(a.totalScores).reduce(
        (sum, score) => sum + score,
        0
      );
      const totalB = Object.values(b.totalScores).reduce(
        (sum, score) => sum + score,
        0
      );
      return totalB - totalA;
    });
  }
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
          : (a as any)[sortKey];
      let valueB =
        sortKey === 'totalScore'
          ? Object.values(b.totalScores).reduce((sum, score) => sum + score, 0)
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

  protected readonly tabs = signal(Object.values(VoteTypes));
  protected readonly activeTable = signal<VoteTable | null>(null);

  protected allTabsData!: Map<VoteTypes, PersonScore[]>;

  protected sortKey = 'totalScore';
  protected sortOrder: 'asc' | 'desc' = 'desc';

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
        this.allTabsData = new Map(res);
        this.activeTable.set({
          voteType: this.tabs()[0],
          results: res.get(this.tabs()[0]) || []
        });
      });
  }

  protected tabChanged(index: number): void {
    this.activeTable.set({
      voteType: this.tabs()[index],
      results: this.allTabsData.get(this.tabs()[index]) || []
    });
  }

  protected changeSort(key: string): void {
    if (this.sortKey === key) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortOrder = 'asc';
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

        if (!personScoresMap[personId]) {
          personScoresMap[personId] = { personName, totalScores: {} };
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
}
