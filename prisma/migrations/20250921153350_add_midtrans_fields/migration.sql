-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "midtrans_order_id" TEXT,
ADD COLUMN     "midtrans_payment_type" TEXT,
ADD COLUMN     "midtrans_settlement_time" TIMESTAMP(3),
ADD COLUMN     "midtrans_status" TEXT,
ADD COLUMN     "midtrans_token" TEXT;

-- CreateTable
CREATE TABLE "public"."webhook_logs" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_logs_order_id_idx" ON "public"."webhook_logs"("order_id");

-- CreateIndex
CREATE INDEX "webhook_logs_event_type_idx" ON "public"."webhook_logs"("event_type");

-- CreateIndex
CREATE INDEX "webhook_logs_processed_idx" ON "public"."webhook_logs"("processed");

-- CreateIndex
CREATE INDEX "bookings_midtrans_order_id_idx" ON "public"."bookings"("midtrans_order_id");
