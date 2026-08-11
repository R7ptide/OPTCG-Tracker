import { DRIVE_BACKUP_FILE_NAME } from "../constants/googleAuth";

// Thin wrapper around the Drive REST API, scoped to the hidden appDataFolder
// (drive.appdata scope) so we only ever touch our own backup file, never the
// rest of the user's Drive. Everything here just needs a valid access token
// from GoogleSignin.getTokens() — no other Drive dependency required.

const authHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export type BackupFileMeta = { id: string; modifiedTime: string };

// Looks up our backup file inside appDataFolder — the source of truth for
// "does a cloud backup exist" and "when was it last updated". Returns null
// if it hasn't been created yet (i.e. no backup has ever been made). This
// must never rely on any local/device state, since that's exactly what's
// gone on a fresh install/new phone.
export const getBackupFileMeta = async (
  accessToken: string,
): Promise<BackupFileMeta | null> => {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false`,
    fields: "files(id, modifiedTime)",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: authHeaders(accessToken) },
  );
  if (!res.ok) throw new Error(`Drive lookup failed (${res.status})`);

  const data = await res.json();
  return data.files?.[0] ?? null;
};

// Looks up just the file id, for callers that don't need modifiedTime.
export const findBackupFileId = async (
  accessToken: string,
): Promise<string | null> => {
  const meta = await getBackupFileMeta(accessToken);
  return meta?.id ?? null;
};

const createBackupFile = async (accessToken: string): Promise<string> => {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: DRIVE_BACKUP_FILE_NAME,
      parents: ["appDataFolder"],
    }),
  });
  if (!res.ok) throw new Error(`Drive file creation failed (${res.status})`);

  const data = await res.json();
  return data.id;
};

// Overwrites the cloud backup file with the given payload, creating it on
// first use.
export const uploadBackupToDrive = async (
  accessToken: string,
  payload: unknown,
): Promise<void> => {
  const fileId =
    (await findBackupFileId(accessToken)) ?? (await createBackupFile(accessToken));

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`);
};

// Returns the parsed backup file, or null if no backup has ever been made.
export const downloadBackupFromDrive = async (
  accessToken: string,
): Promise<unknown | null> => {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: authHeaders(accessToken) },
  );
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);

  return res.json();
};
