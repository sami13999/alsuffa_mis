const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      return successResponse(res, user, 'User profile retrieved');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AuthController();

