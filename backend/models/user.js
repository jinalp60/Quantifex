'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // User belongsToMany Stock
            User.belongsToMany(models.Stock, { through: 'UserStocks' });
            // Alias for easy access: user.getStocks(), user.addStock()
        }
    }
    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: DataTypes.STRING,
        name: DataTypes.STRING,
        image: DataTypes.STRING,
        passwordHash: DataTypes.STRING,
        lastActive: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'User',
    });
    return User;
};
