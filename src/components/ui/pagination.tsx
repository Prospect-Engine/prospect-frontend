"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50],
  itemLabel = "items",
  className = "",
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;

  const handleFirstPage = () => onPageChange(1);
  const handlePreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => onPageChange(totalPages);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ${className}`}
    >
      {/* Left side - Rows per page */}
      <div className="flex items-center space-x-2 order-1 sm:order-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Rows per page:
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-16">
              {itemsPerPage}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {itemsPerPageOptions.map(option => (
              <DropdownMenuItem
                key={option}
                onClick={() => onItemsPerPageChange(option)}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center - Pagination controls */}
      <div className="flex items-center space-x-1 order-2 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 hidden sm:flex"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-3 min-w-[80px] text-center">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 hidden sm:flex"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right side - Items count */}
      <span className="text-sm text-muted-foreground order-3 sm:order-3 whitespace-nowrap">
        Showing {startItem}-{Math.min(startItem + itemsPerPage - 1, totalItems)}{" "}
        of {totalItems} {itemLabel}
      </span>
    </div>
  );
}
