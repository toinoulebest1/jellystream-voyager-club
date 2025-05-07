
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Volume2, VolumeX } from "lucide-react";
import { useJellyfinStore, jellyfinApi } from "@/services/jellyfinService";
import { toast } from "sonner";

interface VideoPlayerProps {
  itemId: string;
}

export const VideoPlayer = ({ itemId }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  // Générer l'URL de streaming
  useEffect(() => {
    if (!serverUrl || !userInfo || !itemId) {
      navigate('/home');
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Générer l'URL de streaming avec un identifiant de session unique
      const streamUrl = jellyfinApi.getStreamUrl(serverUrl, itemId, userInfo.AccessToken);
      setVideoUrl(streamUrl);
      
      console.log("URL de streaming générée:", streamUrl);
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL de streaming:", error);
      setLoadError("Impossible de générer l'URL de streaming");
      toast.error("Erreur de préparation de la vidéo");
    }
  }, [itemId, serverUrl, userInfo, navigate, retryCount]);
  
  // Configuration et gestion du lecteur vidéo
  useEffect(() => {
    if (!videoUrl) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Configuration du lecteur vidéo
    videoElement.crossOrigin = "anonymous";
    videoElement.muted = isMuted;
    videoElement.src = videoUrl;
    
    // Variables pour suivre l'état du chargement
    let loadingTimeout: ReturnType<typeof setTimeout>;
    let isVideoPlaying = false;
    
    // Gestionnaires d'événements pour surveiller le cycle de vie de la vidéo
    const handleCanPlay = () => {
      console.log("Vidéo prête à être lue");
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      
      // Si la lecture n'a pas encore commencé, essayer de démarrer
      if (!isVideoPlaying && videoElement.paused) {
        startPlayback();
      }
    };
    
    const handleError = (e: Event) => {
      console.error("Erreur de chargement vidéo:", e, videoElement.error);
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      
      let errorMessage = "Erreur de lecture de la vidéo";
      if (videoElement.error) {
        switch (videoElement.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = "La lecture a été interrompue";
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = "Problème réseau pendant le chargement de la vidéo";
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = "Format vidéo non supporté ou corrompu";
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = "Ce format vidéo n'est pas supporté par votre navigateur";
            break;
        }
      }
      
      setLoadError(errorMessage);
      toast.error(errorMessage);
    };
    
    const handleAbort = (e: Event) => {
      console.error("Chargement vidéo interrompu:", e);
      setIsLoading(false);
      setLoadError("Le chargement de la vidéo a été interrompu");
    };
    
    const handlePlay = () => {
      isVideoPlaying = true;
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      toast.info("La vidéo est terminée");
    };
    
    // Fonction pour démarrer la lecture
    const startPlayback = () => {
      videoElement.play()
        .then(() => {
          setIsPlaying(true);
          if (isMuted) {
            toast.info("Lecture démarrée en mode muet. Cliquez sur l'icône du son pour activer l'audio.");
          }
        })
        .catch(error => {
          console.error("Erreur lors de la lecture automatique:", error);
          setIsPlaying(false);
          if (error.name === "NotAllowedError") {
            toast.error("La lecture automatique a été bloquée. Veuillez cliquer sur play pour démarrer.");
          } else {
            toast.error("Impossible de démarrer la lecture");
          }
        });
    };
    
    // Définir un délai pour détecter les problèmes de chargement
    loadingTimeout = setTimeout(() => {
      if (videoElement.readyState < 3) { // HAVE_FUTURE_DATA
        setIsLoading(false);
        setLoadError("Le chargement de la vidéo prend trop de temps. Vérifiez votre connexion ou réessayez.");
        toast.error("Chargement vidéo trop long");
      }
    }, 15000); // 15 secondes
    
    // Attacher les événements
    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("error", handleError);
    videoElement.addEventListener("abort", handleAbort);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);
    
    // Nettoyage lors du démontage du composant
    return () => {
      clearTimeout(loadingTimeout);
      if (videoElement) {
        videoElement.removeEventListener("canplay", handleCanPlay);
        videoElement.removeEventListener("error", handleError);
        videoElement.removeEventListener("abort", handleAbort);
        videoElement.removeEventListener("play", handlePlay);
        videoElement.removeEventListener("pause", handlePause);
        videoElement.removeEventListener("ended", handleEnded);
        videoElement.pause();
        videoElement.src = "";
      }
    };
  }, [videoUrl, isMuted]);
  
  const handleBackClick = () => {
    navigate(-1);
  };

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (videoElement.paused) {
      videoElement.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Erreur lors de la lecture:", error);
          toast.error("Impossible de démarrer la lecture");
        });
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.muted = !videoElement.muted;
    setIsMuted(videoElement.muted);
    
    if (videoElement.muted) {
      toast.info("Son désactivé");
    } else {
      toast.info("Son activé");
    }
  };
  
  const handleFullScreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error("Erreur lors de la sortie du mode plein écran:", err);
      });
    } else if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen().catch(err => {
        console.error("Erreur lors du passage en plein écran:", err);
      });
    }
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast.info("Nouvelle tentative de chargement...");
  };

  return (
    <div className="relative h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button 
          variant="ghost" 
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={handleBackClick}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-6 rounded-lg text-white max-w-md text-center">
            <h3 className="text-xl mb-2">Erreur de chargement</h3>
            <p>{loadError}</p>
            <div className="flex gap-4 mt-4 justify-center">
              <Button onClick={handleRetry} variant="outline">
                Réessayer
              </Button>
              <Button onClick={handleBackClick}>
                Retourner à la navigation
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
        <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20" 
            onClick={togglePlay}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H10V20H6V4Z" fill="currentColor" />
                <path d="M14 4H18V20H14V4Z" fill="currentColor" />
              </svg>
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20" 
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleFullScreen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8V4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16V20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 4H20V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 20H20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      </div>
      
      <video 
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={false}
        playsInline
        crossOrigin="anonymous"
      >
        Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
      </video>
    </div>
  );
};

export default VideoPlayer;
