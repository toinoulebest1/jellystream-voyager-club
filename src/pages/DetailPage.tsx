
import { useState, useEffect, useRef } from "react";
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
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser useRef pour suivre si le composant est monté
  const isMounted = useRef(true);
  // Flag pour éviter les appels multiples
  const dataFetched = useRef(false);
  
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    // Définir le composant comme monté
    isMounted.current = true;
    
    if (!serverUrl || !userInfo || !id) {
      toast.error("Informations de connexion manquantes");
      navigate('/home');
      return;
    }
    
    // Si les données ont déjà été récupérées, ne pas refaire l'appel
    if (dataFetched.current) return;
    
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Récupération des détails pour l'élément ${id}`);
        
        // Récupérer les détails de l'élément
        const response = await fetch(
          `${serverUrl}/Items/${id}?UserId=${userInfo.Id}&api_key=${userInfo.AccessToken}`,
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
        console.log("Détails récupérés:", itemData);
        
        // Ne mettre à jour l'état que si le composant est toujours monté
        if (isMounted.current) {
          setItem(itemData);
          dataFetched.current = true;
        }
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        const errorMessage = error instanceof Error ? error.message : "Impossible de charger les détails";
        
        if (isMounted.current) {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    fetchItemDetails();
    
    // Nettoyer l'effet lors du démontage du composant
    return () => {
      isMounted.current = false;
    };
  }, [id, serverUrl, userInfo, navigate]);
  
  const handlePlayMedia = () => {
    if (id) {
      navigate(`/player/${id}`);
    }
  };
  
  const handleGoBack = () => {
    navigate('/home');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-netflix-black">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="min-h-screen bg-netflix-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-netflix-red text-xl font-bold mb-4">Erreur</div>
        <p className="text-white mb-6 text-center max-w-md">
          {error || "Impossible de charger les détails de ce média"}
        </p>
        <Button onClick={handleGoBack} className="bg-netflix-red hover:bg-netflix-red/90">
          Retour à l'accueil
        </Button>
      </div>
    );
  }
  
  const backdropUrl = item.BackdropImageTags && item.BackdropImageTags.length > 0
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
        style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/20 to-transparent"></div>
        
        <div className="relative z-10 container mx-auto px-6 pt-24 pb-8 h-full flex flex-col justify-end">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 w-48 rounded-md overflow-hidden shadow-lg hidden md:block">
              <img 
                src={primaryImageUrl} 
                alt={item.Name} 
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback to placeholder on image error
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }} 
              />
            </div>
            
            <div className="flex-grow">
              <h1 className="text-4xl font-bold mb-2">{item.Name}</h1>
              
              <div className="flex flex-wrap items-center text-sm text-gray-300 gap-4 mb-6">
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
              
              {item.Overview && (
                <p className="text-gray-300 mb-8 max-w-3xl">{item.Overview}</p>
              )}
              
              <div className="flex space-x-4">
                <Button 
                  className="bg-netflix-red hover:bg-netflix-red/90 text-white flex items-center px-8 py-6"
                  onClick={handlePlayMedia}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Lecture
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 flex items-center px-8 py-6"
                  onClick={handleGoBack}
                >
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        {/* Informations supplémentaires sur le média */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {item.Genres && item.Genres.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {item.Genres.map((genre, index) => (
                  <span key={index} className="bg-netflix-gray-dark px-3 py-1 rounded-full text-sm">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Autres détails si disponibles */}
          {item.Studios && item.Studios.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Studios</h3>
              <p className="text-gray-300">
                {item.Studios.map(studio => studio.Name).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
