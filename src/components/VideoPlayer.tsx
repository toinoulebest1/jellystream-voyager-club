
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Volume2, VolumeX, Repeat } from "lucide-react";
import { useJellyfinStore, jellyfinApi, StreamingMethod } from "@/services/jellyfinService";
import { toast } from "sonner";
import Hls from "hls.js";

interface VideoPlayerProps {
  itemId: string;
}

export const VideoPlayer = ({ itemId }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentMethod, setCurrentMethod] = useState<StreamingMethod>(StreamingMethod.HLS);
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  const attemptedUrlsRef = useRef<Set<string>>(new Set());
  const initializingRef = useRef<boolean>(false);
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  // Fonction pour générer l'URL avec la méthode sélectionnée
  const generateStreamUrl = useCallback(() => {
    if (!serverUrl || !userInfo || !itemId) {
      return null;
    }
    
    try {
      const streamUrl = jellyfinApi.getStreamUrl(serverUrl, itemId, userInfo.AccessToken, currentMethod);
      console.log(`URL de streaming générée: ${streamUrl} (${currentMethod})`, retryCount);
      return streamUrl;
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL de streaming:", error);
      return null;
    }
  }, [serverUrl, userInfo, itemId, currentMethod, retryCount]);
  
  // Cycle entre les différentes méthodes de streaming
  const cycleStreamingMethod = useCallback(() => {
    setCurrentMethod((prev) => {
      switch (prev) {
        case StreamingMethod.HLS:
          return StreamingMethod.MP4;
        case StreamingMethod.MP4:
          return StreamingMethod.DIRECT;
        case StreamingMethod.DIRECT:
        default:
          return StreamingMethod.HLS;
      }
    });
    setRetryCount(prev => prev + 1);
  }, []);
  
  // Générer l'URL de streaming uniquement quand la méthode ou l'ID change
  useEffect(() => {
    if (!serverUrl || !userInfo || !itemId) {
      navigate('/home');
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    // Générer une nouvelle URL de streaming
    const newUrl = generateStreamUrl();
    if (newUrl) {
      setVideoUrl(newUrl);
    } else {
      setLoadError("Impossible de générer l'URL de streaming");
      setIsLoading(false);
      toast.error("Erreur de préparation de la vidéo");
    }
  }, [itemId, serverUrl, userInfo, navigate, currentMethod, generateStreamUrl]);
  
  // Nettoyage de l'instance HLS lors du démontage du composant
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);
  
  // Configuration et gestion du lecteur vidéo avec HLS.js
  useEffect(() => {
    if (!videoUrl) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Si l'URL a déjà été tentée et a échoué, passer à la méthode suivante
    if (attemptedUrlsRef.current.has(videoUrl)) {
      console.log("URL déjà tentée et échouée, passage à une autre méthode");
      cycleStreamingMethod();
      return;
    }
    
    // Prévenir les initialisations multiples simultanées
    if (initializingRef.current) {
      console.log("Initialisation déjà en cours, ignorée");
      return;
    }
    
    initializingRef.current = true;
    attemptedUrlsRef.current.add(videoUrl);
    
    setIsLoading(true);
    setLoadError(null);
    
    // Configurer le lecteur
    videoElement.crossOrigin = "anonymous";
    videoElement.muted = isMuted;
    
    // Variables pour suivre l'état du chargement
    let loadingTimeout: ReturnType<typeof setTimeout>;
    let isVideoPlaying = false;
    
    // Nettoyer toute instance HLS précédente
    destroyHls();
    
    // Déterminer comment charger la vidéo
    const isHlsUrl = videoUrl.includes('.m3u8');
    
    const initializePlayer = () => {
      // Pour les flux HLS, utiliser hls.js si disponible
      if (isHlsUrl && Hls.isSupported()) {
        console.log("Initialisation du lecteur HLS.js");
        
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5,
          lowLatencyMode: false,
          debug: false
        });
        
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS.js: Media attachée");
          hls.loadSource(videoUrl);
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS.js: Manifest analysé, démarrage de la lecture");
          startPlayback();
        });
        
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error("Erreur HLS.js fatale:", data.type, data.details);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                toast.error("Erreur réseau lors du chargement de la vidéo");
                // Éviter les retentatives multiples pour la même URL
                initializingRef.current = false;
                cycleStreamingMethod();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                toast.error("Erreur de décodage du média");
                // Éviter les retentatives multiples pour la même URL
                initializingRef.current = false;
                cycleStreamingMethod();
                break;
              default:
                // Erreur fatale irrécupérable
                destroyHls();
                setLoadError(`Erreur HLS: ${data.details}`);
                initializingRef.current = false;
                cycleStreamingMethod(); // Essayer une autre méthode
                break;
            }
          }
        });
        
        // Stocker la référence HLS
        hlsRef.current = hls;
      } 
      else {
        // Méthode standard pour les formats non-HLS
        console.log("Utilisation du lecteur HTML5 standard");
        videoElement.src = videoUrl;
        videoElement.load();
      }
    };
    
    // Gestionnaires d'événements pour le lecteur vidéo
    const handleCanPlay = () => {
      console.log("Vidéo prête à être lue");
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      initializingRef.current = false;
      
      if (!isVideoPlaying && videoElement.paused) {
        startPlayback();
      }
    };
    
    const handleError = (e: Event) => {
      console.error("Erreur de chargement vidéo:", e, videoElement.error);
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      initializingRef.current = false;
      
      let errorMessage = "Erreur de lecture de la vidéo";
      if (videoElement.error) {
        errorMessage = getVideoErrorMessage(videoElement.error);
      }
      
      setLoadError(errorMessage);
      // Essayer une autre méthode après une erreur
      cycleStreamingMethod();
    };
    
    const getVideoErrorMessage = (error: MediaError): string => {
      switch (error.code) {
        case 1: // MEDIA_ERR_ABORTED
          return "La lecture a été interrompue";
        case 2: // MEDIA_ERR_NETWORK
          return "Problème réseau pendant le chargement de la vidéo";
        case 3: // MEDIA_ERR_DECODE
          return "Format vidéo non supporté ou corrompu";
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          return "Ce format vidéo n'est pas supporté par votre navigateur";
        default:
          return `Erreur de lecture (code ${error.code})`;
      }
    };
    
    const handleAbort = (e: Event) => {
      console.error("Chargement vidéo interrompu:", e);
      setIsLoading(false);
      initializingRef.current = false;
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
    
    const startPlayback = () => {
      setTimeout(() => {
        if (!videoElement) return;
        
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
            initializingRef.current = false;
            
            if (error.name === "NotAllowedError") {
              toast.error("La lecture automatique a été bloquée. Veuillez cliquer sur play pour démarrer.");
            }
          });
      }, 500);
    };
    
    // Définir un délai pour détecter les problèmes de chargement
    loadingTimeout = setTimeout(() => {
      if (videoElement.readyState < 3) {
        setIsLoading(false);
        setLoadError("Le chargement de la vidéo prend trop de temps. Tentative avec une autre méthode...");
        initializingRef.current = false;
        cycleStreamingMethod();
      }
    }, 15000); // 15 secondes
    
    // Attacher les événements
    videoElement.addEventListener("canplay", handleCanPlay);
    videoElement.addEventListener("error", handleError);
    videoElement.addEventListener("abort", handleAbort);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);
    
    // Initialiser le lecteur
    initializePlayer();
    
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
        videoElement.load();
      }
      destroyHls();
      initializingRef.current = false;
    };
  }, [videoUrl, isMuted, destroyHls, cycleStreamingMethod]);
  
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
          if (error.name !== "AbortError") {
            toast.error("Impossible de démarrer la lecture");
          }
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
    // Réinitialiser les URLs tentées pour permettre de réessayer
    attemptedUrlsRef.current.clear();
    cycleStreamingMethod();
    toast.info(`Tentative avec ${currentMethod === StreamingMethod.HLS ? "MP4" : currentMethod === StreamingMethod.MP4 ? "lecture directe" : "streaming HLS"}...`);
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
            <p className="mt-2 text-sm text-gray-400">
              Format vidéo non supporté ou problème avec le serveur Jellyfin.
            </p>
            <div className="flex gap-4 mt-4 justify-center">
              <Button onClick={handleRetry} variant="outline" className="flex items-center">
                <Repeat className="mr-2 h-4 w-4" />
                Essayer {currentMethod === StreamingMethod.HLS ? "MP4" : 
                         currentMethod === StreamingMethod.MP4 ? "Direct" : "HLS"}
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
          
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20 text-xs"
            onClick={handleRetry}
          >
            Format: {currentMethod}
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
