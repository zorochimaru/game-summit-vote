import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, of, switchMap } from 'rxjs';
import { read, utils } from 'xlsx';

import {
  FirestoreBatchWriteItem,
  FirestoreCollections,
  FirestoreService,
  Operations,
  StorageFolders,
  UploadService,
  VoteTypes
} from '../../core';
import {
  Cosplay,
  CosplayFirestore,
  ExcelFileFields,
  Kpop,
  KpopFirestore
} from '../core';

type VoteItem = Kpop | Cosplay;

@Component({
  selector: 'app-admin-panel',
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatTableModule,
    TitleCasePipe
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent {
  readonly #firestoreService = inject(FirestoreService);
  readonly #dr = inject(DestroyRef);
  readonly #upload = inject(UploadService);
  readonly #snackBar = inject(MatSnackBar);

  protected rows = signal<VoteItem[]>([]);
  protected images = signal<{ preview: string; file?: File }[]>([]);
  protected displayedColumns = signal<string[]>([]);

  protected types = signal([
    VoteTypes.cosplay,
    VoteTypes.cosplayTeam,
    VoteTypes.kpop
  ]);

  protected typeControl = new FormControl(VoteTypes.cosplay, {
    nonNullable: true
  });

  protected fetchData(): void {
    const collection = this.#mapTypeToCollection(
      this.typeControl.getRawValue()
    );
    this.#firestoreService
      .getList<CosplayFirestore | KpopFirestore>(collection, {
        orderBy: 'order'
      })
      .subscribe(data => {
        this.displayedColumns.set(
          this.#mapTypeToTableHeaders(this.typeControl.getRawValue())
        );
        this.rows.set(data);
        this.images.set(data.map(item => ({ preview: item.image || '' })));
      });
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
        const rows = utils.sheet_to_json<ExcelFileFields>(worksheet, {
          raw: true
        });
        const columns = Object.keys(rows[0]);
        this.displayedColumns.set([...columns, 'image']);
        const orderedRows = rows.map((x, i) => ({
          ...x,
          order: i + 1
        }));
        this.rows.set(orderedRows);
        this.images.set(
          orderedRows.map(item => ({
            preview: item.image || ''
          }))
        );
      };
      reader.readAsArrayBuffer(file);
    }
  }

  protected setImages(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.images.set([]);
    if (fileList?.length) {
      const sortedByNameFiles = Array.from(fileList).sort((a, b) => {
        const numA = parseInt(a.name.match(/^\d+/)![0], 10); // Extract and parse the number
        const numB = parseInt(b.name.match(/^\d+/)![0], 10);
        return numA - numB; // Sort numerically
      });
      for (const file of sortedByNameFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          this.images.update(prev => [...prev, { preview: base64, file }]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  protected updateImage(event: Event, index: number): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
      const file = fileList[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.images.update(prev => {
          const newImages = [...prev];
          newImages[index] = { preview: base64, file };
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    }
  }

  protected editRow(data: unknown): void {
    console.log(data);
  }

  protected onSave(): void {
    const imageRequests = this.images().map(img =>
      img.file
        ? this.#upload.upload(
            img.file,
            this.#mapTypeToStorageFolder(this.typeControl.getRawValue())
          )
        : of({ progress: 100, url: img.preview })
    );

    forkJoin([...imageRequests])
      .pipe(
        switchMap(imageRes => {
          const items: FirestoreBatchWriteItem<
            Partial<KpopFirestore | CosplayFirestore>
          >[] = this.rows().map((item, i) => ({
            operation: item['id'] ? Operations.update : Operations.create,
            docId:
              (item['id'] as string) ||
              this.#generateId(this.typeControl.getRawValue()),
            collectionName: this.#mapTypeToCollection(
              this.typeControl.getRawValue()
            ),
            data: { ...item, image: imageRes[i].url }
          }));
          const batchReqs = this.#firestoreService.batchSave(items);
          return batchReqs;
        }),
        takeUntilDestroyed(this.#dr)
      )
      .subscribe(() => {
        this.rows.set([]);
        this.displayedColumns.set([]);
        this.images.set([]);
        this.#snackBar.open('Data updated!');
      });
  }

  #mapTypeToTableHeaders(type: VoteTypes): string[] {
    switch (type) {
      case VoteTypes.cosplay:
        return [
          'name',
          'count',
          'fandom',
          'fandomType',
          'costumeType',
          'image'
        ];
      case VoteTypes.cosplayTeam:
        return [
          'name',
          'count',
          'fandom',
          'fandomType',
          'costumeType',
          'image'
        ];
      case VoteTypes.kpop:
        return [
          'name',
          'count',
          'fandom',
          'fandomType',
          'costumeType',
          'image'
        ];
    }
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
  #mapTypeToStorageFolder(type: VoteTypes): StorageFolders {
    switch (type) {
      case VoteTypes.cosplay:
        return StorageFolders.cosplay;
      case VoteTypes.cosplayTeam:
        return StorageFolders.cosplayTeam;
      case VoteTypes.kpop:
        return StorageFolders.kpop;
    }
  }

  #generateId(type: VoteTypes): string {
    return this.#firestoreService.autoId(this.#mapTypeToCollection(type));
  }
}
