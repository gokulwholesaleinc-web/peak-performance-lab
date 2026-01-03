import Link from 'next/link';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Peak Performance Lab</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/login">
              <Button>Book a Session</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Mobile Fitness & Wellness
          <br />
          <span className="text-primary">Delivered to You</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Experience personalized training and therapeutic services in the comfort of your home,
          office, or preferred location throughout Chicagoland.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Book Your Session
            </Button>
          </Link>
          <Link href="#services">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold mb-2">We Come to You</h3>
              <p className="text-slate-300">Mobile service throughout Chicagoland area</p>
            </div>
            <div>
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">60-Minute Sessions</h3>
              <p className="text-slate-300">Focused, effective training every time</p>
            </div>
            <div>
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Flexible Payment</h3>
              <p className="text-slate-300">Cash, cards, Venmo, Zelle accepted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          From personal training to therapeutic treatments, we offer a comprehensive
          range of services to help you achieve peak performance.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-2">{service.icon}</div>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Virtual Option */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Virtual Training Available</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            Can&apos;t meet in person? Join us virtually for personalized training
            sessions from anywhere.
          </p>
          <Link href="/login">
            <Button size="lg">Schedule Virtual Session</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-slate-600 mb-8">
          Book your first session today and take the first step towards peak performance.
        </p>
        <Link href="/login">
          <Button size="lg" className="text-lg px-8">
            Book Your Session
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Peak Performance Lab</h3>
              <p className="text-slate-400">
                Mobile fitness and wellness services throughout Chicagoland.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Personal Training</li>
                <li>Golf Fitness</li>
                <li>Dry Needling</li>
                <li>Therapeutic Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Chicagoland Area</li>
                <li>By Appointment Only</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Peak Performance Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
