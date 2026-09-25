const express = require('express');
const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Mount Authentication routes
app.use('/api/auth', authRoutes);

// Protected routes to demonstrate and test roleCheck composability
app.get('/api/test/protected', auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to authenticated user.',
    user: req.user
  });
});

app.get('/api/test/admin-only', auth, roleCheck(['admin']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin: privileged action permitted.'
  });
});

app.get('/api/test/faculty-admin', auth, roleCheck(['faculty', 'admin']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Faculty/Admin: evaluation permitted.'
  });
});

app.get('/api/test/student-only', auth, roleCheck(['student']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Student: portal access permitted.'
  });
});

module.exports = app;
