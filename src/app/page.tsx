import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Clock, CreditCard, Shield, CheckCircle, Phone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">SwissCarMarket</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              So funktioniert&apos;s
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900">
              Über uns
            </Link>
            <Link href="/verkaufen">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Auto verkaufen
              </Button>
            </Link>
          </nav>
          <Link href="/verkaufen" className="md:hidden">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              Verkaufen
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Verkaufen Sie Ihr Auto in{" "}
              <span className="text-orange-500">30 Minuten</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Schnell, einfach und zum besten Preis. Wir kaufen Ihr Auto direkt -
              ohne Stress, ohne Verhandlungen, mit sofortiger Zahlung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verkaufen">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
                  Jetzt Auto bewerten
                </Button>
              </Link>
              <a href="tel:+41445065010">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  +41 44 506 50 10
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Kostenlose Bewertung in wenigen Minuten
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">15+</div>
              <div className="text-blue-100">Jahre Erfahrung</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">4&apos;200+</div>
              <div className="text-blue-100">Autos gekauft</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">8&apos;400+</div>
              <div className="text-blue-100">Zufriedene Kunden</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">30 Min</div>
              <div className="text-blue-100">Zum Angebot</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            So funktioniert&apos;s
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Daten eingeben</h3>
                <p className="text-gray-600 text-sm">
                  Füllen Sie das Formular mit den Fahrzeugdaten aus und laden Sie Fotos hoch.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Sofort-Bewertung</h3>
                <p className="text-gray-600 text-sm">
                  Sie erhalten sofort eine faire Bewertung basierend auf aktuellen Marktpreisen.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Angebot annehmen</h3>
                <p className="text-gray-600 text-sm">
                  Gefällt Ihnen das Angebot? Nehmen Sie es an - keine Verhandlung nötig.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">4</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Sofort bezahlt</h3>
                <p className="text-gray-600 text-sm">
                  Wir holen Ihr Auto ab und Sie erhalten sofort Ihre Zahlung.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Warum SwissCarMarket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Schnell & Einfach</h3>
                <p className="text-gray-600">
                  In nur 30 Minuten erhalten Sie ein verbindliches Angebot für Ihr Auto.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Faire Preise</h3>
                <p className="text-gray-600">
                  Bewertung basierend auf aktuellen Schweizer Marktpreisen.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Sicher & Seriös</h3>
                <p className="text-gray-600">
                  15 Jahre Erfahrung und tausende zufriedene Kunden in der Schweiz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit, Ihr Auto zu verkaufen?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Starten Sie jetzt mit der kostenlosen Bewertung. Keine Verpflichtung,
            keine versteckten Kosten.
          </p>
          <Link href="/verkaufen">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
              Jetzt kostenlos bewerten
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials hint */}
      <section id="about" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Das sagen unsere Kunden
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <CheckCircle key={star} className="h-5 w-5 text-green-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;Super unkompliziert! Innerhalb von einer Stunde hatte ich ein faires
                  Angebot und zwei Tage später wurde das Auto abgeholt.&quot;
                </p>
                <p className="font-semibold">- Thomas M., Zürich</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <CheckCircle key={star} className="h-5 w-5 text-green-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;Professionell, freundlich und der Preis war fair. Kann ich nur
                  weiterempfehlen!&quot;
                </p>
                <p className="font-semibold">- Sandra K., Basel</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <CheckCircle key={star} className="h-5 w-5 text-green-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;Endlich ein Autoankäufer, dem man vertrauen kann. Alles wie
                  versprochen und das Geld kam sofort.&quot;
                </p>
                <p className="font-semibold">- Marco L., Bern</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold">SwissCarMarket</span>
              </div>
              <p className="text-gray-400 text-sm">
                Ihr vertrauenswürdiger Partner für den Autoverkauf in der Schweiz seit 2009.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/verkaufen" className="hover:text-white">Auto verkaufen</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white">So funktioniert&apos;s</Link></li>
                <li><Link href="#about" className="hover:text-white">Über uns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>+41 44 506 50 10</li>
                <li>info@swisscarmarket.ch</li>
                <li>Schweizweit verfügbar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/impressum" className="hover:text-white">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white">AGB</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} SwissCarMarket. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
