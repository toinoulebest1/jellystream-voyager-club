
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
  // Propriétés pour les genres et studios
  Genres?: string[];
  Studios?: { Name: string; Id: string; }[];
}

export interface JellyfinLibrary {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

// Interface pour les options de requête
export interface ItemsOptions {
  Limit?: string;
  SortBy?: string;
  SortOrder?: string;
  Filters?: string;
  Fields?: string;
  [key: string]: string | undefined;
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
  
  getItems: async (
    serverUrl: string, 
    userId: string, 
    token: string, 
    parentId?: string, 
    options?: ItemsOptions
  ): Promise<JellyfinLibrary> => {
    try {
      // Paramètres par défaut pour la requête des items
      const defaultParams: Record<string, string> = {
        ParentId: parentId || '',
        UserId: userId,
        IncludeItemTypes: parentId ? 'Movie,Episode' : 'CollectionFolder',
        Recursive: parentId ? 'true' : 'false',
        Fields: 'Overview,PrimaryImageAspectRatio,ProductionYear,BasicSyncInfo,BackdropImageTags',
        ImageTypeLimit: '1',
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        Limit: '50',
      };

      // Fusionner les paramètres par défaut avec les options fournies
      const params = new URLSearchParams({
        ...defaultParams,
        ...(options || {}),
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
    // Créer une URL de streaming pour le transcodage compatible avec les navigateurs web
    const url = new URL(`${serverUrl}/Videos/${itemId}/stream`);
    
    // Paramètres pour demander un transcodage au lieu du fichier original
    // Spécifier le conteneur et codec que la plupart des navigateurs supportent (MP4/H.264)
    url.searchParams.append("api_key", token);
    url.searchParams.append("VideoCodec", "h264");
    url.searchParams.append("AudioCodec", "aac");
    url.searchParams.append("Container", "mp4");
    url.searchParams.append("TranscodingContainer", "mp4");
    url.searchParams.append("MaxWidth", "1920");
    url.searchParams.append("MaxHeight", "1080");
    
    // Paramètres pour améliorer la qualité du streaming
    url.searchParams.append("MediaSourceId", itemId);
    url.searchParams.append("DeviceId", "JellyStream-Web");
    url.searchParams.append("PlaySessionId", `jellyfin-${Date.now()}`);
    url.searchParams.append("TranscodingMaxAudioChannels", "2");
    
    // Force le transcodage plutôt que la lecture directe pour les formats non supportés
    url.searchParams.append("allowDirectPlay", "false"); 
    url.searchParams.append("allowDirectStream", "false");
    
    return url.toString();
  }
};
