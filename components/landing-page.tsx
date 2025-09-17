"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Shield, Bell, FileText, Check, Star, Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const features = [
  {
    icon: Car,
    title: "Vehicle Management",
    description: "Track MOT, tax, and insurance for all your vehicles in one place",
  },
  {
    icon: FileText,
    title: "Fine Appeals",
    description: "Get AI-powered assistance to appeal parking and driving fines",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss important deadlines with intelligent notifications",
  },
  {
    icon: Shield,
    title: "Compliance Checks",
    description: "Instant DVLA checks for vehicle status and history",
  },
]

const pricingPlans = [
  {
    name: "Free Trial",
    price: "Free",
    period: "",
    description: "Try our service risk-free",
    features: ["1 ticket appeal per registration plate", "Basic MOT checks", "Email notifications", "Community support"],
    popular: false,
    buttonText: "Start Free Trial",
  },
  {
    name: "Single Appeal",
    price: "£2",
    period: "",
    description: "Perfect for one-off appeals",
    features: [
      "1 ticket appeal",
      "Professional appeal letter",
      "Legal guidance",
      "Email support",
      "Success tracking",
    ],
    popular: false,
    buttonText: "Buy Single Appeal",
  },
  {
    name: "Annual Plan",
    price: "£25",
    period: "/year",
    originalPrice: "48",
    description: "Best value for regular drivers",
    features: [
      "2 ticket appeals per month",
      "24 appeals per year total",
      "Priority processing",
      "Advanced legal templates",
    ],
    popular: true,
    buttonText: "Get Annual Plan",
  },
]

const additionalServices = [
  {
    name: "HPI Check",
    price: "£5",
    period: "/check",
    description: "Comprehensive vehicle history report",
    features: [
      "Stolen vehicle check",
      "Outstanding finance check",
      "Write-off category check",
      "Mileage verification",
      "Previous keeper history",
      "Instant digital report",
    ],
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Fleet Manager",
    company: "London Logistics Ltd",
    content: "This platform has saved us thousands in fines and compliance issues. The reminder system is fantastic!",
    rating: 5,
  },
  {
    name: "Mike Thompson",
    role: "Private Driver",
    company: "Birmingham",
    content: "Finally, a simple way to track all my vehicle requirements. The MOT reminders alone are worth it.",
    rating: 5,
  },
  {
    name: "Emma Davis",
    role: "Family Car Owner",
    company: "Manchester",
    content: "The fine appeal feature helped me successfully challenge an unfair parking ticket. Highly recommended!",
    rating: 5,
  },
]

interface LandingPageProps {
  onLogin: () => void
  onSignUp: () => void
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/clearrideai-logo.svg" 
              alt="ClearRideAI Logo" 
              width={80} 
              height={80} 
              className="w-20 h-20"
            />
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-red-500 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm hover:text-red-500 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm hover:text-red-500 transition-colors">
              Reviews
            </a>
            <a href="#contact" className="text-sm hover:text-red-500 transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onLogin}>
              Login
            </Button>
            <Button onClick={onSignUp}>Sign Up</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            🚗 Trusted by 10,000+ UK drivers
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            ClearRideAI
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The complete platform for UK drivers to manage vehicle compliance, appeal fines, and stay on top of
            important deadlines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={onSignUp} className="text-lg px-8">
              Start Free Trial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-red-500">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">£2M+</div>
              <div className="text-sm text-muted-foreground">Fines Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to keep your vehicles compliant and your wallet protected
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start with our free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative hover:shadow-lg transition-shadow ${
                  plan.popular ? "border-red-500 shadow-lg scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600">Most Popular</Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                    {plan.originalPrice && (
                      <div className="text-lg line-through text-muted-foreground mt-1">
                        £{plan.originalPrice}
                      </div>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPlan(plan.name)
                      onSignUp()
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Services */}
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Additional Services</h3>
            <p className="text-lg text-muted-foreground">
              Get comprehensive vehicle history reports on demand
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {additionalServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {service.price}
                    <span className="text-base font-normal text-muted-foreground">{service.period}</span>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(service.name)
                      onSignUp()
                    }}
                  >
                    Order HPI Check
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-muted-foreground">Join thousands of satisfied UK drivers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>

                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-red-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take Control of Your Vehicle Compliance?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of UK drivers who trust us to keep them compliant and save money on fines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={onSignUp} className="text-lg px-8">
              Start Your Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="text-lg px-8 border-white text-white hover:bg-white hover:text-red-500 bg-transparent"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/clearrideai-logo.svg" 
                  alt="ClearRideAI Logo" 
                  width={64} 
                  height={64} 
                  className="w-16 h-16"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered platform for UK vehicle compliance and fine management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-red-500">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-red-500">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-red-500">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-red-500">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-red-500">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@clearrideai.co.uk
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  0800 123 4567
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  London, UK
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ClearRideAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
