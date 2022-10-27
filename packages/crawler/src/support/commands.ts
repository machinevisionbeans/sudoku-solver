// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    getSudokuSample(size: number): Chainable<number[][]>;
  }
}

Cypress.Commands.add('getSudokuSample', (size) => {
  return cy.visit(`/sudoku/${size}/eng/`).then(() => {
    const matrix: number[][] = [];

    return cy
      .get('div.grid > table > tbody')
      .first()
      .children('tr.grid')
      .each(($row) => {
        const row: number[] = [];
        Array.from($row.children()).forEach((element) => {
          row.push(Number(element.textContent));
        });
        matrix.push(row);
      })
      .then(() => {
        return matrix;
      });
  });
});
