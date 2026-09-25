/**
 * Role-Based Authorization Middleware Factory
 * Composable and reusable across any route:
 *   router.get('/admin-only', auth, roleCheck(['admin']), handler)
 *   router.post('/evaluate', auth, roleCheck(['faculty', 'admin']), handler)
 *   router.get('/student-area', auth, roleCheck('student'), handler)
 *
 * @param {string|string[]} roles - Single role string or array of allowed roles
 * @returns {Function} Express middleware function
 */
const roleCheck = (...roles) => {
  // Normalize roles: supports both roleCheck(['admin', 'faculty']) and roleCheck('admin', 'faculty')
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    // 1. Ensure user has been authenticated by auth middleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.'
      });
    }

    // 2. Validate user's verified role against allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles.`
      });
    }

    next();
  };
};

module.exports = roleCheck;
