import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const PaginationControls = ({
  page,
  pageSize,
  setPage,
  setPageSize,
  totalPages,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (val: number) => void;
  setPageSize: (val: number) => void;
}) => {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Items per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => setPageSize(+value)}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
