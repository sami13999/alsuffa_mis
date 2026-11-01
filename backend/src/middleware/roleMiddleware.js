const { errorResponse } = require('../utils/responseFormatter');

/**
 * Role-Based Access Control Guard
 * @param  {...string} allowedRoles Allowed user roles ('admin', 'accountant', 'teacher', 'student')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 'User session not found or unauthorized.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden. Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};

