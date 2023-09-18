import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'booking_schedules';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('did', 48).nullable();
      table.integer('booking_id');
      table.integer('product_id');
      table.string('guid', 48).nullable();
      table.string('name', 32).nullable().comment('If the booking is a recurring booking, this field will be the name of the recurring booking.');
      table.dateTime('booking_start', { useTz: true }).nullable();
      table.dateTime('booking_end', { useTz: true }).nullable();
      table.float('price').nullable().comment('The price of the booking.');
      table.boolean('is_paid').defaultTo(false).comment('If the booking is paid or not.');
      table.string('payment_method', 16).defaultTo('AT_COUNTER');
      table.jsonb('payment_data').nullable().comment('ex: payment links, payment id, etc.');
      table.integer('booking_payment_id').nullable().comment('The payment ID of the booking.');
      table.string('status', 32).defaultTo('DRAFT').comment('PRE_PAID, PENDING, ACTIVE, CANCELLED, COMPLETED, NO_SHOW').nullable();
      table.string('notes', 255).nullable();
      table.jsonb('metadata').nullable().comment('The metadata of the booking schedule.');
      table.jsonb('calendar_event').nullable().comment('Hold the calendar event object to efficient access.');

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
