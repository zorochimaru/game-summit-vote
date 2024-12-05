import { CommonFirestore } from '../../../core';
import { ExcelFileFields } from './excel-file-fields.interface';

export interface CommonVoteItemFirestore
  extends ExcelFileFields,
    CommonFirestore {}
