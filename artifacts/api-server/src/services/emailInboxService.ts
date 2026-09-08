import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";

const MAIL_HOST = process.env.MAIL_HOST || "mailserver.dmail.sa";
const MAIL_PORT = Number(process.env.MAIL_IMAP_PORT || 993);
const MAIL_USER = process.env.MAIL_USER || "info@qodratak.sa";
const MAIL_PASSWORD = process.env.QODRATAK_MAIL_PASSWORD || process.env.SMTP_PASS || "";
const MAIL_SECURE = process.env.MAIL_IMAP_SECURE !== "false";
const MAIL_SENT_FOLDER = process.env.MAIL_SENT_FOLDER || "Sent";
const MAX_MESSAGES = 100;
const WATCH_INTERVAL_MS = Math.max(30_000, Number(process.env.MAILBOX_POLL_INTERVAL_MS || 30_000));

export interface InboxMessageSummary {
  uid: number;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  preview: string;
}

export interface InboxMessage extends InboxMessageSummary {
  text: string;
  html: string;
  replyTo: string;
  attachments: Array<{ filename: string; contentType: string; size: number }>;
}

function createClient() {
  if (!MAIL_PASSWORD) throw new Error("MAILBOX_NOT_CONFIGURED");
  return new ImapFlow({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: { user: MAIL_USER, pass: MAIL_PASSWORD },
    logger: false,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

async function withMailbox<T>(mailbox: string, work: (client: ImapFlow) => Promise<T>) {
  const client = createClient();
  await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  try {
    return await work(client);
  } finally {
    lock.release();
    await client.logout().catch(() => undefined);
  }
}

function addressList(value: any): string {
  return (value || [])
    .map((entry: any) => entry.name ? `${entry.name} <${entry.address}>` : entry.address)
    .filter(Boolean)
    .join(", ");
}

function cleanPreview(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function summaryFromMessage(message: any): InboxMessageSummary {
  const envelope = message.envelope || {};
  return {
    uid: Number(message.uid),
    messageId: String(envelope.messageId || ""),
    subject: String(envelope.subject || "(بدون عنوان)"),
    from: addressList(envelope.from),
    to: addressList(envelope.to),
    date: envelope.date ? new Date(envelope.date).toISOString() : message.internalDate ? new Date(message.internalDate).toISOString() : null,
    seen: Array.isArray(message.flags) && message.flags.includes("\\Seen"),
    flagged: Array.isArray(message.flags) && message.flags.includes("\\Flagged"),
    hasAttachments: Boolean(message.bodyStructure?.childNodes?.some((node: any) => node.disposition === "attachment")),
    preview: "",
  };
}

async function parseMessage(message: any): Promise<InboxMessage> {
  const parsed: ParsedMail = await simpleParser(message.source);
  const summary = summaryFromMessage(message);
  const text = String(parsed.text || "").trim();
  const html = typeof parsed.html === "string" ? parsed.html : "";
  return {
    ...summary,
    subject: parsed.subject || summary.subject,
    from: parsed.from?.text || summary.from,
    to: parsed.to && !Array.isArray(parsed.to) ? parsed.to.text : summary.to,
    replyTo: parsed.replyTo?.text || parsed.from?.text || summary.from,
    preview: cleanPreview(text || parsed.textAsHtml?.replace(/<[^>]+>/g, " ") || ""),
    text,
    html,
    attachments: parsed.attachments.map((attachment) => ({
      filename: attachment.filename || "attachment",
      contentType: attachment.contentType,
      size: attachment.size,
    })),
  };
}

export async function listMailboxMessages(mailbox: string): Promise<{ configured: boolean; email: string; folder: string; messages: InboxMessageSummary[] }> {
  if (!MAIL_PASSWORD) return { configured: false, email: MAIL_USER, messages: [] };
  return withMailbox(mailbox, async (client) => {
    const uids = await client.search({ all: true }, { uid: true });
    const latestUids = uids.slice(-MAX_MESSAGES);
    if (latestUids.length === 0) return { configured: true, email: MAIL_USER, folder: mailbox, messages: [] };
    const messages: InboxMessageSummary[] = [];
    for await (const message of client.fetch(latestUids, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
      bodyStructure: true,
    })) {
      messages.push(summaryFromMessage(message));
    }
    messages.sort((left, right) => (right.date || "").localeCompare(left.date || ""));
    return { configured: true, email: MAIL_USER, folder: mailbox, messages };
  });
}

export async function listInboxMessages() {
  return listMailboxMessages("INBOX");
}

export async function listSentMessages() {
  return listMailboxMessages(MAIL_SENT_FOLDER);
}

export async function getMailboxMessage(mailbox: string, uid: number, markSeen = true): Promise<InboxMessage> {
  return withMailbox(mailbox, async (client) => {
    const messages = [];
    for await (const message of client.fetch(String(uid), {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
      bodyStructure: true,
      source: true,
    }, { uid: true })) {
      messages.push(message);
    }
    const message = messages[0];
    if (!message) throw new Error("EMAIL_NOT_FOUND");
    if (markSeen) await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
    return parseMessage(message);
  });
}

export async function getInboxMessage(uid: number, markSeen = true) {
  return getMailboxMessage("INBOX", uid, markSeen);
}

export async function markMailboxMessage(mailbox: string, uid: number, seen: boolean) {
  return withMailbox(mailbox, async (client) => {
    if (seen) await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
    else await client.messageFlagsRemove(uid, ["\\Seen"], { uid: true });
    return { success: true };
  });
}

export async function markInboxMessage(uid: number, seen: boolean) {
  return markMailboxMessage("INBOX", uid, seen);
}

export async function deleteMailboxMessage(mailbox: string, uid: number) {
  return withMailbox(mailbox, async (client) => {
    await client.messageDelete(uid, { uid: true });
    return { success: true };
  });
}

export async function deleteInboxMessage(uid: number) {
  return deleteMailboxMessage("INBOX", uid);
}

export function getMailboxConfig() {
  return { configured: Boolean(MAIL_PASSWORD), email: MAIL_USER, host: MAIL_HOST, imapPort: MAIL_PORT, sentFolder: MAIL_SENT_FOLDER };
}

let watcherTimer: NodeJS.Timeout | null = null;
let watcherInitialized = false;
const knownInboxUids = new Set<number>();

export function startIncomingEmailWatcher(onMessage: (message: InboxMessage) => Promise<void> | void) {
  if (watcherTimer || !MAIL_PASSWORD) return;

  const poll = async () => {
    try {
      await withMailbox("INBOX", async (client) => {
        const uids = await client.search({ all: true }, { uid: true });
        const latestUids = uids.slice(-MAX_MESSAGES);
        if (!watcherInitialized) {
          latestUids.forEach((uid) => knownInboxUids.add(Number(uid)));
          watcherInitialized = true;
          return;
        }

        for await (const message of client.fetch(latestUids, {
          uid: true,
          envelope: true,
          flags: true,
          internalDate: true,
          bodyStructure: true,
          source: true,
        }, { uid: true })) {
          const uid = Number(message.uid);
          if (knownInboxUids.has(uid)) continue;
          knownInboxUids.add(uid);
          const parsed = await parseMessage(message);
          await onMessage(parsed);
          await client.messageFlagsAdd(uid, ["\\Flagged"], { uid: true });
        }
      });
    } catch (error) {
      console.error("[Mailbox] incoming poll failed:", error instanceof Error ? error.message : error);
    }
  };

  void poll();
  watcherTimer = setInterval(() => void poll(), WATCH_INTERVAL_MS);
}