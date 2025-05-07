
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
    
    // Vérifier si le navigateur prend en charge HLS nativement
    const video = document.createElement('video');
    let hlsSupport = false;
    
    try {
      hlsSupport = video.canPlayType('application/vnd.apple.mpegurl') !== '';
      console.log("Support HLS natif:", hlsSupport ? "Oui" : "Non (HLS.js sera utilisé)");
      
      // Tester également d'autres formats
      const mp4Support = video.canPlayType('video/mp4') !== '';
      console.log("Support MP4:", mp4Support ? "Oui" : "Non");
      
      const webmSupport = video.canPlayType('video/webm') !== '';
      console.log("Support WebM:", webmSupport ? "Oui" : "Non");
      
      // Définir la méthode préférée selon le support du navigateur
      if (!hlsSupport) {
        setPreferredMethod(StreamingMethod.MP4);
      }
    } catch (e) {
      console.log("Erreur lors de la vérification du support des formats:", e);
      setPreferredMethod(StreamingMethod.MP4); // Fallback sur MP4 en cas d'erreur
    }
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
