const express = require('express');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
// Import all models to establish relationships
require('./models/index');
require('dotenv').config();
//if u need add admin const seedAdmin = require('./scripts/seedAdmin');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve frontend static files
app.use('/frontend', express.static('frontend'));

// Test database connection
testConnection().then(() => {
  // Sync database models only if connection is successful
  return sequelize.sync({ alter: true });
}).then(() => {
  console.log('Database synced');
}).catch(err => {
  console.warn('Database connection warning: You may need to set up MySQL with correct credentials in .env file');
  console.warn('Skipping database sync due to connection issues');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Authentication API is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});