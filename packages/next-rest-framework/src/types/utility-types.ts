export type Modify<T, R> = Omit<T, keyof R> & R;

// Accept a string with any casing - used for validating headers.
// Ref: https://stackoverflow.com/a/64932909
export type AnyCase<T extends string> = string extends T
  ? string
  : T extends `${infer F1}${infer F2}${infer R}`
  ? `${Uppercase<F1> | Lowercase<F1>}${
      | Uppercase<F2>
      | Lowercase<F2>}${AnyCase<R>}`
  : T extends `${infer F}${infer R}`
  ? `${Uppercase<F> | Lowercase<F>}${AnyCase<R>}`
  : '';
