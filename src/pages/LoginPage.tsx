
import LoginForm from "@/components/LoginForm";

const LoginPage = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://assets.nflxext.com/ffe/siteui/vlv3/c0b69670-89a3-48ca-877f-45ba7a60c16f/2642e08e-4202-490e-8e93-aff04881ee8a/FR-fr-20240212-popsignuptwoweeks-perspective_alpha_website_small.jpg')" }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-netflix-red mb-2">JELLYSTREAM</h1>
          <p className="text-white text-lg">Votre club de streaming personnalisé</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
