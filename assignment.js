const express = require('express');
const router = express.Router();
const User = require('../models/user');
const WalletTransaction = require('../models/wallet-transaction');
const GoldTransaction = require('../models/gold-transaction');

router.get('/growth/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const walletTransactions = await WalletTransaction.find({ userId });
    const goldTransactions = await GoldTransaction.find({ userId });

    // Calculate net funds added
    const netFundAdded = walletTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((total, t) => total + t.amount, 0);

    // Calculate current fund
    const currentFund = user.runningBalance.wallet;

    // Calculate net growth or loss
    const netGold = goldTransactions.reduce((total, t) => {
      if (t.type === 'CREDIT') {
        return total + t.quantity;
      } else {
        return total - t.quantity;
      }
    }, 0);
    const netGrowthOrLoss = netGold * user.runningBalance.goldPrice - currentFund - netFundAdded;

    // Calculate gain or loss percentage
    const gainOrLossPercentage = (netGrowthOrLoss / currentFund) * 100;

    res.json({
      netFundAdded,
      currentFund,
      netGrowthOrLoss,
      gainOrLossPercentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
