import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';

export const App = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', interest: 'residential' });
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const interests = [
    { id: 'residential', en: 'Residential', jp: '住宅' },
    { id: 'commercial', en: 'Commercial', jp: '商業' },
    { id: 'cultural', en: 'Cultural', jp: '文化' },
    { id: 'urban', en: 'Urban Planning', jp: '都市' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.email && form.password) {
      setSubmitted(true);
    }
  };

  const inputClass = (field) =>
    `w-full bg-transparent border-b pb-3 pt-2 text-[15px] tracking-wide outline-none transition-colors duration-300 placeholder:text-[#9b958c] ${
      focused === field ? 'border-[#1a1a1a]' : 'border-[#d6d0c6]'
    }`;

  return (
    <div className="min-h-screen bg-[#f2efe9] text-[#1a1a1a] font-['Inter'] antialiased overflow-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+JP:wght@300;400&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            ::selection { background: #c84b31; color: #f2efe9; }
            .vertical-text {
              writing-mode: vertical-rl;
              text-orientation: mixed;
            }
            .grain::after {
              content: '';
              position: absolute;
              inset: 0;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
              pointer-events: none;
              mix-blend-mode: multiply;
            }
            input:-webkit-autofill {
              -webkit-box-shadow: 0 0 0 1000px #f2efe9 inset;
              -webkit-text-fill-color: #1a1a1a;
            }
            @keyframes lineGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            .line-grow { animation: lineGrow 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards; transform-origin: left; }
          `,
        }}
      />

      <div className="grid lg:grid-cols-[1fr_minmax(480px,42%)] min-h-screen">
        {/* ——— LEFT: Imagery ——— */}
        <div className="relative hidden lg:block grain overflow-hidden">
          <motion.img
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            src="https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1400&h=1800&fit=crop"
            alt="Concrete architecture detail"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/70 via-transparent to-[#1a1a1a]/20" />

          {/* Vertical brand mark */}
          <div className="absolute top-12 left-12 flex items-start gap-6">
            <span className="vertical-text text-[#f2efe9] text-sm tracking-[0.5em] font-light font-['Noto_Serif_JP']">
              間と光の建築
            </span>
            <div className="w-px h-32 bg-[#f2efe9]/40" />
          </div>

          {/* Bottom statement */}
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-end justify-between gap-12">
                <h2 className="font-['Cormorant_Garamond'] text-[clamp(2.5rem,4vw,4rem)] leading-[1.05] text-[#f2efe9] font-400 max-w-xl">
                  Architecture of
                  <br />
                  <em className="text-[#e0d9cb]">silence &amp; light.</em>
                </h2>
                <div className="text-right shrink-0 pb-2">
                  <p className="text-[#f2efe9]/60 text-[11px] tracking-[0.25em] uppercase mb-1">Studio</p>
                  <p className="text-[#f2efe9] text-sm tracking-[0.15em]">Minato-ku, Tokyo</p>
                </div>
              </div>
              <div className="mt-8 h-px bg-[#f2efe9]/30 line-grow" />
              <div className="mt-5 flex items-center gap-10 text-[#f2efe9]/70 text-[11px] tracking-[0.2em] uppercase">
                <span>Est. 1998</span>
                <span>112 Built Works</span>
                <span>JIA Grand Prize ’22</span>
              </div>
            </motion.div>
          </div>

          {/* Coordinates */}
          <div className="absolute top-12 right-12 text-right text-[#f2efe9]/60 text-[11px] tracking-[0.2em] leading-relaxed">
            35.6586° N<br />139.7454° E
          </div>
        </div>

        {/* ——— RIGHT: Form ——— */}
        <div className="relative flex flex-col justify-between px-8 sm:px-16 lg:px-20 py-10 grain">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-medium tracking-[0.05em]">AOI<span className="text-[#c84b31]">.</span></span>
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#9b958c]">Atelier Aoi Ishikawa</span>
            </div>
            <a href="#" className="text-[12px] tracking-[0.15em] uppercase text-[#6b665e] hover:text-[#1a1a1a] transition-colors border-b border-transparent hover:border-[#1a1a1a] pb-0.5">
              Sign in
            </a>
          </header>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.main
                key="form"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md w-full mx-auto py-12"
              >
                <p className="text-[11px] tracking-[0.35em] uppercase text-[#c84b31] mb-5">Client Portal — 登録</p>
                <h1 className="font-['Cormorant_Garamond'] text-[2.75rem] leading-[1.1] mb-3">
                  Begin your project<br />with us.
                </h1>
                <p className="text-[14px] text-[#6b665e] leading-relaxed mb-12 max-w-sm">
                  Create an account to access project briefs, site documentation, and direct correspondence with our design team.
                </p>

                <form onSubmit={handleSubmit} className="space-y-9">
                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[#9b958c] mb-1">
                      Full name <span className="font-['Noto_Serif_JP'] normal-case tracking-normal ml-2">氏名</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Kenji Watanabe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      className={inputClass('name')}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[#9b958c] mb-1">
                      Email <span className="font-['Noto_Serif_JP'] normal-case tracking-normal ml-2">メール</span>
                    </label>
                    <input
                      type="email"
                      placeholder="k.watanabe@example.jp"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      className={inputClass('email')}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[#9b958c] mb-1">
                      Password <span className="font-['Noto_Serif_JP'] normal-case tracking-normal ml-2">パスワード</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className={inputClass('password') + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-3 text-[#9b958c] hover:text-[#1a1a1a] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[#9b958c] mb-4">
                      Area of interest <span className="font-['Noto_Serif_JP'] normal-case tracking-normal ml-2">分野</span>
                    </label>
                    <div className="grid grid-cols-2 gap-px bg-[#d6d0c6] border border-[#d6d0c6]">
                      {interests.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setForm({ ...form, interest: item.id })}
                          className={`relative px-4 py-3.5 text-left transition-colors duration-300 ${
                            form.interest === item.id
                              ? 'bg-[#1a1a1a] text-[#f2efe9]'
                              : 'bg-[#f2efe9] text-[#6b665e] hover:bg-[#eae6dd]'
                          }`}
                        >
                          <span className="block text-[13px] tracking-wide">{item.en}</span>
                          <span className={`block text-[11px] mt-0.5 font-['Noto_Serif_JP'] ${form.interest === item.id ? 'text-[#c84b31]' : 'text-[#b3ada2]'}`}>
                            {item.jp}
                          </span>
                          {form.interest === item.id && (
                            <Check size={13} strokeWidth={2} className="absolute top-3 right-3 text-[#c84b31]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="group w-full flex items-center justify-between bg-[#1a1a1a] text-[#f2efe9] px-6 py-4 hover:bg-[#c84b31] transition-colors duration-400"
                    >
                      <span className="text-[13px] tracking-[0.25em] uppercase">Create account</span>
                      <ArrowRight size={18} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                    </button>
                    <p className="mt-5 text-[12px] text-[#9b958c] leading-relaxed">
                      By registering you accept our{' '}
                      <a href="#" className="text-[#1a1a1a] border-b border-[#1a1a1a]/30 hover:border-[#c84b31] hover:text-[#c84b31] transition-colors">terms of engagement</a>{' '}
                      and privacy policy.
                    </p>
                  </div>
                </form>
              </motion.main>
            ) : (
              <motion.main
                key="done"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md w-full mx-auto py-12"
              >
                <div className="w-14 h-14 border border-[#1a1a1a] flex items-center justify-center mb-10">
                  <Check size={22} strokeWidth={1.5} className="text-[#c84b31]" />
                </div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-[#c84b31] mb-5">登録完了</p>
                <h1 className="font-['Cormorant_Garamond'] text-[2.75rem] leading-[1.1] mb-4">
                  Welcome,<br />{form.name.split(' ')[0] || 'friend'}.
                </h1>
                <p className="text-[14px] text-[#6b665e] leading-relaxed max-w-sm mb-10">
                  A confirmation has been sent to <span className="text-[#1a1a1a]">{form.email}</span>. Our studio coordinator will reach out within two business days to schedule your first consultation.
                </p>
                <div className="h-px bg-[#d6d0c6] mb-6" />
                <div className="flex items-center gap-8 text-[12px] text-[#9b958c] tracking-[0.1em]">
                  <span>Tue – Sat, 10:00–18:00 JST</span>
                  <span>+81 3-6804-2210</span>
                </div>
              </motion.main>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-[#9b958c]">
            <span>© 2025 Atelier Aoi Ishikawa</span>
            <span className="font-['Noto_Serif_JP'] tracking-[0.3em]">東京都港区</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

