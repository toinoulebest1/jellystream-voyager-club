
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LoadingSpinnerProps {
  className?: string;
  timeout?: number;
}

export const LoadingSpinner = ({ className, timeout = 15000 }: LoadingSpinnerProps) => {
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [timeout]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center">
        <div className="text-netflix-red text-xl font-bold mb-4">
          Le chargement prend plus de temps que prévu
        </div>
        <p className="text-white mb-6">
          Il pourrait y avoir un problème de connexion avec votre serveur Jellyfin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleRetry} className="bg-netflix-red hover:bg-netflix-red/90">
            Réessayer
          </Button>
          <Button onClick={handleBackToLogin} variant="outline" className="border-netflix-red text-netflix-red hover:bg-netflix-red/10">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className={cn("animate-spin rounded-full border-4 border-solid border-netflix-red border-t-transparent h-12 w-12", className)}></div>
    </div>
  );
};

export default LoadingSpinner;
