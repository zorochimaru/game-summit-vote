export function filterPredicate<T>(value: T | undefined | null): value is T {
  return !!value;
}
