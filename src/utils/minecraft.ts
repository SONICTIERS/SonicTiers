/**
 * Minecraft API Helper & Skin Generator
 */

export interface MojangProfile {
  username: string;
  uuid: string;
  avatarUrl: string;
  bodyUrl: string;
  skinFileUrl?: string;
}

// Default fallback Minecraft Steve UUID
export const STEVE_UUID = '8667ba71-b85a-4004-af54-457a9734eed7';
export const ALEX_UUID = '09c6253c-f4b6-4b21-9d8e-171b3e6afbc0';

/**
 * Returns avatars from reliable CDNs
 */
export const getMinecraftAvatar = (usernameOrUuid: string, size = 64, skinTimestamp?: number): string => {
  if (!usernameOrUuid) return '';
  if (usernameOrUuid.startsWith('http://') || usernameOrUuid.startsWith('https://') || usernameOrUuid.startsWith('data:')) {
    if (skinTimestamp && !usernameOrUuid.startsWith('data:')) {
      const separator = usernameOrUuid.includes('?') ? '&' : '?';
      return `${usernameOrUuid}${separator}t=${skinTimestamp}`;
    }
    return usernameOrUuid;
  }
  // Use mc-heads.net to support both premium usernames and clean UUIDs with overlays
  const baseUrl = `https://mc-heads.net/avatar/${usernameOrUuid}/${size}`;
  if (skinTimestamp) {
    return `${baseUrl}?t=${skinTimestamp}`;
  }
  return baseUrl;
};

/**
 * Returns full body renders
 */
export const getMinecraftBodyRender = (usernameOrUuid: string, size = 200, skinTimestamp?: number): string => {
  if (!usernameOrUuid) return '';
  if (usernameOrUuid.startsWith('http://') || usernameOrUuid.startsWith('https://') || usernameOrUuid.startsWith('data:')) {
    if (skinTimestamp && !usernameOrUuid.startsWith('data:')) {
      const separator = usernameOrUuid.includes('?') ? '&' : '?';
      return `${usernameOrUuid}${separator}t=${skinTimestamp}`;
    }
    return usernameOrUuid;
  }
  // Use mc-heads.net body render for high-quality standard 3D isometric skins
  const baseUrl = `https://mc-heads.net/body/${usernameOrUuid}/${size}`;
  if (skinTimestamp) {
    return `${baseUrl}?t=${skinTimestamp}`;
  }
  return baseUrl;
};

/**
 * Gets the correct body render URL for a given MinecraftPlayer, filtering out mock Crafatar/Minotar URLs
 */
export const getCorrectBodyRender = (player: any, size = 200): string => {
  if (!player) return '';

  // 1. Prioritize explicitly custom loaded or uploaded skin templates first!
  const url = player.customBodyUrl;
  let resultUrl = '';
  if (url) {
    if (url.includes('crafatar.com/renders/body/')) {
      const parts = url.split('/body/');
      if (parts.length > 1) {
        const uuid = parts[1].split('?')[0];
        resultUrl = `https://mc-heads.net/body/${uuid}/${size}`;
      }
    } else if (
      player.isUnoriginal ||
      url.startsWith('data:') ||
      (!url.includes('mc-heads.net/body/') && !url.includes('crafatar.com') && !url.includes('minotar.net'))
    ) {
      resultUrl = url;
    }
  }

  if (resultUrl) {
    if (player.skinTimestamp && !resultUrl.startsWith('data:')) {
      const separator = resultUrl.includes('?') ? '&' : '?';
      return `${resultUrl}${separator}t=${player.skinTimestamp}`;
    }
    return resultUrl;
  }

  // 2. If no custom skin is set, and the player is a premium user with a UUID, fetch from high-quality mc-heads.net
  if (!player.isUnoriginal && player.uuid) {
    const isFallbackUuid = player.uuid === STEVE_UUID || player.uuid === ALEX_UUID;
    const identifier = isFallbackUuid ? player.username : player.uuid.replace(/-/g, '');
    const baseUrl = `https://mc-heads.net/body/${identifier}/${size}`;
    if (player.skinTimestamp) {
      return `${baseUrl}?t=${player.skinTimestamp}`;
    }
    return baseUrl;
  }

  // 3. Absolute fallback is username-based body rendering
  resultUrl = getMinecraftBodyRender(player.username, size);
  if (player.skinTimestamp && !resultUrl.startsWith('data:')) {
    const separator = resultUrl.includes('?') ? '&' : '?';
    return `${resultUrl}${separator}t=${player.skinTimestamp}`;
  }
  return resultUrl;
};

/**
 * Gets the correct avatar URL for a given MinecraftPlayer, filtering out mock Crafatar/Minotar URLs
 */
