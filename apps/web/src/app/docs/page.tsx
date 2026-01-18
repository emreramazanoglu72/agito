import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';

const highlights = [
  { label: "Role", value: "Senior Frontend Developer Case" },
  { label: "Product", value: "Agito Corporate Policy Portal" },
  { label: "Release", value: "v1.0 Demo Scope" },
  { label: "Focus", value: "Experience + Architecture" },
];

const techStack = [
  {
    title: "Frontend",
    items: [
      "Next.js App Router",
      "Tailwind CSS",
      "PrimeReact v11 (unstyled)",
      "Zustand",
      "TanStack Query",
    ],
  },
  {
    title: "Backend",
    items: [
      "NestJS Modular Monolith",
      "Prisma ORM",
      "PostgreSQL",
      "Elasticsearch (Vector ready)",
      "Redis (cache)",
    ],
  },
  {
    title: "AI & Data",
    items: [
      "Elasticsearch Fuzzy Search",
      "Automated Risk Scoring",
      "OCR Infrastructure (R2 storage)",
    ],
  },
  {
    title: "DevOps",
    items: ["Docker Compose", "CI-ready scripts", "Migration-first DB flow"],
  },
];

const experiencePillars = [
  {
    title: "Hızlı onboarding",
    text: "Yeni müşteri 5 dakikada paket seçer, başvuru açar, doküman yükler.",
  },
  {
    title: "Yapay Zeka Destekli Operasyon",
    text: "Otomatik risk skorlama ve poliçe öneri motoru ile akıllı karar desteği.",
  },
  {
    title: "Akıllı Arama",
    text: "Elasticsearch tabanlı fuzzy search ve semantic arama altyapısı.",
  },
];

const screens = [
  {
    title: "Public Landing",
    desc: "Paket kartları, değer önerisi ve CTA odaklı dönüşüm.",
  },
  {
    title: "Auth",
    desc: "Güvenli giriş, tenant bazlı kimlik doğrulama.",
  },
  {
    title: "Customer Dashboard",
    desc: "Başvurular, dokümanlar, poliçeler ve ödemeler tek akışta.",
  },
  {
    title: "AI Analysis Center",
    desc: "Risk skorları, otomatik onay önerileri ve içgörü paneli.",
  },
  {
    title: "Admin Dashboard",
    desc: "Başvuru onay, poliçe aktivasyon ve operasyonel kontrol.",
  },
  {
    title: "Applications",
    desc: "Başvuru wizard, revizyon ve durum yönetimi.",
  },
  {
    title: "Corporate Policies",
    desc: "Toplu poliçe aktivasyonu, prim hesaplama, raporlama.",
  },
  {
    title: "Employees & Departments",
    desc: "Çalışan profili, departman hiyerarşisi, doküman yükleme.",
  },
  {
    title: "Analytics",
    desc: "Ödeme sağlığı, risk dağılımı ve trendler.",
  },
];

const architectureFlow = [
  {
    title: "Client",
    text: "App Router + API client + React Query cache.",
  },
  {
    title: "Gateway",
    text: "NestJS controller + DTO validation + guard policy.",
  },
  {
    title: "Intelligence",
    text: "AI scoring servisi ve Elasticsearch indexing.",
  },
  {
    title: "Core",
    text: "Service katmanı ile iş kuralları ve audit log.",
  },
  {
    title: "Data",
    text: "PostgreSQL ana kaynak, Elasticsearch arama aynası.",
  },
];

const qualityChecklist = [
  "Role bazlı erişim ve tenant izolasyonu",
  "DTO + Zod doğrulama katmanı",
  "Elasticsearch dual-write senkronu",
  "Transaction bazlı kritik akışlar",
  "AI-Ready veri mimarisi",
  "Basitçe genişletilebilir modüler yapı",
];

const roadmap = [
  "E2E test akışları (Login -> Upload -> Activate Policy)",
  "GenAI tabanlı poliçe asistanı (Chatbot)",
  "Otomatik hasar tespit algoritmaları",
  "Observability: tracing + structured logs",
];

