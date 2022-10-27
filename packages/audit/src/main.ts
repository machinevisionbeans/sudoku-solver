import { sudokuSolver } from '@sudoku/solver';

const res = sudokuSolver([], 'BINOMIAL', 4);

if (res.sol) {
  res.sol.forEach((row) => console.log(row.toString()));
}

console.log({
  ...res,
  sol: null,
});
