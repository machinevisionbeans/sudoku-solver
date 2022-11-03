export type EncodingType = 'BINOMIAL' | 'SEQUENTIAL';
export type GameLevel = 'easy' | 'medium' | 'hard';
export type Grid = number[][];

export type SolveResult = {
  solution: Grid | null;
  timeMs: number;
  clauseCount: number;
  variableCount: any;
};
