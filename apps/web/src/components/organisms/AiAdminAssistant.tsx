'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Send, X, Mic, MicOff, Volume2, VolumeX, Mail, Wand2, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

type AiTableColumn = {
  key: string;
  label: string;
};

type AiTable = {
  title: string;
  columns: AiTableColumn[];
  rows: Record<string, string | number | null>[];
};

type AiChartDataset = {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
};

type AiChart = {
  title: string;
  type: 'bar' | 'line' | 'doughnut';
  labels: string[];
  datasets: AiChartDataset[];
};

type AiResponse = {
  summary: string;
  tables: AiTable[];
  charts: AiChart[];
  suggestions: string[];
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const baseQuickPrompts = [
  'Genel sistem ozeti',
  'Son 30 gun odeme gecikmeleri',
  'Yaklasan 14 gunluk policeler',
  'Riskli sirketleri tespit et',
  'Basvuru funnel raporu',
];

const roleQuickPrompts: Record<'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'unknown', string[]> = {
  ADMIN: [
    'Kurumsal police pipeline',
    'Odeme yaslandirma raporu',
    'Prim trendi (12 ay)',
    'Buyume trendleri (6 ay)',
    'Bulk operasyon durumu',
  ],
  HR_MANAGER: [
    'Departman risk analizi',
    'Calisan sayisi ve aktif poliçeler',
    'Riskli calisanlar',
  ],
  EMPLOYEE: [
    'Yaklasan poliçelerim',
    'Gecikmis odemelerim var mi',
  ],
  unknown: [],
};

const contextQuickPromptsByPath: { match: RegExp; prompts: string[] }[] = [
  { match: /\/dashboard\/payments/i, prompts: ['Odeme sagligi raporu', 'Gecikmis odeme yaslandirma'] },
  { match: /\/dashboard\/policies/i, prompts: ['Police durum ozeti', 'Yenileme riski listesi'] },
  { match: /\/dashboard\/companies/i, prompts: ['En yuksek prim odeyen sirketler', 'Sirket karsilastirmasi'] },
  { match: /\/dashboard\/analytics/i, prompts: ['Prim trendi (12 ay)', 'Buyume trendleri (6 ay)'] },
  { match: /\/dashboard\/support/i, prompts: ['Destek yogunluklari', 'Acik destek talepleri'] },
  { match: /\/dashboard\/employees/i, prompts: ['Calisan risk analizi', 'Departman bazli gecikmeler'] },
  { match: /\/dashboard\/corporate-policies/i, prompts: ['Kurumsal police pipeline', '30 gun icinde biten policeler'] },
];

