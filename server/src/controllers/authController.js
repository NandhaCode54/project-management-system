const env = require('../config/env');
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { toPublicUser } = require('../utils/serializers');

function setAuthCookie(res, token) {
  res.cookie(env.jwt.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: env.jwt.cookieMaxAge,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.jwt.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: toPublicUser(user), token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: toPublicUser(user), token },
  });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logout successful', data: {} });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Current user retrieved',
    data: { user: toPublicUser(req.user) },
  });
});

module.exports = { register, login, logout, me, setAuthCookie, clearAuthCookie };