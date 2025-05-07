
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useJellyfinStore, jellyfinApi } from "@/services/jellyfinService";

interface VideoPlayerProps {
  itemId: string;
}

export const VideoPlayer = ({ itemId }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!serverUrl || !userInfo || !itemId) {
      navigate('/home');
      return;
    }
    
    // Configurer le lecteur vidéo
    const videoElement = videoRef.current;
    if (videoElement) {
      const streamUrl = jellyfinApi.getStreamUrl(serverUrl, itemId, userInfo.AccessToken);
      videoElement.src = streamUrl;
      
      // Démarrer la lecture automatiquement
      videoElement.play().catch(error => {
        console.error("Erreur lors de la lecture automatique:", error);
      });
    }
    
    // Configurer le lecteur en plein écran
    const handleFullScreen = () => {
      if (videoElement && videoElement.requestFullscreen) {
        videoElement.requestFullscreen().catch(err => {
          console.error("Erreur lors du passage en plein écran:", err);
        });
      }
    };
    
    // Activer le plein écran après 2 secondes si la lecture est en cours
    const fullScreenTimer = setTimeout(() => {
      if (videoElement && !videoElement.paused) {
        handleFullScreen();
      }
    }, 2000);
    
    return () => {
      clearTimeout(fullScreenTimer);
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
      }
    };
  }, [itemId, serverUrl, userInfo, navigate]);
  
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="relative h-screen bg-black">
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 z-10 bg-black/50 text-white hover:bg-black/70"
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>
      
      <video 
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
      >
        Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
      </video>
    </div>
  );
};

export default VideoPlayer;
