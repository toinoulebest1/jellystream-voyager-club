
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJellyfinStore } from "@/services/jellyfinService";
import { Search, Home, Film, Tv, User, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { getUserInfo, clearAuth } = useJellyfinStore();
  const navigate = useNavigate();
  
  const userInfo = getUserInfo();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    clearAuth();
    toast.success("Vous avez été déconnecté");
    navigate('/');
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-netflix-black' : 'bg-gradient-to-b from-netflix-black/80 to-transparent'
    }`}>
      <div className="container mx-auto py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/home" className="flex items-center">
              <span className="text-netflix-red text-2xl font-bold">JELLYSTREAM</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/home" className="text-gray-300 hover:text-white text-sm">
                Accueil
              </Link>
              <Link to="/movies" className="text-gray-300 hover:text-white text-sm">
                Films
              </Link>
              <Link to="/series" className="text-gray-300 hover:text-white text-sm">
                Séries
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
              <Search className="h-5 w-5" />
            </Button>
            
            <div className="relative group">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <User className="h-5 w-5" />
              </Button>
              
              <div className="absolute right-0 mt-2 w-48 bg-netflix-gray rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-2">
                {userInfo && (
                  <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                    {userInfo.Name}
                  </div>
                )}
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-netflix-red/20 rounded"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:hidden border-t border-gray-800">
        <nav className="flex items-center justify-between px-6 py-2">
          <Link to="/home" className="flex flex-col items-center text-gray-300 hover:text-white">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Accueil</span>
          </Link>
          <Link to="/movies" className="flex flex-col items-center text-gray-300 hover:text-white">
            <Film className="h-5 w-5" />
            <span className="text-xs mt-1">Films</span>
          </Link>
          <Link to="/series" className="flex flex-col items-center text-gray-300 hover:text-white">
            <Tv className="h-5 w-5" />
            <span className="text-xs mt-1">Séries</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
