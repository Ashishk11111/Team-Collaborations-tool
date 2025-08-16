const router = require('express').Router();
const passport = require('passport');

// Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['openid', 'profile', 'email']  }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: 'https://team-collaborations-tool-frontend2-0.onrender.com/dashboard', // frontend dashboard
  }));

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.clearCookie('connect.sid'); // if using express-session
    res.status(200).json({ message: 'Logged out successfully' });
  });
});



// Get current user
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;
