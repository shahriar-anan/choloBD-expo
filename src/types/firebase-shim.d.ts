/**
 * Ambient stubs for firebase SDK modules.
 * The SDK is not installed in this app; these declarations keep `tsc` green
 * for the unused/legacy firebase upload path until the package is added.
 */
declare module 'firebase/app' {
  export function initializeApp(config: Record<string, unknown>): unknown;
}

declare module 'firebase/storage' {
  export function getStorage(app: unknown): unknown;
  export function ref(storage: unknown, path: string): unknown;
  export function uploadBytes(
    storageRef: unknown,
    data: Blob,
    metadata?: { contentType?: string }
  ): Promise<unknown>;
  export function getDownloadURL(storageRef: unknown): Promise<string>;
}
