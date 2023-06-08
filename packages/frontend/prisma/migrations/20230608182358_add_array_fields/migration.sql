-- CreateTable
CREATE TABLE "RuleOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ruleId" INTEGER NOT NULL,
    CONSTRAINT "RuleOption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuleReplacedBy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ruleId" INTEGER NOT NULL,
    CONSTRAINT "RuleReplacedBy_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PluginKeyword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "pluginId" INTEGER NOT NULL,
    CONSTRAINT "PluginKeyword_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PluginVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "pluginId" INTEGER NOT NULL,
    CONSTRAINT "PluginVersion_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
