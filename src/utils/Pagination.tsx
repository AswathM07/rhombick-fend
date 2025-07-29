import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Select, Text } from "@chakra-ui/react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  rowsPerPage,
  rowsPerPageOptions = [5, 10, 25, 50],
  onPageChange,
  onRowsPerPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(totalItems, currentPage * rowsPerPage);

  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Flex justify="flex-end" align="center" gap={4} mt={4}>
      <Text>Rows per page:</Text>
      <Select
        w="70px"
        size="sm"
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
      >
        {rowsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Text>
        {start}-{end} of {totalItems}
      </Text>

      <IconButton
        aria-label="Previous Page"
        icon={<ChevronLeftIcon />}
        size="sm"
        onClick={handlePrev}
        isDisabled={currentPage === 1}
        variant="ghost"
      />
      <IconButton
        aria-label="Next Page"
        icon={<ChevronRightIcon />}
        size="sm"
        onClick={handleNext}
        isDisabled={currentPage >= totalPages}
        variant="ghost"
      />
    </Flex>
  );
};

export default Pagination;