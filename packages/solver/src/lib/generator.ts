import { randomInt } from '../utils';
import { Solver, LazySolver } from './nx_solver';
import { GameLevel, Grid } from './types';

type SudokuGenResult =
  | {
      question: Grid;
      solution: Grid;
    }
  | {
      question: null;
      solution: null;
    };

export class Generator {
  private _size: number;
  private _solver: Solver;
  private _generator: globalThis.Generator<Grid, null, unknown>;
  private _isEmpty: boolean;

  constructor(size: number) {
    this._solver = new Solver({ size });
    this._generator = this.createGenerator();
    this._isEmpty = false;
    this._size = size;
  }

  private *createGenerator(): globalThis.Generator<Grid, null, unknown> {
    let currentSol = this._solver.solve([]);

    while (true) {
      const randomNum = Math.random();

      if (randomNum >= 0.5) {
        currentSol = this._solver.solve([]);
      }

      if (currentSol.solution === null) {
        this._isEmpty = true;
        return null;
      }

      yield currentSol.solution;
    }
  }

  make(level?: GameLevel): SudokuGenResult {
    const boarSize = this._size * this._size;
    const set = new Set<string>();
    const numOfClues = 8;

    if (this._isEmpty) {
      return {
        question: null,
        solution: null,
      };
    }

    while (set.size < numOfClues) {
      const rowIndex = randomInt(0, boarSize - 1);
      const colIndex = randomInt(0, boarSize - 1);

      set.add(`${rowIndex}_${colIndex}`);
    }

    const solution = this._generator.next().value;
    const question = solution.map((row) => Array.from(row));

    question.forEach((row, i) => {
      row.forEach((_, j) => {
        if (!set.has(`${i}_${j}`)) {
          question[i][j] = 0;
        }
      });
    });

    return {
      question,
      solution,
    };
  }
}

export class SudokuGenerator {
  private _size: number;
  private _generator: LazySolver['_generator'];

  constructor(size: number) {
    this._generator = new LazySolver({
      size,
      clues: [],
      encodingType: 'SEQUENTIAL',
    }).generator;
    this._size = size;
  }

  make(level?: GameLevel): SudokuGenResult {
    const gridSize = this._size * this._size;
    const set = new Set<string>();
    const numOfClues = 8;

    const result = this._generator.next();

    if (result.done) {
      return {
        question: null,
        solution: null,
      };
    }

    while (set.size < numOfClues) {
      const rowIndex = randomInt(0, gridSize - 1);
      const colIndex = randomInt(0, gridSize - 1);

      set.add(`${rowIndex}_${colIndex}`);
    }

    const solution = result.value;
    const question = solution.map((row) => Array.from(row));

    question.forEach((row, i) => {
      row.forEach((_, j) => {
        if (!set.has(`${i}_${j}`)) {
          question[i][j] = 0;
        }
      });
    });

    return {
      question,
      solution,
    };
  }
}
