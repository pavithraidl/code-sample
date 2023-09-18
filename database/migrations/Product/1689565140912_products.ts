import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.string('name', 128);
      table.string('did', 32).unique().nullable();
      table.string('slug').unique();
      table.text('description').nullable();
      table.string('hero_image_url', 255).nullable();
      table.jsonb('gallery').defaultTo({ data: [] });
      table.string('type', 16).defaultTo('PRODUCT').comment('PRODUCT | SERVICE | CONSUMABLE | TOOL');
      table.float('quantity', 8, 2).defaultTo(1).comment('Quantity of the product');
      table.integer('company_id').nullable();
      table.jsonb('meta').defaultTo({});
      table.string('guid', 48).unique().nullable();
      table.string('stripe_product_id', 64).nullable().unique();
      table.string('status', 16).defaultTo('DRAFT');
      table.integer('seo_id').nullable();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('indexed_at', {useTz: true}).nullable();
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName);
  }
}
