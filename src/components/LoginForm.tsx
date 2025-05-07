
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { JellyfinCredentials, jellyfinApi, useJellyfinStore } from "@/services/jellyfinService";

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<JellyfinCredentials>({
    serverUrl: '',
    username: '',
    password: '',
  });
  const navigate = useNavigate();
  const { saveServerInfo, saveUserInfo } = useJellyfinStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.serverUrl || !credentials.username || !credentials.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Authentifier l'utilisateur
      const user = await jellyfinApi.authenticate(credentials);
      
      // Sauvegarder les informations
      saveServerInfo(credentials);
      saveUserInfo(user);
      
      toast.success(`Bienvenue, ${user.Name} !`);
      navigate('/home');
    } catch (error) {
      console.error("Erreur de connexion:", error);
      // Toast est déjà géré dans la fonction authenticate
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-netflix-gray border-netflix-gray">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Connexion</CardTitle>
        <CardDescription className="text-netflix-light">
          Connectez-vous à votre serveur Jellyfin
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              name="serverUrl"
              placeholder="URL du serveur (ex: http://192.168.1.100:8096)"
              onChange={handleInputChange}
              value={credentials.serverUrl}
              className="bg-[#333] border-[#333] text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              name="username"
              placeholder="Nom d'utilisateur"
              onChange={handleInputChange}
              value={credentials.username}
              className="bg-[#333] border-[#333] text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Mot de passe"
              onChange={handleInputChange}
              value={credentials.password}
              className="bg-[#333] border-[#333] text-white"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-netflix-red hover:bg-netflix-red/90"
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
