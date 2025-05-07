
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
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!serverUrl || !userInfo || !itemId) {
      navigate('/home');
      return;
    }
    
    try {
      // Générer l'URL de streaming
      const streamUrl = jellyfinApi.getStreamUrl(serverUrl, itemId, userInfo.AccessToken);
      setVideoUrl(streamUrl);
      
      console.log("URL de streaming générée:", streamUrl);
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL de streaming:", error);
      setLoadError("Impossible de générer l'URL de streaming");
      toast.error("Erreur de préparation de la vidéo");
    }
  }, [itemId, serverUrl, userInfo, navigate]);
  
  useEffect(() => {
    if (!videoUrl) return;
    
    // Configuration du lecteur vidéo
    const videoElement = videoRef.current;
    if (videoElement) {
      // Configuration des attributs CORS et autres attributs importants
      videoElement.crossOrigin = "anonymous";
      videoElement.src = videoUrl;
      videoElement.muted = true;
      
      // Gestionnaires d'événements pour surveiller les erreurs de chargement
      const handleError = (e: Event) => {
        console.error("Erreur de chargement vidéo:", e);
        setLoadError("Impossible de charger la vidéo. Veuillez réessayer plus tard.");
        toast.error("Erreur de chargement de la vidéo");
      };
      
      const handleCanPlay = () => {
        console.log("Vidéo prête à être lue");
        toast.success("Vidéo prête à être lue");
      };
      
      videoElement.addEventListener("error", handleError);
      videoElement.addEventListener("canplay", handleCanPlay);
      
      // Tentative de lecture automatique en mode muet (généralement autorisée)
      videoElement.play()
        .then(() => {
          setIsPlaying(true);
          toast.info("Lecture démarrée en mode muet. Cliquez sur l'icône du son pour activer l'audio.");
        })
        .catch(error => {
          console.error("Erreur lors de la lecture automatique:", error);
          toast.error("La lecture automatique a été bloquée. Veuillez cliquer sur play pour démarrer.");
          setIsPlaying(false);
        });
      
      return () => {
        videoElement.removeEventListener("error", handleError);
        videoElement.removeEventListener("canplay", handleCanPlay);
        videoElement.pause();
        videoElement.src = "";
      };
    }
  }, [videoUrl]);
  
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
  };
  
  const handleFullScreen = () => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.requestFullscreen) {
      videoElement.requestFullscreen().catch(err => {
        console.error("Erreur lors du passage en plein écran:", err);
      });
    }
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
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 p-6 rounded-lg text-white max-w-md text-center">
            <h3 className="text-xl mb-2">Erreur de chargement</h3>
            <p>{loadError}</p>
            <Button onClick={handleBackClick} className="mt-4">
              Retourner à la navigation
            </Button>
          </div>
        </div>
      )}
      
      {!videoUrl && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
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
