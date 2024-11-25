import type { APIRoute } from 'astro'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
export const prerender = false;

dotenv.config();
const transport = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: parseInt(process.env.MAILTRAP_PORT || '587'),
  auth: {
    user: process.env.MAILTRAP_API_USER,
    pass: process.env.MAILTRAP_API_KEY
  }
})

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()
    const { email, message } = data

    const mainMailOptions = {
      from: process.env.MAILTRAP_FROM_EMAIL,
      to: process.env.MAILTRAP_TO_EMAIL,
      subject: `website form submission from ${email}`,
      text: message,
      replyTo: email
    }

    const acknowledgmentMailOptions = {
      from: process.env.MAILTRAP_FROM_EMAIL,
      to: email,
      subject: 'Thank you for your message',
      text: `Thank you for reaching out! This email confirms that I've received your message and will get back to you soon.

Your message:
${message}

Best regards,
[Your Name]`
    }

    await Promise.all([
      transport.sendMail(mainMailOptions),
      transport.sendMail(acknowledgmentMailOptions)
    ])

    return new Response(JSON.stringify({
      message: 'Email sent successfully'
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({
      message: 'Failed to send email'
    }), {
      status: 500
    })
  }
} 