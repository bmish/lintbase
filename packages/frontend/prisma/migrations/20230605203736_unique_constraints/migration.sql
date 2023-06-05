/*
  Warnings:

  - A unique constraint covering the columns `[name,pluginId]` on the table `Config` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Plugin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,pluginId]` on the table `Rule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Config_name_pluginId_key" ON "Config"("name", "pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_name_key" ON "Plugin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_pluginId_key" ON "Rule"("name", "pluginId");
