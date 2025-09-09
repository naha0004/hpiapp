import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                By accessing and using ClearRideAI services, you agree to be bound by these Terms and Conditions. 
                If you do not agree with any part of these terms, you must not use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                ClearRideAI provides AI-powered vehicle compliance management, HPI checks, and traffic fine appeal 
                assistance services for UK drivers. Our services include but are not limited to:
              </p>
              <ul className="list-disc pl-6 mt-4">
                <li>Vehicle history and compliance checks</li>
                <li>HPI data reporting and analysis</li>
                <li>Traffic fine appeal assistance and document generation</li>
                <li>Vehicle compliance reminders and notifications</li>
                <li>AI-powered legal guidance and form assistance</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Data Sources and Liability Exclusions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <h4 className="font-semibold text-yellow-800">Important Data Accuracy Notice</h4>
              </div>
              
              <h4 className="font-semibold mt-6 mb-3">3.1 Finance Data</h4>
              <p>
                <strong>Finance data displayed in our HPI reports is supplied by Experian.</strong> Experian is the 
                authoritative source for all finance-related information including outstanding finance, hire purchase 
                agreements, and conditional sale agreements shown in our reports.
              </p>

              <h4 className="font-semibold mt-6 mb-3">3.2 Additional Data Sources</h4>
              <p>
                <strong>Non-Experian Data:</strong> Our reports may include additional data from other sources including 
                but not limited to:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Salvage and write-off data from insurance databases</li>
                <li>DVLA vehicle registration and tax status information</li>
                <li>DVSA MOT and roadworthiness data</li>
                <li>Vehicle specification and market valuation data</li>
                <li>Mileage and service history from various automotive databases</li>
              </ul>
              <p className="mt-4">
                <strong>Experian does not provide, endorse, or take responsibility for any non-finance data</strong> 
                included in our reports. Any references to salvage data, insurance write-offs, or other non-finance 
                information are sourced independently and are not supplied by or affiliated with Experian.
              </p>

              <h4 className="font-semibold mt-6 mb-3">3.3 Data Accuracy Disclaimer</h4>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-800">
                  <strong>WE EXCLUDE ALL LIABILITY FOR DATA INACCURACIES.</strong> While we strive to provide 
                  accurate information, we cannot guarantee the completeness, accuracy, or currency of all data 
                  presented in our reports. Data may be:
                </p>
                <ul className="list-disc pl-6 mt-2 text-red-800">
                  <li>Outdated or superseded by more recent information</li>
                  <li>Incomplete due to reporting delays or omissions</li>
                  <li>Subject to errors in source databases</li>
                  <li>Affected by timing differences between data sources</li>
                </ul>
              </div>

              <h4 className="font-semibold mt-6 mb-3">3.4 User Responsibility</h4>
              <p>
                Users are advised to:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Verify all critical information through official sources</li>
                <li>Conduct independent due diligence before making purchasing decisions</li>
                <li>Obtain professional advice for significant financial transactions</li>
                <li>Report any apparent data inaccuracies to us for investigation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <h4 className="font-semibold text-red-800">Comprehensive Liability Exclusion</h4>
                <p className="text-red-800 mt-2">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE EXCLUDE ALL LIABILITY FOR:
                </p>
                <ul className="list-disc pl-6 mt-2 text-red-800">
                  <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
                  <li>Any loss of profits, revenue, data, or business opportunities</li>
                  <li>Any damages arising from data inaccuracies or omissions</li>
                  <li>Any decisions made based on information provided by our services</li>
                  <li>Any financial losses resulting from vehicle purchases or sales</li>
                  <li>Any legal consequences from traffic fine appeals or legal advice</li>
                </ul>
              </div>
              
              <p className="mt-4">
                Our maximum liability to you for any claim shall not exceed the amount you have paid to us for 
                the specific service giving rise to the claim, limited to the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Legal Advice Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h4 className="font-semibold text-blue-800">Not Legal Advice</h4>
                <p className="text-blue-800 mt-2">
                  Our AI-powered legal guidance, appeal assistance, and document generation services are provided 
                  for informational purposes only and <strong>do not constitute formal legal advice</strong>.
                </p>
              </div>
              
              <p className="mt-4">
                You should always consult with a qualified solicitor or legal professional for specific legal 
                matters. We are not responsible for the outcome of any legal proceedings or appeals submitted 
                using our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. User Obligations</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Provide accurate information when using our services</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not attempt to reverse engineer or misuse our AI systems</li>
                <li>Respect intellectual property rights</li>
                <li>Not share account credentials with unauthorized parties</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We strive to maintain service availability but cannot guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue services with reasonable notice. 
                We are not liable for any downtime or service interruptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                All content, software, and intellectual property rights in our services remain our property 
                or that of our licensors. Users receive a limited, non-exclusive license to use our services 
                for their intended purpose only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Our collection and use of personal data is governed by our Privacy Policy, which forms part of 
                these terms. We are committed to protecting your privacy in accordance with UK GDPR and 
                Data Protection Act 2018.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Either party may terminate the service relationship at any time. We reserve the right to 
                suspend or terminate accounts for violation of these terms. Upon termination, your right 
                to use our services ceases immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                These terms are governed by English law and subject to the exclusive jurisdiction of 
                English courts. Any disputes will be resolved through the English legal system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update these terms periodically. Continued use of our services after changes 
                constitutes acceptance of the updated terms. We will notify users of significant changes 
                through our platform or by email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                For questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p><strong>Email:</strong> support@clearrideai.co.uk</p>
                <p><strong>Phone:</strong> 0800 123 4567</p>
                <p><strong>Address:</strong> ClearRideAI Ltd, United Kingdom</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            By using ClearRideAI services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  )
}
