-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'tenant');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('waiting_for_payment', 'waiting_for_confirmation', 'confirmed', 'cancelled', 'expired', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('manual_transfer', 'payment_gateway');

-- CreateEnum
CREATE TYPE "public"."PriceChangeType" AS ENUM ('nominal', 'percentage');

-- CreateEnum
CREATE TYPE "public"."VerificationTokenType" AS ENUM ('email_verification', 'password_reset');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "avatar_url" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."VerificationTokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_images" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "base_price" INTEGER NOT NULL,
    "description" TEXT,
    "total_units" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_images" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_availability" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "custom_price" INTEGER,
    "price_modifier" DOUBLE PRECISION,
    "reason" TEXT,
    "booked_units" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."peak_seasons" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "change_type" "public"."PriceChangeType" NOT NULL,
    "change_value" DOUBLE PRECISION NOT NULL,
    "apply_to_all_properties" BOOLEAN NOT NULL DEFAULT false,
    "property_ids" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peak_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" SERIAL NOT NULL,
    "booking_no" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'waiting_for_payment',
    "total_amount" INTEGER NOT NULL,
    "payment_method" "public"."PaymentMethod",
    "payment_proof_url" TEXT,
    "payment_deadline" TIMESTAMP(3),
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "total_guests" INTEGER NOT NULL,
    "notes" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_items" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "unit_count" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "sub_total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_replies" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_type_idx" ON "public"."verification_tokens"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "public"."properties"("slug");

-- CreateIndex
CREATE INDEX "properties_slug_idx" ON "public"."properties"("slug");

-- CreateIndex
CREATE INDEX "properties_tenant_id_idx" ON "public"."properties"("tenant_id");

-- CreateIndex
CREATE INDEX "properties_city_province_idx" ON "public"."properties"("city", "province");

-- CreateIndex
CREATE INDEX "properties_published_deleted_at_idx" ON "public"."properties"("published", "deleted_at");

-- CreateIndex
CREATE INDEX "property_images_property_id_is_primary_idx" ON "public"."property_images"("property_id", "is_primary");

-- CreateIndex
CREATE INDEX "rooms_property_id_idx" ON "public"."rooms"("property_id");

-- CreateIndex
CREATE INDEX "rooms_base_price_idx" ON "public"."rooms"("base_price");

-- CreateIndex
CREATE INDEX "room_images_room_id_is_primary_idx" ON "public"."room_images"("room_id", "is_primary");

-- CreateIndex
CREATE INDEX "room_availability_date_idx" ON "public"."room_availability"("date");

-- CreateIndex
CREATE INDEX "room_availability_room_id_date_is_available_idx" ON "public"."room_availability"("room_id", "date", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "room_availability_room_id_date_key" ON "public"."room_availability"("room_id", "date");

-- CreateIndex
CREATE INDEX "peak_seasons_tenant_id_idx" ON "public"."peak_seasons"("tenant_id");

-- CreateIndex
CREATE INDEX "peak_seasons_start_date_end_date_idx" ON "public"."peak_seasons"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_no_key" ON "public"."bookings"("booking_no");

-- CreateIndex
CREATE INDEX "bookings_booking_no_idx" ON "public"."bookings"("booking_no");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "public"."bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "public"."bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_check_in_check_out_idx" ON "public"."bookings"("check_in", "check_out");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "public"."booking_items"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "public"."reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_property_id_idx" ON "public"."reviews"("property_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "public"."reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_replies_review_id_key" ON "public"."review_replies"("review_id");

-- AddForeignKey
ALTER TABLE "public"."verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_images" ADD CONSTRAINT "room_images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_availability" ADD CONSTRAINT "room_availability_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."peak_seasons" ADD CONSTRAINT "peak_seasons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_items" ADD CONSTRAINT "booking_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_replies" ADD CONSTRAINT "review_replies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
