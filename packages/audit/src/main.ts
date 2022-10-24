import { sudokuSolver } from '@sudoku/solver';

const res = sudokuSolver([], 'SEQUENTIAL');

res.forEach((row) => console.log(row.toString()));
