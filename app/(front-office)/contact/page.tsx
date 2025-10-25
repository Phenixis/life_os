'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, MapPin, Send, MessageCircle, Bug, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            setSubmitted(true)
            setFormData({
                name: '',
                email: '',
                subject: '',
                category: '',
                message: ''
            })
        } catch (error) {
            console.error('Error submitting form:', error)
            toast.error('Failed to send message. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
                <div className="max-w-md mx-auto px-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Message Sent!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">
                        Send Another Message
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-heading mb-4">Get in Touch</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Have questions, feedback, or need support? We&apos;re here to help you make the most of Life OS.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Contact Information */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Contact Information
                                </CardTitle>
                                <CardDescription>
                                    Multiple ways to reach our team
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-blue-500 mt-1" />
                                    <div>
                                        <p className="font-medium">Email Support</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            max@maximeduhamel.com
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-red-500 mt-1" />
                                    <div>
                                        <p className="font-medium">Address</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            7 kernault, Le Vieux-Bourg<br />
                                            22800, France
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Help</CardTitle>
                                <CardDescription>
                                    Common topics and resources
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <Bug className="h-4 w-4 text-red-500" />
                                    <span className="text-sm">Bug Reports</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm">Feature Requests</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm">General Support</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="Your full name"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="support">General Support</SelectItem>
                                                <SelectItem value="bug">Bug Report</SelectItem>
                                                <SelectItem value="feature">Feature Request</SelectItem>
                                                <SelectItem value="billing">Billing Question</SelectItem>
                                                <SelectItem value="account">Account Issues</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            placeholder="Brief description of your inquiry"
                                            value={formData.subject}
                                            onChange={(e) => handleChange('subject', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Please provide as much detail as possible..."
                                            className="min-h-[120px]"
                                            value={formData.message}
                                            onChange={(e) => handleChange('message', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="sm:w-auto w-full"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 self-center">
                                            We typically respond within 24-48 hours
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16">
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">How do I upgrade my plan?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">
                                    You can upgrade your plan anytime from your account settings. Changes take effect immediately and you&apos;ll only pay the prorated difference.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Is my data secure?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Yes! We use end-to-end encryption and follow enterprise-grade security practices. Your data is protected with bank-level security.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Absolutely! You can cancel your subscription at any time from your account settings. You&apos;ll retain access until the end of your billing period.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Do you offer student discounts?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Yes! We offer special pricing for students. Contact us with your .edu email address for more information about our student program.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
