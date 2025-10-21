import { User } from '@/lib/db/schema';
import axios from 'axios';

export async function sendEmail(to: string, subject: string, htmlContent: string) {
    const apiUrl = process.env.RESEND_API_ENDPOINT;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiUrl) {
        throw new Error('API endpoint is missing');
    }
    if (!apiKey) {
        throw new Error('API key is missing');
    }

    const html = htmlContent.includes("<html>") ? htmlContent : `<html><body>${htmlContent}</body></html>`;

    try {
        const response = await axios.post(apiUrl, {
            to,
            subject,
            html
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 200) {
            throw new Error(`Failed to send email: ${response.statusText}`);
        }

        return response.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export async function sendWelcomeEmail(user: User.User.Select, password: string) {
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
            h3 {
                font-size: 1.125rem;
                font-weight: 500;
                color: #4b5563;
                margin-top: 8px;
            }
            ul {
                list-style-type: disc;
                padding-left: 20px;
                margin: 0;
            }
            li {
                color: #1f2937;
                margin-bottom: 8px;
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
                h3 {
                    font-size: 0.875rem;
                }
                ul {
                    padding-left: 15px;
                }
                li {
                    font-size: 0.875rem;
                }
            }
            </style>
            </head>
            <body>
            <main>
            <h1>Welcome</h1>
            <h2>Your account has been created, here are your credentials</h2>
            <p>These credentials are unique and this is the only time you will see them, please save them in a secure location.</p>
            <p>Identifier: ${user.id}</p>
            <p>Password: ${password}</p>
            <p>You can now login to the app <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">here</a></p>
            <p>If you have any questions, please contact us at <a href="mailto:max@maximeduhamel.com">max@maximeduhamel.com</a></p>
            <p>Thank you again for your trust.</p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    await sendEmail(user.email, "Welcome to the app", emailContent);

    const emailContent2 = `
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
            h3 {
                font-size: 1.125rem;
                font-weight: 500;
                color: #4b5563;
                margin-top: 8px;
            }
            ul {
                list-style-type: disc;
                padding-left: 20px;
                margin: 0;
            }
            li {
                color: #1f2937;
                margin-bottom: 8px;
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
                h3 {
                    font-size: 0.875rem;
                }
                ul {
                    padding-left: 15px;
                }
                li {
                    font-size: 0.875rem;
                }
            }
            </style>
            </head>
            <body>
            <main>
            <h1>Hey !</h1>
            <h2>${user.first_name} ${user.last_name} just created an account on your application</h2>
            <p>You can send them an email at this address: <a href="mailto:${user.email}">${user.email}</a></p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    sendEmail("max@maximeduhamel.com", "Someone created an account on your portfolio !", emailContent2);
}

export async function sendPasswordSetupEmail(user: User.User.Select, resetRequestId: string) {
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${resetRequestId}`

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
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #3b82f6;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
            }
            .info-box {
                background-color: #dbeafe;
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
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
            <h1>Welcome to Life OS!</h1>
            <h2>Hi ${user.first_name},</h2>
            <p>Your account has been created successfully. To get started, you need to set up your password.</p>
            
            <div class="info-box">
                <p><strong>Your Identifier:</strong> ${user.id}</p>
                <p style="margin-top: 8px;">You'll need this identifier along with your password to log in.</p>
            </div>
            
            <p>Click the button below to set up your password. This link will expire in 24 hours.</p>
            
            <div style="text-align: center;">
                <a href="${setupUrl}" class="button">Set Up My Password</a>
            </div>
            
            <p style="font-size: 0.875rem; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 0.875rem; color: #6b7280; word-break: break-all;">${setupUrl}</p>
            
            <p>Your password must meet these requirements:</p>
            <ul>
                <li>Between 8 and 25 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one digit</li>
                <li>At least one special character</li>
            </ul>
            
            <p>If you have any questions, please contact us at <a href="mailto:max@maximeduhamel.com">max@maximeduhamel.com</a></p>
            <p>Thank you for joining us!</p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    await sendEmail(user.email, "Welcome to Life OS - Set Up Your Password", emailContent);

    const emailContent2 = `
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
            </style>
            </head>
            <body>
            <main>
            <h1>Hey !</h1>
            <h2>${user.first_name} ${user.last_name} just created an account on your application</h2>
            <p>You can send them an email at this address: <a href="mailto:${user.email}">${user.email}</a></p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    sendEmail("max@maximeduhamel.com", "Someone created an account on your portfolio !", emailContent2);
}

export async function sendPasswordResetEmail(user: User.User.Select, resetRequestId: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${resetRequestId}`

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
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #3b82f6;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
            }
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            ul {
                list-style-type: disc;
                padding-left: 20px;
                margin: 0;
            }
            li {
                color: #1f2937;
                margin-bottom: 8px;
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
            <h1>Password Reset Request</h1>
            <h2>Hi ${user.first_name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't request this password reset, please ignore this email and contact us immediately at <a href="mailto:max@maximeduhamel.com">max@maximeduhamel.com</a></p>
            </div>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p style="font-size: 0.875rem; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 0.875rem; color: #6b7280; word-break: break-all;">${resetUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>Your new password must meet these requirements:</p>
            <ul>
                <li>Between 8 and 25 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one digit</li>
                <li>At least one special character</li>
            </ul>
            
            <p>If you have any questions or concerns, please contact us at <a href="mailto:max@maximeduhamel.com">max@maximeduhamel.com</a></p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    await sendEmail(user.email, "Password Reset Request", emailContent);
}
export async function sendIdentifierEmail(user: User.User.Select) {
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
                background-color: #dbeafe;
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            .info-box h3 {
                color: #1e40af;
                margin-top: 0;
                font-size: 1.125rem;
            }
            .info-box p {
                color: #1e40af;
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
            <h1>Your Identifier</h1>
            <h2>Identifier Recovery Request</h2>
            <p>Hi ${user.first_name},</p>
            <p>You recently requested your identifier. Here it is:</p>
            
            <div class="info-box">
                <h3>🔑 Your Identifier</h3>
                <p><strong>Identifier:</strong> ${user.id}</p>
                <p>Use this identifier to log in to your account.</p>
            </div>
            
            <p>You can log in to your account <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">here</a></p>
            <p>If you forgot your password, you can reset it from the login page.</p>
            <p>If you did not request this information, please contact us immediately at <a href="mailto:max@maximeduhamel.com">max@maximeduhamel.com</a></p>
            <p>Best regards,</p>
            <p>Maxime Duhamel</p>
            </main>
            </body>
            </html>
        `;

    await sendEmail(user.email, "Your Account Identifier", emailContent);
}