export function chunk<T>(array: T[], size: number) {
  let res: T[][] = [];
  for (let point = 0; point < array.length; point += size) {
    res.push(array.slice(point, point + size));
  }

  return res;
}

export function randomInt(from: number, to: number) {
  const range = to - from;
  return from + Math.floor(Math.random() * range);
}
