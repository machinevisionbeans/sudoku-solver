import * as fs from 'fs';
import * as Papa from 'papaparse';
import { join } from 'path';
import { Encoding, sudokuSolver } from '@sudoku/solver';

function promisifyParseSudokuSample(filePath: string): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const fileRStream = fs.createReadStream(filePath);
    Papa.parse<number[]>(fileRStream, {
      transform(val) {
        return Number(val);
      },
      complete(results) {
        resolve(results.data);
      },
      error(reason) {
        reject(reason);
      },
    });
  });
}

async function runAudit(encoding: Encoding) {
  const minSize = 2,
    maxSize = 2;
  const noOfSample = 1;

  const statistics = [];

  for (let size = minSize; size <= maxSize; size++) {
    for (let sampleIndex = 1; sampleIndex <= noOfSample; sampleIndex++) {
      const cwd = process.cwd();
      const filePath = join(
        cwd,
        `packages/crawler/dataset/${size}x${size}/${sampleIndex}.csv`,
      );

      try {
        const sample = await promisifyParseSudokuSample(filePath);
        const currentRes = sudokuSolver(sample, encoding, size);
        statistics.push([
          `${size}x${size}`,
          currentRes.variableCount,
          currentRes.clauseCount,
          currentRes.timeMs,
        ]);
      } catch (error) {
        console.log(error);
      }
    }
  }

  const rawStatistics = Papa.unparse(statistics);
  fs.writeFileSync(
    join(process.cwd(), `packages/audit/results/${encoding}.csv`),
    rawStatistics,
    {},
  );
}

runAudit('BINOMIAL');
