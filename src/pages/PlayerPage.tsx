
import { useParams, useNavigate } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useJellyfinStore, StreamingMethod } from "@/services/jellyfinService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [preferredMethod, setPreferredMethod] = useState<StreamingMethod>(StreamingMethod.HLS);
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!id) {
      toast.error("Identifiant de média manquant");
      setError("Identifiant de média manquant");
      return;
    }
    
    if (!serverUrl || !userInfo) {
      toast.error("Informations de connexion manquantes");
      setError("Veuillez vous connecter à votre serveur Jellyfin");
      return;
    }
    
    // Vérifier que les paramètres requis sont présents
    console.log("Préparation de la lecture du média:", id);
    
    // Détecter le support des formats vidéo
    const detectVideoSupport = () => {
      const video = document.createElement('video');
      
      try {
        // Tester le support HLS natif
        const hlsSupport = video.canPlayType('application/vnd.apple.mpegurl') !== '';
        console.log("Support HLS natif:", hlsSupport ? "Oui" : "Non (HLS.js sera utilisé si disponible)");
        
        // Tester le support des formats courants
        const mp4Support = video.canPlayType('video/mp4') !== '';
        console.log("Support MP4:", mp4Support ? "Oui" : "Non");
        
        const webmSupport = video.canPlayType('video/webm') !== '';
        console.log("Support WebM:", webmSupport ? "Oui" : "Non");
        
        // Définir la méthode préférée selon les capacités du navigateur
        if (hlsSupport) {
          setPreferredMethod(StreamingMethod.HLS);
        } else if (mp4Support) {
          setPreferredMethod(StreamingMethod.MP4);
        } else {
          // Fallback vers la lecture directe si rien d'autre n'est supporté
          setPreferredMethod(StreamingMethod.DIRECT);
          toast.warning("Votre navigateur a un support limité pour la lecture vidéo");
        }
      } catch (e) {
        console.error("Erreur lors de la détection des formats supportés:", e);
        // Fallback sur MP4 en cas d'erreur
        setPreferredMethod(StreamingMethod.MP4);
      }
    };
    
    // Exécuter la détection de format
    detectVideoSupport();
    
  }, [id, serverUrl, userInfo, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <div className="bg-black/60 p-6 rounded-lg text-white max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Erreur de lecture</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={() => navigate('/home')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (!id) return null;

  return <VideoPlayer itemId={id} initialMethod={preferredMethod} />;
};

export default PlayerPage;
