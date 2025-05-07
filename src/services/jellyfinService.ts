
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
  
  // Fonction optimisée pour obtenir l'URL de streaming basée sur le format utilisé par Jellyfin
  getStreamUrl: (
    serverUrl: string, 
    itemId: string, 
    token: string, 
    method: StreamingMethod = StreamingMethod.HLS
  ): string => {
    // Formatter l'ID pour correspondre au format Jellyfin UUID avec tirets
    const formattedId = itemId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    
    // Générer un ID de session unique
    const playSessionId = `jellyfin-${Date.now()}`;
    // Générer un device ID consistant
    const deviceId = `JellyStream-Web-${Math.random().toString(36).substring(2, 9)}`;
    
    // Paramètres communs pour toutes les méthodes
    const commonParams = new URLSearchParams();
    commonParams.append("DeviceId", deviceId);
    commonParams.append("MediaSourceId", itemId);
    commonParams.append("PlaySessionId", playSessionId);
    commonParams.append("api_key", token);
    
    switch (method) {
      case StreamingMethod.DIRECT:
        // Lecture directe sans transcodage - pour les fichiers déjà compatibles
        return `${serverUrl}/Videos/${itemId}/stream?${commonParams.toString()}&static=true`;
        
      case StreamingMethod.MP4:
        // URL optimisée pour le format MP4 en utilisant le point d'endpoint /stream
        const mp4Params = new URLSearchParams(commonParams.toString());
        mp4Params.append("VideoCodec", "h264");
        mp4Params.append("AudioCodec", "aac");
        mp4Params.append("VideoBitrate", "5000000"); // Augmenté pour plus de qualité
        mp4Params.append("AudioBitrate", "192000"); // Standard pour audio stéréo de bonne qualité
        mp4Params.append("MaxWidth", "1920"); // Full HD
        mp4Params.append("MaxHeight", "1080");
        mp4Params.append("TranscodeReasons", "ContainerNotSupported,VideoCodecNotSupported,AudioCodecNotSupported");
        mp4Params.append("h264-profile", "high,main,baseline");
        mp4Params.append("h264-level", "41");
        mp4Params.append("SubtitleMethod", "None");
        mp4Params.append("EnableSubtitles", "false");
        
        return `${serverUrl}/Videos/${itemId}/stream?${mp4Params.toString()}`;
        
      case StreamingMethod.HLS:
      default:
        // HLS (HTTP Live Streaming) avec format similaire à celui utilisé par le client Jellyfin officiel
        const hlsParams = new URLSearchParams(commonParams.toString());
        hlsParams.append("VideoCodec", "h264,av1,vp9");
        hlsParams.append("AudioCodec", "aac");
        hlsParams.append("AudioSampleRate", "44100");
        hlsParams.append("VideoBitrate", "5000000");
        hlsParams.append("AudioBitrate", "192000");
        hlsParams.append("MaxWidth", "1920");
        hlsParams.append("MaxHeight", "1080");
        hlsParams.append("MaxFramerate", "60");
        hlsParams.append("RequireAvc", "false"); // Permet d'utiliser d'autres codecs vidéo si disponibles
        hlsParams.append("TranscodingMaxAudioChannels", "2");
        hlsParams.append("SegmentContainer", "ts"); // TS est mieux supporté pour HLS
        hlsParams.append("MinSegments", "1");
        hlsParams.append("BreakOnNonKeyFrames", "True");
        hlsParams.append("h264-profile", "high,main,baseline");
        hlsParams.append("h264-level", "42");
        hlsParams.append("h264-deinterlace", "true");
        hlsParams.append("SubtitleMethod", "None");
        hlsParams.append("EnableSubtitles", "false");
        hlsParams.append("TranscodeReasons", "ContainerNotSupported,VideoCodecNotSupported,AudioCodecNotSupported");
        
        // Utiliser le format /videos/{id}/master.m3u8 comme dans l'exemple
        return `${serverUrl}/videos/${formattedId}/master.m3u8?${hlsParams.toString()}`;
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
