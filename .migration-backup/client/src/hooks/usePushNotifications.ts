import { useState, useEffect, useCallback } from "react";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface PushState {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
}

// Convert base64url VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Check if push is supported in this browser/OS
function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    permission: isPushSupported() ? (Notification.permission as PushPermission) : "unsupported",
    isSubscribed: false,
    isLoading: false,
    isSupported: isPushSupported(),
  });

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!isPushSupported()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState((s) => ({ ...s, isSubscribed: !!sub }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) return false;
    setState((s) => ({ ...s, isLoading: true }));
    try {
      // 1. Get VAPID public key
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) throw new Error("No VAPID key");
      const { publicKey } = await keyRes.json();

      // 2. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((s) => ({ ...s, isLoading: false, permission: permission as PushPermission }));
        return false;
      }

      // 3. Register service worker and subscribe
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      // 4. Send subscription to server
      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
        credentials: "include",
      });

      if (res.ok) {
        setState((s) => ({ ...s, isLoading: false, isSubscribed: true, permission: "granted" }));
        return true;
      } else {
        throw new Error("Server rejected subscription");
      }
    } catch (err) {
      console.error("Push subscribe error:", err);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  // Unsubscribe from push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
          credentials: "include",
        });
      }
      setState((s) => ({ ...s, isLoading: false, isSubscribed: false }));
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  // Send a test push notification
  const sendTest = useCallback(async (type = "general"): Promise<boolean> => {
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        credentials: "include",
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }, []);

  return { ...state, subscribe, unsubscribe, sendTest, checkSubscription };
}
