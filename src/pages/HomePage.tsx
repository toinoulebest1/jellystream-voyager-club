
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import MediaRow from "@/components/MediaRow";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useJellyfinStore, jellyfinApi, JellyfinItem } from "@/services/jellyfinService";

const HomePage = () => {
  const [libraries, setLibraries] = useState<JellyfinItem[]>([]);
  const [movies, setMovies] = useState<JellyfinItem[]>([]);
  const [tvShows, setTvShows] = useState<JellyfinItem[]>([]);
  const [featuredItem, setFeaturedItem] = useState<JellyfinItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!serverUrl || !userInfo) {
      navigate('/');
      return;
    }
    
    const fetchLibraries = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les bibliothèques
        const librariesData = await jellyfinApi.getItems(
          serverUrl,
          userInfo.Id,
          userInfo.AccessToken
        );
        
        setLibraries(librariesData.Items);
        
        // Trouver les bibliothèques de films et de séries
        const movieLibrary = librariesData.Items.find(
          (item) => item.Name === "Films" || item.Name === "Movies"
        );
        
        const tvLibrary = librariesData.Items.find(
          (item) => item.Name === "Séries" || item.Name === "TV Shows" || item.Name === "Series"
        );
        
        // Récupérer les films
        if (movieLibrary) {
          const moviesData = await jellyfinApi.getItems(
            serverUrl,
            userInfo.Id,
            userInfo.AccessToken,
            movieLibrary.Id
          );
          
          setMovies(moviesData.Items);
          
          // Choisir un film au hasard pour le header
          if (moviesData.Items.length > 0) {
            const randomIndex = Math.floor(Math.random() * moviesData.Items.length);
            setFeaturedItem(moviesData.Items[randomIndex]);
          }
        }
        
        // Récupérer les séries
        if (tvLibrary) {
          const tvShowsData = await jellyfinApi.getItems(
            serverUrl,
            userInfo.Id,
            userInfo.AccessToken,
            tvLibrary.Id
          );
          
          setTvShows(tvShowsData.Items);
          
          // Si aucun film n'a été sélectionné pour le header, choisir une série
          if (!featuredItem && tvShowsData.Items.length > 0) {
            const randomIndex = Math.floor(Math.random() * tvShowsData.Items.length);
            setFeaturedItem(tvShowsData.Items[randomIndex]);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des médias:", error);
        toast.error("Impossible de charger le contenu");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLibraries();
  }, [serverUrl, userInfo, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <Navbar />
      
      {featuredItem && <Header item={featuredItem} />}
      
      <div className="container mx-auto px-6 py-8 mt-[70vh]">
        {movies.length > 0 && (
          <MediaRow title="Films" items={movies} />
        )}
        
        {tvShows.length > 0 && (
          <MediaRow title="Séries" items={tvShows} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
