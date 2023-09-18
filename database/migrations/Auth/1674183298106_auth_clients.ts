import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'auth_clients';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('uid', 16).unique();
      table.string('name', 32);
      table.string('description', 256).nullable();
      table.string('auth_secret', 64);
      table.json('allowed_origins').nullable();
      table.json('allowed_ips').nullable();
      table.json('allowed_methods').nullable();
      table.json('meta_data').nullable();
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName);
  }
}
