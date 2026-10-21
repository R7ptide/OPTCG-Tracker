import { useEffect, useRef, useState } from "react";
import { Image, type ImageProps } from "expo-image";
import {
  SERVER_IMAGE_TIMEOUT_MS,
  USE_FALLBACK,
  serverUrls,
} from "../constants/server";
import { resolveCardImage } from "../utils/cards";

type Props = Omit<ImageProps, "source"> & {
  cardId: string;
  // The official-site URL stored on the card, used when the server can't
  // provide the image.
  fallbackUrl?: string | null;
};

// After a server image times out, skip the server for a while so a list of
// hundreds of cards doesn't wait on the timeout once per image (e.g. when
// the device is off the tailnet).
const SERVER_DOWN_COOLDOWN_MS = 60_000;
let serverDownUntil = 0;
const isServerDown = () => Date.now() < serverDownUntil;

// Home server first, official site as the fallback (when USE_FALLBACK is on).
export default function CardImage({
  cardId,
  fallbackUrl,
  onLoad,
  onError,
  ...props
}: Props) {
  // Keyed by card id so a recycled list cell starts fresh for its new card.
  const [failedId, setFailedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const useFallback = USE_FALLBACK && (failedId === cardId || isServerDown());

  useEffect(() => {
    if (!USE_FALLBACK || useFallback) return;
    timer.current = setTimeout(() => {
      serverDownUntil = Date.now() + SERVER_DOWN_COOLDOWN_MS;
      setFailedId(cardId);
    }, SERVER_IMAGE_TIMEOUT_MS);
    return () => clearTimeout(timer.current);
  }, [cardId, useFallback]);

  return (
    <Image
      {...props}
      source={{
        uri: useFallback
          ? resolveCardImage(cardId, fallbackUrl)
          : serverUrls.image(cardId),
      }}
      onLoad={(event) => {
        clearTimeout(timer.current);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (USE_FALLBACK && !useFallback) setFailedId(cardId);
        onError?.(event);
      }}
    />
  );
}

// Warms the image cache ahead of a capture; mirrors CardImage's fallback.
export const prefetchCardImage = async (
  cardId: string,
  fallbackUrl?: string | null,
): Promise<void> => {
  const ok = await Image.prefetch(serverUrls.image(cardId)).catch(() => false);
  if (!ok && USE_FALLBACK) {
    await Image.prefetch(resolveCardImage(cardId, fallbackUrl)).catch(() => {});
  }
};
