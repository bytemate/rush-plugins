export type NestedRequired<T> = {
  [P in keyof T]-?: NestedRequired<T[P]>;
};
export type NestedPartial<T> = {
  [P in keyof T]?: NestedPartial<T[P]>;
};
