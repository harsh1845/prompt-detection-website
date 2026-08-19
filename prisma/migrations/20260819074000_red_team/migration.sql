-- CreateTable
CREATE TABLE "RedTeamTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "appId" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headersJson" TEXT NOT NULL DEFAULT '{}',
    "bodyTemplate" TEXT NOT NULL DEFAULT '{"text":"{{prompt}}"}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedTeamTarget_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RedTeamTarget_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedTeamRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "appId" TEXT,
    "targetId" TEXT,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "targetKind" TEXT NOT NULL,
    "targetUrl" TEXT,
    "targetName" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headersJson" TEXT NOT NULL DEFAULT '{}',
    "bodyTemplate" TEXT NOT NULL DEFAULT '{"text":"{{prompt}}"}',
    "corporaJson" TEXT NOT NULL DEFAULT '[]',
    "customText" TEXT NOT NULL DEFAULT '',
    "customCount" INTEGER NOT NULL DEFAULT 0,
    "concurrency" INTEGER NOT NULL DEFAULT 2,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 15,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "passRate" REAL,
    "regressionsJson" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedTeamRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RedTeamRun_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RedTeamRun_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "RedTeamTarget" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RedTeamRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedTeamItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "corpus" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "promptExcerpt" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "detectorStatus" TEXT,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "error" TEXT,
    "responseExcerpt" TEXT,
    "isRegression" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedTeamItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "RedTeamRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RedTeamItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedTeamSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "appId" TEXT,
    "targetId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cadence" TEXT NOT NULL DEFAULT 'weekly',
    "targetKind" TEXT NOT NULL,
    "targetUrl" TEXT,
    "targetName" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headersJson" TEXT NOT NULL DEFAULT '{}',
    "bodyTemplate" TEXT NOT NULL DEFAULT '{"text":"{{prompt}}"}',
    "corporaJson" TEXT NOT NULL DEFAULT '[]',
    "customText" TEXT NOT NULL DEFAULT '',
    "concurrency" INTEGER NOT NULL DEFAULT 2,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 15,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedTeamSchedule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RedTeamSchedule_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RedTeamSchedule_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "RedTeamTarget" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RedTeamTarget_orgId_idx" ON "RedTeamTarget"("orgId");

-- CreateIndex
CREATE INDEX "RedTeamRun_orgId_createdAt_idx" ON "RedTeamRun"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "RedTeamRun_orgId_status_idx" ON "RedTeamRun"("orgId", "status");

-- CreateIndex
CREATE INDEX "RedTeamRun_appId_createdAt_idx" ON "RedTeamRun"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "RedTeamItem_runId_idx" ON "RedTeamItem"("runId");

-- CreateIndex
CREATE INDEX "RedTeamItem_orgId_runId_idx" ON "RedTeamItem"("orgId", "runId");

-- CreateIndex
CREATE INDEX "RedTeamSchedule_orgId_idx" ON "RedTeamSchedule"("orgId");

-- CreateIndex
CREATE INDEX "RedTeamSchedule_nextRunAt_enabled_idx" ON "RedTeamSchedule"("nextRunAt", "enabled");
