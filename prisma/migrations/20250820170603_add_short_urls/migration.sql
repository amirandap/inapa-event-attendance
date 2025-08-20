/*
  Warnings:

  - The primary key for the `checkins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `invitees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isResource` on the `invitees` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `invitees` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `invitees` table. All the data in the column will be lost.
  - Added the required column `cedula` to the `invitees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `invitees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "short_urls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shortCode" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "short_urls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "institucion" TEXT,
    "correo" TEXT,
    "sexo" TEXT,
    "telefono" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "checkins_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "invitees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "checkins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_checkins" ("cargo", "cedula", "correo", "createdAt", "eventId", "id", "institucion", "ipAddress", "nombre", "sexo", "telefono", "updatedAt", "userAgent") SELECT "cargo", "cedula", "correo", "createdAt", "eventId", "id", "institucion", "ipAddress", "nombre", "sexo", "telefono", "updatedAt", "userAgent" FROM "checkins";
DROP TABLE "checkins";
ALTER TABLE "new_checkins" RENAME TO "checkins";
CREATE UNIQUE INDEX "checkins_eventId_cedula_key" ON "checkins"("eventId", "cedula");
CREATE TABLE "new_invitees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" TEXT,
    "institucion" TEXT,
    "sexo" TEXT,
    "telefono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invitees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_invitees" ("createdAt", "email", "eventId", "id", "updatedAt") SELECT "createdAt", "email", "eventId", "id", "updatedAt" FROM "invitees";
DROP TABLE "invitees";
ALTER TABLE "new_invitees" RENAME TO "invitees";
CREATE UNIQUE INDEX "invitees_eventId_cedula_key" ON "invitees"("eventId", "cedula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_shortCode_key" ON "short_urls"("shortCode");
