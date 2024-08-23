const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Token = require('../models/Token')

router.get('/verify-email', async (req, res) => {
  const { token, id } = req.query

  const tokenRecord = await Token.findOne({ token, userId: id })
  if (!tokenRecord) {
    return res.status(400).send('Invalid token or token has expired')
  }

  const user = await User.findById(id)
  if (!user) {
    return res.status(400).send('User not found')
  }

  user.verified = true
  await user.save()

  await Token.findByIdAndRemove(tokenRecord._id)

  res.send('Email verified successfully. You can now log in.')
})

module.exports = router
