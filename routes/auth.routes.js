const express = require("express")
const { loginController, registerController,getAccessTokenController, forgetPasswordController, resetPasswordController, setPasswordController } = require("../controllers/auth.controller")

const router = express.Router()

router.post("/login", loginController)
router.post("/register", registerController)
router.post("/get-accesstoken", getAccessTokenController)
// router.post("/forget-password", forgetPasswordController)
// router.get("/reset-password/:token", resetPasswordController)
// router.post("/setPassword", setPasswordController )


module.exports = router