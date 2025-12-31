
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'worklens_secret_key_123';

/**
 * @desc Register new user & send OTP
 * @route POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 2. Check Duplicates
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Email already exists.' });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Create User
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
    });

    await newUser.save();

    // 6. Send Email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Signup successful. Verification code sent.', email });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Verify OTP & Login
 * @route POST /api/auth/verify
 */
exports.verify = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found.' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark verified and clear code
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Generate Token
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Account verified.', token, username: user.username });

  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ error: 'Verification failed.' });
  }
};

/**
 * @desc Login User
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check User
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

    // 2. Check Verification
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account not verified. Please check your email.' });
    }

    // 3. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

    // 4. Return Token
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login successful.', token, username: user.username });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
};
