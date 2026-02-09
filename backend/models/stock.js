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
        analysisSummary: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Stock',
    });
    return Stock;
};
