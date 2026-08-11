// Public OAuth client identifiers — safe to commit. These identify the app
// to Google, they don't authorize anything by themselves (no secret here).
export const GOOGLE_WEB_CLIENT_ID =
  "567396441837-lkr9agqfl29h4sk3p45pkp4j630cqscr.apps.googleusercontent.com";

// TODO: set once the iOS OAuth client is created in Cloud Console.
export const GOOGLE_IOS_CLIENT_ID: string | undefined = undefined;

// Hidden app-data scope: lets us read/write our own backup file in the
// user's Drive without ever seeing the rest of their Drive contents.
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

export const DRIVE_BACKUP_FILE_NAME = "op_vault_backup.json";
