
import { useParams } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) return null;

  return <VideoPlayer itemId={id} />;
};

export default PlayerPage;
