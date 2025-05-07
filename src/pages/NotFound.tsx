
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJellyfinStore } from "@/services/jellyfinService";

const NotFound = () => {
  const { getUserInfo } = useJellyfinStore();
  const userInfo = getUserInfo();
  const redirectPath = userInfo ? "/home" : "/";
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-netflix-black">
      <div className="text-center">
        <h1 className="text-netflix-red text-6xl font-bold mb-4">404</h1>
        <p className="text-white text-xl mb-8">
          Cette page semble avoir disparu dans le néant du streaming.
        </p>
        <Button asChild className="bg-netflix-red hover:bg-netflix-red/90">
          <Link to={redirectPath}>Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
