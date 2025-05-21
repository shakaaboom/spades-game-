
import { Layout } from "@/components/layout/Layout";

const Privacy = () => {
  return (
    <Layout>
      <div className="container max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <section>
            <p>
              This Privacy Policy describes how Spades for Cash, a subsidiary of New Folder Corporation ("we," "us," or "our"), collects, uses, and discloses information about you when you access or use our website, mobile application, and services (collectively, the "Service").
            </p>
            <p className="mt-2">
              By accessing or using the Service, you agree to this Privacy Policy. If you do not agree with our policies and practices, do not use the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, information that we collect automatically when you use the Service, and information from third-party sources.
            </p>
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Information You Provide</h3>
            <p>
              We collect information that you provide when you register for an account, participate in games, make deposits or withdrawals, communicate with us, or otherwise use the Service. This information may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Contact information, such as your name, email address, and phone number</li>
              <li>Account information, such as your username and password</li>
              <li>Financial information, such as payment method details</li>
              <li>Identity verification information, such as your date of birth and government-issued ID</li>
              <li>Any other information you choose to provide</li>
            </ul>
            
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Information We Collect Automatically</h3>
            <p>
              When you use the Service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Log information, such as your IP address, browser type, operating system, and pages visited</li>
              <li>Device information, such as your device type, model, and unique identifiers</li>
              <li>Location information, such as your approximate location based on your IP address</li>
              <li>Usage information, such as the games you play, the bets you place, and your interactions with the Service</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve the Service. Specifically, we use your information to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Create and maintain your account</li>
              <li>Process transactions and manage your funds</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Personalize your experience and provide tailored content</li>
              <li>Analyze usage patterns and improve the Service</li>
              <li>Communicate with you about the Service, promotions, and other news</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. How We Share Your Information</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With service providers that perform services on our behalf</li>
              <li>With financial institutions to process payments and withdrawals</li>
              <li>With legal and regulatory authorities as required by law</li>
              <li>With other users as necessary to facilitate gameplay</li>
              <li>In connection with a business transaction, such as a merger or acquisition</li>
              <li>With your consent or at your direction</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Security</h2>
            <p>
              We take reasonable measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Your Choices</h2>
            <p>
              You have several choices regarding your information:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account Information: You can update or correct your account information by accessing your account settings</li>
              <li>Communications: You can opt out of marketing communications by following the unsubscribe instructions in our emails</li>
              <li>Cookies: You can manage your cookie preferences through your browser settings</li>
              <li>Do Not Track: We do not currently respond to Do Not Track signals</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, we will delete or anonymize it.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 18, and we do not knowingly collect information from children under 18. If we learn that we have collected information from a child under 18, we will delete that information.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than the country in which you reside. These countries may have different data protection laws than your country.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Your continued use of the Service after the posting of changes constitutes your acceptance of such changes.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@spadesforcash.com.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">11. Last Updated</h2>
            <p>
              This Privacy Policy was last updated on {new Date().toLocaleDateString()}.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
