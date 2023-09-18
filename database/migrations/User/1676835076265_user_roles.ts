import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'user_roles';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('name', 16);
      table.string('description', 128).nullable();
      table.jsonb('permissions').nullable();
      table.boolean('is_locked').defaultTo(false);
      table.boolean('is_manual_enabled').defaultTo(true);
      table.string('role_image', 128).nullable();
      table.string('slug', 24).unique();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
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
