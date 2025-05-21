
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageCircle, Phone, HelpCircle } from "lucide-react";

const Support = () => {
  const [activeSection, setActiveSection] = useState<"faq" | "contact" | "guidelines">("faq");

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground text-sm">
          How can we help you today?
        </p>
      </div>

      {/* Simple Navigation Buttons */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <Button 
          variant={activeSection === "faq" ? "default" : "outline"}
          onClick={() => setActiveSection("faq")}
          className="flex-1 min-w-[120px] max-w-[150px]"
          size="sm"
        >
          FAQs
        </Button>
        <Button 
          variant={activeSection === "contact" ? "default" : "outline"}
          onClick={() => setActiveSection("contact")}
          className="flex-1 min-w-[120px] max-w-[150px]"
          size="sm"
        >
          Contact Us
        </Button>
        <Button 
          variant={activeSection === "guidelines" ? "default" : "outline"}
          onClick={() => setActiveSection("guidelines")}
          className="flex-1 min-w-[120px] max-w-[150px]"
          size="sm"
        >
          Guidelines
        </Button>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {/* FAQ Section */}
        {activeSection === "faq" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-base mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === "contact" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContactCard 
                icon={<MessageCircle className="h-5 w-5" />}
                title="Live Chat"
                description="Available 24/7"
                action="Start Chat"
                href="#"
              />
              <ContactCard 
                icon={<Mail className="h-5 w-5" />}
                title="Email Support"
                description="Response within 24 hours"
                action="support@spadesforcash.com"
                href="mailto:support@spadesforcash.com"
                isLink={true}
              />
              <ContactCard 
                icon={<Phone className="h-5 w-5" />}
                title="Phone Support"
                description="Available 9 AM - 5 PM ET"
                action="1-800-SPADES-HELP"
                href="tel:1-800-SPADES-HELP"
                isLink={true}
              />
              <ContactCard 
                icon={<HelpCircle className="h-5 w-5" />}
                title="Support Ticket"
                description="Tracked issue resolution"
                action="Create Ticket"
                href="#"
              />
            </div>
          </div>
        )}

        {/* Guidelines Section */}
        {activeSection === "guidelines" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Support Guidelines</h2>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-base mb-2">Response Times</h3>
                <ul className="list-disc pl-5 mb-4 text-sm">
                  <li>Live Chat: Immediate to 5 minutes</li>
                  <li>Email: Within 24 hours</li>
                  <li>Phone: Immediate during business hours</li>
                  <li>Support Tickets: Initial response within 12 hours</li>
                </ul>

                <h3 className="font-medium text-base mb-2">Information to Include</h3>
                <p className="text-sm mb-2">When contacting support, please include:</p>
                <ul className="list-disc pl-5 mb-4 text-sm">
                  <li>Your username</li>
                  <li>Game ID (if applicable)</li>
                  <li>Date and time of the issue</li>
                  <li>Screenshots of any error messages</li>
                </ul>

                <h3 className="font-medium text-base mb-2">Support Priority</h3>
                <ol className="list-decimal pl-5 text-sm">
                  <li><strong>Critical:</strong> Account access, payment issues</li>
                  <li><strong>High:</strong> Game result disputes, technical glitches</li>
                  <li><strong>Medium:</strong> Feature requests, gameplay questions</li>
                  <li><strong>Low:</strong> General inquiries, feedback</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Additional Help Call-to-Action */}
      <div className="mt-8 text-center p-4 bg-muted rounded-lg">
        <p className="text-sm mb-3">Still need help with something else?</p>
        <Button size="sm" onClick={() => setActiveSection("contact")}>
          Contact Support
        </Button>
      </div>
    </div>
  );
};

// Contact Card Component
const ContactCard = ({ 
  icon, 
  title, 
  description, 
  action, 
  href,
  isLink = false
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  action: string; 
  href: string;
  isLink?: boolean;
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center mb-2 gap-2">
          {icon}
          <div>
            <h3 className="font-medium text-base">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {isLink ? (
          <Button variant="outline" size="sm" className="w-full mt-2" asChild>
            <a href={href}>{action}</a>
          </Button>
        ) : (
          <Button size="sm" className="w-full mt-2" onClick={() => window.location.href = href}>
            {action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// FAQ Data
const faqs = [
  {
    question: "How do I create an account?",
    answer: "To create an account, click on the 'Sign Up' button in the navigation bar. You'll need to provide a valid email address, create a username, and set a secure password."
  },
  {
    question: "How do deposits and withdrawals work?",
    answer: "You can deposit funds using credit/debit cards, bank transfers, and e-wallets. Withdrawals are processed within 1-3 business days, depending on your payment method."
  },
  {
    question: "What should I do if I experience a technical issue?",
    answer: "Take a screenshot of the problem, note the game ID (visible in the URL), and contact our support team through any of our contact channels."
  },
  {
    question: "Are there any fees for playing?",
    answer: "We charge a small platform fee (typically 5-10%) on real-money games. Practice games are completely free. Additional fees may apply for certain payment methods."
  },
  {
    question: "How does the rating system work?",
    answer: "Our rating system is based on an Elo-style algorithm that considers your performance against opponents of varying skill levels."
  }
];

export default Support;
