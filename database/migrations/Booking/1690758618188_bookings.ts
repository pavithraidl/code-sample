import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bookings';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('did', 48).nullable();
      table.string('name', 32).nullable();
      table.string('description', 255).nullable();
      table.string('guid', 48).nullable();
      table.integer('customer_id').nullable();
      table.integer('product_id').nullable();
      table.jsonb('recurrence').nullable().comment('Hold the recurrence information for recurring bookings.');
      table.float('booking_duration').nullable().comment('The duration of the booking in minutes.');
      table.float('booking_volume').nullable().comment('The volume of the booking. This is the volume setup in the pricing model');
      table.float('schedule_price').nullable().comment('The price of a single schedule');
      table.integer('created_by_id').nullable().comment('The user who created the booking.');
      table.jsonb('metadata').nullable().comment('The metadata of the booking.');
      table.integer('company_id');

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