export default async function DocsPage() {
  // From apps/web, go up to project root then into docs/adr
  const adrDir = path.join(process.cwd(), '../../docs/adr');
  const files = fs.readdirSync(adrDir).filter(file => file.endsWith('.md')).sort();
  const adrs = files.map(file => {
    const filePath = path.join(adrDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const title = lines[0].replace(/^# /, '');
    return { title, content };
  });
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="pt-24">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,90,172,0.12),_transparent_60%)]"></div>
          <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl animate-pulse"></div>
          <div className="absolute -left-10 bottom-0 h-52 w-52 rounded-full bg-slate-200/60 blur-3xl"></div>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="relative z-10 space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Case Study • Demo Delivery
                </span>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Agito Kurumsal Sigorta Platformu
                  <span className="block text-blue-600">
                    Senior Frontend Case Dökümanı
                  </span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Bu doküman, Agito için hazırlanan ürün demosunun mimari
                  yaklaşımını, tasarım kararlarını ve uçtan uca kullanıcı
                  deneyimini özetler. Amaç, ürünün nasıl ölçekleneceğini
                  göstermek ve rol için somut bir teslim sunmaktır.
                </p>
                <div className="flex flex-wrap gap-3">
                  {highlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {item.label}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
                <h2 className="text-lg font-bold text-slate-900">
                  Demo kapsamı kısa özet
                </h2>
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <p>
                    Paket, başvuru, kurumsal poliçe ve ödeme süreçleri tek bir
                    akışta kurgulandı. Kullanıcılar müşteri ve admin rolüyle
                    senaryoları uçtan uca deneyimleyebiliyor.
                  </p>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Çıktılar
                    </div>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Başvuru - poliçe aktivasyon akışı
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Analitik paneller + operasyonel kontrol
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Ölçeklenebilir frontend mimarisi
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Durum
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        Demo hazır
                      </div>
                    </div>
                    <div className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      v1.0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
            <div className="space-y-16">
              <section id="vision">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Vizyon ve hedefler
                      </h2>
                      <p className="mt-3 text-slate-600 leading-relaxed">
                        Agito, kurumsal sigorta süreçlerini tek panelde yönetmeyi
                        hedefler. Demo, hızlı onboarding, operasyonel görünürlük
                        ve analitik karar desteği üzerine kurgulandı.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {experiencePillars.map((pillar) => (
                        <div
                          key={pillar.title}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-60"
                        >
                          <h3 className="text-sm font-bold text-slate-900">
                            {pillar.title}
                          </h3>
                          <p className="mt-2 text-xs text-slate-600">
                            {pillar.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="stack">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Teknoloji yığını
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Modern, ölçeklenebilir ve kurumsal standartlara uygun bir
                    stack tercih edildi. Frontend tarafında performans ve
                    tasarım hızı; backend tarafında ise veri tutarlılığı ve
                    arama yetenekleri önceliklendirildi.
                  </p>
                  <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {techStack.map((stack) => (
                      <div
                        key={stack.title}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {stack.title}
                        </h3>
                        <ul className="mt-4 space-y-2 text-sm text-slate-700">
                          {stack.items.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="architecture">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Mimari yaklaşım
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Sistem, modüler monolit prensipleriyle tasarlandı. Her
                    domain kendi controller/service katmanına sahip. Okuma
                    performansı için Elasticsearch, dokümanlar için R2 kullanıldı.
                  </p>
                  <div className="mt-8 grid gap-4 md:grid-cols-5">
                    {architectureFlow.map((step, index) => (
                      <div
                        key={step.title}
                        className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {`0${index + 1}`}
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-slate-900">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-600">
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-900">
                        Domain modelleri
                      </h4>
                      <p className="mt-2 text-xs text-slate-600">
                        Tenant, Company, Employee, Application, Corporate Policy,
                        Policy, Payment, Document ve Support Ticket modülleri.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-900">
                        En kritik akış
                      </h4>
                      <p className="mt-2 text-xs text-slate-600">
                        Başvuru onaylandıktan sonra kurumsal poliçe aktivasyonu
                        transaction ile birden fazla çalışan için poliçe üretir.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="screens">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ekranlar ve akışlar
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Demo, hem müşteri hem admin rolleri için kritik ekranları
                    kapsar. Her ekran, hızlı işlem ve karar desteği sağlamak
                    üzere tasarlanmıştır.
                  </p>
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {screens.map((screen) => (
                      <div
                        key={screen.title}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10"
                      >
                        <h3 className="text-sm font-bold text-slate-900">
                          {screen.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-600">
                          {screen.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="quality">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Güvenlik ve kalite
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Sistem, tenant izolasyonu ve rol tabanlı erişimle korunur.
                    DTO + Zod doğrulama katmanı ile girişler güvenli hale
                    getirilmiştir.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <ul className="space-y-3 text-sm text-slate-700">
                      {qualityChecklist.map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Test stratejisi
                      </h3>
                      <p className="mt-2 text-xs text-slate-600">
                        Demo teslimi için API seviyesinde jest altyapısı hazır.
                        Ürünleştirme aşamasında kritik akışlar için Playwright
                        tabanlı E2E senaryoları planlandı.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="operations">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Operasyon ve teslim
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Frontend tasarımı, hızlı iterasyon ve tekrar kullanılabilir
                    bileşenler üzerine kuruldu. Backend tarafında migration-first
                    yaklaşımı benimsendi.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Teslim paketi
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs text-slate-600">
                        <li>Demo url + role bazlı test hesapları</li>
                        <li>API dokümantasyon + mimari notlar</li>
                        <li>Release 1.0 scope ve risk analizi</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Yol haritası
                      </h3>
                      <ul className="mt-3 space-y-2 text-xs text-slate-600">
                        {roadmap.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-32 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  İçindekiler
                </div>
                <nav className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                  <a className="block hover:text-blue-600" href="#vision">
                    Vizyon & hedefler
                  </a>
                  <a className="block hover:text-blue-600" href="#stack">
                    Teknoloji yığını
                  </a>
                  <a className="block hover:text-blue-600" href="#architecture">
                    Mimari yaklaşım
                  </a>
                  <a className="block hover:text-blue-600" href="#screens">
                    Ekranlar
                  </a>
                  <a className="block hover:text-blue-600" href="#quality">
                    Güvenlik & kalite
                  </a>
                  <a className="block hover:text-blue-600" href="#operations">
                    Operasyon & teslim
                  </a>
                </nav>
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="mt-6 w-full rounded-full bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-blue-700">
                      Mimari kararlar (ADR)
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"

                    className="!w-[75vw]   border-l border-slate-200 bg-slate-50 !max-w-[75vw]"
                  >
                    <div className="h-full overflow-y-auto p-8">
                      <SheetHeader>
                        <SheetTitle className="text-2xl font-bold text-slate-900">
                          Mimari Karar Kayitlari (ADR)
                        </SheetTitle>
                        <SheetDescription className="text-slate-600">
                          Agito case calismasi icin alinan tum mimari kararlarin
                          kapsamli analizi ve gerekceleri.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
                        <Accordion type="single" collapsible className="w-full">
                          {adrs.map((adr, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                              <AccordionTrigger className="text-left">
                                {adr.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-6 text-slate-700">
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-2xl font-bold text-slate-900">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-xl font-bold text-slate-900">
                                          {children}
                                        </h2>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc space-y-2 pl-6 text-sm">
                                          {children}
                                        </ul>
                                      ),
                                      li: ({ children }) => (
                                        <li className="leading-relaxed">{children}</li>
                                      ),
                                      p: ({ children }) => (
                                        <p className="text-sm leading-relaxed">
                                          {children}
                                        </p>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-semibold text-slate-900">
                                          {children}
                                        </strong>
                                      ),
                                      table: ({ children }) => (
                                        <table className="w-full border-collapse border border-slate-300 text-sm">
                                          {children}
                                        </table>
                                      ),
                                      thead: ({ children }) => (
                                        <thead className="bg-slate-100">
                                          {children}
                                        </thead>
                                      ),
                                      tbody: ({ children }) => (
                                        <tbody>{children}</tbody>
                                      ),
                                      tr: ({ children }) => (
                                        <tr className="border-b border-slate-200">
                                          {children}
                                        </tr>
                                      ),
                                      td: ({ children }) => (
                                        <td className="border border-slate-300 px-4 py-2">
                                          {children}
                                        </td>
                                      ),
                                      th: ({ children }) => (
                                        <th className="border border-slate-300 px-4 py-2 font-semibold">
                                          {children}
                                        </th>
                                      ),
                                    }}
                                  >
                                    {adr.content}
                                  </ReactMarkdown>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-xs text-white">
                  <div className="font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Not
                  </div>
                  <p className="mt-2 text-slate-200">
                    Bu doküman, mülakat sürecinde mimari ve tasarım kararlarını
                    net şekilde anlatmak için hazırlanmıştır.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
