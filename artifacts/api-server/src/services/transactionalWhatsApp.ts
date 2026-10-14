import { sendWhatsAppText, type WhatsAppOutboundKind } from "./whatsappService";
export type DeliveryState = "sent" | "failed" | "queued";
/** Keep saving accounts/questions independent of an unavailable or busy transport. */
export async function transactionalWhatsApp(
  phone: string, text: string, kind: WhatsAppOutboundKind,
  settled?: (status: "sent" | "failed") => Promise<unknown>,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = async (status: "sent" | "failed") => {
    try { await settled?.(status); } catch { /* Delivery result must not undo a saved record. */ }
    return status;
  };
  try {
    const completion = sendWhatsAppText(phone, text, kind)
      .then(() => finish("sent"), () => finish("failed"));
    return await Promise.race<DeliveryState>([
      completion,
      new Promise<DeliveryState>(resolve => { timer = setTimeout(() => resolve("queued"), 2500); }),
    ]);
  } catch { return finish("failed"); }
  finally { if (timer) clearTimeout(timer); }
}
