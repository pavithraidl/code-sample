import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('did', 32).unique().nullable();
      table.string('first_name', 32);
      table.string('last_name', 32);
      table.string('email', 255).unique();
      table.string('avatar_url', 255).nullable();
      table.string('gender', 8).nullable();
      table.string('phone_number', 32).nullable();
      table.string('guid', 48).unique().nullable();
      table.jsonb('meta_data').nullable();
      table.jsonb('social_login_data').nullable();
      table.string('password', 255).nullable();
      table.string('password_reset_token', 128).unique().nullable();
      table.boolean('password_reset_token_validated').defaultTo(false);
      table.string('status', 16).defaultTo('PENDING');
      table.integer('role_id').nullable().unsigned();
      table.jsonb('permissions').nullable();
      table.integer('company_id').nullable();
      table.integer('office_id').nullable();

      /**
       * Uses timestamp tz for PostgresSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName);
  }
}
