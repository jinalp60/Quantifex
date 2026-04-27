'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SignalAudits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      signalPrice: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      signalScore: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      signalRating: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resultPrice: {
        type: Sequelize.FLOAT,
        allowNull: true // Filled 24h later
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: true // Filled 24h later
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index for symbol and signalRating to speed up accuracy queries
    await queryInterface.addIndex('SignalAudits', ['symbol']);
    await queryInterface.addIndex('SignalAudits', ['signalRating']);
    await queryInterface.addIndex('SignalAudits', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SignalAudits');
  }
};
