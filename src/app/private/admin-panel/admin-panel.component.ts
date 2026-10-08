import { Dialog } from '@angular/cdk/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MatChipEditedEvent,
  MatChipInputEvent,
  MatChipsModule
} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  catchError,
  EMPTY,
  filter,
  finalize,
  forkJoin,
  of,
  switchMap,
  tap
} from 'rxjs';
import { read, utils } from 'xlsx';

import {
  AuthService,
  AuthUser,
  FirestoreBatchDeleteItem,
  FirestoreBatchWriteItem,
  FirestoreCollections,
  FirestoreService,
  Operations,
  StorageFolders,
  UploadService,
  VoteTypes
} from '../../core';
import { filterPredicate } from '../../utils';
import {
  Cosplay,
  CosplayFirestore,
  CraftMedia,
  Criteria,
  CriteriaFirestore,
  ExcelFileFields,
  Kpop,
  KpopFirestore
} from '../core';
import { PrivateService } from '../private.service';
import { ConfirmDialogComponent, MessageDialogComponent } from '../shared';

type VoteItem = Kpop | Cosplay;

@Component({
  selector: 'app-admin-panel',
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatTableModule,
    TitleCasePipe,
    MatChipsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent {
  readonly #firestoreService = inject(FirestoreService);
  readonly #authService = inject(AuthService);
  readonly #dr = inject(DestroyRef);
  readonly #upload = inject(UploadService);
  readonly #snackBar = inject(MatSnackBar);
  readonly #privateService = inject(PrivateService);
  readonly #dialog = inject(Dialog);

  protected processing = signal(false);
  protected progressLabel = signal('');
  protected criterias = signal<Criteria[] | CriteriaFirestore[]>([]);
  protected rows = signal<VoteItem[]>([]);
  protected images = signal<{ preview: string; file?: File }[]>([]);
  protected craftMedia = signal<{ existing: CraftMedia[]; files: File[] }[]>(
    []
  );
  protected craftMediaLabels = computed(() =>
    this.craftMedia().map(({ existing, files }) => {
      if (files.length) {
        const videos = files.filter(f => f.type.startsWith('video')).length;
        return `${files.length} files (${files.length - videos} 📷 / ${videos} 🎬) · pending`;
      }
      if (!existing.length) {
        return '0 files';
      }
      const existingVideos = existing.filter(m => m.type === 'video').length;
      return `${existing.length} files (${existing.length - existingVideos} 📷 / ${existingVideos} 🎬)`;
    })
  );
  protected displayedColumns = signal<string[]>([]);

  protected types = signal([
    VoteTypes.cosplay,
    VoteTypes.cosplayTeam,
    VoteTypes.kpop
  ]);

  protected typeControl = new FormControl(VoteTypes.cosplay, {
    nonNullable: true
  });

  readonly addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  readonly #deletedCriterias = signal<CriteriaFirestore[]>([]);

  constructor() {
    effect(() => {
      if (this.processing()) {
        this.typeControl.disable({ emitEvent: false });
      } else {
        this.typeControl.enable({ emitEvent: false });
      }
    });
  }

  protected addCriteria(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our criteria
    if (value) {
      this.criterias.update(criterias => [...criterias, { name: value }]);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  protected removeCriteria(criteria: CriteriaFirestore | Criteria): void {
    this.criterias.update(criterias => {
      const index = criterias.findIndex(c => c.name === criteria.name);
      if (index < 0) {
        return criterias;
      }

      criterias.splice(index, 1);

      if (filterPredicate<CriteriaFirestore>(criteria)) {
        this.#deletedCriterias.update(deleted => [...deleted, criteria]);
      }
      return [...criterias];
    });
  }

  protected editCriteria(
    criteria: Criteria | CriteriaFirestore,
    event: MatChipEditedEvent
  ) {
    const value = event.value.trim();

    // Remove criteria if it no longer has a name
    if (!value) {
      this.removeCriteria(criteria);
      return;
    }

    // Edit existing criteria
    this.criterias.update(criterias => {
      const index = criterias.findIndex(c => c.name === criteria.name);
      if (index >= 0) {
        criterias[index].name = value;
        return [...criterias];
      }
      return criterias;
    });
  }

  protected fetchCriterias(): void {
    this.processing.set(true);
    this.#firestoreService
      .getList<CriteriaFirestore>(
        this.#privateService.mapTypeToCriteriaCollection(
          this.typeControl.getRawValue()
        )
      )
      .pipe(
        catchError(err => this.#handleError(err)),
        finalize(() => this.processing.set(false))
      )
      .subscribe(data => {
        this.criterias.set(data);
      });
  }

  protected fetchData(): void {
    const collection = this.#privateService.mapTypeToCollection(
      this.typeControl.getRawValue()
    );
    this.processing.set(true);
    this.#firestoreService
      .getList<CosplayFirestore | KpopFirestore>(collection, {
        orderBy: 'order'
      })
      .pipe(
        catchError(err => this.#handleError(err)),
        finalize(() => this.processing.set(false))
      )
      .subscribe(data => {
        this.displayedColumns.set(
          this.#mapTypeToTableHeaders(this.typeControl.getRawValue())
        );
        this.rows.set(data);
        this.images.set(data.map(item => ({ preview: item.image || '' })));
        this.craftMedia.set(
          data.map(item => ({
            existing:
              ((item as CosplayFirestore).craftMedia as
                | CraftMedia[]
                | undefined) ?? [],
            files: []
          }))
        );
      });
  }

  protected onFileChange(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
      const file = fileList[0];
      const reader = new FileReader();
      this.processing.set(true);
      reader.onload = (e: any) => {
        try {
          const workbook = read(e.target.result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = utils.sheet_to_json<ExcelFileFields>(worksheet, {
            raw: true
          });
          const columns = Object.keys(rows[0]);
          this.displayedColumns.set([
            ...columns,
            'image',
            ...(this.typeControl.getRawValue() === VoteTypes.kpop
              ? []
              : ['craftMedia'])
          ]);
          const orderedRows = rows.map((x, i) => ({
            ...x,
            stars: 0,
            order: i + 1
          }));
          this.rows.set(orderedRows);
          this.images.set(
            orderedRows.map(item => ({
              preview: item.image || ''
            }))
          );
          this.craftMedia.set(
            orderedRows.map(() => ({ existing: [], files: [] }))
          );
        } catch (err) {
          this.#handleError(err);
        } finally {
          this.processing.set(false);
        }
      };
      reader.onerror = () => {
        this.processing.set(false);
        this.#handleError(reader.error);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  protected setImages(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    this.images.set([]);

    if (fileList?.length) {
      this.processing.set(true);
      const sortedByNameFiles = Array.from(fileList).sort((a, b) => {
        const numA = parseInt(a.name.match(/^\d+/)![0], 10);
        const numB = parseInt(b.name.match(/^\d+/)![0], 10);
        return numA - numB;
      });

      // Create an array to hold all the file reading promises with their indices
      const fileReadPromises = sortedByNameFiles.map((file, index) => {
        return new Promise<{ index: number; preview: string; file: File }>(
          (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                index,
                preview: (reader.result as string) || '',
                file
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }
        );
      });

      // When all files are read, update the images array
      Promise.all(fileReadPromises)
        .then(results => {
          // Sort by the original index to ensure correct order
          results.sort((a, b) => a.index - b.index);
          // Map to the format expected by the images signal
          const orderedImages = results.map(item => ({
            preview: item.preview,
            file: item.file
          }));
          this.images.set(orderedImages);
        })
        .catch(err => this.#handleError(err))
        .finally(() => this.processing.set(false));
    }
  }

  protected updateImage(event: Event, index: number): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
      const file = fileList[0];
      const reader = new FileReader();
      this.processing.set(true);
      reader.onload = () => {
        const base64 = reader.result as string;
        this.images.update(prev => {
          const newImages = [...prev];
          newImages[index] = { preview: base64, file };
          return newImages;
        });
        this.processing.set(false);
      };
      reader.onerror = () => {
        this.processing.set(false);
        this.#handleError(reader.error);
      };
      reader.readAsDataURL(file);
    }
  }

  protected setCraftMedia(event: Event, index: number): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList?.length) {
      const files = this.#filterAndSortMedia(Array.from(fileList));
      if (!files.length) {
        return;
      }
      this.craftMedia.update(prev => {
        const next = [...prev];
        next[index] = { existing: prev[index]?.existing ?? [], files };
        return next;
      });
    }
  }

  protected clearCraftMedia(index: number): void {
    this.craftMedia.update(prev => {
      const next = [...prev];
      next[index] = { existing: [], files: [] };
      return next;
    });
  }

  protected setCraftMediaFolder(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (!fileList?.length) {
      return;
    }

    const folders = new Map<number, File[]>();
    let outside = 0;
    for (const file of Array.from(fileList)) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length !== 3 || !/^\d+$/.test(parts[1])) {
        outside++;
        continue;
      }
      const order = Number(parts[1]);
      folders.set(order, [...(folders.get(order) ?? []), file]);
    }

    const orders = new Set(this.rows().map(row => row.order));
    const unmatched: number[] = [];
    const updates = new Map<number, File[]>();
    let nonMedia = 0;
    let matchedFiles = 0;
    for (const [order, files] of [...folders].sort((a, b) => a[0] - b[0])) {
      const { media, dropped } = this.#splitMedia(files);
      nonMedia += dropped;
      if (!orders.has(order)) {
        unmatched.push(order);
        continue;
      }
      if (media.length) {
        updates.set(order, media);
        matchedFiles += media.length;
      }
    }

    if (updates.size) {
      this.craftMedia.update(prev => {
        const next = [...prev];
        for (const [order, files] of updates) {
          next[order - 1] = {
            existing: prev[order - 1]?.existing ?? [],
            files
          };
        }
        return next;
      });
    }

    const skipped: string[] = [];
    if (unmatched.length) {
      skipped.push(`folder ${unmatched.join(', ')} (no participant)`);
    }
    if (nonMedia) {
      skipped.push(`${nonMedia} non-media files`);
    }
    if (outside) {
      skipped.push(`${outside} files outside numbered folders`);
    }
    this.#dialog.open(MessageDialogComponent, {
      data: {
        message: `Matched ${updates.size} folders, ${matchedFiles} files.${
          skipped.length ? ` Skipped: ${skipped.join('; ')}.` : ''
        }`
      }
    });
  }

  protected deleteResults(): void {
    this.#dialog.open(ConfirmDialogComponent).closed.subscribe(res => {
      if (res) {
        this.#deleteAllResults();
      }
    });
  }

  protected deleteAllData(): void {
    this.#dialog.open(ConfirmDialogComponent).closed.subscribe(res => {
      if (res) {
        this.#deleteAllDataInCollection(this.typeControl.getRawValue());
      }
    });
  }

  protected onSaveData(): void {
    const total = this.images().filter(img => img.file).length;
    let completed = 0;
    const imageRequests = this.images().map(img =>
      img.file
        ? this.#upload
            .upload(
              img.file,
              this.#mapTypeToStorageFolder(this.typeControl.getRawValue())
            )
            .pipe(
              tap(res => {
                if (res.progress === 100) {
                  completed++;
                  this.progressLabel.set(
                    `Uploading covers ${completed}/${total}`
                  );
                }
              })
            )
        : of({ progress: 100, url: img.preview })
    );

    this.processing.set(true);
    this.progressLabel.set(total ? `Uploading covers 0/${total}` : '');

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
            collectionName: this.#privateService.mapTypeToCollection(
              this.typeControl.getRawValue()
            ),
            data: { ...item, stars: 0, image: imageRes[i].url }
          }));
          const batchReqs = this.#firestoreService.batchSave(items);
          return batchReqs;
        }),
        catchError(err => this.#handleError(err)),
        finalize(() => {
          this.processing.set(false);
          this.progressLabel.set('');
        }),
        takeUntilDestroyed(this.#dr)
      )
      .subscribe(() => {
        this.rows.set([]);
        this.displayedColumns.set([]);
        this.images.set([]);
        this.craftMedia.set([]);
        this.#snackBar.open('Data updated!', 'Ok', { duration: 3000 });
      });
  }

  protected onSaveCriterias(): void {
    const items: FirestoreBatchWriteItem<Partial<CriteriaFirestore>>[] =
      this.criterias().map(item => ({
        operation: (item as CriteriaFirestore)['id']
          ? Operations.update
          : Operations.create,
        docId:
          ((item as CriteriaFirestore)['id'] as string) ||
          this.#generateId(this.typeControl.getRawValue()),
        collectionName: this.#privateService.mapTypeToCriteriaCollection(
          this.typeControl.getRawValue()
        ),
        data: { ...item }
      }));
    const deleteItems: FirestoreBatchDeleteItem[] =
      this.#deletedCriterias().map(item => ({
        operation: Operations.delete,
        docId: item.id,
        collectionName: this.#privateService.mapTypeToCriteriaCollection(
          this.typeControl.getRawValue()
        )
      }));
    const deleteReqs = this.#firestoreService.batchSave(deleteItems);
    const batchReqs = this.#firestoreService.batchSave(items);

    this.processing.set(true);
    forkJoin([batchReqs, deleteReqs])
      .pipe(
        catchError(err => this.#handleError(err)),
        finalize(() => this.processing.set(false))
      )
      .subscribe(() => {
        this.criterias.set([]);
        this.#snackBar.open('Criteria updated!', 'Ok', { duration: 3000 });
      });
  }

  #mapTypeToTableHeaders(type: VoteTypes): string[] {
    switch (type) {
      case VoteTypes.cosplay:
        return [
          'name',
          'fandom',
          'characterName',
          'sceneDescription',
          'image',
          'craftMedia'
        ];
      case VoteTypes.cosplayTeam:
        return ['name', 'fandom', 'sceneDescription', 'image', 'craftMedia'];
      case VoteTypes.kpop:
        return ['name', 'image'];
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

  #filterAndSortMedia(files: File[]): File[] {
    const { media, dropped } = this.#splitMedia(files);
    if (dropped) {
      this.#snackBar.open(`${dropped} non-media files ignored`, 'Ok', {
        duration: 3000
      });
    }
    return media;
  }

  #splitMedia(files: File[]): { dropped: number; media: File[] } {
    const media = files
      .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
    return { dropped: files.length - media.length, media };
  }

  #generateId(type: VoteTypes): string {
    return this.#firestoreService.autoId(
      this.#privateService.mapTypeToCollection(type)
    );
  }

  #handleError(err: unknown): typeof EMPTY {
    const message = err instanceof Error ? err.message : String(err ?? '');
    this.#snackBar.open(
      `Something went wrong${message ? `: ${message}` : ''}`,
      'Ok',
      {
        duration: 5000
      }
    );
    return EMPTY;
  }

  #deleteAllDataInCollection(type: VoteTypes): void {
    this.processing.set(true);
    this.#firestoreService
      .getList(this.#privateService.mapTypeToCollection(type))
      .pipe(
        filter(Boolean),
        switchMap(res => {
          const items: FirestoreBatchDeleteItem[] = res.map(item => ({
            docId: item.id || '',
            collectionName: this.#privateService.mapTypeToCollection(
              this.typeControl.getRawValue()
            ),
            operation: Operations.delete
          }));
          const batchReqs = this.#firestoreService.batchSave(items);
          return batchReqs;
        }),
        catchError(err => this.#handleError(err)),
        finalize(() => this.processing.set(false))
      )
      .subscribe(() => {
        this.rows.set([]);
        this.displayedColumns.set([]);
        this.images.set([]);
        this.craftMedia.set([]);
        this.#snackBar.open('Data deleted!', 'Ok', { duration: 3000 });
      });
  }

  #deleteAllResults(): void {
    const collections = Object.values(VoteTypes).map(type =>
      this.#privateService.mapTypeToResultsCollection(type)
    );

    const personsCollections = Object.values(VoteTypes).map(type =>
      this.#privateService.mapTypeToCollection(type)
    );

    const personsUpdateRequests = personsCollections.map(collection => {
      return this.#firestoreService.getList(collection).pipe(
        switchMap(list => {
          const items: FirestoreBatchWriteItem<
            Partial<KpopFirestore | CosplayFirestore>
          >[] = list.map(item => ({
            docId: item.id!,
            collectionName: collection,
            operation: Operations.update,
            data: { ...item, stars: 0 }
          }));
          return this.#firestoreService.batchSave(items);
        })
      );
    });

    const requests = collections.map(collection =>
      this.#firestoreService.getList(collection).pipe(
        switchMap(list => {
          const items: FirestoreBatchDeleteItem[] = list.map(item => ({
            docId: item.id || '',
            collectionName: collection,
            operation: Operations.delete
          }));
          return this.#firestoreService.batchSave(items);
        })
      )
    );

    const clearAuthFlagsRequest = this.#firestoreService
      .getList<AuthUser>(FirestoreCollections.authUsers)
      .pipe(
        switchMap(list => {
          const items: FirestoreBatchWriteItem<Partial<AuthUser>>[] = list.map(
            item => ({
              docId: item.id,
              collectionName: FirestoreCollections.authUsers,
              operation: Operations.update,
              data: { votedTypes: [] }
            })
          );
          return this.#firestoreService.batchSave(items);
        })
      );

    this.processing.set(true);
    forkJoin([...requests, ...personsUpdateRequests, clearAuthFlagsRequest])
      .pipe(
        switchMap(() =>
          this.#firestoreService.get<AuthUser>(
            FirestoreCollections.authUsers,
            this.#authService.authUser()!.id
          )
        ),
        filter(Boolean),
        catchError(err => this.#handleError(err)),
        finalize(() => this.processing.set(false))
      )
      .subscribe(updatedUser => {
        this.#authService.setCurrentUser(updatedUser);
        this.#snackBar.open('Results deleted!', 'Ok', { duration: 3000 });
      });
  }
}
