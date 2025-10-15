/*
  Warnings:

  - You are about to drop the column `category_id` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `public_id` to the `room_images` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyCategory" AS ENUM ('villa', 'house', 'apartment');

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "category_id",
ADD COLUMN     "category" "public"."PropertyCategory" NOT NULL DEFAULT 'house';

-- AlterTable
ALTER TABLE "public"."property_images" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "public"."room_availability" ADD COLUMN     "totalUnits" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."room_images" ADD COLUMN     "public_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."categories";
