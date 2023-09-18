import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'product_pricing_models';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('product_id');
      table.string('guid', 48).nullable();
      table.string('mode', 16).defaultTo('RETAIL').comment('RETAIL, WHOLESALE');
      table.string('model_type', 16).defaultTo('FIXED').comment('FIXED, VOLUME');
      table.float('price', 8, 2).nullable().comment('Price of the product. For scheduled price, this is the default price');
      table.jsonb('volume').nullable().comment('{measurement: string; input: number | dropdown, inputLabel: string, inputOptions: {title: string; value: number}[]}');
      table.jsonb('session').defaultTo({isEnabled: false, duration: null, isMultiplyWithVolume: false, isTimelyVolume: false}).comment('Session based service details');
      table.boolean('is_scheduled').defaultTo(false).comment('Whether the pricing model is scheduled or not');
      table.jsonb('schedule').defaultTo({data: []}).comment('{day: number; timeFrom: string; timeTo: string; price: number;}[]');
      table.string('status', 16).defaultTo('ACTIVE').comment('ACTIVE, ARCHIVED');
      table.boolean('is_editable').defaultTo(true).comment('Whether the pricing model is editable or not');
      table.string('stripe_price_id', 64).nullable().unique().comment('Stripe payment id for the product');
      table.jsonb('meta').defaultTo({});
      table.integer('company_id').nullable();
      table.integer('created_by').nullable();

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
