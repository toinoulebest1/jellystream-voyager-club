
import { useParams } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect } from "react";
import { toast } from "sonner";
import { useJellyfinStore } from "@/services/jellyfinService";

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getServerUrl, getUserInfo } = useJellyfinStore();
  
  const serverUrl = getServerUrl();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (!id) {
      toast.error("Identifiant de média manquant");
      return;
    }
    
    if (!serverUrl || !userInfo) {
      toast.error("Informations de connexion manquantes");
      return;
    }
    
    // Vérifier que les paramètres requis sont présents
    console.log("Préparation de la lecture du média:", id);
    
    // Vérifier si le navigateur prend en charge HLS nativement
    const video = document.createElement('video');
    let hlsSupport = false;
    
    try {
      hlsSupport = video.canPlayType('application/vnd.apple.mpegurl') !== '';
    } catch (e) {
      console.log("Erreur lors de la vérification du support HLS:", e);
    }
    
    console.log("Support HLS natif:", hlsSupport ? "Oui" : "Non (HLS.js sera utilisé)");
    
    // Vérifier si le navigateur prend en charge MKV
    try {
      const mkvSupport = video.canPlayType('video/x-matroska') !== '';
      console.log("Support MKV:", mkvSupport ? "Oui" : "Non");
    } catch (e) {
      console.log("MKV probablement non supporté");
    }
    
  }, [id, serverUrl, userInfo]);

  if (!id) return null;

  return <VideoPlayer itemId={id} />;
};

export default PlayerPage;
