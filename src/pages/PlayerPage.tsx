
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
  }, [id, serverUrl, userInfo]);

  if (!id) return null;

  return <VideoPlayer itemId={id} />;
};

export default PlayerPage;
