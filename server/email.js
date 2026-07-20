import process from 'node:process'
import nodemailer from 'nodemailer'

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const sendWelcomeEmail = async (user) => {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replaceAll(' ', '')

  if (!gmailUser || !gmailAppPassword) {
    console.log(`Welcome email skipped for ${user.email}: email service is not configured.`)
    return
  }

  const firstName = user.name.split(' ')[0]
  const safeName = escapeHtml(firstName)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  })

  const info = await transporter.sendMail({
      from: `Noted <${gmailUser}>`,
      to: user.email,
      subject: 'Welcome to Noted!',
      text: `Hi ${firstName},\n\nWelcome to Noted! We are happy to have you here. Your personal workspace is ready, so feel free to explore the app and capture your ideas whenever inspiration finds you.\n\nStart with one thought and let your collection grow from there.\n\nWarmly,\nThe Noted team`,
      html: `
        <!doctype html>
        <html lang="en">
          <body style="margin:0;padding:0;background:#f4f5f1;font-family:Arial,sans-serif;color:#202722">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f1;padding:32px 16px">
              <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe2da;border-radius:8px;overflow:hidden">
                  <tr><td style="background:#246b49;padding:24px 32px;color:#ffffff;font-size:22px;font-weight:bold">Noted</td></tr>
                  <tr><td style="padding:38px 32px">
                    <p style="margin:0 0 12px;color:#9a5a32;font-size:12px;font-weight:bold;text-transform:uppercase">Welcome to your workspace</p>
                    <h1 style="margin:0 0 20px;font-size:28px;line-height:1.25;color:#202722">Hi ${safeName}, we are so glad you are here.</h1>
                    <p style="margin:0 0 16px;color:#626a64;font-size:16px;line-height:1.65">Welcome to Noted! We are happy to have you with us. Your personal workspace is ready, so feel free to explore the app and capture your ideas whenever inspiration finds you.</p>
                    <p style="margin:0;color:#626a64;font-size:16px;line-height:1.65">Start with one thought, and let your collection grow from there.</p>
                  </td></tr>
                  <tr><td style="padding:22px 32px;background:#f8f9f6;color:#858c86;font-size:13px">Warmly,<br><strong style="color:#4a534c">The Noted team</strong></td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>`,
      headers: { 'X-Noted-User-ID': user.id },
  })
  console.log(`Welcome email sent to ${user.email} (${info.messageId})`)
}
