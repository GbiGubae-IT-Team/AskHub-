ALTER TABLE "Notification" ADD COLUMN "pushQueuedAt" TIMESTAMP(3);
-- Previously stored notifications must not trigger a burst of old alerts.
UPDATE "Notification" SET "pushQueuedAt" = CURRENT_TIMESTAMP;
CREATE INDEX "Notification_pushQueuedAt_createdAt_idx" ON "Notification"("pushQueuedAt", "createdAt");

CREATE TABLE "PushDevice" (
  "id" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "expoPushToken" TEXT,
  "userId" TEXT,
  "language" TEXT NOT NULL DEFAULT 'en',
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "bindingVersion" INTEGER NOT NULL DEFAULT 0,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushDevice_expoPushToken_key" ON "PushDevice"("expoPushToken");
CREATE INDEX "PushDevice_userId_isEnabled_idx" ON "PushDevice"("userId", "isEnabled");
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PushDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "deviceVersion" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ticketId" TEXT,
  "sentToken" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushDelivery_notificationId_deviceId_key" ON "PushDelivery"("notificationId", "deviceId");
CREATE INDEX "PushDelivery_status_availableAt_idx" ON "PushDelivery"("status", "availableAt");
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PushDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
