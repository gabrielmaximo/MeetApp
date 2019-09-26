import { Sequelize } from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';
import Meetup from '../app/models/Meetup';

import postgresConfig from '../config/postgres';
import Subscription from '../app/models/Subscription';

const models = [User, File, Meetup, Subscription];

class Database {
  constructor() {
    this.postgres();
    this.relationships();
  }

  postgres() {
    this.connection = new Sequelize(postgresConfig);

    models.forEach(model => model.init(this.connection));
  }

  relationships() {
    models.forEach(model => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }
}

export default new Database();
