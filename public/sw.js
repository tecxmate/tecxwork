self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "TECXWORK";
  const options = {
    body: data.message || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
