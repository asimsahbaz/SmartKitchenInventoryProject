-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REGULAR_USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXPIRY_WARNING', 'ITEM_EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'REGULAR_USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "expiryDate" DATE,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "prepTimeMinutes" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "ingredientName" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT 'My Shopping List',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" UUID NOT NULL,
    "shoppingListId" UUID NOT NULL,
    "recipeId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pantryItemId" UUID,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "PantryItem_userId_idx" ON "PantryItem"("userId");

-- CreateIndex
CREATE INDEX "PantryItem_expiryDate_idx" ON "PantryItem"("expiryDate");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_idx" ON "ShoppingList"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_pantryItemId_fkey" FOREIGN KEY ("pantryItemId") REFERENCES "PantryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
