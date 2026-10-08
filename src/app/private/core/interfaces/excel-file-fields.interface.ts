import { CraftMedia } from './craft-media.interface';

export interface ExcelFileFields
  extends Record<string, string | number | undefined | Date | CraftMedia[]> {
  name: string;
  order: number;
  image?: string;
}
