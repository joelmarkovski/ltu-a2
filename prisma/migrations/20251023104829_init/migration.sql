-- CreateTable
CREATE TABLE "EscapeGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "EscapeStage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "timerSecs" INTEGER,
    "hint" TEXT,
    CONSTRAINT "EscapeStage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "EscapeGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EscapeStage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "EscapeStage_gameId_idx" ON "EscapeStage"("gameId");

-- CreateIndex
CREATE INDEX "EscapeStage_questionId_idx" ON "EscapeStage"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "EscapeStage_gameId_orderIndex_key" ON "EscapeStage"("gameId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");
