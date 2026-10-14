const attempts = new Map();

export function rateLimitAuth(windowMs = 15 * 60 * 1000, maxAttempts = 10) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!attempts.has(ip)) {
      attempts.set(ip, []);
    }

    const timestamps = attempts.get(ip).filter(t => now - t < windowMs);
    if (timestamps.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many login/registration attempts. Please wait 15 minutes before trying again.'
      });
    }

    timestamps.push(now);
    attempts.set(ip, timestamps);
    next();
  };
}
