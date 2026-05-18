-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
