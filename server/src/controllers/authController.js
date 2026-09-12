const env = require('../config/env');
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
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
  let user;
  try {
    const result = await authService.register(req.body);
    user = result.user;
    setAuthCookie(res, result.token);

    await recordAudit({
      userId: user.id,
      action: 'AUTH_REGISTER',
      resource: 'USER',
      resourceId: user.id,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: toPublicUser(user), token: result.token },
    });
  } catch (err) {
    await recordAudit({
      userId: null,
      action: 'AUTH_REGISTER_FAILED',
      resource: 'USER',
      meta: { email: req.body?.email },
      req,
    });
    throw err;
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);

    await recordAudit({
      userId: user.id,
      action: 'AUTH_LOGIN',
      resource: 'USER',
      resourceId: user.id,
      req,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: toPublicUser(user), token },
    });
  } catch (err) {
    await recordAudit({
      userId: null,
      action: 'AUTH_LOGIN_FAILED',
      resource: 'USER',
      meta: { email: req.body?.email },
      req,
    });
    throw err;
  }
});

const logout = asyncHandler(async (req, res) => {
  await recordAudit({
    userId: req.user.id,
    action: 'AUTH_LOGOUT',
    resource: 'USER',
    resourceId: req.user.id,
    req,
  });
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