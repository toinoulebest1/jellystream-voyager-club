
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
      className="cursor-pointer rounded-md overflow-hidden bg-netflix-gray-dark/50 transition-transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigateToDetails}
    >
      <div className="relative aspect-[2/3] w-full">
        <img 
          src={imageUrl} 
          alt={item.Name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Button 
              size="sm" 
              className="bg-netflix-red hover:bg-netflix-red/90 text-white rounded-full w-10 h-10 p-2"
              onClick={handlePlayMedia}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-bold text-sm text-white truncate" title={item.Name}>{item.Name}</h3>
        {item.ProductionYear && (
          <p className="text-xs text-gray-300">{item.ProductionYear}</p>
        )}
      </div>
    </div>
  );
};

export default MediaCard;
