// @ts-ignore
import * as Logic from 'logic-solver';
import { chunk } from 'lodash';
import { DEFAULT_SIZE } from '../consts';
import { toVariable } from '../encoding/to-variable';
import { exactOneClausesWithBinomialEncoding } from '../encoding/binomial';
import { exactOneClausesWithSequentialEncoding } from '../encoding/sequential';

export type Encoding = 'BINOMIAL' | 'SEQUENTIAL';
export type SolverReturn = {
  sol: number[][] | null;
  timeMs: number;
  clauseCount: number;
  variableCount: any;
};

export function sudokuSolver(
  samples: number[][],
  encoding: Encoding = 'BINOMIAL',
  _size: number = DEFAULT_SIZE,
): SolverReturn {
  let clauseCount = 0;
  const size = _size * _size;
  const exactOne =
    encoding === 'BINOMIAL'
      ? exactOneClausesWithBinomialEncoding
      : exactOneClausesWithSequentialEncoding;

  const solver = new Logic.Solver();
  //  Each box contains precisely one number.
  for (let row = 1; row <= size; row++) {
    for (let col = 1; col <= size; col++) {
      let variables = [];
      for (let k = 1; k <= size; k++) {
        variables.push(toVariable(row, col, k));
      }

      const clauses = exactOne(variables);
      clauseCount += clauses.length;
      clauses.forEach((clause) => solver.require(Logic.or(clause)));
    }
  }

  // Precisely once in each row (fix i ):
  for (let row = 1; row <= size; row++) {
    for (let k = 1; k <= size; k++) {
      let variables = [];
      for (let col = 1; col <= size; col++) {
        variables.push(toVariable(row, col, k));
      }

      const clauses = exactOne(variables);
      clauseCount += clauses.length;
      clauses.forEach((clause) => solver.require(Logic.or(clause)));
    }
  }

  // Precisely once in each colum (fix j):
  for (let col = 1; col <= size; col++) {
    for (let k = 1; k <= size; k++) {
      let variables = [];
      for (let row = 1; row <= size; row++) {
        variables.push(toVariable(row, col, k));
      }

      const clauses = exactOne(variables);
      clauseCount += clauses.length;
      clauses.forEach((clause) => solver.require(Logic.or(clause)));
    }
  }

  // Precisely once in each sub-3x3 matrix.
  for (let rowPart = 1; rowPart <= size; rowPart += Math.sqrt(size)) {
    for (let colPart = 1; colPart <= size; colPart += Math.sqrt(size)) {
      for (let k = 1; k <= size; k++) {
        let variables = [];
        for (let i = 0; i < Math.sqrt(size); i++) {
          for (let j = 0; j < Math.sqrt(size); j++) {
            const row = rowPart + i;
            const col = colPart + j;

            variables.push(toVariable(row, col, k));
          }
        }
        const clauses = exactOne(variables);
        clauseCount += clauses.length;
        clauses.forEach((clause) => solver.require(Logic.or(clause)));
      }
    }
  }

  const clues: string[] = [];
  samples.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val > 0) {
        clues.push(toVariable(i + 1, j + 1, val));
      }
    });
  });

  const startPoint = performance.now();
  const currentSol = solver.solveAssuming(Logic.and(clues));
  const endPoint = performance.now();

  const sol: number[][] = currentSol
    ? chunk(
        currentSol
          .getTrueVars()
          .filter((variable: string) => /^\d+\_\d+\_\d+$/.test(variable))
          .sort()
          .map((variable: string) => +variable.split('_').pop()),
        size,
      )
    : null;

  return {
    sol,
    timeMs: endPoint - startPoint,
    clauseCount,
    variableCount: currentSol ? Object.keys(currentSol.getMap()).length : 0,
  };
}
