-- CreateTable
CREATE TABLE "calendar_auth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "scopes" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_auth_email_key" ON "calendar_auth"("email");

-- CreateIndex
CREATE INDEX "calendar_auth_userId_idx" ON "calendar_auth"("userId");

-- CreateIndex
CREATE INDEX "calendar_auth_isValid_idx" ON "calendar_auth"("isValid");
