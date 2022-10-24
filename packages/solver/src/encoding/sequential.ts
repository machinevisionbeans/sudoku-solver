import { toExtraSequentialVar } from './to-variable';
import { v4 as uuidv4 } from 'uuid';

export function exactOneClausesWithSequentialEncoding(variables: string[]) {
  const clauses: string[][] = [variables];
  const n = variables.length;
  const identity = uuidv4();

  clauses.push([`-${variables[0]}`, toExtraSequentialVar(identity, 0)]);
  clauses.push([
    `-${variables[n - 1]}`,
    `-${toExtraSequentialVar(identity, n - 2)}`,
  ]);

  for (let i = 1; i <= n - 2; i++) {
    clauses.push([`-${variables[i]}`, toExtraSequentialVar(identity, i)]);
    clauses.push([
      `-${toExtraSequentialVar(identity, i - 1)}`,
      toExtraSequentialVar(identity, i),
    ]);
    clauses.push([
      `-${variables[i]}`,
      `-${toExtraSequentialVar(identity, i - 1)}`,
    ]);
  }

  return clauses;
}
