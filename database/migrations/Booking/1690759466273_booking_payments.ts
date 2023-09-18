import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'booking_payments';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('booking_id');
      table.string('payment_method').comment('AT_COUNTER, SEND_INVOICE, ONLINE, BANK_TRANSFER');
      table.string('stripe_customer_id', 255).nullable().comment('The Stripe customer ID.');
      table.integer('session_count').comment('Number of sessions paying.');
      table.integer('quantity_per_session').comment('Quantity per each session.');
      table.float('session_price').comment('The price of a single session.');
      table.float('total_price').nullable().comment('The amount of the payment.');
      table.string('currency', 3).defaultTo('nzd').comment('The currency of the payment.');
      table.string('stripe_invoice_id', 255).nullable().comment('The Stripe invoice ID.');
      table.string('payment_link', 255).nullable().comment('The payment link of the payment.');
      table.string('invoice_pdf_url', 255).nullable();
      table.boolean('paid').defaultTo(false).comment('If the payment is paid or not.');
      table.string('receipt_url', 255).nullable().comment('The URL to the receipt of the payment.');
      table.string('status', 32).defaultTo('PENDING').comment('PENDING, COMPLETED, FAILED').nullable();
      table.dateTime('paid_at', { useTz: true }).nullable().comment('The date and time the payment was paid.');
      table.string('payment_notes', 255).nullable().comment('The notes of the payment.');
      table.integer('company_id').nullable().comment('The company ID of the payment.');
      table.integer('created_by_id').nullable().comment('The user who created the payment.');

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
