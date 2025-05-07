
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { JellyfinItem, jellyfinApi, useJellyfinStore } from "@/services/jellyfinService";
import { Play, Info } from "lucide-react";

interface HeaderProps {
  item: JellyfinItem;
}

export const Header = ({ item }: HeaderProps) => {
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  if (!serverUrl || !userInfo || !item) return null;
  
  const backdropUrl = item.BackdropImageTags && item.BackdropImageTags[0]
    ? jellyfinApi.getBackdropUrl(serverUrl, item.Id, item.BackdropImageTags[0])
    : '';
    
  const handlePlayMedia = () => {
    navigate(`/player/${item.Id}`);
  };
  
  const handleMoreInfo = () => {
    navigate(`/details/${item.Id}`);
  };

  return (
    <div 
      className="header-background"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      <div className="header-content">
        <h1 className="text-4xl font-bold text-white mb-2">{item.Name}</h1>
        {item.Overview && (
          <p className="text-white text-lg mb-6 line-clamp-3 max-w-3xl">{item.Overview}</p>
        )}
        <div className="flex space-x-4">
          <Button 
            className="bg-white hover:bg-white/90 text-black flex items-center"
            onClick={handlePlayMedia}
          >
            <Play className="mr-2 h-4 w-4" />
            Lecture
          </Button>
          <Button 
            variant="outline" 
            className="bg-gray-600/80 hover:bg-gray-600 text-white border-none flex items-center"
            onClick={handleMoreInfo}
          >
            <Info className="mr-2 h-4 w-4" />
            Plus d'infos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
