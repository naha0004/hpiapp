import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                ClearRideAI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our services.
              </p>
              <p>
                We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4 className="font-semibold mt-4 mb-2">2.1 Information You Provide</h4>
              <ul className="list-disc pl-6">
                <li>Account registration details (name, email address, contact information)</li>
                <li>Vehicle registration numbers and related vehicle data</li>
                <li>Payment information and billing addresses</li>
                <li>Appeal documentation and case details</li>
                <li>Communications with our support team</li>
              </ul>

              <h4 className="font-semibold mt-6 mb-2">2.2 Information We Collect Automatically</h4>
              <ul className="list-disc pl-6">
                <li>Usage data and service interactions</li>
                <li>Device information and browser type</li>
                <li>IP addresses and location data</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Performance and analytics data</li>
              </ul>

              <h4 className="font-semibold mt-6 mb-2">2.3 Information From Third Parties</h4>
              <ul className="list-disc pl-6">
                <li>Vehicle data from DVLA databases</li>
                <li>Finance information from Experian</li>
                <li>MOT and roadworthiness data from DVSA</li>
                <li>Insurance and salvage data from automotive databases</li>
                <li>Authentication data from social login providers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Provide and improve our services</li>
                <li>Generate vehicle history and HPI reports</li>
                <li>Assist with traffic fine appeals and legal documentation</li>
                <li>Send compliance reminders and notifications</li>
                <li>Process payments and manage your account</li>
                <li>Provide customer support</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
                <li>Conduct analytics and improve our AI systems</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Legal Basis for Processing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We process your personal data based on:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Contract:</strong> To provide services you've requested</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential features</li>
                <li><strong>Legitimate Interest:</strong> For service improvement, analytics, and fraud prevention</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <h4 className="font-semibold text-blue-800">Data Provider Acknowledgment</h4>
                <p className="text-blue-800 mt-2">
                  <strong>Finance data in our reports is supplied by Experian.</strong> When you request an HPI check, 
                  we may share your vehicle registration number with Experian to retrieve finance information. 
                  Experian's privacy policy applies to their processing of this data.
                </p>
              </div>

              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Data Providers:</strong> DVLA, DVSA, Experian, and other automotive databases</li>
                <li><strong>Service Providers:</strong> Payment processors, hosting providers, and technical partners</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Partners:</strong> With your consent for specific services</li>
              </ul>

              <p className="mt-4">
                <strong>We do not sell your personal data</strong> to third parties for marketing purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We implement appropriate technical and organizational measures to protect your data, including:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication systems</li>
                <li>Regular security audits and updates</li>
                <li>Staff training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your data</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at support@clearrideai.co.uk. We will respond within one month.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We retain your data only as long as necessary for:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Providing our services</li>
                <li>Complying with legal obligations</li>
                <li>Resolving disputes and enforcing agreements</li>
                <li>Legitimate business purposes</li>
              </ul>
              <p className="mt-4">
                Account data is typically retained for 7 years after account closure. 
                HPI report data is retained for 2 years for audit purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Your data may be transferred to and processed in countries outside the UK. We ensure adequate 
                protection through:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Adequacy decisions by the UK government</li>
                <li>Standard contractual clauses</li>
                <li>Binding corporate rules</li>
                <li>Other approved safeguards</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Essential website functionality</li>
                <li>Performance and analytics</li>
                <li>Personalization and preferences</li>
                <li>Marketing and advertising (with consent)</li>
              </ul>
              <p className="mt-4">
                You can manage cookie preferences through your browser settings or our cookie consent tool.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Our services are not intended for children under 16. We do not knowingly collect personal 
                information from children. If you believe we have collected data from a child, please contact us 
                immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                through our platform or by email. Continued use after changes constitutes acceptance of the 
                updated policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>For privacy-related questions or to exercise your rights, contact us at:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p><strong>Data Protection Officer:</strong> dpo@clearrideai.co.uk</p>
                <p><strong>General Enquiries:</strong> support@clearrideai.co.uk</p>
                <p><strong>Phone:</strong> 0800 123 4567</p>
                <p><strong>Address:</strong> ClearRideAI Ltd, United Kingdom</p>
              </div>
              <p className="mt-4">
                You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) 
                if you believe your data protection rights have been breached.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            This Privacy Policy forms part of our Terms and Conditions and should be read in conjunction with them.
          </p>
        </div>
      </div>
    </div>
  )
}
