import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TYPE "public"."enum_posts_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TYPE "public"."enum__posts_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TYPE "public"."enum_events_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TYPE "public"."enum__events_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  CREATE TABLE "totp_attempts" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" ADD COLUMN "review_status" "enum_pages_review_status" DEFAULT 'in_progress';
  ALTER TABLE "pages" ADD COLUMN "review_note" varchar;
  ALTER TABLE "pages" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_review_status" "enum__pages_v_version_review_status" DEFAULT 'in_progress';
  ALTER TABLE "_pages_v" ADD COLUMN "version_review_note" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "posts" ADD COLUMN "review_status" "enum_posts_review_status" DEFAULT 'in_progress';
  ALTER TABLE "posts" ADD COLUMN "review_note" varchar;
  ALTER TABLE "posts" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_review_status" "enum__posts_v_version_review_status" DEFAULT 'in_progress';
  ALTER TABLE "_posts_v" ADD COLUMN "version_review_note" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "events" ADD COLUMN "review_status" "enum_events_review_status" DEFAULT 'in_progress';
  ALTER TABLE "events" ADD COLUMN "review_note" varchar;
  ALTER TABLE "events" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_review_status" "enum__events_v_version_review_status" DEFAULT 'in_progress';
  ALTER TABLE "_events_v" ADD COLUMN "version_review_note" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "users" ADD COLUMN "totp_secret" varchar;
  ALTER TABLE "users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_review_status_idx" ON "pages" USING btree ("review_status");
  CREATE INDEX "pages_submitted_by_idx" ON "pages" USING btree ("submitted_by_id");
  CREATE INDEX "_pages_v_version_version_review_status_idx" ON "_pages_v" USING btree ("version_review_status");
  CREATE INDEX "_pages_v_version_version_submitted_by_idx" ON "_pages_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "posts_review_status_idx" ON "posts" USING btree ("review_status");
  CREATE INDEX "posts_submitted_by_idx" ON "posts" USING btree ("submitted_by_id");
  CREATE INDEX "_posts_v_version_version_review_status_idx" ON "_posts_v" USING btree ("version_review_status");
  CREATE INDEX "_posts_v_version_version_submitted_by_idx" ON "_posts_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "events_review_status_idx" ON "events" USING btree ("review_status");
  CREATE INDEX "events_submitted_by_idx" ON "events" USING btree ("submitted_by_id");
  CREATE INDEX "_events_v_version_version_review_status_idx" ON "_events_v" USING btree ("version_review_status");
  CREATE INDEX "_events_v_version_version_submitted_by_idx" ON "_events_v" USING btree ("version_submitted_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "totp_attempts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "totp_attempts" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_submitted_by_id_users_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_submitted_by_id_users_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_submitted_by_id_users_id_fk";
  
  DROP INDEX "pages_review_status_idx";
  DROP INDEX "pages_submitted_by_idx";
  DROP INDEX "_pages_v_version_version_review_status_idx";
  DROP INDEX "_pages_v_version_version_submitted_by_idx";
  DROP INDEX "posts_review_status_idx";
  DROP INDEX "posts_submitted_by_idx";
  DROP INDEX "_posts_v_version_version_review_status_idx";
  DROP INDEX "_posts_v_version_version_submitted_by_idx";
  DROP INDEX "events_review_status_idx";
  DROP INDEX "events_submitted_by_idx";
  DROP INDEX "_events_v_version_version_review_status_idx";
  DROP INDEX "_events_v_version_version_submitted_by_idx";
  ALTER TABLE "pages" DROP COLUMN "review_status";
  ALTER TABLE "pages" DROP COLUMN "review_note";
  ALTER TABLE "pages" DROP COLUMN "submitted_by_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_review_status";
  ALTER TABLE "_pages_v" DROP COLUMN "version_review_note";
  ALTER TABLE "_pages_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "posts" DROP COLUMN "review_status";
  ALTER TABLE "posts" DROP COLUMN "review_note";
  ALTER TABLE "posts" DROP COLUMN "submitted_by_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_review_status";
  ALTER TABLE "_posts_v" DROP COLUMN "version_review_note";
  ALTER TABLE "_posts_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "events" DROP COLUMN "review_status";
  ALTER TABLE "events" DROP COLUMN "review_note";
  ALTER TABLE "events" DROP COLUMN "submitted_by_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_review_status";
  ALTER TABLE "_events_v" DROP COLUMN "version_review_note";
  ALTER TABLE "_events_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "users" DROP COLUMN "totp_secret";
  ALTER TABLE "users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "users" DROP COLUMN "api_key";
  ALTER TABLE "users" DROP COLUMN "api_key_index";
  DROP TYPE "public"."enum_pages_review_status";
  DROP TYPE "public"."enum__pages_v_version_review_status";
  DROP TYPE "public"."enum_posts_review_status";
  DROP TYPE "public"."enum__posts_v_version_review_status";
  DROP TYPE "public"."enum_events_review_status";
  DROP TYPE "public"."enum__events_v_version_review_status";`)
}
