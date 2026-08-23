-- CreateTable
CREATE TABLE "CompanyAccessGrant" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyAccessGrant_userId_idx" ON "CompanyAccessGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAccessGrant_companyId_userId_key" ON "CompanyAccessGrant"("companyId", "userId");

-- AddForeignKey
ALTER TABLE "CompanyAccessGrant" ADD CONSTRAINT "CompanyAccessGrant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAccessGrant" ADD CONSTRAINT "CompanyAccessGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAccessGrant" ADD CONSTRAINT "CompanyAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
