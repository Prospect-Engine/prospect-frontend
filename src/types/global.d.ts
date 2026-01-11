export {};

declare global {
  type Optional<T, O extends keyof T> = {
    [J in Exclude<keyof T, O>]: T[J];
  } & { [K in O]?: T[K] };
}
