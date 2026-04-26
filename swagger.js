const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hotel Booking API',
            version: '1.0.0',
            description: 'API documentation for Hotel Booking System'
        },
        servers: [
            {
                url: 'https://se-be-9w6y.onrender.com',
                description: 'Production'
            },
            {
                url: 'http://localhost:5000',
                description: 'Development'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    // บอกให้ swagger-jsdoc ไปอ่าน @swagger comment จากไฟล์ไหนบ้าง
    apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };