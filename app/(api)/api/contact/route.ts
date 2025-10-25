import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/components/utils/send_email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, subject, category, message } = body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create HTML email content
        const emailContent = `
            <html>
            <head>
            <style>
            body {
                background-color: #f3f4f6;
                margin: 0;
                font-family: Arial, sans-serif;
            }
            main {
                max-width: 768px;
                width: 100%;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 1.5rem;
                font-weight: bold;
                color: #000000;
                margin-bottom: 16px;
                text-align: center;
            }
            h2 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #374151;
                margin-top: 16px;
            }
            .info-box {
                background-color: #f3f4f6;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            .info-box p {
                margin: 8px 0;
                color: #1f2937;
            }
            .message-content {
                background-color: #ffffff;
                border-left: 4px solid #3b82f6;
                padding: 16px;
                margin: 16px 0;
                white-space: pre-wrap;
            }
            @media (max-width: 600px) {
                main {
                    padding: 10px;
                }
                h1 {
                    font-size: 1.25rem;
                }
                h2 {
                    font-size: 1rem;
                }
            }
            </style>
            </head>
            <body>
            <main>
            <h1>New Contact Form Submission</h1>
            <h2>Contact Information</h2>
            <div class="info-box">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Subject:</strong> ${subject}</p>
                ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
            </div>
            <h2>Message</h2>
            <div class="message-content">
                ${message}
            </div>
            </main>
            </body>
            </html>
        `;

        // Send email to max@maximeduhamel.com
        const emailSubject = `Contact Form: ${subject}`;
        await sendEmail("max@maximeduhamel.com", emailSubject, emailContent);

        return NextResponse.json(
            { message: "Email sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending contact email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
