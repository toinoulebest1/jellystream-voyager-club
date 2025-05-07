
import { useParams } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { useEffect } from "react";
import { toast } from "sonner";

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    if (!id) {
      toast.error("Identifiant de média manquant");
    }
  }, [id]);

  if (!id) return null;

  return <VideoPlayer itemId={id} />;
};

export default PlayerPage;
