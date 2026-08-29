export function cn(...args: Array<unknown>): string {
  return args.filter((a): a is string | number => Boolean(a) || a === 0 || a === '').map(String).join(' ');
}
