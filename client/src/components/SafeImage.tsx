import React, { useCallback, useState } from 'react';
import { FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE } from '../constants/storageMessages';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Shown when `src` is missing or the image fails to load (e.g. 404 from storage). */
  fallback: React.ReactNode;
}

/**
 * Profile / remote file images: on load error, shows fallback with a tooltip explaining storage may be down.
 */
const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className, fallback, onError, ...rest }) => {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setFailed(true);
      onError?.(e);
    },
    [onError],
  );

  if (!src || failed) {
    return (
      <span
        title={FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE}
        className="inline-flex w-full h-full min-w-0 min-h-0 items-center justify-center"
      >
        {fallback}
      </span>
    );
  }

  return <img src={src} alt={alt ?? ''} className={className} onError={handleError} {...rest} />;
};

export default SafeImage;
