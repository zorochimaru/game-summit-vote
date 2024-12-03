import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { map, switchMap } from 'rxjs';
import { read, utils } from 'xlsx';

import { FirestoreCollections, FirestoreService, VoteTypes } from '../../core';
import { CosplayTeamFirestore } from '../interface';

@Component({
  selector: 'app-admin-panel',
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatTableModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  readonly #firestoreService = inject(FirestoreService);
  readonly #dr = inject(DestroyRef);

  // TODO: Make union type
  protected rows = signal<unknown[]>([]);

  protected types = signal([
    VoteTypes.cosplay,
    VoteTypes.cosplayTeam,
    VoteTypes.kpop
  ]);

  protected typeControl = new FormControl(VoteTypes.cosplay, {
    nonNullable: true
  });

  protected displayedColumns: string[] = [
    'name',
    'count',
    'fandom',
    'fandomType',
    'costumeType',
    'characterDescription',
    'image'
  ];

  public ngOnInit(): void {
    this.typeControl.valueChanges
      .pipe(
        map(this.#mapTypeToCollection),
        switchMap(collection =>
          this.#firestoreService.getList<CosplayTeamFirestore>(collection, {
            orderBy: 'order'
          })
        ),
        takeUntilDestroyed(this.#dr)
      )
      .subscribe(data => this.rows.set(data));
  }

  protected onFileChange(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
      const file = fileList[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const workbook = read(e.target.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = utils.sheet_to_json(worksheet, { raw: true });
        const orderedRows = rows.sort((a: any, b: any) => a.order - b.order);
        this.rows.set(orderedRows);
      };
      reader.readAsArrayBuffer(file);
    }
  }
  protected uploadAndImportImagesByOrder(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
    }
  }

  protected updateImage(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
    }
  }

  protected editRow(data: unknown): void {
    console.log(data);
  }

  protected onSave(): void {
    // TODO: Save data to Firestore
  }

  #mapTypeToCollection(type: VoteTypes): FirestoreCollections {
    switch (type) {
      case VoteTypes.cosplay:
        return FirestoreCollections.cosplaySolo;
      case VoteTypes.cosplayTeam:
        return FirestoreCollections.cosplayTeams;
      case VoteTypes.kpop:
        return FirestoreCollections.kPop;
    }
  }
}
