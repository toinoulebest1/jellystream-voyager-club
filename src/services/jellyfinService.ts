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

// Enum pour les méthodes de streaming
export enum StreamingMethod {
  HLS = "hls",
  MP4 = "mp4",
  DIRECT = "direct"
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
  
  // Fonction améliorée pour obtenir l'URL de streaming
  getStreamUrl: (
    serverUrl: string, 
    itemId: string, 
    token: string, 
    method: StreamingMethod = StreamingMethod.HLS
  ): string => {
    const playSessionId = `jellyfin-${Date.now()}`;
    
    switch (method) {
      case StreamingMethod.DIRECT:
        // Lecture directe sans transcodage
        const directUrl = new URL(`${serverUrl}/Videos/${itemId}/stream`);
        directUrl.searchParams.append("api_key", token);
        directUrl.searchParams.append("static", "true");
        directUrl.searchParams.append("MediaSourceId", itemId);
        return directUrl.toString();
        
      case StreamingMethod.MP4:
        // Transcodage MP4 pour compatibilité maximale
        const mp4Url = new URL(`${serverUrl}/Videos/${itemId}/stream`);
        mp4Url.searchParams.append("api_key", token);
        mp4Url.searchParams.append("PlaySessionId", playSessionId);
        mp4Url.searchParams.append("MediaSourceId", itemId);
        mp4Url.searchParams.append("DeviceId", "JellyStream-Web");
        mp4Url.searchParams.append("VideoCodec", "h264");
        mp4Url.searchParams.append("AudioCodec", "aac");
        mp4Url.searchParams.append("Container", "mp4");
        mp4Url.searchParams.append("TranscodingContainer", "mp4");
        mp4Url.searchParams.append("MaxWidth", "1920");
        mp4Url.searchParams.append("MaxHeight", "1080");
        mp4Url.searchParams.append("TranscodingMaxAudioChannels", "2");
        mp4Url.searchParams.append("VideoBitrate", "3000000");
        mp4Url.searchParams.append("AudioBitrate", "128000");
        mp4Url.searchParams.append("EnableSubtitles", "false");
        mp4Url.searchParams.append("SubtitleMethod", "Encode");
        return mp4Url.toString();
        
      case StreamingMethod.HLS:
      default:
        // HLS (HTTP Live Streaming) pour téléchargement progressif
        const hlsUrl = new URL(`${serverUrl}/Videos/${itemId}/main.m3u8`);
        hlsUrl.searchParams.append("api_key", token);
        hlsUrl.searchParams.append("PlaySessionId", playSessionId);
        hlsUrl.searchParams.append("MediaSourceId", itemId);
        hlsUrl.searchParams.append("DeviceId", "JellyStream-Web");
        hlsUrl.searchParams.append("TranscodingMaxAudioChannels", "2");
        hlsUrl.searchParams.append("Codec", "h264");
        hlsUrl.searchParams.append("Container", "ts");
        hlsUrl.searchParams.append("AudioCodec", "aac");
        hlsUrl.searchParams.append("VideoBitrate", "2000000");
        hlsUrl.searchParams.append("AudioBitrate", "128000");
        hlsUrl.searchParams.append("MaxVideoBitDepth", "8");
        hlsUrl.searchParams.append("SubtitleMethod", "None");
        hlsUrl.searchParams.append("EnableSubtitles", "false");
        hlsUrl.searchParams.append("RequireAvc", "true");
        return hlsUrl.toString();
    }
  },
  
  // Test de format vidéo
  testStreamFormat: async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch (error) {
      console.log("Test de format échoué:", error);
      return false;
    }
  }
};
