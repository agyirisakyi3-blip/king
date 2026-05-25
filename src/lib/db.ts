import "server-only";

export async function query(sql: string, ...values: unknown[]): Promise<unknown[]> {
  void sql;
  void values;
  return [];
}
