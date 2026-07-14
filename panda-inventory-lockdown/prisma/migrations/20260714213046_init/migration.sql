-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "aco" TEXT,
    "rdo" TEXT,
    "fiscalWeek" TEXT,
    "manager" TEXT,
    "sourceFile" TEXT,
    "parsedAt" TIMESTAMP(3),
    "weekLabels" TEXT[],
    "deliveryDays" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "productNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "averagePer1k" DOUBLE PRECISION,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyUsage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeeklyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCase" (
    "productNumber" TEXT NOT NULL,
    "unitsPerCase" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCase_pkey" PRIMARY KEY ("productNumber")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_number_key" ON "Store"("number");

-- CreateIndex
CREATE INDEX "Category_storeId_idx" ON "Category"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_storeId_name_key" ON "Category"("storeId", "name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_productNumber_idx" ON "Product"("productNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Product_categoryId_productNumber_key" ON "Product"("categoryId", "productNumber");

-- CreateIndex
CREATE INDEX "WeeklyUsage_productId_idx" ON "WeeklyUsage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyUsage_productId_label_key" ON "WeeklyUsage"("productId", "label");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyUsage" ADD CONSTRAINT "WeeklyUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
