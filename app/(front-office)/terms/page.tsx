import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | Life OS',
    description: 'Read the terms and conditions for using Life OS services and understand your rights and responsibilities.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold font-heading mb-8">Terms of Service</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Last updated: June 4, 2025
                </p>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            By accessing and using Life OS (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Life OS is a comprehensive productivity and life management platform designed to help students and professionals organize their tasks, notes, projects, and personal goals. Our service includes:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Task and project management tools</li>
                            <li>Note-taking and idea capture features</li>
                            <li>Media tracking and personal goal management</li>
                            <li>Mood and habit tracking capabilities</li>
                            <li>Cross-device synchronization</li>
                            <li>Community features (Pro plan only)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            To access certain features of Life OS, you must create an account. You are responsible for:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Providing accurate and up-to-date information</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Subscription Plans and Billing</h2>
                        <h3 className="text-xl font-medium mb-3">Free Plan</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Our Free plan provides unlimited access to core features including tasks, notes, and basic productivity tools. No credit card required.
                        </p>
                        
                        <h3 className="text-xl font-medium mb-3">Paid Plans</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Basic Plan: €20/month with premium features</li>
                            <li>Pro Plan: €100/month with community access (limited to 10 members)</li>
                        </ul>
                        
                        <h3 className="text-xl font-medium mb-3">Billing Terms</h3>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Subscriptions are billed monthly in advance</li>
                            <li>All fees are non-refundable except as required by law</li>
                            <li>You may cancel your subscription at any time</li>
                            <li>Price changes will be communicated 30 days in advance</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You agree not to use Life OS for:
                        </p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
                            <li>Illegal activities or violating any laws</li>
                            <li>Harassing, threatening, or defaming others</li>
                            <li>Distributing spam, malware, or harmful content</li>
                            <li>Attempting to gain unauthorized access to our systems</li>
                            <li>Interfering with other users&apos; enjoyment of the service</li>
                            <li>Commercial use without explicit permission</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Life OS and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You retain ownership of all content you create using our service. By using Life OS, you grant us a limited license to store, process, and display your content solely for the purpose of providing our services.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Privacy and Data Protection</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We implement end-to-end encryption and follow GDPR compliance standards to protect your personal data.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We strive to maintain high service availability but cannot guarantee uninterrupted access. We may temporarily suspend the service for maintenance, updates, or other operational reasons.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            To the maximum extent permitted by law, Life OS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Termination</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            You may terminate your account at any time by contacting us or using the account deletion feature in your settings.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Your continued use after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Email:</strong> max@maximeduhamel.com<br />
                                <strong>Address:</strong> Life OS Legal Team<br />
                                7 kernault, Le Vieux-Bourg<br />
                                22800, France
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