export const getCorrectAvatar = (player: any, size = 64): string => {
  if (!player) return '';

  // 1. Prioritize explicitly custom loaded or uploaded skin templates first!
  const url = player.customAvatarUrl;
  let resultUrl = '';
  if (url) {
    if (url.includes('crafatar.com/avatars/')) {
      const parts = url.split('/avatars/');
      if (parts.length > 1) {
        const uuid = parts[1].split('?')[0];
        resultUrl = `https://mc-heads.net/avatar/${uuid}/${size}`;
      }
    } else if (
      player.isUnoriginal ||
      url.startsWith('data:') ||
      (!url.includes('mc-heads.net/avatar/') && !url.includes('crafatar.com') && !url.includes('minotar.net'))
    ) {
      resultUrl = url;
    }
  }

  if (resultUrl) {
    if (player.skinTimestamp && !resultUrl.startsWith('data:')) {
      const separator = resultUrl.includes('?') ? '&' : '?';
      return `${resultUrl}${separator}t=${player.skinTimestamp}`;
    }
    return resultUrl;
  }

  // 2. If no custom skin is set, and the player is a premium user with a UUID, fetch from high-quality mc-heads.net
  if (!player.isUnoriginal && player.uuid) {
    const isFallbackUuid = player.uuid === STEVE_UUID || player.uuid === ALEX_UUID;
    const identifier = isFallbackUuid ? player.username : player.uuid.replace(/-/g, '');
    const baseUrl = `https://mc-heads.net/avatar/${identifier}/${size}`;
    if (player.skinTimestamp) {
      return `${baseUrl}?t=${player.skinTimestamp}`;
    }
    return baseUrl;
  }

  // 3. Absolute fallback is username-based avatar rendering
  resultUrl = getMinecraftAvatar(player.username, size);
  if (player.skinTimestamp && !resultUrl.startsWith('data:')) {
    const separator = resultUrl.includes('?') ? '&' : '?';
    return `${resultUrl}${separator}t=${player.skinTimestamp}`;
  }
  return resultUrl;
};

/**
 * Fetches player UUID and profile details using PlayerDB.co
 */
export const fetchMinecraftProfile = async (username: string): Promise<MojangProfile> => {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Username cannot be empty');
  }

  // Alpha-numeric check for standard Minecraft usernames
  if (!/^[a-zA-Z0-9_]{2,16}$/.test(cleanUsername)) {
    throw new Error('Invalid Minecraft username format (2-16 chars, letters/numbers/underscores only)');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(`https://playerdb.co/api/player/minecraft/${cleanUsername}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`MoJang network lookup failed (${response.status})`);
    }

    const json = await response.json();
    
    if (json.success && json.data?.player) {
      const player = json.data.player;
      return {
        username: cleanUsername,
        uuid: player.id,
        avatarUrl: `https://mc-heads.net/avatar/${player.id}/64`,
        bodyUrl: `https://mc-heads.net/body/${player.id}/200`,
        skinFileUrl: player.skin_texture || null,
      };
    } else {
      throw new Error(`Profile not found for username "${cleanUsername}"`);
    }
  } catch (error) {
    console.warn(`Error resolving Minecraft profile for ${cleanUsername}, loading high-quality local Steve/Alex fallback:`, error);
    
    // Generates a seed based on username length to assign Steve vs Alex
    const isAlex = cleanUsername.length % 2 === 0;
    const uuid = isAlex ? ALEX_UUID : STEVE_UUID;

    return {
      username: cleanUsername,
      uuid: uuid,
      avatarUrl: `https://mc-heads.net/avatar/${cleanUsername}/64`,
      bodyUrl: `https://mc-heads.net/body/${cleanUsername}/200`,
    };
  }
};

/**
 * Parses and processes a raw Minecraft Skin file (64x64 or 64x32)
 * into high-quality front-facing avatar and body 3D isometric renders.
 */
