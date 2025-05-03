import nodemailer from "nodemailer"
import dotenv from "dotenv"
import { createVerificationCode, verifyCode } from "../models/verificationModel.js"

dotenv.config()

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, 
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: process.env.NODE_ENV === "development", 
  })

  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP connection error:", error)
    } else {
      console.log("SMTP server is ready to send messages")
    }
  })

  return transporter
}

export const sendVerificationEmail = async (email) => {
  try {
    const verificationCode = await createVerificationCode(email)

    const mailOptions = {
      from: {
        name: "Your App Name",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
    }

    if (process.env.NODE_ENV === "development" && process.env.SKIP_EMAIL_SENDING === "true") {
      console.log(`[DEV MODE] Email to ${email}: Verification code: ${verificationCode}`)
      return {
        success: true,
        messageId: "DEV_MODE_ID",
        verificationCode,
      }
    }

    const transporter = createTransporter()
    console.log(`Attempting to send email to ${email}...`)
    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent to ${email} with ID: ${info.messageId}`)

    return {
      success: true,
      messageId: info.messageId,
      verificationCode: process.env.NODE_ENV === "development" ? verificationCode : undefined,
    }
  } catch (error) {
    console.error("Error sending verification email:", error)

    if (process.env.NODE_ENV === "development") {
      const verificationCode = await createVerificationCode(email)
      console.log(`[DEV MODE] Error sending email, but generated code for ${email}: ${verificationCode}`)
      return {
        success: true,
        messageId: "DEV_MODE_ID",
        verificationCode,
      }
    }

    throw error
  }
}

export const verifyEmailCode = async (email, code) => {
  try {
    const result = await verifyCode(email, code)

    return {
      isValid: result.valid,
      message: result.message,
      email,
    }
  } catch (error) {
    console.error("Error verifying email code:", error)
    throw error
  }
}

export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}
