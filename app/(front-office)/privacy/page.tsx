import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | Life OS',
    description: 'Learn how Life OS protects and handles your personal data with our comprehensive privacy policy.',
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold font-heading mb-8">Privacy Policy</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Last updated: June 4, 2025
                </p>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            At Life OS, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and services.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We are committed to protecting your personal data with enterprise-grade security and transparent practices.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                        <h3 className="text-xl font-medium mb-3">Personal Information</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Email address and account credentials</li>
                            <li>Profile information (name, preferences)</li>
                            <li>Tasks, notes, and project data you create</li>
                            <li>Media tracking data (movies, books, experiences)</li>
                            <li>Mood and habit tracking information</li>
                        </ul>

                        <h3 className="text-xl font-medium mb-3">Technical Information</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Device information and browser type</li>
                            <li>IP address and location data (for sync purposes)</li>
                            <li>Usage analytics and performance metrics</li>
                            <li>Error logs and diagnostic data</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Provide and maintain our services</li>
                            <li>Sync your data across devices</li>
                            <li>Improve our application and user experience</li>
                            <li>Send important service notifications</li>
                            <li>Provide customer support</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We implement industry-standard security measures to protect your information:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>End-to-end encryption for sensitive data</li>
                            <li>Regular security audits and penetration testing</li>
                            <li>Secure data centers with 24/7 monitoring</li>
                            <li>Access controls and employee training</li>
                            <li>Automatic security updates and patches</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and safety</li>
                            <li>With trusted service providers (under strict agreements)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Under GDPR and other privacy laws, you have the right to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate information</li>
                            <li>Delete your account and data</li>
                            <li>Export your data in a portable format</li>
                            <li>Restrict or object to processing</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We retain your personal information only as long as necessary to provide our services and comply with legal obligations. You can delete your account and data at any time through your account settings.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If you have any questions about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Email:</strong> max@maximeduhamel.com<br />
                                <strong>Address:</strong> Life OS Privacy Team<br />
                                7 kernault, Le Vieux-Bourg<br />
                                22800, France
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued use of our services after any changes constitutes acceptance of the new Privacy Policy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
