import { Link } from 'react-router-dom'
import { Camera, Zap, Layers, ArrowRight, Guitar, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Guitar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">PedalPath</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/signin"
              className="hidden sm:flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-primary-600/20"
            >
              Get Started
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="pt-32 pb-28 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #1a4eaa 0%, #2E86DE 55%, #3498DB 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-24 w-[500px] h-[500px] rounded-full bg-black/10" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-10">
            <Zap className="w-3 h-3" />
            Powered by Claude AI Vision
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Build guitar pedals<br />
            <span className="text-yellow-300">like LEGO</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed mb-10">
            Upload any schematic. Get an instant bill of materials and
            step-by-step build guide — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-400/30"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white/90 hover:text-white font-semibold px-8 py-4 rounded-full border border-white/25 hover:border-white/50 hover:bg-white/10 transition-all text-base"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-white/40 text-sm">Free to try · No credit card required</p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
              From schematic to build list
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              AI does the hard part. You get straight to building.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                accent: 'text-blue-600',
                bg: 'bg-blue-50',
                title: 'Upload any schematic',
                body: 'Photo, scan, or file. Hand-drawn, PDF, or image — any format works.',
              },
              {
                icon: Zap,
                accent: 'text-yellow-600',
                bg: 'bg-yellow-50',
                title: 'Instant AI analysis',
                body: 'Every component identified, valued, and grouped. Confidence scores included.',
              },
              {
                icon: Layers,
                accent: 'text-green-600',
                bg: 'bg-green-50',
                title: 'Step-by-step guides',
                body: 'Breadboard, stripboard, and enclosure instructions. Built for beginners.',
              },
            ].map(({ icon: Icon, accent, bg, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${bg} ${accent} mb-5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-16">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { n: '1', title: 'Upload', sub: 'Drop in your schematic image or file' },
              { n: '2', title: 'Analyze', sub: 'AI extracts every component in seconds' },
              { n: '3', title: 'Build', sub: 'Follow the visual guide to completion' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-primary-600/25">
                  {n}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-24 px-4"
        style={{ background: 'linear-gradient(150deg, #1a4eaa 0%, #2E86DE 100%)' }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Ready to build?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Create your free account and upload your first schematic today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-400/30"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white/90 hover:text-white font-semibold px-8 py-4 rounded-full border border-white/25 hover:border-white/50 hover:bg-white/10 transition-all text-base"
            >
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
              <Guitar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">PedalPath</span>
          </div>
          <p className="text-xs text-gray-500">© 2026 PedalPath. AI-powered pedal building.</p>
          <div className="flex items-center gap-5">
            <Link to="/signin" className="text-xs text-gray-500 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="text-xs text-gray-500 hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
