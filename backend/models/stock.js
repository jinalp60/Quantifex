import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class Stock extends Model {
        static associate(models) {
            // Stock belongsToMany User
            Stock.belongsToMany(models.User, { through: 'UserStocks' });
        }
    }
    Stock.init({
        symbol: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        currentPrice: DataTypes.FLOAT,
        volume: DataTypes.BIGINT,
        open: DataTypes.FLOAT,
        close: DataTypes.FLOAT,
        high: DataTypes.FLOAT,
        low: DataTypes.FLOAT,
        intrinsicValue: DataTypes.FLOAT,
        valuationStatus: DataTypes.STRING,
        sentimentScore: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        convictionScore: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        convictionRating: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sma50: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        sma200: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        newsSummary: {
            type: DataTypes.JSON,
            allowNull: true
        },
        intelligenceUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        analysisSummary: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Stock',
    });
    return Stock;
};
