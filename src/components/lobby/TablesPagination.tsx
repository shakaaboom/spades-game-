
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TablesPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TablesPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: TablesPaginationProps) => {
  // Generate page numbers for popover
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Previous</span>
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs sm:text-sm min-w-[80px] h-8 sm:h-9"
          >
            <span className="font-medium">{currentPage}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </Button>
        </PopoverTrigger>
        {totalPages > 3 && (
          <PopoverContent className="w-48 p-2" align="center">
            <div className="grid grid-cols-5 gap-1">
              {pageNumbers.map(pageNumber => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onPageChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
      >
        <span className="sr-only sm:not-sr-only sm:mr-2">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TablesPagination;
