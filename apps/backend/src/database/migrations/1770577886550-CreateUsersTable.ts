import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUsersTable1770577886550 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid-ossp extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "password_hash",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "first_name",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "last_name",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "role",
                        type: "enum",
                        enum: ["user", "admin"],
                        default: "'user'",
                        isNullable: false,
                    },
                    {
                        name: "last_login_at",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                        isNullable: false,
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_users_email",
                columnNames: ["email"],
            })
        );

        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_users_role",
                columnNames: ["role"],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("users", "IDX_users_role");
        await queryRunner.dropIndex("users", "IDX_users_email");
        await queryRunner.dropTable("users");
    }

}
