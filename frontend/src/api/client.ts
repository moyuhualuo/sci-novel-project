import type {
  BlockPayload,
  ContentBlock,
  ImageUploadResponse,
  LoginPayload,
  MessageResponse,
  NovelSection,
  RegisterPayload,
  RegistrationResponse,
  SiteProfilePayload,
  SessionState,
  SectionPayload,
  SiteResponse,
} from "../data/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_BYTES = 900 * 1024;
type UploadProgressCallback = (percent: number) => void;

function replaceFileExtension(name: string, nextExtension: string): string {
  const parts = name.split(".");
  if (parts.length === 1) {
    return `${name}.${nextExtension}`;
  }
  parts[parts.length - 1] = nextExtension;
  return parts.join(".");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(options?.headers);
    if (options?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      headers,
      ...options,
    });
  } catch {
    throw new Error("Unable to reach the content service right now.");
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let detail = "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
      detail = payload?.detail ?? "";
    } else {
      detail = await response.text().catch(() => "");
    }

    if (response.status === 401) {
      throw new Error("Invalid email or password.");
    }

    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function sendJsonWithProgress<T>(
  path: string,
  method: string,
  body: unknown,
  onProgress?: UploadProgressCallback,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE_URL}${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }
      const ratio = event.total > 0 ? event.loaded / event.total : 0;
      onProgress(Math.min(96, Math.round(48 + ratio * 48)));
    };

    xhr.onerror = () => reject(new Error("Unable to reach the content service right now."));
    xhr.onabort = () => reject(new Error("Image upload was cancelled."));

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader("content-type") ?? "";
      const rawText = xhr.responseText ?? "";
      const parseJson = () => {
        try {
          return rawText ? (JSON.parse(rawText) as T | { detail?: string }) : null;
        } catch {
          return null;
        }
      };

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        const payload = parseJson();
        resolve((payload ?? undefined) as T);
        return;
      }

      const payload = contentType.includes("application/json") ? parseJson() : null;
      const detail =
        payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
          ? payload.detail
          : rawText;

      if (xhr.status === 401) {
        reject(new Error("Invalid email or password."));
        return;
      }

      reject(new Error(detail || `Request failed with status ${xhr.status}`));
    };

    xhr.send(JSON.stringify(body));
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to compress image"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    image.src = url;
  });
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Keep vector and animated assets untouched to avoid corrupting them in canvas.
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable for image compression");
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === "image/png" || file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const outputExtension = outputType === "image/webp" ? "webp" : "jpg";
  const qualitySteps = [0.84, 0.76, 0.68, 0.6];
  let bestBlob: Blob | null = null;

  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
    if (blob.size <= TARGET_IMAGE_BYTES) {
      bestBlob = blob;
      break;
    }
  }

  if (!bestBlob || bestBlob.size >= file.size) {
    return file;
  }

  return new File([bestBlob], replaceFileExtension(file.name, outputExtension), {
    type: outputType,
    lastModified: Date.now(),
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const encoded = value.includes(",") ? value.split(",", 2)[1] : value;
      if (!encoded) {
        reject(new Error("Failed to encode file"));
        return;
      }
      resolve(encoded);
    };
    reader.readAsDataURL(file);
  });
}

export const apiClient = {
  getSite: () => request<SiteResponse>("/site"),
  getAdminContent: () => request<SiteResponse>("/admin/content"),
  getSession: () => request<SessionState>("/auth/me"),
  login: (payload: LoginPayload) => send<SessionState>("/auth/login", "POST", payload),
  register: (payload: RegisterPayload) => send<RegistrationResponse>("/auth/register", "POST", payload),
  resendVerification: (email: string) => send<MessageResponse>("/auth/resend-verification", "POST", { email }),
  logout: () => send<{ success: boolean }>("/auth/logout", "POST"),
  updateSiteProfile: (payload: SiteProfilePayload) => send<SiteProfilePayload>("/admin/site-profile", "PUT", payload),
  createSection: (payload: SectionPayload) => send<NovelSection>("/admin/sections", "POST", payload),
  updateSection: (sectionId: number, payload: SectionPayload) =>
    send<NovelSection>(`/admin/sections/${sectionId}`, "PUT", payload),
  deleteSection: (sectionId: number) => send<{ success: boolean }>(`/admin/sections/${sectionId}`, "DELETE"),
  createBlock: (sectionId: number, payload: BlockPayload) =>
    send<ContentBlock>(`/admin/sections/${sectionId}/blocks`, "POST", payload),
  updateBlock: (blockId: number, payload: BlockPayload) =>
    send<ContentBlock>(`/admin/blocks/${blockId}`, "PUT", payload),
  deleteBlock: (blockId: number) => send<{ success: boolean }>(`/admin/blocks/${blockId}`, "DELETE"),
  uploadImage: async (file: File, onProgress?: UploadProgressCallback) => {
    onProgress?.(8);
    const compressed = await compressImage(file);
    onProgress?.(24);
    const dataBase64 = await fileToBase64(compressed);
    onProgress?.(42);
    return sendJsonWithProgress<ImageUploadResponse>("/admin/uploads/images", "POST", {
      filename: compressed.name,
      content_type: compressed.type || "image/png",
      data_base64: dataBase64,
    }, onProgress);
  },
};
