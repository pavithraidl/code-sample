import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'user_login_logs';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('user_id').unsigned();
      table.string('ip_address', 48).nullable();
      table.string('city', 32).nullable();
      table.string('region', 32).nullable();
      table.string('country', 32).nullable();
      table.string('user_agent', 64).nullable();
      table.string('user_device', 32).nullable();
      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName);
  }
}
