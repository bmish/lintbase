-- CreateTable
CREATE TABLE "RuleOptionChoice" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ruleOptionId" INTEGER NOT NULL,

    CONSTRAINT "RuleOptionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "required" BOOLEAN,
    "deprecated" BOOLEAN,
    "default" TEXT,
    "description" TEXT,
    "descriptionAI" TEXT,
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
    "category" TEXT,
    "deprecated" BOOLEAN NOT NULL,
    "description" TEXT,
    "descriptionAI" TEXT,
    "fixable" TEXT,
    "hasSuggestions" BOOLEAN NOT NULL,
    "requiresTypeChecking" BOOLEAN NOT NULL,
    "type" TEXT,
    "linkRuleDoc" TEXT,
    "schema" JSONB,
    "linterId" INTEGER NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "descriptionAI" TEXT,
    "linterId" INTEGER NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "severity" TEXT NOT NULL,
    "linterId" INTEGER NOT NULL,
    "configId" INTEGER NOT NULL,
    "ruleId" INTEGER NOT NULL,

    CONSTRAINT "RuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageKeyword" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "packageId" INTEGER NOT NULL,

    CONSTRAINT "PackageKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageVersion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isLoaded" BOOLEAN NOT NULL DEFAULT false,
    "packageId" INTEGER NOT NULL,

    CONSTRAINT "PackageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageVersionTag" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "packageVersionId" INTEGER NOT NULL,

    CONSTRAINT "PackageVersionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAI" TEXT,
    "packageCreatedAt" TIMESTAMP(3) NOT NULL,
    "packageUpdatedAt" TIMESTAMP(3) NOT NULL,
    "countContributors" INTEGER NOT NULL,
    "countForks" INTEGER NOT NULL,
    "countIssues" INTEGER NOT NULL,
    "countPrs" INTEGER NOT NULL,
    "countStars" INTEGER NOT NULL,
    "countWatching" INTEGER NOT NULL,
    "countWeeklyDownloads" INTEGER NOT NULL,
    "repositoryDirectory" TEXT,
    "linkRepository" TEXT,
    "linkHomepage" TEXT,
    "linkBugs" TEXT,
    "emailBugs" TEXT,
    "ecosystemId" INTEGER NOT NULL,
    "linterId" INTEGER,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Linter" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "descriptionAI" TEXT,
    "lintFrameworkId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,

    CONSTRAINT "Linter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LintFramework" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ecosystemId" INTEGER NOT NULL,
    "linterId" INTEGER,

    CONSTRAINT "LintFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ecosystem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkRepository" TEXT NOT NULL,
    "linkHomepage" TEXT NOT NULL,

    CONSTRAINT "Ecosystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWaitlist" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "UserWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "image" TEXT,
    "name" TEXT,
    "locale" TEXT,
    "accountProvider" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAI" TEXT,
    "commitSha" TEXT,
    "committedAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3),
    "scannedAt" TIMESTAMP(3),
    "language" TEXT,
    "size" INTEGER,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPackage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "pathManifest" TEXT NOT NULL,

    CONSTRAINT "LocalPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPackageLintFramework" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "localPackageId" INTEGER NOT NULL,
    "lintFrameworkId" INTEGER NOT NULL,
    "pathConfig" TEXT,
    "version" TEXT,
    "isPresent" BOOLEAN NOT NULL DEFAULT false,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalPackageLintFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPackageLinter" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "localPackageId" INTEGER NOT NULL,
    "linterId" INTEGER NOT NULL,
    "version" TEXT,
    "isPresent" BOOLEAN NOT NULL DEFAULT false,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalPackageLinter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPackageRule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "localPackageId" INTEGER NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "countViolations" INTEGER,
    "countAutofixable" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalPackageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalPackageConfig" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "localPackageId" INTEGER NOT NULL,
    "configId" INTEGER NOT NULL,
    "countViolations" INTEGER,
    "countAutofixable" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocalPackageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuleOptionChoice_name_ruleOptionId_key" ON "RuleOptionChoice"("name", "ruleOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleOption_name_ruleId_key" ON "RuleOption"("name", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleReplacedBy_name_ruleId_key" ON "RuleReplacedBy"("name", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_linterId_key" ON "Rule"("name", "linterId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_name_linterId_key" ON "Config"("name", "linterId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleConfig_ruleId_configId_key" ON "RuleConfig"("ruleId", "configId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageKeyword_name_packageId_key" ON "PackageKeyword"("name", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageVersion_version_packageId_key" ON "PackageVersion"("version", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageVersionTag_name_packageVersionId_key" ON "PackageVersionTag"("name", "packageVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_linterId_key" ON "Package"("linterId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_name_ecosystemId_key" ON "Package"("name", "ecosystemId");

-- CreateIndex
CREATE UNIQUE INDEX "Linter_packageId_key" ON "Linter"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "LintFramework_linterId_key" ON "LintFramework"("linterId");

-- CreateIndex
CREATE UNIQUE INDEX "LintFramework_name_ecosystemId_key" ON "LintFramework"("name", "ecosystemId");

-- CreateIndex
CREATE UNIQUE INDEX "Ecosystem_name_key" ON "Ecosystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserWaitlist_email_key" ON "UserWaitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_fullName_key" ON "Repository"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPackage_repositoryId_path_key" ON "LocalPackage"("repositoryId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPackageLintFramework_localPackageId_lintFrameworkId_key" ON "LocalPackageLintFramework"("localPackageId", "lintFrameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPackageLinter_localPackageId_linterId_key" ON "LocalPackageLinter"("localPackageId", "linterId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPackageRule_localPackageId_ruleId_key" ON "LocalPackageRule"("localPackageId", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPackageConfig_localPackageId_configId_key" ON "LocalPackageConfig"("localPackageId", "configId");

-- AddForeignKey
ALTER TABLE "RuleOptionChoice" ADD CONSTRAINT "RuleOptionChoice_ruleOptionId_fkey" FOREIGN KEY ("ruleOptionId") REFERENCES "RuleOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleOption" ADD CONSTRAINT "RuleOption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleReplacedBy" ADD CONSTRAINT "RuleReplacedBy_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_linterId_fkey" FOREIGN KEY ("linterId") REFERENCES "Linter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_linterId_fkey" FOREIGN KEY ("linterId") REFERENCES "Linter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleConfig" ADD CONSTRAINT "RuleConfig_linterId_fkey" FOREIGN KEY ("linterId") REFERENCES "Linter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleConfig" ADD CONSTRAINT "RuleConfig_configId_fkey" FOREIGN KEY ("configId") REFERENCES "Config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleConfig" ADD CONSTRAINT "RuleConfig_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageKeyword" ADD CONSTRAINT "PackageKeyword_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageVersion" ADD CONSTRAINT "PackageVersion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageVersionTag" ADD CONSTRAINT "PackageVersionTag_packageVersionId_fkey" FOREIGN KEY ("packageVersionId") REFERENCES "PackageVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "Ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linter" ADD CONSTRAINT "Linter_lintFrameworkId_fkey" FOREIGN KEY ("lintFrameworkId") REFERENCES "LintFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linter" ADD CONSTRAINT "Linter_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LintFramework" ADD CONSTRAINT "LintFramework_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "Ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LintFramework" ADD CONSTRAINT "LintFramework_linterId_fkey" FOREIGN KEY ("linterId") REFERENCES "Linter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackage" ADD CONSTRAINT "LocalPackage_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageLintFramework" ADD CONSTRAINT "LocalPackageLintFramework_localPackageId_fkey" FOREIGN KEY ("localPackageId") REFERENCES "LocalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageLintFramework" ADD CONSTRAINT "LocalPackageLintFramework_lintFrameworkId_fkey" FOREIGN KEY ("lintFrameworkId") REFERENCES "LintFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageLinter" ADD CONSTRAINT "LocalPackageLinter_localPackageId_fkey" FOREIGN KEY ("localPackageId") REFERENCES "LocalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageLinter" ADD CONSTRAINT "LocalPackageLinter_linterId_fkey" FOREIGN KEY ("linterId") REFERENCES "Linter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageRule" ADD CONSTRAINT "LocalPackageRule_localPackageId_fkey" FOREIGN KEY ("localPackageId") REFERENCES "LocalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageRule" ADD CONSTRAINT "LocalPackageRule_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageConfig" ADD CONSTRAINT "LocalPackageConfig_localPackageId_fkey" FOREIGN KEY ("localPackageId") REFERENCES "LocalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalPackageConfig" ADD CONSTRAINT "LocalPackageConfig_configId_fkey" FOREIGN KEY ("configId") REFERENCES "Config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
