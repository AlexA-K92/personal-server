export type BridgeLogEntry = {
  time: string;
  message: string;
};

export type BridgeStatus = {
  connected: boolean;
  host: string;
  port: number;
  lastError: string | null;
  log: BridgeLogEntry[];
};

type ApiResponse<T> = T & {
  ok: boolean;
  error?: string;
  message?: string;
  status: BridgeStatus;
};

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Bridge request failed.");
  }

  return data;
}

export async function getBridgeStatus() {
  const response = await fetch("/api/status");
  return (await response.json()) as BridgeStatus;
}

export async function connectToServer() {
  return request<{}>("/api/connect", {
    method: "POST",
  });
}

export async function disconnectFromServer() {
  return request<{}>("/api/disconnect", {
    method: "POST",
  });
}

export async function sendServerCommand(command: string) {
  return request<{ command: string; response: string }>("/api/send", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}