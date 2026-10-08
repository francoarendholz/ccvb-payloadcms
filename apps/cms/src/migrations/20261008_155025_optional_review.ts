import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "pages" SET "review_status" = 'none' WHERE "review_status" = 'in_progress';
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum_pages_review_status";
  CREATE TYPE "public"."enum_pages_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DEFAULT 'none'::"public"."enum_pages_review_status";
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_pages_review_status" USING "review_status"::"public"."enum_pages_review_status";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_pages_v" SET "version_review_status" = 'none' WHERE "version_review_status" = 'in_progress';
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum__pages_v_version_review_status";
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::"public"."enum__pages_v_version_review_status";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__pages_v_version_review_status" USING "version_review_status"::"public"."enum__pages_v_version_review_status";
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "posts" SET "review_status" = 'none' WHERE "review_status" = 'in_progress';
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum_posts_review_status";
  CREATE TYPE "public"."enum_posts_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DEFAULT 'none'::"public"."enum_posts_review_status";
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_posts_review_status" USING "review_status"::"public"."enum_posts_review_status";
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_posts_v" SET "version_review_status" = 'none' WHERE "version_review_status" = 'in_progress';
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum__posts_v_version_review_status";
  CREATE TYPE "public"."enum__posts_v_version_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::"public"."enum__posts_v_version_review_status";
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__posts_v_version_review_status" USING "version_review_status"::"public"."enum__posts_v_version_review_status";
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "events" SET "review_status" = 'none' WHERE "review_status" = 'in_progress';
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum_events_review_status";
  CREATE TYPE "public"."enum_events_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DEFAULT 'none'::"public"."enum_events_review_status";
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_events_review_status" USING "review_status"::"public"."enum_events_review_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_events_v" SET "version_review_status" = 'none' WHERE "version_review_status" = 'in_progress';
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum__events_v_version_review_status";
  CREATE TYPE "public"."enum__events_v_version_review_status" AS ENUM('none', 'review', 'changes_requested', 'approved');
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DEFAULT 'none'::"public"."enum__events_v_version_review_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__events_v_version_review_status" USING "version_review_status"::"public"."enum__events_v_version_review_status";
  ALTER TABLE "pages" ADD COLUMN "reviewer_id" integer;
  ALTER TABLE "pages" ADD COLUMN "reviewed_by_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_reviewer_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_reviewed_by_id" integer;
  ALTER TABLE "posts" ADD COLUMN "reviewer_id" integer;
  ALTER TABLE "posts" ADD COLUMN "reviewed_by_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_reviewer_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_reviewed_by_id" integer;
  ALTER TABLE "events" ADD COLUMN "reviewer_id" integer;
  ALTER TABLE "events" ADD COLUMN "reviewed_by_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_reviewer_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_reviewed_by_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_reviewer_id_users_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_reviewer_idx" ON "pages" USING btree ("reviewer_id");
  CREATE INDEX "pages_reviewed_by_idx" ON "pages" USING btree ("reviewed_by_id");
  CREATE INDEX "_pages_v_version_version_reviewer_idx" ON "_pages_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_pages_v_version_version_reviewed_by_idx" ON "_pages_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "posts_reviewer_idx" ON "posts" USING btree ("reviewer_id");
  CREATE INDEX "posts_reviewed_by_idx" ON "posts" USING btree ("reviewed_by_id");
  CREATE INDEX "_posts_v_version_version_reviewer_idx" ON "_posts_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_posts_v_version_version_reviewed_by_idx" ON "_posts_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "events_reviewer_idx" ON "events" USING btree ("reviewer_id");
  CREATE INDEX "events_reviewed_by_idx" ON "events" USING btree ("reviewed_by_id");
  CREATE INDEX "_events_v_version_version_reviewer_idx" ON "_events_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_events_v_version_version_reviewed_by_idx" ON "_events_v" USING btree ("version_reviewed_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP CONSTRAINT "pages_reviewer_id_users_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_reviewer_id_users_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_reviewer_id_users_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_reviewer_id_users_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_reviewer_id_users_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_reviewer_id_users_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "pages" SET "review_status" = 'in_progress' WHERE "review_status" IN ('none', 'approved');
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum_pages_review_status";
  CREATE TYPE "public"."enum_pages_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::"public"."enum_pages_review_status";
  ALTER TABLE "pages" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_pages_review_status" USING "review_status"::"public"."enum_pages_review_status";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_pages_v" SET "version_review_status" = 'in_progress' WHERE "version_review_status" IN ('none', 'approved');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum__pages_v_version_review_status";
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::"public"."enum__pages_v_version_review_status";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__pages_v_version_review_status" USING "version_review_status"::"public"."enum__pages_v_version_review_status";
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "posts" SET "review_status" = 'in_progress' WHERE "review_status" IN ('none', 'approved');
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum_posts_review_status";
  CREATE TYPE "public"."enum_posts_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::"public"."enum_posts_review_status";
  ALTER TABLE "posts" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_posts_review_status" USING "review_status"::"public"."enum_posts_review_status";
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_posts_v" SET "version_review_status" = 'in_progress' WHERE "version_review_status" IN ('none', 'approved');
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum__posts_v_version_review_status";
  CREATE TYPE "public"."enum__posts_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::"public"."enum__posts_v_version_review_status";
  ALTER TABLE "_posts_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__posts_v_version_review_status" USING "version_review_status"::"public"."enum__posts_v_version_review_status";
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DATA TYPE text;
  UPDATE "events" SET "review_status" = 'in_progress' WHERE "review_status" IN ('none', 'approved');
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum_events_review_status";
  CREATE TYPE "public"."enum_events_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DEFAULT 'in_progress'::"public"."enum_events_review_status";
  ALTER TABLE "events" ALTER COLUMN "review_status" SET DATA TYPE "public"."enum_events_review_status" USING "review_status"::"public"."enum_events_review_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DATA TYPE text;
  UPDATE "_events_v" SET "version_review_status" = 'in_progress' WHERE "version_review_status" IN ('none', 'approved');
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::text;
  DROP TYPE "public"."enum__events_v_version_review_status";
  CREATE TYPE "public"."enum__events_v_version_review_status" AS ENUM('in_progress', 'review', 'changes_requested');
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DEFAULT 'in_progress'::"public"."enum__events_v_version_review_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_review_status" SET DATA TYPE "public"."enum__events_v_version_review_status" USING "version_review_status"::"public"."enum__events_v_version_review_status";
  DROP INDEX "pages_reviewer_idx";
  DROP INDEX "pages_reviewed_by_idx";
  DROP INDEX "_pages_v_version_version_reviewer_idx";
  DROP INDEX "_pages_v_version_version_reviewed_by_idx";
  DROP INDEX "posts_reviewer_idx";
  DROP INDEX "posts_reviewed_by_idx";
  DROP INDEX "_posts_v_version_version_reviewer_idx";
  DROP INDEX "_posts_v_version_version_reviewed_by_idx";
  DROP INDEX "events_reviewer_idx";
  DROP INDEX "events_reviewed_by_idx";
  DROP INDEX "_events_v_version_version_reviewer_idx";
  DROP INDEX "_events_v_version_version_reviewed_by_idx";
  ALTER TABLE "pages" DROP COLUMN "reviewer_id";
  ALTER TABLE "pages" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_reviewer_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_reviewed_by_id";
  ALTER TABLE "posts" DROP COLUMN "reviewer_id";
  ALTER TABLE "posts" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_reviewer_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_reviewed_by_id";
  ALTER TABLE "events" DROP COLUMN "reviewer_id";
  ALTER TABLE "events" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_reviewer_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_reviewed_by_id";`)
}
