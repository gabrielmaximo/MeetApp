require('dotenv/config');

module.exports = {
  dialect: 'postgres',
  host: process.env.PG_HOST,
  username: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_NAME,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
