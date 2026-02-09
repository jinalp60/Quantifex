import Sequelize from 'sequelize';
import process from 'process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import userModel from './user.js';
import stockModel from './stock.js';

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  if (!dbUrl) {
    throw new Error(
      `Database connection error: Environment variable "${config.use_env_variable}" is not set. ` +
      `Current NODE_ENV: ${env}. ` +
      `Available env vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'}`
    );
  }
  sequelize = new Sequelize(dbUrl, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Explicitly register models
const User = userModel(sequelize, Sequelize.DataTypes);
const Stock = stockModel(sequelize, Sequelize.DataTypes);

db[User.name] = User;
db[Stock.name] = Stock;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export { User, Stock, sequelize, Sequelize };
export default db;
