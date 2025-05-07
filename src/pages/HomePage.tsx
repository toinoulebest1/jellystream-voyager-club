
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import MediaRow from "@/components/MediaRow";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useJellyfinStore, jellyfinApi, JellyfinItem } from "@/services/jellyfinService";

const HomePage = () => {
  const [libraries, setLibraries] = useState<JellyfinItem[]>([]);
  const [movies, setMovies] = useState<JellyfinItem[]>([]);
  const [tvShows, setTvShows] = useState<JellyfinItem[]>([]);
  const [featuredItem, setFeaturedItem] = useState<JellyfinItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo, clearAuth } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!serverUrl || !userInfo) {
      navigate('/');
      return;
    }
    
    // Prévenir les appels API répétés si on a déjà chargé les données
    if (dataFetched) return;
    
    const fetchLibraries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Tentative de récupération des bibliothèques depuis", serverUrl);
        
        // Vérifier que le serveur est accessible
        try {
          const checkResponse = await fetch(`${serverUrl}/System/Info/Public`, {
            method: 'GET',
            headers: {
              'X-Emby-Token': userInfo.AccessToken,
            },
          });
          
          if (!checkResponse.ok) {
            throw new Error(`Serveur inaccessible, code: ${checkResponse.status}`);
          }
        } catch (e) {
          console.error("Erreur lors de la vérification du serveur:", e);
          throw new Error("Impossible de se connecter au serveur Jellyfin. Vérifiez l'URL et que le serveur est accessible.");
        }
        
        // Récupérer les bibliothèques
        const librariesData = await jellyfinApi.getItems(
          serverUrl,
          userInfo.Id,
          userInfo.AccessToken
        );
        
        console.log("Bibliothèques récupérées:", librariesData);
        
        if (!librariesData || !librariesData.Items || librariesData.Items.length === 0) {
          throw new Error("Aucune bibliothèque trouvée. Vérifiez les permissions de l'utilisateur.");
        }
        
        setLibraries(librariesData.Items);
        
        // Trouver les bibliothèques de films et de séries
        const movieLibrary = librariesData.Items.find(
          (item) => item.Name === "Films" || item.Name === "Movies"
        );
        
        const tvLibrary = librariesData.Items.find(
          (item) => item.Name === "Séries" || item.Name === "TV Shows" || item.Name === "Series"
        );
        
        // Limiter le nombre de films récupérés pour éviter les problèmes de performance
        const fetchOptions = {
          Limit: '30', // Limite à 30 éléments
          SortBy: 'DateCreated',
          SortOrder: 'Descending'
        };
        
        // Récupérer les films (limités)
        if (movieLibrary) {
          const moviesData = await jellyfinApi.getItems(
            serverUrl,
            userInfo.Id,
            userInfo.AccessToken,
            movieLibrary.Id,
            fetchOptions
          );
          
          console.log("Films récupérés:", moviesData);
          if (moviesData && moviesData.Items) {
            setMovies(moviesData.Items);
            
            // Choisir un film au hasard pour le header
            if (moviesData.Items.length > 0) {
              const randomIndex = Math.floor(Math.random() * moviesData.Items.length);
              setFeaturedItem(moviesData.Items[randomIndex]);
            }
          }
        } else {
          console.log("Pas de bibliothèque de films trouvée");
        }
        
        // Récupérer les séries (limitées)
        if (tvLibrary) {
          const tvShowsData = await jellyfinApi.getItems(
            serverUrl,
            userInfo.Id,
            userInfo.AccessToken,
            tvLibrary.Id,
            fetchOptions
          );
          
          console.log("Séries récupérées:", tvShowsData);
          if (tvShowsData && tvShowsData.Items) {
            setTvShows(tvShowsData.Items);
            
            // Si aucun film n'a été sélectionné pour le header, choisir une série
            if (!featuredItem && tvShowsData.Items.length > 0) {
              const randomIndex = Math.floor(Math.random() * tvShowsData.Items.length);
              setFeaturedItem(tvShowsData.Items[randomIndex]);
            }
          }
        } else {
          console.log("Pas de bibliothèque de séries trouvée");
        }

        // Marquer les données comme chargées pour éviter les rechargements
        setDataFetched(true);
      } catch (error) {
        console.error("Erreur lors du chargement des médias:", error);
        const errorMessage = error instanceof Error ? error.message : "Impossible de charger le contenu";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLibraries();
  }, [serverUrl, userInfo, navigate, dataFetched, featuredItem]);
  
  const handleLogout = () => {
    clearAuth();
    navigate('/');
    toast.success("Vous avez été déconnecté");
  };
  
  const handleRefresh = () => {
    setDataFetched(false); // Réinitialiser pour permettre un nouveau chargement
    setIsLoading(true);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-netflix-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-netflix-red text-xl font-bold mb-4">Erreur</div>
        <p className="text-white mb-6 text-center max-w-md">{error}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleRefresh} className="bg-netflix-red hover:bg-netflix-red/90">
            Réessayer
          </Button>
          <Button onClick={handleLogout} variant="outline" className="border-netflix-red text-netflix-red hover:bg-netflix-red/10">
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <Navbar />
      
      {featuredItem && <Header item={featuredItem} />}
      
      <div className="container mx-auto px-6 py-8 mt-[70vh]">
        {movies.length > 0 ? (
          <MediaRow title="Films" items={movies} />
        ) : (
          <div className="p-4 text-center text-gray-400">
            Aucun film trouvé dans votre médiathèque
          </div>
        )}
        
        {tvShows.length > 0 ? (
          <MediaRow title="Séries" items={tvShows} />
        ) : (
          <div className="p-4 text-center text-gray-400">
            Aucune série trouvée dans votre médiathèque
          </div>
        )}
        
        {movies.length === 0 && tvShows.length === 0 && (
          <div className="p-8 text-center bg-netflix-gray/20 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Aucun contenu trouvé</h2>
            <p className="mb-4">Assurez-vous d'avoir des médias dans votre serveur Jellyfin et que l'utilisateur dispose des permissions nécessaires.</p>
            <Button onClick={handleRefresh} className="bg-netflix-red hover:bg-netflix-red/90">
              Actualiser la page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
