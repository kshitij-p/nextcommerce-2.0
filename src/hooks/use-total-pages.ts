import { useMemo } from "react";

export const useTotalPages = (total: number, pageSize: number) => {
  return useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
};
