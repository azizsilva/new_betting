-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('bigboss', 'admin_provider', 'owner', 'partner', 'super_admin', 'admin', 'agent', 'player', 'provider');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'locked', 'suspended');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('upi', 'bank', 'wallet', 'cash', 'gateway', 'other');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('deposit', 'withdrawal', 'adjustment', 'refund');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'reversed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "GameAction" AS ENUM ('bet', 'win', 'refund');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('upcoming', 'inplay', 'ended');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(191),
    "mobile" VARCHAR(15) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "password_text" VARCHAR(255),
    "role" "UserRole",
    "parent_id" INTEGER,
    "credit_ref" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "exposure" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "language" VARCHAR(5) NOT NULL DEFAULT 'en',
    "session_token" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" VARCHAR(255),
    "txn_ref" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "payer_id" INTEGER,
    "payee_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "mode_id" INTEGER,
    "type" "PaymentType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "fee_percent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "fee_flat" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "reference" VARCHAR(100),
    "note" VARCHAR(255),
    "meta_json" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_modes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "channel" "PaymentChannel" NOT NULL DEFAULT 'other',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fee_percent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "fee_flat" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allowed_roles" VARCHAR(100) NOT NULL DEFAULT 'admin,master,agent',
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" BIGSERIAL NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "SettlementStatus" NOT NULL DEFAULT 'completed',
    "note" VARCHAR(255),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_ledger" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "points" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "note" VARCHAR(255),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bonus_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_ledger" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "points" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "note" VARCHAR(255),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_methods" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "target_role" "UserRole" NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "channel" "PaymentChannel" NOT NULL DEFAULT 'other',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "details_json" JSONB,
    "source_method_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_deposit_methods" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "channel" "PaymentChannel" NOT NULL DEFAULT 'other',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "details_json" JSONB,
    "source_method_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_deposit_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_deposit_methods" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "channel" "PaymentChannel" NOT NULL DEFAULT 'other',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "details_json" JSONB,
    "source_method_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_deposit_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_withdraw_banks" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bank_slot" SMALLINT NOT NULL,
    "bank_name" VARCHAR(120) NOT NULL,
    "ifsc_swift" VARCHAR(32) NOT NULL,
    "account_no" VARCHAR(40) NOT NULL,
    "account_holder" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_withdraw_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_callback_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "username" VARCHAR(191) NOT NULL,
    "action" "GameAction" NOT NULL,
    "game_uid" VARCHAR(100),
    "txn_id" VARCHAR(128) NOT NULL,
    "game_round" VARCHAR(128),
    "provider_ts" TIMESTAMP(3),
    "bet_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "win_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_delta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_before" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "result_status" BOOLEAN NOT NULL DEFAULT true,
    "result_message" VARCHAR(255),
    "request_ip" VARCHAR(64),
    "request_ua" VARCHAR(255),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_callback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_round_exposures" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_round" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_round_exposures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashback_payouts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "loss_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "cashback_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashback_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login" VARCHAR(100) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "game_id" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recent_games" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" VARCHAR(50) NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_config" (
    "id" SERIAL NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sb_matches" (
    "id" VARCHAR(50) NOT NULL,
    "sport_id" INTEGER NOT NULL DEFAULT 1,
    "league_name" VARCHAR(200) NOT NULL DEFAULT '',
    "home_team" VARCHAR(150) NOT NULL DEFAULT '',
    "away_team" VARCHAR(150) NOT NULL DEFAULT '',
    "start_time" BIGINT NOT NULL DEFAULT 0,
    "status" "MatchStatus" NOT NULL DEFAULT 'upcoming',
    "score" VARCHAR(30),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sb_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_exposure" (
    "id" BIGSERIAL NOT NULL,
    "match_id" VARCHAR(50) NOT NULL,
    "market_id" VARCHAR(50) NOT NULL,
    "selection_id" VARCHAR(100) NOT NULL,
    "total_staked" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "liability" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_exposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "actor_role" VARCHAR(20) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "old_json" JSONB,
    "new_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("setting_key")
);

