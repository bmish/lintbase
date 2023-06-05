/*
  Warnings:

  - You are about to drop the column `contributors` on the `Plugin` table. All the data in the column will be lost.
  - Added the required column `countContributors` to the `Plugin` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plugin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "linter" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "countContributors" INTEGER NOT NULL,
    "countForks" INTEGER NOT NULL,
    "countIssues" INTEGER NOT NULL,
    "countPrs" INTEGER NOT NULL,
    "countStars" INTEGER NOT NULL,
    "countWatching" INTEGER NOT NULL,
    "countWeeklyDownloads" INTEGER NOT NULL,
    "linkPackageRegistry" TEXT NOT NULL,
    "linkReadme" TEXT,
    "linkUs" TEXT NOT NULL
);
INSERT INTO "new_Plugin" ("countForks", "countIssues", "countPrs", "countStars", "countWatching", "countWeeklyDownloads", "createdAt", "description", "ecosystem", "id", "linkPackageRegistry", "linkReadme", "linkUs", "linter", "name", "updatedAt") SELECT "countForks", "countIssues", "countPrs", "countStars", "countWatching", "countWeeklyDownloads", "createdAt", "description", "ecosystem", "id", "linkPackageRegistry", "linkReadme", "linkUs", "linter", "name", "updatedAt" FROM "Plugin";
DROP TABLE "Plugin";
ALTER TABLE "new_Plugin" RENAME TO "Plugin";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
