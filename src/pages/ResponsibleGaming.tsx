
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Shield, Ban, Lock } from "lucide-react";

const ResponsibleGaming = () => {
  return (
    <Layout>
      <div className="container max-w-4xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Responsible Gaming</h1>
        
        <div className="bg-card p-6 rounded-lg mb-8 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold">Play Responsibly</h2>
              <p className="text-muted-foreground">Spades for Cash is committed to promoting responsible gaming practices.</p>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-muted-foreground mb-4">
            At Spades for Cash, we believe that gaming should be an enjoyable form of entertainment, not a way to make money or escape from problems. We are committed to helping our players maintain healthy gaming habits.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2">
              <Lock className="h-4 w-4" />
              Set Limits
            </Button>
            <Button variant="outline" className="gap-2">
              <Ban className="h-4 w-4" />
              Self-Exclude
            </Button>
            <Button variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
        
        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Our Commitment</h2>
            <p>
              At Spades for Cash, a subsidiary of New Folder Corporation, we are committed to promoting responsible gaming. We believe that gaming should be an entertaining and social activity, not a source of financial or personal problems.
            </p>
            <p className="mt-2">
              We provide tools and resources to help you maintain control over your gaming activities and make informed decisions about your gaming habits.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Signs of Problem Gaming</h2>
            <p>
              It's important to recognize the signs of problem gaming. These may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Spending more time or money on gaming than you intended</li>
              <li>Neglecting work, school, or family responsibilities due to gaming</li>
              <li>Feeling irritable or restless when not gaming</li>
              <li>Using gaming to escape from problems or negative feelings</li>
              <li>Lying about how much time or money you spend on gaming</li>
              <li>Continuing to game despite negative consequences</li>
              <li>Needing to spend more money to get the same excitement from gaming</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Self-Assessment</h2>
            <p>
              Take a moment to assess your gaming habits by asking yourself these questions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Do I spend more time or money on gaming than I can afford?</li>
              <li>Has gaming affected my relationships, work, or studies?</li>
              <li>Do I game to escape problems or negative feelings?</li>
              <li>Do I feel anxious or irritable when I can't game?</li>
              <li>Have I lied about my gaming habits?</li>
              <li>Have I tried to cut back or stop gaming but couldn't?</li>
            </ul>
            <p className="mt-2">
              If you answered "yes" to any of these questions, you may want to consider taking steps to address your gaming habits.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Responsible Gaming Tools</h2>
            <div className="grid gap-6 mt-4 md:grid-cols-2">
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Time Limits</h3>
                </div>
                <p className="text-sm">Set daily, weekly, or monthly time limits for your gaming sessions.</p>
              </div>
              
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Deposit Limits</h3>
                </div>
                <p className="text-sm">Control how much money you can deposit into your account in a given period.</p>
              </div>
              
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Self-Exclusion</h3>
                </div>
                <p className="text-sm">Temporarily or permanently exclude yourself from the platform.</p>
              </div>
              
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Reality Checks</h3>
                </div>
                <p className="text-sm">Receive periodic notifications about the time and money you've spent.</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Tips for Responsible Gaming</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Set time and money limits before you start playing</li>
              <li>Don't chase losses; accept them as part of the cost of entertainment</li>
              <li>Don't game when you're upset, stressed, or depressed</li>
              <li>Balance gaming with other activities</li>
              <li>Don't use gaming as a source of income or a way to recoup debts</li>
              <li>Take regular breaks during gaming sessions</li>
              <li>Avoid mixing gaming with alcohol or drugs</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Resources for Help</h2>
            <p>
              If you or someone you know is struggling with problem gaming, the following resources can provide help:
            </p>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="font-medium mb-1">National Problem Gambling Helpline</h3>
                <p className="text-sm">1-800-522-4700 (Call or Text)</p>
                <p className="text-sm">Available 24/7, confidential, and toll-free</p>
              </div>
              
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="font-medium mb-1">Gamblers Anonymous</h3>
                <p className="text-sm">www.gamblersanonymous.org</p>
                <p className="text-sm">Support groups for people who want to stop gambling</p>
              </div>
              
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="font-medium mb-1">National Council on Problem Gambling</h3>
                <p className="text-sm">www.ncpgambling.org</p>
                <p className="text-sm">Information, resources, and treatment options</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Parental Controls</h2>
            <p>
              Spades for Cash is intended for adults 18 years and older. We encourage parents to use parental control tools to prevent minors from accessing our platform.
            </p>
            <p className="mt-2">
              There are several third-party software options that can help parents monitor and control their children's internet access:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Net Nanny</li>
              <li>Qustodio</li>
              <li>Norton Family</li>
              <li>Apple Screen Time</li>
              <li>Google Family Link</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Contact Us</h2>
            <p>
              If you have any questions or concerns about responsible gaming, please contact our support team at support@spadesforcash.com or through our customer support channels.
            </p>
          </section>
          
          <section className="mt-8 pt-6 border-t border-border">
            <p className="italic">
              Remember: Gaming should be fun, not a problem. If it stops being fun, stop playing.
            </p>
            <p className="mt-2 italic">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ResponsibleGaming;