export const AiAdminAssistant: React.FC = () => {
  const { toast } = useToast();
  const pathname = usePathname();
  const [role, setRole] = useState<'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'unknown'>('unknown');
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Poliçe yenileme hatırlatması');
  const [emailBody, setEmailBody] = useState(
    'Merhaba {{company}},\n\n{{policyNo}} numarali poliçeniz {{endDate}} tarihinde sona erecek. Yenileme icin destek olmak isteriz.\n\nSaygilarimizla,\nAgito Sigorta Ekibi',
  );
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role') as 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | null;
      setRole(storedRole || 'unknown');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(Boolean(SpeechRecognition));
      setTtsSupported('speechSynthesis' in window);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      requestAnimationFrame(() => setIsPanelVisible(true));
    } else {
      document.body.classList.remove('overflow-hidden');
      setIsPanelVisible(false);
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const hasResponse = useMemo(() => Boolean(response), [response]);
  const quickPrompts = useMemo(() => {
    const rolePrompts = roleQuickPrompts[role] || [];
    const contextPrompts = contextQuickPromptsByPath.find((item) => item.match.test(pathname))?.prompts || [];
    const combined = [...baseQuickPrompts, ...rolePrompts, ...contextPrompts];
    return Array.from(new Set(combined)).slice(0, 10);
  }, [pathname, role]);
  const upcomingTable = useMemo(() => {
    if (!response?.tables?.length) return null;
    return response.tables.find((table) => table.title.toLowerCase().includes('yaklasan'));
  }, [response]);
  const emailPreview = useMemo(() => {
    if (!upcomingTable?.rows?.length) return '';
    const row = upcomingTable.rows[selectedRowIndex] || upcomingTable.rows[0];
    return emailBody
      .replace(/{{company}}/g, String(row.company ?? ''))
      .replace(/{{policyNo}}/g, String(row.policyNo ?? ''))
      .replace(/{{endDate}}/g, String(row.endDate ?? ''))
      .replace(/{{premium}}/g, String(row.premium ?? ''));
  }, [emailBody, upcomingTable, selectedRowIndex]);

  const handleSend = async (value?: string) => {
    const content = (value ?? prompt).trim();
    if (!content) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, newMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const { data } = await api.post<AiResponse>('/ai/admin', {
        prompt: content,
      });
      setResponse(data);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.summary,
        },
      ]);
      if (voicePlaybackEnabled && ttsSupported) {
        speakResponse(data.summary);
      }
    } catch (error: any) {
      toast({
        title: 'AI Asistan Hata',
        description: error?.response?.data?.message || 'Yanıt alinamadi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Sesli Asistan', description: 'Tarayici sesli girisi desteklemiyor.' });
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0]?.transcript || '')
          .join('')
          .trim();
        if (transcript) {
          setPrompt(transcript);
        }
        const lastResult = event.results[event.results.length - 1];
        if (lastResult?.isFinal && transcript) {
          setIsListening(false);
          handleSend(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const renderChart = (chart: AiChart) => {
    const dataset = {
      labels: chart.labels,
      datasets: chart.datasets,
    };
    if (chart.type === 'line') {
      return <Line data={dataset} />;
    }
    if (chart.type === 'doughnut') {
      return <Doughnut data={dataset} />;
    }
    return <Bar data={dataset} />;
  };

  if (role !== 'ADMIN') {
    return null;
  }

  const handleClose = () => {
    setIsPanelVisible(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleSendEmail = () => {
    toast({
      title: 'Mail gonderildi (mock)',
      description: 'Hatirlatma maili kuyruga alindi.',
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_20px_50px_rgba(249,115,22,0.35)] transition hover:scale-105"
        aria-label="AI Asistan"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isPanelVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
          />
          <div
            className={`absolute inset-y-0 right-0 flex h-full w-full flex-col bg-gradient-to-b from-white via-white to-slate-50 shadow-[0_30px_60px_rgba(15,23,42,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="relative overflow-hidden border-b border-slate-100 px-6 py-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.8),transparent_60%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Admin AI Suite</p>
                    <h2 className="text-xl font-semibold text-slate-900">Sihirli Asistan</h2>
                    <p className="text-xs text-slate-500">Analiz + aksiyon paneli</p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoicePlaybackEnabled((prev) => !prev)}
                  className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 shadow-sm hover:text-slate-900"
                  aria-label="Sesli yanit"
                  disabled={!ttsSupported}
                >
                  {voicePlaybackEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 shadow-sm hover:text-slate-900"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-12">
              <section className="order-2 flex min-h-0 flex-1 flex-col border-t border-slate-100 bg-white md:order-1 md:col-span-8 md:border-r md:border-t-0">
                <div className="flex-1 overflow-y-auto p-6">
                  {!hasResponse && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-white via-white to-amber-50 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                      <h3 className="text-lg font-semibold text-slate-900">Analiz paneli hazir</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Sagdan bir prompt gonderin. AI, verileri analiz edip tablo ve chartlari buraya tasir.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        <span className="rounded-full bg-slate-100 px-3 py-1">Gercek veri</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">Anlik icgoru</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">Aksiyon listesi</span>
                      </div>
                    </div>
                  )}

                  {response && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ozet</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">{response.summary}</p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            <Wand2 className="h-3 w-3" /> AI
                          </div>
                        </div>
                        {response.suggestions?.length > 0 && (
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            {response.suggestions.map((item, index) => (
                              <div key={`suggestion-${index}`} className="rounded-2xl bg-slate-100/70 px-3 py-2">
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {upcomingTable && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hatirlatma</p>
                              <h4 className="text-lg font-semibold text-slate-900">Poliçe yenileme maili</h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowEmailComposer((prev) => !prev)}
                              className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg"
                            >
                              <Mail className="h-4 w-4" />
                              {showEmailComposer ? 'Gizle' : 'Mail Hazirla'}
                            </button>
                          </div>

                          {showEmailComposer && (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  Konu
                                </label>
                                <input
                                  value={emailSubject}
                                  onChange={(event) => setEmailSubject(event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                />
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  Sirket / Police Sec
                                </label>
                                <select
                                  value={selectedRowIndex}
                                  onChange={(event) => setSelectedRowIndex(Number(event.target.value))}
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                >
                                  {upcomingTable.rows.map((row, index) => (
                                    <option key={`row-${index}`} value={index}>
                                      {row.company} - {row.policyNo}
                                    </option>
                                  ))}
                                </select>
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  Template
                                </label>
                                <textarea
                                  value={emailBody}
                                  onChange={(event) => setEmailBody(event.target.value)}
                                  rows={7}
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                                />
                                <div className="text-xs text-slate-400">
                                  Degiskenler: {'{'}{'{'}company{'}'}{'}'}, {'{'}{'{'}policyNo{'}'}{'}'}, {'{'}{'{'}endDate{'}'}{'}'}, {'{'}{'{'}premium{'}'}{'}'}
                                </div>
                                <button
                                  type="button"
                                  onClick={handleSendEmail}
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-amber-600"
                                >
                                  <Mail className="h-4 w-4" />
                                  Hatirlatma Maili Gonder
                                </button>
                              </div>
                              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Onizleme</p>
                                <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-inner">
                                  <div className="text-xs font-semibold text-slate-400">Konu: {emailSubject}</div>
                                  <div className="mt-3 whitespace-pre-line">{emailPreview}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {response.charts?.map((chart, index) => (
                        <div key={`chart-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                          <div className="mb-3 text-sm font-semibold text-slate-600">{chart.title}</div>
                          {renderChart(chart)}
                        </div>
                      ))}

                      {response.tables?.map((table, index) => (
                        <div key={`table-${index}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                            {table.title}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                  {table.columns.map((column) => (
                                    <th key={column.key} className="px-4 py-3">
                                      {column.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {table.rows.map((row, rowIndex) => (
                                  <tr key={`${table.title}-${rowIndex}`} className="hover:bg-slate-50">
                                    {table.columns.map((column) => (
                                      <td key={`${column.key}-${rowIndex}`} className="px-4 py-3">
                                        {row[column.key] ?? '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="order-1 flex min-h-0 flex-1 flex-col bg-white md:order-2 md:col-span-4">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-500">Chat</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Live
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {message.content}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                        Analiz hazirlaniyor...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {quickPrompts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSend(item)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-inner">
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900"
                      aria-label="Sesli giris"
                      disabled={!voiceSupported}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Soru yazin..."
                      className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      className="rounded-full bg-slate-900 p-2 text-white transition hover:bg-slate-700"
                      aria-label="Gonder"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {isSpeaking ? 'Sesli yanit oynatiliyor.' : 'Ornek: "Son 14 gun odemeleri" veya "Riskli sirketleri getir".'}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
