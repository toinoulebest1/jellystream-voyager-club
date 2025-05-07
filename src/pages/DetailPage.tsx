
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useJellyfinStore, jellyfinApi, JellyfinItem } from "@/services/jellyfinService";
import { Play } from "lucide-react";

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<JellyfinItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!serverUrl || !userInfo || !id) {
      navigate('/home');
      return;
    }
    
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les détails de l'élément
        const response = await fetch(
          `${serverUrl}/Items/${id}?api_key=${userInfo.AccessToken}`,
          {
            headers: {
              'X-Emby-Token': userInfo.AccessToken,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erreur de récupération des détails: ${response.status}`);
        }
        
        const itemData = await response.json();
        setItem(itemData);
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        toast.error("Impossible de charger les détails");
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItemDetails();
  }, [id, serverUrl, userInfo, navigate]);
  
  const handlePlayMedia = () => {
    if (id) {
      navigate(`/player/${id}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!item) return null;
  
  const backdropUrl = item.BackdropImageTags && item.BackdropImageTags[0]
    ? jellyfinApi.getBackdropUrl(serverUrl!, item.Id, item.BackdropImageTags[0])
    : '';
    
  const primaryImageUrl = item.ImageTags?.Primary 
    ? jellyfinApi.getImageUrl(serverUrl!, item.Id, item.ImageTags.Primary)
    : '/placeholder.svg';
    
  const formatRuntime = (ticks?: number) => {
    if (!ticks) return '';
    const minutes = Math.floor((ticks / (10000 * 1000 * 60)) % 60);
    const hours = Math.floor(ticks / (10000 * 1000 * 60 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <Navbar />
      
      <div 
        className="relative w-full h-[70vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/20 to-transparent"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-32 h-full flex flex-col justify-end">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 w-48 rounded-md overflow-hidden shadow-lg hidden md:block">
              <img src={primaryImageUrl} alt={item.Name} className="w-full h-auto" />
            </div>
            
            <div className="flex-grow">
              <h1 className="text-4xl font-bold mb-2">{item.Name}</h1>
              
              <div className="flex items-center text-sm text-gray-300 space-x-4 mb-6">
                {item.ProductionYear && <span>{item.ProductionYear}</span>}
                {item.RunTimeTicks && <span>{formatRuntime(item.RunTimeTicks)}</span>}
                {item.CommunityRating && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {item.CommunityRating.toFixed(1)}
                  </span>
                )}
              </div>
              
              {item.Overview && <p className="text-gray-300 mb-8 max-w-3xl">{item.Overview}</p>}
              
              <div className="flex space-x-4">
                <Button 
                  className="bg-netflix-red hover:bg-netflix-red/90 text-white flex items-center px-8 py-6"
                  onClick={handlePlayMedia}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Lecture
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
