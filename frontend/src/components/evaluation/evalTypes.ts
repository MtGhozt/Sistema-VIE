export type EvalActionHandler = (
  action: string,
  payload?: unknown,
) => Promise<boolean>;
