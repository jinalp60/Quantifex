'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Stocks', {
            symbol: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING
            },
            currentPrice: {
                type: Sequelize.FLOAT
            },
            volume: {
                type: Sequelize.BIGINT
            },
            open: {
                type: Sequelize.FLOAT
            },
            close: {
                type: Sequelize.FLOAT
            },
            high: {
                type: Sequelize.FLOAT
            },
            low: {
                type: Sequelize.FLOAT
            },
            intrinsicValue: {
                type: Sequelize.FLOAT
            },
            valuationStatus: {
                type: Sequelize.STRING // 'UNDERVALUED', 'FAIR', 'OVERVALUED'
            },
            analysisSummary: {
                type: Sequelize.TEXT
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
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Stocks');
    }
};
