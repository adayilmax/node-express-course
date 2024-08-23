const User = require('../models/User')
const Token = require('../models/Token')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')
const crypto = require('crypto')

const register = async (req, res) => {
  const user = await User.create({ ...req.body })
  const token = crypto.randomBytes(32).toString('hex')
  await new Token({
    userId: user._id,
    token: token,
  }).save()

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}&id=${user._id}`
  await sendEmail({
    to: user.email,
    subject: 'Email Verification',
    text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
  })

  const jwtToken = user.createJWT()
  res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token: jwtToken })
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password')
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials')
  }

  if (!user.verified) {
    throw new UnauthenticatedError('Please verify your email before logging in.')
  }

  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials')
  }

  const token = user.createJWT()
  res.status(StatusCodes.OK).json({ user: { name: user.name }, token })
}

module.exports = {
  register,
  login,
}
