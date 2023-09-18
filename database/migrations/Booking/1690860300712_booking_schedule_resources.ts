import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'booking_schedule_resources';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('booking_schedule_id');
      table.string('type', 16);
      table.float('required_quantity', 8, 2).defaultTo(1).comment('required quantity of the resource');
      table.string('resource_did', 64).nullable();
      table.integer('preparation_time').defaultTo(0).comment('Preparation time in minutes');
      table.integer('finalizing_time').defaultTo(0).comment('Finalizing time in minutes');
      table.integer('company_id').nullable();

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
