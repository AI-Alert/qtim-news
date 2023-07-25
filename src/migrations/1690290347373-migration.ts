import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1690290347373 implements MigrationInterface {
    name = 'Migration1690290347373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_gender_enum" AS ENUM('male', 'female', 'omitted')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying NOT NULL, "passwordHash" character varying, "passwordSalt" character varying, "lastPasswordResetDate" TIMESTAMP NOT NULL, "firstName" character varying, "lastName" character varying, "gender" "public"."user_gender_enum", "age" integer, "dateOfBirth" date, "verificationId" integer NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "REL_6c4dd8e21a4e8131d8a66e430c" UNIQUE ("verificationId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6c4dd8e21a4e8131d8a66e430c" ON "user" ("verificationId") `);
        await queryRunner.query(`CREATE TABLE "userVerification" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "passwordVerificationCode" character varying, "lastPasswordVerificationCodeSentAt" TIMESTAMP WITH TIME ZONE, "emailVerificationCode" character varying, "lastEmailVerificationCodeSentAt" TIMESTAMP WITH TIME ZONE, "verifiedEmail" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_71522ed088193b35ec1c8870bc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_6c4dd8e21a4e8131d8a66e430c0" FOREIGN KEY ("verificationId") REFERENCES "userVerification"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_6c4dd8e21a4e8131d8a66e430c0"`);
        await queryRunner.query(`DROP TABLE "userVerification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6c4dd8e21a4e8131d8a66e430c"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
    }

}
