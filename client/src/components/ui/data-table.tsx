import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown
} from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    sortable?: boolean;
    sortKey?: keyof T;
  }[];
  itemsPerPage?: number;
  onRowClick?: (item: T) => void;
  selectedRows?: (string | number)[];
}

// Function to get a comparable value for sorting
const getSortableValue = <T,>(item: T, key: keyof T): any => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  return value;
};

export function DataTable<T>({
  data,
  columns,
  itemsPerPage = 10,
  onRowClick,
  selectedRows = []
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Handle sorting
  const sortData = (data: T[]): T[] => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const valueA = getSortableValue(a, sortColumn);
      const valueB = getSortableValue(b, sortColumn);
      
      // Handle numeric values
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Handle string values
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      if (sortDirection === 'asc') {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  };
  
  // Sort the data
  const sortedData = sortData(data);
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);
  
  // Page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  // Handle sort header click
  const handleSortClick = (column: typeof columns[0]) => {
    if (!column.sortable || !column.sortKey) return;
    
    const clickedColumn = column.sortKey;
    
    if (sortColumn === clickedColumn) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, reset to ascending
      setSortColumn(clickedColumn);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };
  
  // Cell renderer
  const renderCell = (item: T, accessor: keyof T | ((item: T) => React.ReactNode)) => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    return item[accessor] as React.ReactNode;
  };
  
  // Render sort indicator
  const renderSortIndicator = (column: typeof columns[0]) => {
    if (!column.sortable || !column.sortKey) return null;
    
    if (sortColumn === column.sortKey) {
      return sortDirection === 'asc' ? 
        <ChevronUp className="ml-1 h-4 w-4 inline" /> : 
        <ChevronDown className="ml-1 h-4 w-4 inline" />;
    }
    
    return <ArrowUpDown className="ml-1 h-4 w-4 inline opacity-40" />;
  };
  
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`${column.className} ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => column.sortable && handleSortClick(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIndicator(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${onRowClick ? "cursor-pointer hover:bg-muted" : ""} ${
                    // @ts-ignore - we know id might not exist on T, but we're using it for selection
                    selectedRows.includes((item as any).id) ? "bg-primary/10 hover:bg-primary/20" : ""
                  }`}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {renderCell(item, column.accessor)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, sortedData.length)}</span> of{" "}
            <span className="font-medium">{sortedData.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
