import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-b from-foreground to-foreground/90 text-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Intimate
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              AI-powered personalized recommendations to enhance your relationship
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-background text-foreground py-3 px-6 rounded-lg font-medium hover:bg-background/90 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="bg-transparent border border-background py-3 px-6 rounded-lg font-medium hover:bg-background/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-foreground/10 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Connect with your partner</h3>
              <p className="text-foreground/70">
                Create your accounts and link with your partner to start your
                intimate journey together.
              </p>
            </div>
            <div className="p-6 border border-foreground/10 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Share your preferences</h3>
              <p className="text-foreground/70">
                Complete questionnaires about your desires, preferences, and
                boundaries in a private, secure environment.
              </p>
            </div>
            <div className="p-6 border border-foreground/10 rounded-lg">
              <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Get personalized recommendations</h3>
              <p className="text-foreground/70">
                Receive AI-generated suggestions tailored to your relationship's
                unique dynamic and preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-foreground/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Intimate</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="text-foreground/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Total Privacy</h3>
                <p className="text-foreground/70">
                  Your data is encrypted and protected. We prioritize your
                  privacy and security above all else.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-foreground/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 16.7a7 7 0 1 1-14 0v-2.7h14v2.7z" />
                  <rect x="4" y="3" width="16" height="11" rx="2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">AI-Powered</h3>
                <p className="text-foreground/70">
                  Our advanced AI understands your unique dynamics and provides
                  tailored recommendations just for you.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-foreground/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16h.01" />
                  <path d="M8 16h.01" />
                  <path d="M12 20c5.5 0 8-2.5 8-8H4c0 5.5 2.5 8 8 8z" />
                  <path d="M12 8v4" />
                  <path d="M8.5 2C10 3 12 3 13.5 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Positive Focus</h3>
                <p className="text-foreground/70">
                  We focus on enhancing connection and intimacy in a positive,
                  consent-driven approach.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-foreground/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Non-Judgmental</h3>
                <p className="text-foreground/70">
                  Explore your desires in a safe, non-judgmental space designed
                  to foster communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to enhance your relationship?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of couples who have discovered new dimensions in their
            relationships with Intimate.
          </p>
          <Link
            href="/auth/signup"
            className="bg-foreground text-background py-3 px-8 rounded-lg font-medium hover:bg-foreground/90 transition-colors inline-block"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="font-bold text-xl">Intimate</p>
              <p className="text-background/70">© 2025 Intimate App. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}