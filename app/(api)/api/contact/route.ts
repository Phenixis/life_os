import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/components/utils/send_email";

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, subject, category, message } = body;

        // Validate required fields and trim whitespace
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate email format using a more comprehensive regex following RFC standards
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Escape user input to prevent XSS (trim before escaping)
        const safeName = escapeHtml(name.trim());
        const safeEmail = escapeHtml(email.trim());
        const safeSubject = escapeHtml(subject.trim());
        const safeCategory = category?.trim() ? escapeHtml(category.trim()) : '';
        const safeMessage = escapeHtml(message.trim());

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
                <p><strong>Name:</strong> ${safeName}</p>
                <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                <p><strong>Subject:</strong> ${safeSubject}</p>
                ${safeCategory ? `<p><strong>Category:</strong> ${safeCategory}</p>` : ''}
            </div>
            <h2>Message</h2>
            <div class="message-content">
                ${safeMessage}
            </div>
            </main>
            </body>
            </html>
        `;

        // Send email to max@maximeduhamel.com
        const emailSubject = `Contact Form: ${safeSubject}`;
        await sendEmail("max@maximeduhamel.com", emailSubject, emailContent);

        return NextResponse.json(
            { message: "Email sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending contact email:", error);
        // Log the detailed error for debugging while keeping user message generic
        if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
        }
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
