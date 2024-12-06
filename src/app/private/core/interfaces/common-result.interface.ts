export interface Score {
  criteriaId: string;
  criteriaName: string;
  score: number;
}

export interface CommonResult {
  personId: string;
  personName: string;
  results: Score[];
}
