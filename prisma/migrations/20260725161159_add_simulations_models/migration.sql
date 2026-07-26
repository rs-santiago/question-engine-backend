/*
  Warnings:

  - A unique constraint covering the columns `[user_id,simulation_id,question_id]` on the table `student_answers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "student_answers" ADD COLUMN     "simulation_id" UUID;

-- CreateTable
CREATE TABLE "simulations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 180,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_questions" (
    "id" UUID NOT NULL,
    "simulation_id" UUID NOT NULL,
    "question_id" BIGINT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "simulation_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulation_questions_simulation_id_question_id_key" ON "simulation_questions"("simulation_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_user_id_simulation_id_question_id_key" ON "student_answers"("user_id", "simulation_id", "question_id");

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_questions" ADD CONSTRAINT "simulation_questions_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_questions" ADD CONSTRAINT "simulation_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
