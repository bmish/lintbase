-- CreateTable
CREATE TABLE "Rule" (
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
    "linkUs" TEXT NOT NULL,
    "pluginId" INTEGER NOT NULL,
    CONSTRAINT "Rule_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pluginId" INTEGER,
    CONSTRAINT "Config_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plugin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "linter" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "contributors" INTEGER NOT NULL,
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
