import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_DRIVE_SCOPE,
} from "../constants/googleAuth";
import {
  buildBackupPayload,
  restoreBackupPayload,
  isBackupPayload,
  isLegacyCollectionBackup,
  type BackupPayload,
} from "../repositories/backup";
import {
  uploadBackupToDrive,
  downloadBackupFromDrive,
  getBackupFileMeta,
} from "../services/googleDrive";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  scopes: [GOOGLE_DRIVE_SCOPE],
  ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
});

const toBackupPayload = (data: unknown): BackupPayload => {
  if (isLegacyCollectionBackup(data)) {
    return { version: 1, exportedAt: "", collection: data, tournaments: [], matches: [] };
  }
  if (isBackupPayload(data)) return data;
  throw new Error("Cloud backup file is invalid.");
};

export type CloudBackupState = {
  isLinked: boolean;
  linkedEmail: string | null;
  // Whether a backup file actually exists in Drive right now — checked
  // live against Drive, never inferred from local device state, since a
  // reinstall/new phone wipes local state but the cloud file is still there.
  hasCloudBackup: boolean;
  lastBackupAt: string | null;
  isBusy: boolean;
  linkGoogleAccount: () => Promise<void>;
  unlinkGoogleAccount: () => Promise<void>;
  backupNow: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;
};

export const useCloudBackup = (): CloudBackupState => {
  const [isLinked, setIsLinked] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [hasCloudBackup, setHasCloudBackup] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Live Drive lookup — the single source of truth for both "does a backup
  // exist" and "when was it last updated". Swallows errors (e.g. offline)
  // so a transient network hiccup doesn't wrongly flip Restore off.
  const refreshCloudBackupStatus = useCallback(async () => {
    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const meta = await getBackupFileMeta(accessToken);
      if (meta) {
        setHasCloudBackup(true);
        setLastBackupAt(meta.modifiedTime);
      } else {
        setHasCloudBackup(false);
        setLastBackupAt(null);
      }
    } catch {
      // Leave existing state as-is; not being able to check right now
      // shouldn't erase what we already knew.
    }
  }, []);

  useEffect(() => {
    // Restore the linked state on app start if there's already a signed-in
    // Google session, so the user doesn't have to re-link every launch.
    (async () => {
      if (!GoogleSignin.hasPreviousSignIn()) return;
      const response = await GoogleSignin.signInSilently();
      if (response.type === "success") {
        setIsLinked(true);
        setLinkedEmail(response.data.user.email);
        await refreshCloudBackupStatus();
      }
    })();
  }, [refreshCloudBackupStatus]);

  const linkGoogleAccount = async () => {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      setIsLinked(true);
      setLinkedEmail(response.data.user.email);
      await refreshCloudBackupStatus();
    }
  };

  const unlinkGoogleAccount = async () => {
    await GoogleSignin.signOut();
    setIsLinked(false);
    setLinkedEmail(null);
    setHasCloudBackup(false);
    setLastBackupAt(null);
  };

  const backupNow = async () => {
    setIsBusy(true);
    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const payload = buildBackupPayload();
      await uploadBackupToDrive(accessToken, payload);
      await refreshCloudBackupStatus();
    } finally {
      setIsBusy(false);
    }
  };

  const restoreFromCloud = async () => {
    setIsBusy(true);
    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const data = await downloadBackupFromDrive(accessToken);
      if (!data) throw new Error("No cloud backup found.");
      restoreBackupPayload(toBackupPayload(data));
    } finally {
      setIsBusy(false);
    }
  };

  return {
    isLinked,
    linkedEmail,
    hasCloudBackup,
    lastBackupAt,
    isBusy,
    linkGoogleAccount,
    unlinkGoogleAccount,
    backupNow,
    restoreFromCloud,
  };
};
