<DOCUMENT filename="SendNotification.tsx">
"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { base64ToUint8Array } from "@/utils/webPushUtils"; // Moved to a utility file

interface NotificationPreference {
  transactionAlerts: boolean;
  systemUpdates: boolean;
}

export default function SendNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [preferences, setPreferences] = useState<NotificationPreference>({
    transactionAlerts: true,
    systemUpdates: true,
  });

  // Check browser support and environment variables
  const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const isEnvValid = !!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY && !!process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }
    if (!isEnvValid) {
      toast.error("Required environment variables are missing.");
      return;
    }

    // Check notification permission status
    setPermissionStatus(Notification.permission);

    // Register service worker and check subscription
    if (window.serwist) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
      });
    }
  }, [isSupported, isEnvValid]);

  const saveSubscriptionToServer = async (sub: PushSubscription) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), preferences }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Failed to save subscription");
      console.log("Subscription saved to server");
    } catch (error) {
      console.error("Error saving subscription:", error);
      throw error;
    }
  };

  const deleteSubscriptionFromServer = async (sub: PushSubscription) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Failed to delete subscription");
      console.log("Subscription deleted from server");
    } catch (error) {
      console.error("Error deleting subscription:", error);
      throw error;
    }
  };

  const retryAsync = async <T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Retry attempts exhausted");
  };

  const subscribeButtonOnClick = async () => {
    if (!isSupported || !isEnvValid || !registration) {
      toast.error("Cannot subscribe: Push notifications not supported or configuration missing.");
      return;
    }
    if (permissionStatus !== "granted") {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission !== "granted") {
        toast.error("Notification permission denied. Please enable notifications in your browser settings.");
        return;
      }
    }

    setIsSubscribing(true);
    try {
      const sub = await retryAsync(() =>
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!),
        })
      );
      await saveSubscriptionToServer(sub);
      setSubscription(sub);
      setIsSubscribed(true);
      toast.success("Successfully subscribed to notifications!");
      // Track analytics event (example)
      // mixpanel.track("PushSubscription", { status: "subscribed" });
    } catch (error) {
      toast.error(`Failed to subscribe: ${(error as Error).message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeButtonOnClick = async () => {
    if (!subscription) {
      toast.error("Not subscribed to push notifications.");
      return;
    }

    setIsUnsubscribing(true);
    try {
      await retryAsync(() => subscription.unsubscribe());
      await deleteSubscriptionFromServer(subscription);
      setSubscription(null);
      setIsSubscribed(false);
      toast.success("Successfully unsubscribed from notifications!");
      // Track analytics event (example)
      // mixpanel.track("PushSubscription", { status: "unsubscribed" });
    } catch (error) {
      toast.error(`Failed to unsubscribe: ${(error as Error).message}`);
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const sendNotificationButtonOnClick = async () => {
    if (!subscription) {
      toast.error("Not subscribed to push notifications.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          payload: {
            title: "Test Notification",
            body: "This is a test push notification from Nexus!",
            icon: "/icon.png",
            data: { url: window.location.origin },
          },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Failed to send notification");
      toast.success("Test notification sent successfully!");
      // Track analytics event (example)
      // mixpanel.track("TestNotificationSent");
    } catch (error) {
      const err = error as Error;
      if (err.name === "TimeoutError") {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(`Failed to send notification: ${err.message}`);
      }
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreference) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-8">
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
        <span className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-3">
          🔔
        </span>
        Push Notifications
      </h3>

      {!isSupported && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <span className="text-red-800 dark:text-red-200 text-sm font-medium">
            Push notifications are not supported in this browser.
          </span>
        </div>
      )}

      {isSupported && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">
              Notification Permission: {permissionStatus.toUpperCase()}
              {permissionStatus === "denied" && (
                <span>
                  {" "}
                  - Please enable notifications in your browser settings.
                </span>
              )}
            </span>
          </div>

          {isSubscribed && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Notification Preferences
              </h4>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={preferences.transactionAlerts}
                  onChange={() => handlePreferenceChange("transactionAlerts")}
                  className="mr-2"
                  aria-label="Enable transaction alerts"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Transaction Alerts
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.systemUpdates}
                  onChange={() => handlePreferenceChange("systemUpdates")}
                  className="mr-2"
                  aria-label="Enable system updates"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  System Updates
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={subscribeButtonOnClick}
              disabled={isSubscribed || isSubscribing || !isSupported || !isEnvValid}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center disabled:cursor-not-allowed disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:dark:text-gray-400 ${
                isSubscribed || isSubscribing
                  ? ""
                  : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white hover:shadow-lg"
              }`}
              aria-label={isSubscribed ? "Subscribed to notifications" : "Subscribe to notifications"}
            >
              {isSubscribing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subscribing...
                </>
              ) : isSubscribed ? (
                "✓ Subscribed"
              ) : (
                "Subscribe to Notifications"
              )}
            </button>

            <button
              type="button"
              onClick={unsubscribeButtonOnClick}
              disabled={!isSubscribed || isUnsubscribing}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center disabled:cursor-not-allowed disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:dark:text-gray-400 ${
                !isSubscribed || isUnsubscribing
                  ? ""
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white hover:shadow-lg"
              }`}
              aria-label="Unsubscribe from notifications"
            >
              {isUnsubscribing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Unsubscribing...
                </>
              ) : (
                "Unsubscribe"
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={sendNotificationButtonOnClick}
            disabled={!isSubscribed || !isSupported || !isEnvValid}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md mt-4 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:dark:text-gray-400 ${
              isSubscribed
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white hover:shadow-lg"
                : ""
            }`}
            aria-label="Send test notification"
          >
            Send Test Notification
          </button>

          {isSubscribed && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Notifications are enabled for this device
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
</DOCUMENT>