export const processMinecraftSkin = (
  skinDataUrl: string
): Promise<{ avatarUrl: string; bodyUrl: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const isOldLayout = img.height === 32 || img.height !== 64;
      
      // 1. Render AVATAR (Face + Hat overlay)
      const avatarCanvas = document.createElement('canvas');
      avatarCanvas.width = 64;
      avatarCanvas.height = 64;
      const ctxAv = avatarCanvas.getContext('2d');
      if (ctxAv) {
        ctxAv.imageSmoothingEnabled = false;
        // Front face (8, 8, 8, 8) -> scale to 64x64
        ctxAv.drawImage(img, 8, 8, 8, 8, 0, 0, 64, 64);
        // Front hat overlay (40, 8, 8, 8) -> scale to 64x64
        ctxAv.drawImage(img, 40, 8, 8, 8, 0, 0, 64, 64);
      }
      const avatarUrl = avatarCanvas.toDataURL('image/png');

      // 2. Render 3D ISOMETRIC BODY (Front-Left perspective, looking down/right/left standard mc-heads style)
      const bodyCanvas = document.createElement('canvas');
      bodyCanvas.width = 200;
      bodyCanvas.height = 400;
      const ctx = bodyCanvas.getContext('2d');
      
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 200, 400);

        // Turn it the other way by mirroring horizontally to align with standard mc-heads direction
        ctx.translate(200, 0);
        ctx.scale(-1, 1);

        // Center parameters (scaled from 9.5 to 11.2 to match size of standard premium ones)
        const scale = 11.2;
        const offsetX = 58;
        const offsetY = 12;

        const cos30 = 0.866025;
        const sin30 = 0.5;

        // Draw cuboid with 3D isometric projection
        const drawCuboid = (
          ox: number, oy: number, // Base skin offset (e.g., 0, 16)
          ox_ovr: number, oy_ovr: number, // Overlay skin offset (0, 0 if none)
          w: number, h: number, d: number, // 3D dimensions
          x_orig: number, y_orig: number, z_orig: number, // 3D positions in model space
          isMirrored = false
        ) => {
          const drawFace = (
            sx: number, sy: number, sw: number, sh: number,
            faceType: 'front' | 'left' | 'top',
            mirrorFace = false
          ) => {
            ctx.save();
            
            let x_trans = 0;
            let y_trans = 0;
            let basisA = 0, basisB = 0, basisC = 0, basisD = 0;

            if (faceType === 'front') {
              const z_front = z_orig + d;
              x_trans = offsetX + scale * (x_orig - z_front) * cos30;
              y_trans = offsetY + scale * (y_orig + (x_orig + z_front) * sin30);
              basisA = scale * cos30;
              basisB = scale * sin30;
              basisC = 0;
              basisD = scale;
            } else if (faceType === 'left') {
              x_trans = offsetX + scale * ((x_orig + w) - (z_orig + d)) * cos30;
              y_trans = offsetY + scale * (y_orig + ((x_orig + w) + (z_orig + d)) * sin30);
              basisA = scale * cos30;
              basisB = -scale * sin30;
              basisC = 0;
              basisD = scale;
            } else if (faceType === 'top') {
              x_trans = offsetX + scale * (x_orig - z_orig) * cos30;
              y_trans = offsetY + scale * (y_orig + (x_orig + z_orig) * sin30);
              basisA = scale * cos30;
              basisB = scale * sin30;
              basisC = -scale * cos30;
              basisD = scale * sin30;
            }

            ctx.transform(basisA, basisB, basisC, basisD, x_trans, y_trans);

            if (mirrorFace) {
              if (faceType === 'front' || faceType === 'left') {
                ctx.translate(sw, 0);
                ctx.scale(-1, 1);
              } else if (faceType === 'top') {
                ctx.translate(sw, sh);
                ctx.scale(-1, -1);
              }
            }

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            ctx.restore();
          };

          // 1. Top face (ox + d, oy, size w x d)
          drawFace(ox + d, oy, w, d, 'top', isMirrored);
          if (ox_ovr > 0 || oy_ovr > 0) {
            drawFace(ox_ovr + d, oy_ovr, w, d, 'top', isMirrored);
          }

          // 2. Front face (ox + d, oy + d, size w x h)
          drawFace(ox + d, oy + d, w, h, 'front', isMirrored);
          if (ox_ovr > 0 || oy_ovr > 0) {
            drawFace(ox_ovr + d, oy_ovr + d, w, h, 'front', isMirrored);
          }

          // 3. Left face (ox + d + w, oy + d, size d x h)
          drawFace(ox + d + w, oy + d, d, h, 'left', isMirrored);
          if (ox_ovr > 0 || oy_ovr > 0) {
            drawFace(ox_ovr + d + w, oy_ovr + d, d, h, 'left', isMirrored);
          }
        };

        // Draw body parts from back-to-front (Painter's Algorithm)
        // Order: Right Leg -> Right Arm -> Torso -> Left Leg -> Left Arm -> Head
        
        // 1. Right Leg (back-left of model space, x=4, y=20, z=0)
        drawCuboid(0, 16, 0, 32, 4, 12, 4, 4, 20, 0, false);

        // 2. Right Arm (back-left-top, x=0, y=8, z=0)
        drawCuboid(40, 16, 40, 32, 4, 12, 4, 0, 8, 0, false);

        // 3. Torso (middle, x=4, y=8, z=0)
        drawCuboid(16, 16, 16, 32, 8, 12, 4, 4, 8, 0, false);

        // 4. Left Leg (front-right-bottom, x=8, y=20, z=0)
        if (isOldLayout) {
          // Mirrored right leg
          drawCuboid(0, 16, 0, 32, 4, 12, 4, 8, 20, 0, true);
        } else {
          drawCuboid(16, 48, 0, 48, 4, 12, 4, 8, 20, 0, false);
        }

        // 5. Left Arm (front-right-top, x=12, y=8, z=0)
        if (isOldLayout) {
          // Mirrored right arm
          drawCuboid(40, 16, 40, 32, 4, 12, 4, 12, 8, 0, true);
        } else {
          drawCuboid(32, 48, 48, 48, 4, 12, 4, 12, 8, 0, false);
        }

        // 6. Head (top, x=4, y=0, z=-2)
        drawCuboid(0, 0, 32, 0, 8, 8, 8, 4, 0, -2, false);
      }
      
      const bodyUrl = bodyCanvas.toDataURL('image/png');
      resolve({ avatarUrl, bodyUrl });
    };

    img.onerror = () => {
      resolve({ avatarUrl: skinDataUrl, bodyUrl: skinDataUrl });
    };

    img.src = skinDataUrl;
  });
};
