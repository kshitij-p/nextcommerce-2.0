import { useMemo, useState } from "react";

export type UsePaginationState = ReturnType<typeof usePagination>;

export const usePagination = (initialPageSize = 10, initialPage = 1) => {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(initialPage);

  const onChange = (_page: number, _pageSize: number) => {
    setPageSize(_pageSize);
    setPage(_page);
  };

  const skip = useMemo(
    () => (page <= 1 ? 0 : pageSize * (page - 1)),
    [page, pageSize],
  );
  const take = pageSize;

  return { page, setPage, pageSize, setPageSize, onChange, skip, take };
};
