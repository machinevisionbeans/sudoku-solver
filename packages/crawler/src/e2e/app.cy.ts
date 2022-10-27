import * as Papa from 'papaparse';

const NO_OF_SAMPLES = 10;
const MIN_SUDOKU_SIZE = 2;
const MAX_SUDOKU_SIZE = 9;

const DATA_EXTENSION = 'csv';

for (let size = MIN_SUDOKU_SIZE; size <= MAX_SUDOKU_SIZE; size++) {
  describe(`Crawl sudoku samples, sizes ${size}x${size}, ${NO_OF_SAMPLES} samples.`, () => {
    Cypress._.times(NO_OF_SAMPLES, (k) => {
      it(`Crawl sample ${k + 1} of ${NO_OF_SAMPLES} samples.`, () => {
        cy.getSudokuSample(size).then(function (matrix) {
          const rawCsv: string = Papa.unparse(matrix);

          cy.writeFile(
            `./dataset/${size}x${size}/${k + 1}.${DATA_EXTENSION}`,
            rawCsv,
          );
        });
      });
    });
  });
}
