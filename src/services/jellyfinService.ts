
import { toast } from 'sonner';

// Types basiques pour Jellyfin API
export interface JellyfinCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  AccessToken: string;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ImageTags: {
    Primary?: string;
    Thumb?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  Overview?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  RunTimeTicks?: number;
  SeriesName?: string;
  ParentId?: string;
}

export interface JellyfinLibrary {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

// Custom hook pour stocker les informations du serveur dans localStorage
export const useJellyfinStore = () => {
  const saveServerInfo = (info: JellyfinCredentials) => {
    localStorage.setItem('jellyfin_server', info.serverUrl);
  };

  const saveUserInfo = (user: JellyfinUser) => {
    localStorage.setItem('jellyfin_user', JSON.stringify(user));
  };

  const getServerUrl = (): string | null => {
    return localStorage.getItem('jellyfin_server');
  };

  const getUserInfo = (): JellyfinUser | null => {
    const userInfo = localStorage.getItem('jellyfin_user');
    return userInfo ? JSON.parse(userInfo) : null;
  };

  const clearAuth = () => {
    localStorage.removeItem('jellyfin_user');
  };

  return {
    saveServerInfo,
    saveUserInfo,
    getServerUrl,
    getUserInfo,
    clearAuth,
  };
};

export const jellyfinApi = {
  authenticate: async (credentials: JellyfinCredentials): Promise<JellyfinUser> => {
    try {
      // Nettoyer l'URL du serveur
      const serverUrl = credentials.serverUrl.endsWith('/')
        ? credentials.serverUrl.slice(0, -1)
        : credentials.serverUrl;
      
      const authUrl = `${serverUrl}/Users/AuthenticateByName`;
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': `MediaBrowser Client="JellyStream", Device="Web", DeviceId="JellyStream-Web", Version="1.0.0"`,
        },
        body: JSON.stringify({
          Username: credentials.username,
          Pw: credentials.password,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur d'authentification: ${response.status}`);
      }
      
      const authResult = await response.json();
      
      return {
        Id: authResult.User.Id,
        Name: authResult.User.Name,
        ServerId: authResult.User.ServerId,
        AccessToken: authResult.AccessToken,
      };
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      toast.error("Échec de la connexion. Vérifiez vos informations et l'accessibilité du serveur.");
      throw error;
    }
  },
  
  getItems: async (serverUrl: string, userId: string, token: string, parentId?: string): Promise<JellyfinLibrary> => {
    try {
      // Paramètres pour la requête des items
      const params = new URLSearchParams({
        ParentId: parentId || '',
        UserId: userId,
        IncludeItemTypes: parentId ? 'Movie,Episode' : 'CollectionFolder',
        Recursive: parentId ? 'true' : 'false',
        Fields: 'Overview,PrimaryImageAspectRatio,ProductionYear,BasicSyncInfo,BackdropImageTags',
        ImageTypeLimit: '1',
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        Limit: '50',
      });
      
      const itemsUrl = `${serverUrl}/Items?${params.toString()}`;
      
      const response = await fetch(itemsUrl, {
        headers: {
          'X-Emby-Token': token,
          'X-Emby-Authorization': `MediaBrowser Client="JellyStream", Device="Web", DeviceId="JellyStream-Web", Version="1.0.0"`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur de récupération des éléments: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des éléments:", error);
      toast.error("Impossible de charger les contenus");
      throw error;
    }
  },
  
  getImageUrl: (serverUrl: string, itemId: string, tag: string, type = 'Primary', size = 'Large'): string => {
    return `${serverUrl}/Items/${itemId}/Images/${type}?tag=${tag}&quality=90&maxHeight=300`;
  },
  
  getBackdropUrl: (serverUrl: string, itemId: string, tag: string): string => {
    return `${serverUrl}/Items/${itemId}/Images/Backdrop?tag=${tag}&quality=90`;
  },
  
  getStreamUrl: (serverUrl: string, itemId: string, token: string): string => {
    return `${serverUrl}/Videos/${itemId}/stream?static=true&MediaSourceId=${itemId}&api_key=${token}`;
  }
};
