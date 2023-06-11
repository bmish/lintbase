-- CreateTable
CREATE TABLE "RuleOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ruleId" INTEGER NOT NULL,

    CONSTRAINT "RuleOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleReplacedBy" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ruleId" INTEGER NOT NULL,

    CONSTRAINT "RuleReplacedBy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "category" TEXT,
    "deprecated" BOOLEAN NOT NULL,
    "description" TEXT,
    "fixable" TEXT,
    "hasSuggestions" BOOLEAN NOT NULL,
    "requiresTypeChecking" BOOLEAN NOT NULL,
    "type" TEXT,
    "linkRuleDoc" TEXT,
    "pluginId" INTEGER NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "pluginId" INTEGER,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginKeyword" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "pluginId" INTEGER NOT NULL,

    CONSTRAINT "PluginKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginVersion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "pluginId" INTEGER NOT NULL,

    CONSTRAINT "PluginVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plugin" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "linter" TEXT NOT NULL,
    "description" TEXT,
    "packageCreatedAt" TIMESTAMP(3) NOT NULL,
    "packageUpdatedAt" TIMESTAMP(3) NOT NULL,
    "countContributors" INTEGER NOT NULL,
    "countForks" INTEGER NOT NULL,
    "countIssues" INTEGER NOT NULL,
    "countPrs" INTEGER NOT NULL,
    "countStars" INTEGER NOT NULL,
    "countWatching" INTEGER NOT NULL,
    "countWeeklyDownloads" INTEGER NOT NULL,
    "linkHomepage" TEXT,
    "linkBugs" TEXT,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuleOption_name_ruleId_key" ON "RuleOption"("name", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleReplacedBy_name_ruleId_key" ON "RuleReplacedBy"("name", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_pluginId_key" ON "Rule"("name", "pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_name_pluginId_key" ON "Config"("name", "pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginKeyword_name_pluginId_key" ON "PluginKeyword"("name", "pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginVersion_version_pluginId_key" ON "PluginVersion"("version", "pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_name_key" ON "Plugin"("name");

-- AddForeignKey
ALTER TABLE "RuleOption" ADD CONSTRAINT "RuleOption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleReplacedBy" ADD CONSTRAINT "RuleReplacedBy_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginKeyword" ADD CONSTRAINT "PluginKeyword_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginVersion" ADD CONSTRAINT "PluginVersion_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "Plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
