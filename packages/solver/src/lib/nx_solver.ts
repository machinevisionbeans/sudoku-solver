// @ts-ignore
import * as Logic from 'logic-solver';
import { chunk } from '../utils';
import { BOARD_VAR_PATTERN } from '../consts';
import { Binominal } from '../encoder/binomial';
import { Sequential } from '../encoder/sequential';
import { toVariable } from '../encoder/to-variable';

import type { Encoder } from '../encoder/interface';
import type { EncodingType, SolveResult, Grid } from './types';
import _ from 'lodash';

export class BaseSolver {
  private readonly _size: number;
  private readonly _gridSize: number;
  private readonly _clauses: string[][] = [];
  private readonly _encoder: Encoder;

  protected readonly _satSolver: any;

  constructor({
    size,
    encodingType = 'SEQUENTIAL',
  }: {
    size: number;
    encodingType?: EncodingType;
  }) {
    this._size = size;
    this._clauses = [];
    this._gridSize = size * size;
    this._satSolver = new Logic.Solver();

    switch (encodingType) {
      case 'BINOMIAL':
        this._encoder = new Binominal();
        break;
      case 'SEQUENTIAL':
        this._encoder = new Binominal();
        break;
      default:
        this._encoder = new Sequential();
    }

    this.addClausesForCellContraints()
      .addClausesForRowContraints()
      .addClausesForColumnContraints()
      .addClausesForSubmaxtrixContraints();
  }

