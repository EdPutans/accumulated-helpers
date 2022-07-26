export type ValueOf<T extends object> = T[keyof T];

// yeeted from https://stackoverflow.com/a/60762482
type Grow<T, A extends Array<T>> = ((x: T, ...xs: A) => void) extends ((...a: infer X) => void) ? X : never;
type GrowToSize<T, A extends Array<T>, N extends number> = { 0: A, 1: GrowToSize<T, Grow<T, A>, N> }[A['length'] extends N ? 0 : 1];
// force an array to only have a certain size
export type FixedLengthArray<T, N extends number> = GrowToSize<T, [], N>;