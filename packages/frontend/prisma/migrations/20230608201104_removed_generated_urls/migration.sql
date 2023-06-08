/*
  Warnings:

  - You are about to drop the column `linkPackageRegistry` on the `Plugin` table. All the data in the column will be lost.
  - You are about to drop the column `linkUs` on the `Plugin` table. All the data in the column will be lost.
  - You are about to drop the column `linkUs` on the `Rule` table. All the data in the column will be lost.

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
    "linkReadme" TEXT
);
INSERT INTO "new_Plugin" ("countContributors", "countForks", "countIssues", "countPrs", "countStars", "countWatching", "countWeeklyDownloads", "createdAt", "description", "ecosystem", "id", "linkReadme", "linter", "name", "updatedAt") SELECT "countContributors", "countForks", "countIssues", "countPrs", "countStars", "countWatching", "countWeeklyDownloads", "createdAt", "description", "ecosystem", "id", "linkReadme", "linter", "name", "updatedAt" FROM "Plugin";
DROP TABLE "Plugin";
ALTER TABLE "new_Plugin" RENAME TO "Plugin";
CREATE UNIQUE INDEX "Plugin_name_key" ON "Plugin"("name");
CREATE TABLE "new_Rule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "category" TEXT,
    "deprecated" BOOLEAN NOT NULL,
    "description" TEXT,
    "fixable" TEXT,
    "hasSuggestions" BOOLEAN NOT NULL,
    "requiresTypeChecking" BOOLEAN NOT NULL,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "linkRuleDoc" TEXT,
    "pluginId" INTEGER NOT NULL,
    CONSTRAINT "Rule_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rule" ("category", "createdAt", "deprecated", "description", "ecosystem", "fixable", "hasSuggestions", "id", "linkRuleDoc", "name", "pluginId", "requiresTypeChecking", "type", "updatedAt") SELECT "category", "createdAt", "deprecated", "description", "ecosystem", "fixable", "hasSuggestions", "id", "linkRuleDoc", "name", "pluginId", "requiresTypeChecking", "type", "updatedAt" FROM "Rule";
DROP TABLE "Rule";
ALTER TABLE "new_Rule" RENAME TO "Rule";
CREATE UNIQUE INDEX "Rule_name_pluginId_key" ON "Rule"("name", "pluginId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
