import React from 'react';
import {Img, OffthreadVideo, getStaticFiles, staticFile} from 'remotion';

/**
 * Emplacement média remplaçable.
 * Si un fichier public/media/<name>.mp4|.webm|.jpg|.png existe, il est utilisé
 * (vidéo sous licence, photo autorisée…). Sinon, l'illustration originale
 * fournie en `fallback` est affichée. Aucun asset officiel n'est inventé.
 */
const EXT = ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'webp'];

export const findMedia = (name: string) => {
  const files = getStaticFiles();
  for (const ext of EXT) {
    const hit = files.find((f) => f.name === `media/${name}.${ext}`);
    if (hit) return {src: staticFile(hit.name), video: ['mp4', 'webm', 'mov'].includes(ext)};
  }
  return null;
};

export const MediaSlot: React.FC<{
  name: string;
  fallback: React.ReactNode;
  /** zoom lent (Ken Burns) appliqué au média réel */
  scale?: number;
  style?: React.CSSProperties;
}> = ({name, fallback, scale = 1, style}) => {
  const media = findMedia(name);
  const fill: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`};
  if (!media) return <div style={{position: 'absolute', inset: 0, ...style}}>{fallback}</div>;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', ...style}}>
      {media.video ? <OffthreadVideo src={media.src} muted style={fill} /> : <Img src={media.src} style={fill} />}
    </div>
  );
};
