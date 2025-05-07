
import { JellyfinItem } from "@/services/jellyfinService";
import MediaCard from "./MediaCard";

interface MediaRowProps {
  title: string;
  items: JellyfinItem[];
}

export const MediaRow = ({ title, items }: MediaRowProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="section-title">{title}</h2>
      <div className="carousel">
        {items.map((item) => (
          <div key={item.Id} className="flex-shrink-0 w-48">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaRow;
