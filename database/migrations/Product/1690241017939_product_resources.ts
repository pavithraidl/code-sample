import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'product_resources';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('product_id');
      table.string('name', 64).nullable();
      table.string('guid', 48).nullable();
      table.string('type', 16).comment('PERSONNEL | TOOL | CONSUMABLE');
      table.integer('preparation_time').defaultTo(0).comment('Preparation time in minutes');
      table.integer('finalizing_time').defaultTo(0).comment('Finalizing time in minutes');
      table.float('required_quantity', 8, 2).defaultTo(1).comment('required quantity of the resource');
      table.string('tool_did', 32).nullable();
      table.string('consumable_did', 32).nullable();
      table.integer('company_id').nullable();
      table.string('status', 16).defaultTo('ACTIVE').comment('ACTIVE | INACTIVE');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName);
  }
}