  private addClausesForCellContraints() {
    //  Each box contains precisely one number.
    for (let row = 1; row <= this._gridSize; row++) {
      for (let col = 1; col <= this._gridSize; col++) {
        let variables = [];
        for (let k = 1; k <= this._gridSize; k++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForRowContraints() {
    // Precisely once in each row (fix i ):
    for (let row = 1; row <= this._gridSize; row++) {
      for (let k = 1; k <= this._gridSize; k++) {
        let variables = [];
        for (let col = 1; col <= this._gridSize; col++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForColumnContraints() {
    // Precisely once in each colum (fix j):
    for (let col = 1; col <= this._gridSize; col++) {
      for (let k = 1; k <= this._gridSize; k++) {
        let variables = [];
        for (let row = 1; row <= this._gridSize; row++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForSubmaxtrixContraints() {
    // Precisely once in each sub-3x3 matrix.
    for (let rowPart = 1; rowPart <= this._gridSize; rowPart += this._size) {
      for (let colPart = 1; colPart <= this._gridSize; colPart += this._size) {
        for (let k = 1; k <= this._gridSize; k++) {
          let variables = [];
          for (let i = 0; i < this._size; i++) {
            for (let j = 0; j < this._size; j++) {
              const row = rowPart + i;
              const col = colPart + j;

              variables.push(toVariable(row, col, k));
            }
          }
          const clauses = this._encoder.exactOne(variables);
          this._clauses.concat(clauses);
          clauses.forEach((clause) =>
            this._satSolver.require(Logic.or(clause)),
          );
        }
      }
    }

    return this;
  }

  get clausesCount(): number {
    return this._clauses.length;
  }

  prettizeSolution(currentSol: any): Grid {
    return chunk(
      currentSol
        .getTrueVars()
        .filter((variable: string) => BOARD_VAR_PATTERN.test(variable))
        .sort()
        .map((variable: string) => Number(variable.split('_').pop())),
      this._gridSize,
    );
  }
}

export class SpeedSolver extends BaseSolver {
  solve(
    clues: Grid,
  ):
    | { solution: Grid; satFormula: any; variableCount: number }
    | { solution: null; satFormula: null; variableCount: number } {
    const variables: string[] = [];
    clues.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val > 0) {
          variables.push(toVariable(i + 1, j + 1, val));
        }
      });
    });

    const currentSol = this._satSolver.solveAssuming(Logic.and(variables));

    if (currentSol) {
      return {
        solution: this.prettizeSolution(currentSol),
        satFormula: currentSol.getFormula(),
        variableCount: Object.keys(currentSol.getMap()).length,
      };
    }

    return {
      solution: null,
      satFormula: null,
      variableCount: 0,
    };
  }

  solveAsStatistics(clues: Grid): SolveResult {
    const startPoint = performance.now();
    const { solution, variableCount } = this.solve(clues);
    const endPoint = performance.now();

    if (solution) {
      return {
        variableCount,
        timeMs: endPoint - startPoint,
        clauseCount: this.clausesCount,
        solution: this.prettizeSolution(solution),
      };
    }

    return {
      variableCount: 0,
      timeMs: endPoint - startPoint,
      clauseCount: this.clausesCount,
      solution: null,
    };
  }
}

export class LazySolver extends BaseSolver {
  private readonly _clues: Grid;
  private readonly _generator: Generator<Grid, null, unknown>;

  constructor({
    size,
    clues,
    encodingType = 'SEQUENTIAL',
  }: {
    size: number;
    clues: Grid;
    encodingType?: EncodingType;
  }) {
    super({
      size,
      encodingType,
    });
    this._clues = clues;
    this._generator = this.createSolutionGenetator();
  }

  get generator() {
    return this._generator;
  }

  private *createSolutionGenetator(): Generator<Grid, null, unknown> {
    let currentSol = this._satSolver.solve(this._clues);

    while (currentSol) {
      this._satSolver.forbid(currentSol.getFormula());
      yield this.prettizeSolution(currentSol);
    }

    return null;
  }
}

export class Solver {
  private _size: number;
  private _boardSize: number;
  private _clauses: string[][] = [];
  private _satSolver = new Logic.Solver();
  private _encoder: Encoder;

  constructor({
    size,
    encodingType = 'SEQUENTIAL',
  }: {
    size: number;
    encodingType?: EncodingType;
  }) {
    this._size = size;
    this._clauses = [];
    this._boardSize = size * size;

    switch (encodingType) {
      case 'BINOMIAL':
        this._encoder = new Binominal();
        break;
      case 'SEQUENTIAL':
        this._encoder = new Binominal();
        break;
      default:
        this._encoder = new Sequential();
    }
  }

  private reset() {
    this._clauses = [];
    this._satSolver = new Logic.Solver();
    return this;
  }

  private addClausesForCellContraints() {
    //  Each box contains precisely one number.
    for (let row = 1; row <= this._boardSize; row++) {
      for (let col = 1; col <= this._boardSize; col++) {
        let variables = [];
        for (let k = 1; k <= this._boardSize; k++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForRowContraints() {
    // Precisely once in each row (fix i ):
    for (let row = 1; row <= this._boardSize; row++) {
      for (let k = 1; k <= this._boardSize; k++) {
        let variables = [];
        for (let col = 1; col <= this._boardSize; col++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForColumnContraints() {
    // Precisely once in each colum (fix j):
    for (let col = 1; col <= this._boardSize; col++) {
      for (let k = 1; k <= this._boardSize; k++) {
        let variables = [];
        for (let row = 1; row <= this._boardSize; row++) {
          variables.push(toVariable(row, col, k));
        }

        const clauses = this._encoder.exactOne(variables);
        this._clauses.concat(clauses);
        clauses.forEach((clause) => this._satSolver.require(Logic.or(clause)));
      }
    }

    return this;
  }

  private addClausesForSubmaxtrixContraints() {
    // Precisely once in each sub-3x3 matrix.
    for (let rowPart = 1; rowPart <= this._boardSize; rowPart += this._size) {
      for (let colPart = 1; colPart <= this._boardSize; colPart += this._size) {
        for (let k = 1; k <= this._boardSize; k++) {
          let variables = [];
          for (let i = 0; i < this._size; i++) {
            for (let j = 0; j < this._size; j++) {
              const row = rowPart + i;
              const col = colPart + j;

              variables.push(toVariable(row, col, k));
            }
          }
          const clauses = this._encoder.exactOne(variables);
          this._clauses.concat(clauses);
          clauses.forEach((clause) =>
            this._satSolver.require(Logic.or(clause)),
          );
        }
      }
    }

    return this;
  }

  solve(
    clues: Grid,
    {
      resetBeforeRun = false,
      once = false,
    }: {
      resetBeforeRun?: boolean;
      once?: boolean;
    } = {},
  ): SolveResult {
    if (resetBeforeRun) {
      this.reset();
    }

    const startPoint = performance.now();
    this.addClausesForCellContraints()
      .addClausesForRowContraints()
      .addClausesForColumnContraints()
      .addClausesForSubmaxtrixContraints();

    const variables: string[] = [];
    clues.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val > 0) {
          variables.push(toVariable(i + 1, j + 1, val));
        }
      });
    });

    const currentSol = this._satSolver.solveAssuming(Logic.and(variables));
    const endPoint = performance.now();

    if (currentSol) {
      if (once) {
        this._satSolver.forbid(currentSol.getFormula());
      }

      return {
        solution: chunk(
          currentSol
            .getTrueVars()
            .filter((variable: string) => BOARD_VAR_PATTERN.test(variable))
            .sort()
            .map((variable: string) => Number(variable.split('_').pop())),
          this._boardSize,
        ),
        timeMs: endPoint - startPoint,
        clauseCount: this._clauses.length,
        variableCount: Object.keys(currentSol.getMap()).length,
      };
    }

    return {
      solution: null,
      timeMs: endPoint - startPoint,
      clauseCount: this._clauses.length,
      variableCount: 0,
    };
  }

  solveOnce(clues: Grid) {
    return this.solve(clues, { once: true });
  }
}
