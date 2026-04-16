'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Stocks', 'sentimentScore', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'convictionScore', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'convictionRating', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'sma50', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'sma200', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'newsSummary', {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.addColumn('Stocks', 'intelligenceUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Stocks', 'sentimentScore');
    await queryInterface.removeColumn('Stocks', 'convictionScore');
    await queryInterface.removeColumn('Stocks', 'convictionRating');
    await queryInterface.removeColumn('Stocks', 'sma50');
    await queryInterface.removeColumn('Stocks', 'sma200');
    await queryInterface.removeColumn('Stocks', 'newsSummary');
    await queryInterface.removeColumn('Stocks', 'intelligenceUpdatedAt');
  }
};
