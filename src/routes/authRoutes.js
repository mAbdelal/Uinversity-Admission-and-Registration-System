const authController=require("../controllers/authController")
const express=require("express");
const router=express.Router();
const { authenticate }=require("../middlewares/authMiddleware")


router.post('/students/login',authController.login("S"))
router.post('/employees/login', authController.login("E"))
router.post('/refresh-token', authController.refreshToken)
router.post('/students/forget-password', authController.forgotPassword("S"))
router.post('/employees/forget-password', authController.forgotPassword("E"))
router.post('/students/reset-password/:resetToken', authController.resetPassword("S"))
router.post('/employees/reset-password/:resetToken', authController.resetPassword("E"))
router.post('/change-password', authenticate, authController.changePassword)

module.exports = router;