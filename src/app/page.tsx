import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const services = [
  {
    title: 'Personal Training',
    description: 'One-on-one sessions tailored to your fitness goals',
    icon: '💪',
  },
  {
    title: 'Golf Fitness',
    description: 'Sport-specific conditioning to improve your game',
    icon: '⛳',
  },
  {
    title: 'Dry Needling',
    description: 'Targeted therapy for muscle pain and tension relief',
    icon: '🎯',
  },
  {
    title: 'IASTM',
    description: 'Instrument-assisted soft tissue mobilization',
    icon: '🔧',
  },
  {
    title: 'Cupping Therapy',
    description: 'Ancient technique for improved circulation and healing',
    icon: '⭕',
  },
  {
    title: 'Assisted Stretching',
    description: 'Improve flexibility and reduce muscle tension',
    icon: '🧘',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground hidden sm:inline-block">
              Peak Performance Lab
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90">Book a Session</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6">
          Mobile Fitness & Wellness
          <br />
          <span className="text-primary">Delivered to You</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience personalized training and therapeutic services in the comfort of your home,
          office, or preferred location throughout Chicagoland.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 bg-primary hover:bg-primary/90">
              Book Your Session
            </Button>
          </Link>
          <Link href="#services">
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary text-primary hover:bg-primary/5">
              View Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold mb-2">We Come to You</h3>
              <p className="text-primary-foreground/80">Mobile service throughout Chicagoland area</p>
            </div>
            <div>
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">60-Minute Sessions</h3>
              <p className="text-primary-foreground/80">Focused, effective training every time</p>
            </div>
            <div>
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Flexible Payment</h3>
              <p className="text-primary-foreground/80">Cash, cards, Venmo, Zelle accepted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Our Services</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          From personal training to therapeutic treatments, we offer a comprehensive
          range of services to help you achieve peak performance.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="hover:shadow-lg transition-shadow border-border">
              <CardHeader>
                <div className="text-4xl mb-2">{service.icon}</div>
                <CardTitle className="text-foreground">{service.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Virtual Option */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Virtual Training Available</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Can&apos;t meet in person? Join us virtually for personalized training
            sessions from anywhere.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90">Schedule Virtual Session</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8">
          Book your first session today and take the first step towards peak performance.
        </p>
        <Link href="/login">
          <Button size="lg" className="text-lg px-8 bg-primary hover:bg-primary/90">
            Book Your Session
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Peak Performance Lab</h3>
              </div>
              <p className="text-primary-foreground/70">
                Mobile fitness and wellness services throughout Chicagoland.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-primary-foreground/70">
                <li>Personal Training</li>
                <li>Golf Fitness</li>
                <li>Dry Needling</li>
                <li>Therapeutic Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-primary-foreground/70">
                <li>Chicagoland Area</li>
                <li>By Appointment Only</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/70">
            <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Peak Performance Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
