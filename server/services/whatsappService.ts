import fs from "fs";
import path from "path";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";

export type WhatsAppConnectionState =
  | "disconnected"
  | "connecting"
  | "waiting_for_qr"
  | "connected";

interface WhatsAppStatus {
  state: WhatsAppConnectionState;
  phone: string | null;
  qrDataUrl: string | null;
  updatedAt: string;
  message: string;
}

const authDir = path.resolve(process.cwd(), ".whatsapp-auth");
let socket: WASocket | null = null;
let connectPromise: Promise<WhatsAppStatus> | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let manualDisconnect = false;
let reconnectAttempts = 0;

let currentStatus: WhatsAppStatus = {
  state: "disconnected",
  phone: null,
  qrDataUrl: null,
  updatedAt: new Date().toISOString(),
  message: "واتساب غير مرتبط",
};

function setStatus(update: Partial<WhatsAppStatus>) {
  currentStatus = {
    ...currentStatus,
    ...update,
    updatedAt: new Date().toISOString(),
  };
}

function linkedPhone(sock: WASocket) {
  const jid = sock.user?.id || "";
  const digits = jid.split(":")[0]?.split("@")[0]?.replace(/\D/g, "");
  return digits ? `+${digits}` : null;
}

function hasSavedSession() {
  return fs.existsSync(path.join(authDir, "creds.json"));
}

function scheduleReconnect() {
  if (manualDisconnect || reconnectTimer) return;
  const delay = Math.min(60_000, 2_000 * Math.max(1, 2 ** reconnectAttempts));
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectWhatsApp();
  }, delay);
}

export function getWhatsAppStatus(): WhatsAppStatus & { hasSavedSession: boolean } {
  return { ...currentStatus, hasSavedSession: hasSavedSession() };
}

export async function connectWhatsApp(): Promise<WhatsAppStatus> {
  if (currentStatus.state === "connected" && socket) return currentStatus;
  if (connectPromise) return connectPromise;

  manualDisconnect = false;
  connectPromise = (async () => {
    fs.mkdirSync(authDir, { recursive: true, mode: 0o700 });
    setStatus({
      state: "connecting",
      qrDataUrl: null,
      message: "جاري الاتصال بواتساب",
    });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const nextSocket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });
    socket = nextSocket;
    nextSocket.ev.on("creds.update", saveCreds);

    nextSocket.ev.on("connection.update", async (update) => {
      if (update.qr) {
        const qrDataUrl = await QRCode.toDataURL(update.qr, {
          width: 360,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        setStatus({
          state: "waiting_for_qr",
          qrDataUrl,
          message: "امسح الباركود من الأجهزة المرتبطة في واتساب",
        });
      }

      if (update.connection === "open") {
        reconnectAttempts = 0;
        setStatus({
          state: "connected",
          phone: linkedPhone(nextSocket),
          qrDataUrl: null,
          message: "واتساب متصل وجاهز للإرسال",
        });
      }

      if (update.connection === "close") {
        const statusCode = (update.lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
        socket = null;

        if (loggedOut) {
          fs.rmSync(authDir, { recursive: true, force: true });
          setStatus({
            state: "disconnected",
            phone: null,
            qrDataUrl: null,
            message: "انتهى ربط واتساب. أنشئ ربطاً جديداً",
          });
          return;
        }

        setStatus({
          state: "disconnected",
          qrDataUrl: null,
          message: manualDisconnect ? "تم فصل واتساب" : "انقطع الاتصال، ستتم إعادة المحاولة",
        });
        scheduleReconnect();
      }
    });

    return currentStatus;
  })()
    .catch((error) => {
      socket = null;
      setStatus({
        state: "disconnected",
        qrDataUrl: null,
        message: "تعذر بدء اتصال واتساب",
      });
      throw error;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

export async function disconnectWhatsApp(clearSession = false) {
  manualDisconnect = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const activeSocket = socket;
  socket = null;
  if (activeSocket) {
    try {
      if (clearSession) await activeSocket.logout();
      else activeSocket.end(undefined);
    } catch {
      // The local state below is authoritative even when the remote socket closed first.
    }
  }

  if (clearSession) fs.rmSync(authDir, { recursive: true, force: true });
  setStatus({
    state: "disconnected",
    phone: clearSession ? null : currentStatus.phone,
    qrDataUrl: null,
    message: clearSession ? "تم فك الربط وحذف الجلسة" : "تم فصل الاتصال مؤقتاً",
  });
  return getWhatsAppStatus();
}

export async function sendWhatsAppText(phone: string, text: string) {
  if (!socket || currentStatus.state !== "connected") {
    throw new Error("WHATSAPP_NOT_CONNECTED");
  }
  const digits = phone.replace(/\D/g, "");
  if (!digits) throw new Error("INVALID_PHONE");
  await socket.sendMessage(`${digits}@s.whatsapp.net`, { text });
}

export async function restoreWhatsAppSession() {
  if (!hasSavedSession()) return;
  try {
    await connectWhatsApp();
  } catch (error) {
    console.error("[WhatsApp] Failed to restore saved session:", error);
  }
}