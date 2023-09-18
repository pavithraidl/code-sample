import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'product_resource_personnels';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('product_id');
      table.integer('resource_id');
      table.integer('user_id');
      table.string('status', 16).defaultTo('ACTIVE').comment('ACTIVE, INACTIVE');
      table.jsonb('meta').defaultTo({});

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
