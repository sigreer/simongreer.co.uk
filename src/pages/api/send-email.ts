export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    // @ts-ignore
    const runtime = locals.runtime;
    
    const formData = await request.json();
    const { name, email, message } = formData as { name: string; email: string; message: string };
  
    const emailData = {
      from: {
        email: runtime.env.MAILTRAP_FROM_EMAIL,
        name: "SimonGreer.co.uk MailBot",
      },
      to: [
        {
          email: runtime.env.MAILTRAP_TO_EMAIL,
          name: "Simon Greer",
        },
      ],
      subject: "New Contact Form Submission",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };
  
    try {
      const response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await runtime.env.MAILTRAP_API_KEY}`,
        },
        body: JSON.stringify(emailData),
      });
  
      if (!response.ok) {
        const error = await response.json();
        return new Response(JSON.stringify({ error }), { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ message: "Email sent successfully" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(JSON.stringify({ error: "Server error" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
}