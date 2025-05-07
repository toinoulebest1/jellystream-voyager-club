
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JellyfinItem, jellyfinApi, useJellyfinStore } from "@/services/jellyfinService";

interface MediaCardProps {
  item: JellyfinItem;
}

export const MediaCard = ({ item }: MediaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  if (!serverUrl || !userInfo) return null;
  
  const imageUrl = item.ImageTags?.Primary 
    ? jellyfinApi.getImageUrl(serverUrl, item.Id, item.ImageTags.Primary)
    : item.ImageTags?.Thumb
      ? jellyfinApi.getImageUrl(serverUrl, item.Id, item.ImageTags.Thumb, 'Thumb')
      : '/placeholder.svg';
      
  const handleNavigateToDetails = () => {
    navigate(`/details/${item.Id}`);
  };
  
  const handlePlayMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/player/${item.Id}`);
  };

  return (
    <div 
      className="movie-card cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigateToDetails}
    >
      <img 
        src={imageUrl} 
        alt={item.Name}
        className="movie-card-image"
        loading="lazy"
      />
      <div className={`movie-card-overlay ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <h3 className="font-bold text-white mb-1">{item.Name}</h3>
        {item.ProductionYear && (
          <p className="text-xs text-gray-300 mb-2">{item.ProductionYear}</p>
        )}
        <Button 
          size="sm" 
          className="bg-netflix-red hover:bg-netflix-red/90 text-white rounded-full w-10 h-10 p-2"
          onClick={handlePlayMedia}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MediaCard;
