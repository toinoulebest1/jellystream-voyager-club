
import { useState } from "react";
import { JellyfinItem } from "@/services/jellyfinService";
import MediaCard from "./MediaCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaRowProps {
  title: string;
  items: JellyfinItem[];
}

export const MediaRow = ({ title, items }: MediaRowProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6; // Nombre d'éléments à afficher par page
  
  if (!items || items.length === 0) return null;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {currentPage + 1}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {visibleItems.map((item) => (
          <MediaCard key={item.Id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default MediaRow;
