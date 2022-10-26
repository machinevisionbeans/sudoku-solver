const NO_OF_SAMPLES = 10;

for (let size = 2; size <= 9; size++) {
  describe(`Crawl sudoku samples, sizes ${size}x${size}, ${NO_OF_SAMPLES} samples.`, () => {
    Cypress._.times(NO_OF_SAMPLES, (k) => {
      it(`Crawl sample ${k + 1} of ${NO_OF_SAMPLES} samples.`, () => {
        cy.getSample(size).then(function (matrix) {
          cy.writeFile(`./dataset/${size}x${size}/${k + 1}.json`, matrix);
        });
      });
    });
  });
}
