require('dotenv').config({path: '../'});

exports.up = function(knex, Promise) {
  knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto').then(function() {
    return knex.schema.createTable(process.env.DB_TABLE, function(table) {
      table.string('id', 6).primary();
      table.string('destination_url').unique();
      table.json('meta_json');
      table.integer('view_count').unique();
      table.timestamp('created_at', true).defaultTo(knex.raw('now()'));
      table.timestamp('updated_at', true).defaultTo(knex.raw('now()'));
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(process.env.DB_TABLE);
};
