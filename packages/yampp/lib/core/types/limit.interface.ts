export interface ILimit {
  (fn: () => Promise<unknown>): Promise<unknown>;
}