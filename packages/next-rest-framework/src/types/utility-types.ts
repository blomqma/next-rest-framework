export type Modify<T, R> = Omit<T, keyof R> & R;

export type AnyCase<T extends string> = T | Uppercase<T> | Lowercase<T>;