-- CreateTable
CREATE TABLE "web_settings" (
    "id" SERIAL NOT NULL,
    "site_logo" VARCHAR(255) DEFAULT 'https://moneyking24x7.com/moneyking247.png',
    "telegram_link" VARCHAR(255) DEFAULT '#',
    "instagram_link" VARCHAR(255) DEFAULT '#',
    "facebook_link" VARCHAR(255) DEFAULT '#',
    "telegram_icon" VARCHAR(255) DEFAULT 'fa fa-paper-plane',
    "instagram_icon" VARCHAR(255) DEFAULT 'fa fa-instagram',
    "facebook_icon" VARCHAR(255) DEFAULT 'fa fa-facebook',
    "country_code" VARCHAR(10) DEFAULT '+91',
    "country_name" VARCHAR(50) DEFAULT 'IN',
    "is_login_on" BOOLEAN DEFAULT true,
    "is_signup_on" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_parent_id_idx" ON "users"("parent_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txn_ref_key" ON "transactions"("txn_ref");

-- CreateIndex
CREATE INDEX "transactions_sender_id_created_at_idx" ON "transactions"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_receiver_id_created_at_idx" ON "transactions"("receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "payments_payer_id_created_at_idx" ON "payments"("payer_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_payee_id_created_at_idx" ON "payments"("payee_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_created_by_created_at_idx" ON "payments"("created_by", "created_at");

-- CreateIndex
CREATE INDEX "payments_mode_id_idx" ON "payments"("mode_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_modes_name_key" ON "payment_modes"("name");

-- CreateIndex
CREATE INDEX "payment_modes_enabled_idx" ON "payment_modes"("enabled");

-- CreateIndex
CREATE INDEX "settlements_from_user_id_created_at_idx" ON "settlements"("from_user_id", "created_at");

-- CreateIndex
CREATE INDEX "settlements_to_user_id_created_at_idx" ON "settlements"("to_user_id", "created_at");

-- CreateIndex
CREATE INDEX "settlements_status_created_at_idx" ON "settlements"("status", "created_at");

-- CreateIndex
CREATE INDEX "bonus_ledger_user_id_created_at_idx" ON "bonus_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "bonus_ledger_created_by_created_at_idx" ON "bonus_ledger"("created_by", "created_at");

-- CreateIndex
CREATE INDEX "loyalty_ledger_user_id_created_at_idx" ON "loyalty_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "loyalty_ledger_created_by_created_at_idx" ON "loyalty_ledger"("created_by", "created_at");

-- CreateIndex
CREATE INDEX "deposit_methods_owner_id_target_role_enabled_sort_order_idx" ON "deposit_methods"("owner_id", "target_role", "enabled", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_methods_owner_id_target_role_label_key" ON "deposit_methods"("owner_id", "target_role", "label");

-- CreateIndex
CREATE INDEX "player_deposit_methods_agent_id_enabled_sort_order_idx" ON "player_deposit_methods"("agent_id", "enabled", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "player_deposit_methods_agent_id_label_key" ON "player_deposit_methods"("agent_id", "label");

-- CreateIndex
CREATE INDEX "user_deposit_methods_user_id_enabled_sort_order_idx" ON "user_deposit_methods"("user_id", "enabled", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_deposit_methods_user_id_label_key" ON "user_deposit_methods"("user_id", "label");

-- CreateIndex
CREATE INDEX "user_withdraw_banks_user_id_enabled_updated_at_idx" ON "user_withdraw_banks"("user_id", "enabled", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_withdraw_banks_user_id_bank_slot_key" ON "user_withdraw_banks"("user_id", "bank_slot");

-- CreateIndex
CREATE INDEX "game_callback_events_user_id_created_at_idx" ON "game_callback_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "game_callback_events_game_uid_created_at_idx" ON "game_callback_events"("game_uid", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_callback_events_txn_id_action_key" ON "game_callback_events"("txn_id", "action");

-- CreateIndex
CREATE INDEX "game_round_exposures_user_id_idx" ON "game_round_exposures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_round_exposures_user_id_game_round_key" ON "game_round_exposures"("user_id", "game_round");

-- CreateIndex
CREATE INDEX "cashback_payouts_week_start_idx" ON "cashback_payouts"("week_start");

-- CreateIndex
CREATE UNIQUE INDEX "cashback_payouts_user_id_week_start_key" ON "cashback_payouts"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_session_id_key" ON "game_sessions"("session_id");

-- CreateIndex
CREATE INDEX "game_sessions_login_created_at_idx" ON "game_sessions"("login", "created_at" DESC);

-- CreateIndex
CREATE INDEX "game_sessions_user_id_idx" ON "game_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recent_games_user_id_game_id_key" ON "recent_games"("user_id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_config_setting_key_key" ON "provider_config"("setting_key");

-- CreateIndex
CREATE INDEX "sb_matches_start_time_idx" ON "sb_matches"("start_time");

-- CreateIndex
CREATE INDEX "sb_matches_status_idx" ON "sb_matches"("status");

-- CreateIndex
CREATE INDEX "sb_matches_sport_id_idx" ON "sb_matches"("sport_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_exposure_match_id_market_id_selection_id_key" ON "market_exposure"("match_id", "market_id", "selection_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "payment_modes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_deposit_methods" ADD CONSTRAINT "user_deposit_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_withdraw_banks" ADD CONSTRAINT "user_withdraw_banks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_callback_events" ADD CONSTRAINT "game_callback_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_round_exposures" ADD CONSTRAINT "game_round_exposures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_payouts" ADD CONSTRAINT "cashback_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recent_games" ADD CONSTRAINT "recent_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
