
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJellyfinStore } from "@/services/jellyfinService";
import LoginPage from "./LoginPage";

const Index = () => {
  const navigate = useNavigate();
  const { getUserInfo } = useJellyfinStore();
  const userInfo = getUserInfo();
  
  useEffect(() => {
    if (userInfo) {
      navigate('/home');
    }
  }, [userInfo, navigate]);

  return <LoginPage />;
};

export default Index;
