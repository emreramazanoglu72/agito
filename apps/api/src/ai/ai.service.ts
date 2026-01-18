import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AiRequestDto } from './dto/ai-request.dto';
import { AiChart, AiResponse, AiTable } from './ai.types';
import { ApplicationStatus, CorporatePolicyStatus, PolicyStatus, PaymentStatus } from '@prisma/client';

type AiIntent =
  | 'overdue_payments'
  | 'upcoming_policies'
  | 'risky_companies'
  | 'company_info'
  | 'employee_info'
  | 'department_risk'
  | 'policy_type_distribution'
  | 'collection_forecast'
  | 'top_paying_companies'
  | 'pending_applications'
  | 'support_hotspots'
  | 'company_compare'
  | 'payment_reminders'
  | 'renewal_risk'
  | 'payments_aging'
  | 'activity_feed'
  | 'policy_status_summary'
  | 'applications_funnel'
  | 'corporate_policy_pipeline'
  | 'bulk_operations'
  | 'payment_health'
  | 'premium_trend'
  | 'growth_trends'
  | 'top_risky_employees'
  | 'recent_entities'
  | 'global_stats'
  | 'general';
type AiPlan = {
  intent: AiIntent;
  dateFrom?: string | null;
  dateTo?: string | null;
  windowDays?: number | null;
  companyName?: string | null;
  companyNameA?: string | null;
  companyNameB?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  policyType?: string | null;
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async runAdminAssistant(body: AiRequestDto, tenantId: string): Promise<AiResponse> {
    const prompt = body.prompt?.trim() || '';
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const useLlm = body.useLlm ?? Boolean(apiKey);
    const llmPlan: AiPlan | undefined = useLlm && apiKey
      ? await this.parseIntentWithLlm(prompt, apiKey)
      : undefined;
    const intent = llmPlan?.intent ?? this.detectIntent(prompt);

    switch (intent) {
      case 'overdue_payments':
        return this.getOverduePayments(prompt, body, tenantId, llmPlan);
      case 'upcoming_policies':
        return this.getUpcomingPolicies(prompt, body, tenantId, llmPlan);
      case 'risky_companies':
        return this.getRiskyCompanies(prompt, body, tenantId, llmPlan);
      case 'company_info':
        return this.getCompanyInfo(prompt, body, tenantId, llmPlan);
      case 'employee_info':
        return this.getEmployeeInfo(prompt, body, tenantId, llmPlan);
      case 'department_risk':
        return this.getDepartmentRisk(prompt, body, tenantId, llmPlan);
      case 'policy_type_distribution':
        return this.getPolicyTypeDistribution(tenantId);
      case 'collection_forecast':
        return this.getCollectionForecast(prompt, body, tenantId, llmPlan);
      case 'top_paying_companies':
        return this.getTopPayingCompanies(tenantId);
      case 'pending_applications':
        return this.getPendingApplications(tenantId);
      case 'support_hotspots':
        return this.getSupportHotspots(tenantId);
      case 'company_compare':
        return this.getCompanyCompare(prompt, body, tenantId, llmPlan);
      case 'payment_reminders':
        return this.getPaymentReminders(prompt, body, tenantId, llmPlan);
      case 'renewal_risk':
        return this.getRenewalRisk(prompt, body, tenantId, llmPlan);
      case 'payments_aging':
        return this.getPaymentsAging(tenantId);
      case 'activity_feed':
        return this.getActivityFeed(tenantId);
      case 'policy_status_summary':
        return this.getPolicyStatusSummary(tenantId);
      case 'applications_funnel':
        return this.getApplicationsFunnel(tenantId);
      case 'corporate_policy_pipeline':
        return this.getCorporatePolicyPipeline(tenantId);
      case 'bulk_operations':
        return this.getBulkOperationsStatus(tenantId);
      case 'payment_health':
        return this.getPaymentHealth(tenantId);
      case 'premium_trend':
        return this.getPremiumTrend(tenantId);
      case 'growth_trends':
        return this.getGrowthTrends(tenantId);
      case 'top_risky_employees':
        return this.getTopRiskyEmployees(tenantId);
      case 'recent_entities':
        return this.getRecentEntities(tenantId);
      case 'global_stats':
        return this.getGlobalStats(tenantId);
      case 'general':
      default:
        return this.getGeneralResponse();
    }
  }

  private detectIntent(prompt: string): AiIntent {
    const normalized = prompt.toLowerCase();
    if ((normalized.includes('risk') || normalized.includes('riskli')) && (normalized.includes('calisan') || normalized.includes('çalışan'))) {
      return 'top_risky_employees';
    }
    if ((normalized.includes('kurumsal') || normalized.includes('corporate')) && (normalized.includes('poli') || normalized.includes('police'))) {
      return 'corporate_policy_pipeline';
    }
    if (normalized.includes('odeme') || normalized.includes('ödeme') || normalized.includes('gecik')) {
      return 'overdue_payments';
    }
    if (normalized.includes('odeme sagligi') || normalized.includes('payment health') || normalized.includes('tahsilat sagligi')) {
      return 'payment_health';
    }
    if (normalized.includes('hatirlatma') || normalized.includes('hatırlatma') || normalized.includes('remind')) {
      return 'payment_reminders';
    }
    if (normalized.includes('poli') || normalized.includes('police') || normalized.includes('yaklasan') || normalized.includes('yaklaşan')) {
      return 'upcoming_policies';
    }
    if (normalized.includes('yenileme')) {
      return 'renewal_risk';
    }
    if (normalized.includes('risk')) {
      return 'risky_companies';
    }
    if (normalized.includes('karsilastir') || normalized.includes('karşılaştır') || normalized.includes('vs')) {
      return 'company_compare';
    }
    if (normalized.includes('calisan') || normalized.includes('çalışan') || normalized.includes('personel')) {
      return 'employee_info';
    }
    if (normalized.includes('departman')) {
      return 'department_risk';
    }
    if (normalized.includes('tur') || normalized.includes('tür') || normalized.includes('dagilim') || normalized.includes('dağılım')) {
      return 'policy_type_distribution';
    }
    if (normalized.includes('tahsilat') || normalized.includes('beklenen')) {
      return 'collection_forecast';
    }
    if ((normalized.includes('prim') || normalized.includes('premium')) && (normalized.includes('trend') || normalized.includes('aylik') || normalized.includes('grafik'))) {
      return 'premium_trend';
    }
    if ((normalized.includes('buyume') || normalized.includes('growth') || normalized.includes('trend')) &&
      (normalized.includes('calisan') || normalized.includes('çalışan') || normalized.includes('sirket') || normalized.includes('şirket') || normalized.includes('poli') || normalized.includes('police'))
    ) {
      return 'growth_trends';
    }
    if (normalized.includes('en yuksek') || normalized.includes('en yüksek') || normalized.includes('top')) {
      return 'top_paying_companies';
    }
    if ((normalized.includes('basvuru') || normalized.includes('başvuru')) &&
      (normalized.includes('dagilim') || normalized.includes('dağılım') || normalized.includes('durum') || normalized.includes('funnel') || normalized.includes('pipeline'))
    ) {
      return 'applications_funnel';
    }
    if ((normalized.includes('basvuru') || normalized.includes('başvuru')) &&
      (normalized.includes('bekleyen') || normalized.includes('pending') || normalized.includes('inceleme'))
    ) {
      return 'pending_applications';
    }
    if (normalized.includes('basvuru') || normalized.includes('başvuru')) {
      return 'applications_funnel';
    }
    if (normalized.includes('bulk') || normalized.includes('toplu') || normalized.includes('upload') || normalized.includes('operasyon')) {
      return 'bulk_operations';
    }
    if (normalized.includes('destek') || normalized.includes('ticket')) {
      return 'support_hotspots';
    }
    if (normalized.includes('aktivite') || normalized.includes('islem') || normalized.includes('işlem')) {
      return 'activity_feed';
    }
    if (normalized.includes('aging') || normalized.includes('yaslandirma') || normalized.includes('yaşlandırma')) {
      return 'payments_aging';
    }
    if (normalized.includes('durum') || normalized.includes('aktif') || normalized.includes('pasif')) {
      return 'policy_status_summary';
    }
    if (normalized.includes('son') && (normalized.includes('sirket') || normalized.includes('şirket') || normalized.includes('calisan') || normalized.includes('çalışan'))) {
      return 'recent_entities';
    }
    if (normalized.includes('kac') || normalized.includes('kaç') || normalized.includes('toplam') || normalized.includes('genel')) {
      return 'global_stats';
    }
    if (normalized.includes('sirket') || normalized.includes('şirket') || normalized.includes('firma')) {
      return 'company_info';
    }
    return 'general';
  }

  private async parseIntentWithLlm(prompt: string, apiKey: string): Promise<AiPlan | undefined> {
    const system = [
      'Sen bir admin asistanisin. Kullanicinin istegini siniflandir.',
      'Ciktiyi yalnizca JSON olarak ver, baska metin ekleme.',
      'Format: {"intent":"overdue_payments|upcoming_policies|risky_companies|company_info|employee_info|department_risk|policy_type_distribution|collection_forecast|top_paying_companies|pending_applications|support_hotspots|company_compare|payment_reminders|renewal_risk|payments_aging|activity_feed|policy_status_summary|applications_funnel|corporate_policy_pipeline|bulk_operations|payment_health|premium_trend|growth_trends|top_risky_employees|recent_entities|global_stats|general","dateFrom":"YYYY-MM-DD|null","dateTo":"YYYY-MM-DD|null","windowDays":number|null,"companyName":"string|null","companyNameA":"string|null","companyNameB":"string|null","employeeName":"string|null","departmentName":"string|null","policyType":"string|null"}.',
      'Tarih araligi sorularinda dateFrom/dateTo doldur. "Son X gun" ise windowDays kullan.',
      'Sirketle ilgili isteklerde companyName alanini doldur.',
      'Sirket karsilastirmada companyNameA ve companyNameB doldur.',
      'Calisan icin employeeName doldur, departman icin departmentName doldur.',
      'Eger istek analiz icermiyorsa intent=general.',
    ].join(' ');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return undefined;
      }

      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent as AiIntent,
        dateFrom: typeof parsed.dateFrom === 'string' ? parsed.dateFrom : null,
        dateTo: typeof parsed.dateTo === 'string' ? parsed.dateTo : null,
        windowDays: typeof parsed.windowDays === 'number' ? parsed.windowDays : null,
        companyName: typeof parsed.companyName === 'string' ? parsed.companyName : null,
        companyNameA: typeof parsed.companyNameA === 'string' ? parsed.companyNameA : null,
        companyNameB: typeof parsed.companyNameB === 'string' ? parsed.companyNameB : null,
        employeeName: typeof parsed.employeeName === 'string' ? parsed.employeeName : null,
        departmentName: typeof parsed.departmentName === 'string' ? parsed.departmentName : null,
        policyType: typeof parsed.policyType === 'string' ? parsed.policyType : null,
      };
    } catch (error) {
      return undefined;
    }
  }

  private getGeneralResponse(): AiResponse {
    return {
      summary: 'Merhaba! Analiz icin odeme gecikmeleri, yaklasan policeler veya riskli sirketler konusunda soru sorabilirsiniz.',
      tables: [],
      charts: [],
      suggestions: [
        'Son 30 gun odeme gecikmeleri',
        'Yaklasan 14 gunluk policeler',
        'Riskli sirketleri tespit et',
        'Genel sistem ozeti',
        'Odeme yaslandirma raporu',
        'Basvuru durumu dagilimi',
        'Kurumsal police pipeline',
      ],
    };
  }

  private getDateRangeFromPrompt(prompt: string, fallbackDays: number) {
    const dateMatches = prompt.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches && dateMatches.length >= 2) {
      const [fromRaw, toRaw] = dateMatches;
      const from = new Date(`${fromRaw}T00:00:00.000Z`);
      const to = new Date(`${toRaw}T23:59:59.999Z`);
      return { from, to };
    }

    const relativeMatch = prompt.match(/son\s+(\d+)\s*(gun|gün)/i);
    const days = relativeMatch ? Number(relativeMatch[1]) : fallbackDays;
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    return { from, to };
  }

  private getWindowDays(prompt: string, fallbackDays: number) {
    const match = prompt.match(/(\d+)\s*(gun|gün)/i);
    if (match) {
      return Number(match[1]);
    }
    return fallbackDays;
  }

  private async getOverduePayments(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: any | { dateFrom?: string | null; dateTo?: string | null },
  ): Promise<AiResponse> {
    const range = this.getDateRangeFromPrompt(prompt, 30);
    const from = body.filters?.dateFrom
      ? new Date(body.filters.dateFrom)
      : llmPlan?.dateFrom
        ? new Date(llmPlan.dateFrom)
        : range.from;
    const to = body.filters?.dateTo
      ? new Date(body.filters.dateTo)
      : llmPlan?.dateTo
        ? new Date(llmPlan.dateTo)
        : range.to;

    const payments = await this.prisma.policyPayment.findMany({
      where: {
        status: PaymentStatus.OVERDUE,
        dueDate: {
          gte: from,
          lte: to,
        },
        policy: {
          tenantId,
        },
      },
      include: {
        policy: {
          include: {
            company: true,
            employee: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 200,
    });

    const rows = payments.map((payment) => ({
      company: payment.policy.company?.name || 'Bilinmiyor',
      employee: payment.policy.employee
        ? `${payment.policy.employee.firstName} ${payment.policy.employee.lastName}`.trim()
        : 'Bilinmiyor',
      policyNo: payment.policy.policyNo,
      dueDate: payment.dueDate.toISOString().split('T')[0],
      amount: Number(payment.amount),
      status: payment.status,
    }));

    const table: AiTable = {
      title: 'Gecikmis Odemeler',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'employee', label: 'Calisan' },
        { key: 'policyNo', label: 'Police No' },
        { key: 'dueDate', label: 'Vade Tarihi' },
        { key: 'amount', label: 'Tutar' },
        { key: 'status', label: 'Durum' },
      ],
      rows,
    };

    const groupedByCompany = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.company] = (acc[row.company] || 0) + 1;
      return acc;
    }, {});

    const chart: AiChart = {
      title: 'Sirket Bazli Gecikme Adedi',
      type: 'bar',
      labels: Object.keys(groupedByCompany),
      datasets: [
        {
          label: 'Gecikme Adedi',
          data: Object.values(groupedByCompany),
          backgroundColor: ['#0ea5e9'],
        },
      ],
    };

    return {
      summary: `${from.toISOString().split('T')[0]} - ${to.toISOString().split('T')[0]} araliginda ${rows.length} gecikmis odeme bulundu.`,
      tables: [table],
      charts: [chart],
      suggestions: [
        'Gecikme sayisi yuksek sirketler icin hatirlatma kampanyasi planlayin.',
        'Gecikme tutari yuksek olan poliçeleri onceliklendirin.',
      ],
    };
  }

  private async getUpcomingPolicies(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { windowDays?: number | null },
  ): Promise<AiResponse> {
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || this.getWindowDays(prompt, 14);
    const from = new Date();
    const to = new Date();
    to.setDate(from.getDate() + windowDays);

    const policies = await this.prisma.policy.findMany({
      where: {
        tenantId,
        endDate: {
          gte: from,
          lte: to,
        },
        status: {
          in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL],
        },
      },
      include: {
        company: true,
        employee: true,
      },
      orderBy: {
        endDate: 'asc',
      },
      take: 200,
    });

    const rows = policies.map((policy) => ({
      company: policy.company?.name || 'Bilinmiyor',
      employee: policy.employee
        ? `${policy.employee.firstName} ${policy.employee.lastName}`.trim()
        : 'Bilinmiyor',
      policyNo: policy.policyNo,
      endDate: policy.endDate.toISOString().split('T')[0],
      premium: Number(policy.premium),
      status: policy.status,
    }));

    const table: AiTable = {
      title: `Yaklasan Policeler (Sonraki ${windowDays} gun)`,
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'employee', label: 'Calisan' },
        { key: 'policyNo', label: 'Police No' },
        { key: 'endDate', label: 'Bitis Tarihi' },
        { key: 'premium', label: 'Prim' },
        { key: 'status', label: 'Durum' },
      ],
      rows,
    };

    const groupedByDate = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.endDate] = (acc[row.endDate] || 0) + 1;
      return acc;
    }, {});

    const chart: AiChart = {
      title: 'Bitis Tarihine Gore Police Sayisi',
      type: 'line',
      labels: Object.keys(groupedByDate),
      datasets: [
        {
          label: 'Police Sayisi',
          data: Object.values(groupedByDate),
          borderColor: ['#22c55e'],
          backgroundColor: ['#22c55e'],
        },
      ],
    };

    return {
      summary: `Onumuzdeki ${windowDays} gun icinde ${rows.length} police bitiyor.`,
      tables: [table],
      charts: [chart],
      suggestions: [
        'Yenileme icin oncelikli musteri listesi cikartin.',
        'Bitis tarihi yakin policeler icin otomatik hatirlatma gonderin.',
      ],
    };
  }

  private async getRiskyCompanies(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { windowDays?: number | null },
  ): Promise<AiResponse> {
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || this.getWindowDays(prompt, 14);
    const now = new Date();
    const overdueFrom = new Date();
    overdueFrom.setDate(now.getDate() - 90);
    const cancelledFrom = new Date();
    cancelledFrom.setDate(now.getDate() - 180);
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + windowDays);

    const [companies, overduePayments, upcomingPolicies, cancelledPolicies] = await Promise.all([
      this.prisma.company.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      }),
      this.prisma.policyPayment.findMany({
        where: {
          status: PaymentStatus.OVERDUE,
          dueDate: { gte: overdueFrom },
          policy: { tenantId },
        },
        select: {
          policy: {
            select: { companyId: true },
          },
        },
      }),
      this.prisma.policy.findMany({
        where: {
          tenantId,
          status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL] },
          endDate: { gte: now, lte: upcomingTo },
        },
        select: {
          companyId: true,
        },
      }),
      this.prisma.policy.findMany({
        where: {
          tenantId,
          status: { in: [PolicyStatus.CANCELLED, PolicyStatus.EXPIRED] },
          updatedAt: { gte: cancelledFrom },
        },
        select: {
          companyId: true,
        },
      }),
    ]);

    const overdueByCompany = this.countByCompany(overduePayments.map((item) => item.policy.companyId));
    const upcomingByCompany = this.countByCompany(upcomingPolicies.map((item) => item.companyId));
    const cancelledByCompany = this.countByCompany(cancelledPolicies.map((item) => item.companyId));

    const rows = companies.map((company) => {
      const overdue = overdueByCompany[company.id] || 0;
      const upcoming = upcomingByCompany[company.id] || 0;
      const cancelled = cancelledByCompany[company.id] || 0;
      const score = overdue * 3 + upcoming * 2 + cancelled * 2;
      return {
        company: company.name,
        overdue,
        upcoming,
        cancelled,
        score,
        risky: score >= 7 ? 'Evet' : 'Hayir',
      };
    });

    const riskyCompanies = rows.filter((row) => row.score >= 7).sort((a, b) => b.score - a.score);
    const table: AiTable = {
      title: 'Riskli Sirketler',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'overdue', label: 'Gecikme' },
        { key: 'upcoming', label: 'Yaklasan' },
        { key: 'cancelled', label: 'Iptal/Expired' },
        { key: 'score', label: 'Risk Skoru' },
        { key: 'risky', label: 'Riskli' },
      ],
      rows: riskyCompanies.length ? riskyCompanies : rows,
    };

    const chart: AiChart = {
      title: 'Risk Skoru (Top 10)',
      type: 'bar',
      labels: riskyCompanies.slice(0, 10).map((row) => row.company),
      datasets: [
        {
          label: 'Risk Skoru',
          data: riskyCompanies.slice(0, 10).map((row) => row.score),
          backgroundColor: ['#f97316'],
        },
      ],
    };

    return {
      summary: `${riskyCompanies.length} sirket riskli olarak isaretlendi. (Esik: 7)`,
      tables: [table],
      charts: [chart],
      suggestions: [
        'Risk skoru yuksek sirketler icin icgoru toplantisi planlayin.',
        'Gecikme odemeleri icin yeniden tahsilat akisi calistirin.',
      ],
    };
  }

  private async getCompanyInfo(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { companyName?: string | null; windowDays?: number | null },
  ): Promise<AiResponse> {
    const fallbackName = prompt.replace(/(sirket|şirket|firma|hakkinda|hakkında|bilgi|ver|goster|göster)/gi, '').trim();
    const companyName = llmPlan?.companyName || fallbackName;
    if (!companyName) {
      return {
        summary: 'Sirket adini belirtir misiniz? (Ornek: "Acme sirketi hakkinda bilgi ver")',
        tables: [],
        charts: [],
        suggestions: ['Acme sirketi hakkinda bilgi ver', 'Globex firmasi odeme durumu'],
      };
    }

    const company = await this.prisma.company.findFirst({
      where: {
        tenantId,
        name: {
          contains: companyName,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            employees: true,
            policies: true,
            departments: true,
            corporatePolicies: true,
            applications: true,
          },
        },
      },
    });

    if (!company) {
      return {
        summary: `"${companyName}" adinda bir sirket bulunamadi.`,
        tables: [],
        charts: [],
        suggestions: ['Sirket adini kontrol edin veya farkli bir isim deneyin.'],
      };
    }

    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || 14;
    const now = new Date();
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + windowDays);

    const [overduePayments, upcomingPolicies] = await Promise.all([
      this.prisma.policyPayment.count({
        where: {
          status: PaymentStatus.OVERDUE,
          policy: {
            companyId: company.id,
          },
        },
      }),
      this.prisma.policy.count({
        where: {
          companyId: company.id,
          endDate: { gte: now, lte: upcomingTo },
          status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL] },
        },
      }),
    ]);

    const table: AiTable = {
      title: 'Sirket Ozeti',
      columns: [
        { key: 'field', label: 'Alan' },
        { key: 'value', label: 'Deger' },
      ],
      rows: [
        { field: 'Isim', value: company.name },
        { field: 'Vergi No', value: company.taxId },
        { field: 'Sehir', value: company.city || '-' },
        { field: 'Telefon', value: company.phone || '-' },
        { field: 'E-posta', value: company.email || '-' },
        { field: 'Calisan Sayisi (kayıt)', value: company._count.employees },
        { field: 'Policeler', value: company._count.policies },
        { field: 'Departmanlar', value: company._count.departments },
        { field: 'Kurumsal Policeler', value: company._count.corporatePolicies },
        { field: 'Basvurular', value: company._count.applications },
        { field: `Gecikmis Odeme (toplam)`, value: overduePayments },
        { field: `Yaklasan Police ( ${windowDays} gun )`, value: upcomingPolicies },
      ],
    };

    const chart: AiChart = {
      title: 'Sirket Aktivite Ozeti',
      type: 'bar',
      labels: ['Calisan', 'Police', 'Departman', 'Kurumsal Police', 'Basvuru', 'Gecikme', 'Yaklasan'],
      datasets: [
        {
          label: 'Adet',
          data: [
            company._count.employees,
            company._count.policies,
            company._count.departments,
            company._count.corporatePolicies,
            company._count.applications,
            overduePayments,
            upcomingPolicies,
          ],
          backgroundColor: ['#0ea5e9'],
        },
      ],
    };

    return {
      summary: `${company.name} icin ozet bilgiler listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: [
        'Gecikmis odemeler icin tahsilat planini kontrol edin.',
        'Yaklasan poliçeler icin yenileme teklifleri hazirlayin.',
      ],
    };
  }

  private async getEmployeeInfo(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { employeeName?: string | null; windowDays?: number | null },
  ): Promise<AiResponse> {
    const employeeName = llmPlan?.employeeName || this.extractName(prompt, ['calisan', 'çalışan', 'personel', 'bilgi', 'hakkinda', 'hakkında', 'ver']);
    if (!employeeName) {
      return {
        summary: 'Calisan adini belirtir misiniz? (Ornek: "Ahmet Yilmaz calisan bilgileri")',
        tables: [],
        charts: [],
        suggestions: ['Ahmet Yilmaz calisan bilgileri', 'Ayse Kaya odeme durumu'],
      };
    }

    const nameParts = employeeName.split(' ').filter(Boolean);
    const whereName = nameParts.length >= 2
      ? {
          firstName: { contains: nameParts[0], mode: 'insensitive' as const },
          lastName: { contains: nameParts.slice(1).join(' '), mode: 'insensitive' as const },
        }
      : {
          OR: [
            { firstName: { contains: employeeName, mode: 'insensitive' as const } },
            { lastName: { contains: employeeName, mode: 'insensitive' as const } },
          ],
        };

    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId,
        ...whereName,
      },
      include: {
        company: true,
        department: true,
        _count: {
          select: { policies: true, documents: true },
        },
      },
    });

    if (!employee) {
      return {
        summary: `"${employeeName}" adinda bir calisan bulunamadi.`,
        tables: [],
        charts: [],
        suggestions: ['Calisan adini kontrol edin veya tam isim deneyin.'],
      };
    }

    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || 14;
    const now = new Date();
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + windowDays);

    const [upcomingPolicies, overduePayments] = await Promise.all([
      this.prisma.policy.count({
        where: {
          employeeId: employee.id,
          endDate: { gte: now, lte: upcomingTo },
          status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL] },
        },
      }),
      this.prisma.policyPayment.count({
        where: {
          status: PaymentStatus.OVERDUE,
          policy: { employeeId: employee.id },
        },
      }),
    ]);

    const table: AiTable = {
      title: 'Calisan Ozeti',
      columns: [
        { key: 'field', label: 'Alan' },
        { key: 'value', label: 'Deger' },
      ],
      rows: [
        { field: 'Isim', value: `${employee.firstName} ${employee.lastName}`.trim() },
        { field: 'TC No', value: employee.tcNo },
        { field: 'Sirket', value: employee.company?.name || '-' },
        { field: 'Departman', value: employee.department?.name || '-' },
        { field: 'Police Sayisi', value: employee._count.policies },
        { field: 'Dokuman Sayisi', value: employee._count.documents },
        { field: `Yaklasan Police (${windowDays} gun)`, value: upcomingPolicies },
        { field: 'Gecikmis Odeme', value: overduePayments },
      ],
    };

    const chart: AiChart = {
      title: 'Calisan Durum Ozeti',
      type: 'doughnut',
      labels: ['Policeler', 'Dokumanlar', 'Yaklasan', 'Gecikmis'],
      datasets: [
        {
          label: 'Adet',
          data: [
            employee._count.policies,
            employee._count.documents,
            upcomingPolicies,
            overduePayments,
          ],
          backgroundColor: ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444'],
        },
      ],
    };

    return {
      summary: `${employee.firstName} ${employee.lastName} icin ozet bilgiler listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: [
        'Gecikmis odeme varsa hatirlatma gonderin.',
        'Yaklasan policeler icin yenileme tekliflerini planlayin.',
      ],
    };
  }

  private async getDepartmentRisk(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { departmentName?: string | null; windowDays?: number | null },
  ): Promise<AiResponse> {
    const departmentName = llmPlan?.departmentName || this.extractName(prompt, ['departman', 'risk', 'analiz', 'liste', 'goster', 'göster']);
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || 14;
    const now = new Date();
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + windowDays);

    const departments = await this.prisma.department.findMany({
      where: {
        tenantId,
        ...(departmentName
          ? { name: { contains: departmentName, mode: 'insensitive' } }
          : {}),
      },
      select: { id: true, name: true },
    });

    if (!departments.length) {
      return {
        summary: 'Departman bulunamadi.',
        tables: [],
        charts: [],
        suggestions: ['Departman adini kontrol edin.'],
      };
    }

    const rows = await Promise.all(
      departments.map(async (department) => {
        const [employeeCount, overduePayments, upcomingPolicies] = await Promise.all([
          this.prisma.employee.count({ where: { tenantId, departmentId: department.id } }),
          this.prisma.policyPayment.count({
            where: {
              status: PaymentStatus.OVERDUE,
              policy: { employee: { departmentId: department.id } },
            },
          }),
          this.prisma.policy.count({
            where: {
              tenantId,
              employee: { departmentId: department.id },
              endDate: { gte: now, lte: upcomingTo },
              status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL] },
            },
          }),
        ]);

        const score = overduePayments * 2 + upcomingPolicies;
        return {
          department: department.name,
          employees: employeeCount,
          overdue: overduePayments,
          upcoming: upcomingPolicies,
          score,
        };
      }),
    );

    const sorted = rows.sort((a, b) => b.score - a.score);
    const table: AiTable = {
      title: 'Departman Risk Analizi',
      columns: [
        { key: 'department', label: 'Departman' },
        { key: 'employees', label: 'Calisan' },
        { key: 'overdue', label: 'Gecikme' },
        { key: 'upcoming', label: 'Yaklasan' },
        { key: 'score', label: 'Risk Skoru' },
      ],
      rows: sorted,
    };

    const chart: AiChart = {
      title: 'Departman Risk Skoru',
      type: 'bar',
      labels: sorted.slice(0, 10).map((row) => row.department),
      datasets: [
        {
          label: 'Skor',
          data: sorted.slice(0, 10).map((row) => row.score),
          backgroundColor: ['#f97316'],
        },
      ],
    };

    return {
      summary: `${sorted.length} departman icin risk skorlamasi tamamlandi.`,
      tables: [table],
      charts: [chart],
      suggestions: ['Skoru yuksek departmanlar icin odeme aksiyonlari belirleyin.'],
    };
  }

  private async getPolicyTypeDistribution(tenantId: string): Promise<AiResponse> {
    const [policies, policyTypes] = await Promise.all([
      this.prisma.policy.findMany({
        where: { tenantId },
        select: { policyTypeId: true, type: true, premium: true },
      }),
      this.prisma.policyType.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    ]);

    const typeMap = policyTypes.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});

    const aggregates = policies.reduce<Record<string, { count: number; premium: number }>>((acc, policy) => {
      const label = policy.policyTypeId ? typeMap[policy.policyTypeId] || 'Bilinmeyen' : String(policy.type);
      if (!acc[label]) acc[label] = { count: 0, premium: 0 };
      acc[label].count += 1;
      acc[label].premium += Number(policy.premium);
      return acc;
    }, {});

    const rows = Object.entries(aggregates).map(([label, value]) => ({
      type: label,
      count: value.count,
      premium: Number(value.premium.toFixed(2)),
    }));

    const table: AiTable = {
      title: 'Poliçe Turu Dagilimi',
      columns: [
        { key: 'type', label: 'Tur' },
        { key: 'count', label: 'Adet' },
        { key: 'premium', label: 'Toplam Prim' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Poliçe Turleri',
      type: 'doughnut',
      labels: rows.map((row) => row.type),
      datasets: [
        {
          label: 'Adet',
          data: rows.map((row) => row.count),
          backgroundColor: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
        },
      ],
    };

    return {
      summary: `Toplam ${policies.length} policenin tur dagilimi listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: ['En yuksek prim payina sahip turleri onceliklendirin.'],
    };
  }

  private async getCollectionForecast(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { windowDays?: number | null },
  ): Promise<AiResponse> {
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || this.getWindowDays(prompt, 30);
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + windowDays);

    const payments = await this.prisma.policyPayment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        dueDate: { gte: now, lte: end },
        policy: { tenantId },
      },
      select: { dueDate: true, amount: true },
    });

    const grouped = payments.reduce<Record<string, number>>((acc, payment) => {
      const key = payment.dueDate.toISOString().split('T')[0];
      acc[key] = (acc[key] || 0) + Number(payment.amount);
      return acc;
    }, {});

    const rows = Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount: Number(amount.toFixed(2)),
    }));

    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    const table: AiTable = {
      title: 'Beklenen Tahsilat',
      columns: [
        { key: 'date', label: 'Tarih' },
        { key: 'amount', label: 'Tutar' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Tahsilat Akisi',
      type: 'line',
      labels: rows.map((row) => row.date),
      datasets: [
        {
          label: 'Tutar',
          data: rows.map((row) => row.amount),
          borderColor: ['#22c55e'],
          backgroundColor: ['#22c55e'],
        },
      ],
    };

    return {
      summary: `Onumuzdeki ${windowDays} gunde beklenen tahsilat: ${Number(total.toFixed(2))} TRY.`,
      tables: [table],
      charts: [chart],
      suggestions: ['Nakit akisi planlamasinda bu tahsilat penceresini kullanin.'],
    };
  }

  private async getTopPayingCompanies(tenantId: string): Promise<AiResponse> {
    const grouped = await this.prisma.policy.groupBy({
      by: ['companyId'],
      where: { tenantId },
      _sum: { premium: true },
      _count: { _all: true },
      orderBy: { _sum: { premium: 'desc' } },
      take: 10,
    });

    const companyIds = grouped.map((item) => item.companyId);
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const companyMap = companies.reduce<Record<string, string>>((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});

    const rows = grouped.map((item) => ({
      company: companyMap[item.companyId] || 'Bilinmiyor',
      totalPremium: Number(item._sum.premium || 0),
      policyCount: item._count._all,
    }));

    const table: AiTable = {
      title: 'En Yuksek Prim Odeyen Sirketler',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'totalPremium', label: 'Toplam Prim' },
        { key: 'policyCount', label: 'Police Sayisi' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Toplam Prim (Top 10)',
      type: 'bar',
      labels: rows.map((row) => row.company),
      datasets: [
        {
          label: 'Prim',
          data: rows.map((row) => row.totalPremium),
          backgroundColor: ['#0ea5e9'],
        },
      ],
    };

    return {
      summary: 'En yuksek prim odeyen 10 sirket listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: ['Bu sirketler icin ozel yenileme teklifleri hazirlayin.'],
    };
  }

  private async getPendingApplications(tenantId: string): Promise<AiResponse> {
    const applications = await this.prisma.application.findMany({
      where: {
        tenantId,
        status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.IN_REVIEW, ApplicationStatus.NEEDS_INFO] },
      },
      include: {
        package: true,
        carrier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const rows = applications.map((app) => ({
      company: app.companyName,
      status: app.status,
      package: app.package?.name || '-',
      carrier: app.carrier?.name || '-',
      createdAt: app.createdAt.toISOString().split('T')[0],
    }));

    const byStatus = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const table: AiTable = {
      title: 'Bekleyen Basvurular',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'status', label: 'Durum' },
        { key: 'package', label: 'Paket' },
        { key: 'carrier', label: 'Marka' },
        { key: 'createdAt', label: 'Tarih' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Basvuru Durumlari',
      type: 'doughnut',
      labels: Object.keys(byStatus),
      datasets: [
        {
          label: 'Adet',
          data: Object.values(byStatus),
          backgroundColor: ['#f59e0b', '#0ea5e9', '#ef4444'],
        },
      ],
    };

    return {
      summary: `${rows.length} bekleyen basvuru listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: ['NEEDS_INFO basvurulari icin kullanicilara bilgilendirme gonderin.'],
    };
  }

  private async getSupportHotspots(tenantId: string): Promise<AiResponse> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { tenantId },
      select: { category: true, status: true },
    });

    const grouped = tickets.reduce<Record<string, { total: number; open: number }>>((acc, ticket) => {
      const key = ticket.category || 'Diger';
      if (!acc[key]) acc[key] = { total: 0, open: 0 };
      acc[key].total += 1;
      if (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') {
        acc[key].open += 1;
      }
      return acc;
    }, {});

    const rows = Object.entries(grouped).map(([category, counts]) => ({
      category,
      total: counts.total,
      open: counts.open,
    }));

    const table: AiTable = {
      title: 'Destek Yogunluklari',
      columns: [
        { key: 'category', label: 'Kategori' },
        { key: 'total', label: 'Toplam' },
        { key: 'open', label: 'Acik' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Destek Talepleri (Kategori)',
      type: 'doughnut',
      labels: rows.map((row) => row.category),
      datasets: [
        {
          label: 'Adet',
          data: rows.map((row) => row.total),
          backgroundColor: ['#0ea5e9', '#f59e0b', '#ef4444', '#22c55e'],
        },
      ],
    };

    return {
      summary: 'Destek talepleri kategori bazinda listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: ['En yogun kategori icin ek kapasite planlayin.'],
    };
  }

  private async getCompanyCompare(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { companyNameA?: string | null; companyNameB?: string | null; windowDays?: number | null },
  ): Promise<AiResponse> {
    const fallback = this.parseCompanyPairFromPrompt(prompt);
    const nameA = llmPlan?.companyNameA || fallback?.[0] || '';
    const nameB = llmPlan?.companyNameB || fallback?.[1] || '';

    if (!nameA || !nameB) {
      return {
        summary: 'Karsilastirma icin iki sirket adi belirtin.',
        tables: [],
        charts: [],
        suggestions: ['Acme ve Globex sirketlerini karsilastir'],
      };
    }

    const [companyA, companyB] = await Promise.all([
      this.prisma.company.findFirst({
        where: { tenantId, name: { contains: nameA, mode: 'insensitive' } },
      }),
      this.prisma.company.findFirst({
        where: { tenantId, name: { contains: nameB, mode: 'insensitive' } },
      }),
    ]);

    if (!companyA || !companyB) {
      return {
        summary: 'Karsilastirilacak sirketlerden biri bulunamadi.',
        tables: [],
        charts: [],
        suggestions: ['Sirket adlarini kontrol edin.'],
      };
    }

    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || 14;
    const now = new Date();
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + windowDays);

    const buildStats = async (companyId: string) => {
      const [employees, policies, departments, overduePayments, upcomingPolicies, premiumSum] = await Promise.all([
        this.prisma.employee.count({ where: { tenantId, companyId } }),
        this.prisma.policy.count({ where: { tenantId, companyId } }),
        this.prisma.department.count({ where: { tenantId, companyId } }),
        this.prisma.policyPayment.count({
          where: { status: PaymentStatus.OVERDUE, policy: { companyId } },
        }),
        this.prisma.policy.count({
          where: {
            tenantId,
            companyId,
            endDate: { gte: now, lte: upcomingTo },
            status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_RENEWAL] },
          },
        }),
        this.prisma.policy.aggregate({
          where: { tenantId, companyId },
          _sum: { premium: true },
        }),
      ]);

      return {
        employees,
        policies,
        departments,
        overduePayments,
        upcomingPolicies,
        totalPremium: Number(premiumSum._sum.premium || 0),
      };
    };

    const [statsA, statsB] = await Promise.all([
      buildStats(companyA.id),
      buildStats(companyB.id),
    ]);

    const rows = [
      { company: companyA.name, ...statsA },
      { company: companyB.name, ...statsB },
    ];

    const table: AiTable = {
      title: 'Sirket Karsilastirma',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'employees', label: 'Calisan' },
        { key: 'policies', label: 'Police' },
        { key: 'departments', label: 'Departman' },
        { key: 'overduePayments', label: 'Gecikme' },
        { key: 'upcomingPolicies', label: 'Yaklasan' },
        { key: 'totalPremium', label: 'Toplam Prim' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Toplam Prim Karsilastirma',
      type: 'bar',
      labels: rows.map((row) => row.company),
      datasets: [
        {
          label: 'Toplam Prim',
          data: rows.map((row) => row.totalPremium),
          backgroundColor: ['#0ea5e9'],
        },
      ],
    };

    return {
      summary: `${companyA.name} ve ${companyB.name} karsilastirmasi hazir.`,
      tables: [table],
      charts: [chart],
      suggestions: ['Prim farki yuksek olan sirket icin risk analizi yapin.'],
    };
  }

  private async getPaymentReminders(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { windowDays?: number | null },
  ): Promise<AiResponse> {
    const isToday = prompt.toLowerCase().includes('bugun') || prompt.toLowerCase().includes('today');
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || (isToday ? 0 : 3);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + windowDays);
    to.setHours(23, 59, 59, 999);

    const payments = await this.prisma.policyPayment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        OR: [
          { dueDate: { gte: from, lte: to } },
          { status: PaymentStatus.OVERDUE },
        ],
        policy: { tenantId },
      },
      include: {
        policy: { include: { company: true, employee: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 200,
    });

    const rows = payments.map((payment) => ({
      company: payment.policy.company?.name || 'Bilinmiyor',
      employee: payment.policy.employee
        ? `${payment.policy.employee.firstName} ${payment.policy.employee.lastName}`.trim()
        : 'Bilinmiyor',
      policyNo: payment.policy.policyNo,
      dueDate: payment.dueDate.toISOString().split('T')[0],
      amount: Number(payment.amount),
      status: payment.status,
    }));

    const byStatus = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const table: AiTable = {
      title: 'Odeme Hatirlatma Listesi',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'employee', label: 'Calisan' },
        { key: 'policyNo', label: 'Police No' },
        { key: 'dueDate', label: 'Vade' },
        { key: 'amount', label: 'Tutar' },
        { key: 'status', label: 'Durum' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Hatirlatma Durumlari',
      type: 'doughnut',
      labels: Object.keys(byStatus),
      datasets: [
        {
          label: 'Adet',
          data: Object.values(byStatus),
          backgroundColor: ['#0ea5e9', '#ef4444'],
        },
      ],
    };

    return {
      summary: `${rows.length} odeme icin hatirlatma listesi hazir.`,
      tables: [table],
      charts: [chart],
      suggestions: ['Hatirlatma SMS/eposta kampanyasi baslatin.'],
    };
  }

  private async getRenewalRisk(
    prompt: string,
    body: AiRequestDto,
    tenantId: string,
    llmPlan?: { windowDays?: number | null },
  ): Promise<AiResponse> {
    const windowDays = body.filters?.windowDays || llmPlan?.windowDays || this.getWindowDays(prompt, 14);
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + windowDays);

    const policies = await this.prisma.policy.findMany({
      where: {
        tenantId,
        endDate: { gte: now, lte: end },
        OR: [
          { autoRenew: false },
          { status: PolicyStatus.PENDING_RENEWAL },
        ],
      },
      include: { company: true, employee: true },
      orderBy: { endDate: 'asc' },
      take: 200,
    });

    const rows = policies.map((policy) => ({
      company: policy.company?.name || 'Bilinmiyor',
      employee: policy.employee
        ? `${policy.employee.firstName} ${policy.employee.lastName}`.trim()
        : 'Bilinmiyor',
      policyNo: policy.policyNo,
      endDate: policy.endDate.toISOString().split('T')[0],
      premium: Number(policy.premium),
      autoRenew: policy.autoRenew ? 'Evet' : 'Hayir',
    }));

    const byCompany = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.company] = (acc[row.company] || 0) + 1;
      return acc;
    }, {});

    const table: AiTable = {
      title: 'Yenileme Riski Olan Policeler',
      columns: [
        { key: 'company', label: 'Sirket' },
        { key: 'employee', label: 'Calisan' },
        { key: 'policyNo', label: 'Police No' },
        { key: 'endDate', label: 'Bitis' },
        { key: 'premium', label: 'Prim' },
        { key: 'autoRenew', label: 'Oto Yenileme' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Sirket Bazli Yenileme Riski',
      type: 'bar',
      labels: Object.keys(byCompany),
      datasets: [
        {
          label: 'Police',
          data: Object.values(byCompany),
          backgroundColor: ['#ef4444'],
        },
      ],
    };

    return {
      summary: `${rows.length} police yenileme riski listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: ['Yenileme riski yuksek policeler icin teklif gonderin.'],
    };
  }

  private async getGlobalStats(tenantId: string): Promise<AiResponse> {
    const [
      companies,
      employees,
      policies,
      activePolicies,
      pendingRenewal,
      expiredPolicies,
      paymentsOverdue,
      supportOpen,
      applicationsPending,
    ] = await Promise.all([
      this.prisma.company.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.policy.count({ where: { tenantId } }),
      this.prisma.policy.count({ where: { tenantId, status: PolicyStatus.ACTIVE } }),
      this.prisma.policy.count({ where: { tenantId, status: PolicyStatus.PENDING_RENEWAL } }),
      this.prisma.policy.count({ where: { tenantId, status: PolicyStatus.EXPIRED } }),
      this.prisma.policyPayment.count({ where: { status: PaymentStatus.OVERDUE, policy: { tenantId } } }),
      this.prisma.supportTicket.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.application.count({
        where: { tenantId, status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.IN_REVIEW, ApplicationStatus.NEEDS_INFO] } },
      }),
    ]);

    const table: AiTable = {
      title: 'Genel Sistem Ozeti',
      columns: [
        { key: 'metric', label: 'Metrik' },
        { key: 'value', label: 'Deger' },
      ],
      rows: [
        { metric: 'Sirket', value: companies },
        { metric: 'Calisan', value: employees },
        { metric: 'Police (toplam)', value: policies },
        { metric: 'Police (aktif)', value: activePolicies },
        { metric: 'Police (yenileme bekleyen)', value: pendingRenewal },
        { metric: 'Police (expired)', value: expiredPolicies },
        { metric: 'Gecikmis odeme', value: paymentsOverdue },
        { metric: 'Acik destek talebi', value: supportOpen },
        { metric: 'Bekleyen basvuru', value: applicationsPending },
      ],
    };

    const chart: AiChart = {
      title: 'Police Durumlari',
      type: 'doughnut',
      labels: ['Aktif', 'Yenileme', 'Expired'],
      datasets: [
        {
          label: 'Adet',
          data: [activePolicies, pendingRenewal, expiredPolicies],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        },
      ],
    };

    return {
      summary: 'Sistemin genel metrikleri listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: [
        'Gecikmis odeme sayisi yuksekse tahsilat ekibini bilgilendirin.',
        'Bekleyen basvurular icin is akisi optimize edin.',
      ],
    };
  }

  private async getApplicationsFunnel(tenantId: string): Promise<AiResponse> {
    const grouped = await this.prisma.application.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });

    const rows = grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    const table: AiTable = {
      title: 'Basvuru Durum Dagilimi',
      columns: [
        { key: 'status', label: 'Durum' },
        { key: 'count', label: 'Adet' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Basvuru Funnel',
      type: 'doughnut',
      labels: rows.map((row) => row.status),
      datasets: [
        {
          label: 'Adet',
          data: rows.map((row) => row.count),
          backgroundColor: ['#0ea5e9', '#f59e0b', '#ef4444', '#22c55e', '#6366f1', '#14b8a6', '#f97316'],
        },
      ],
    };

    return {
      summary: 'Basvurularin durum dagilimi listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: ['IN_REVIEW ve NEEDS_INFO basvurulari icin aksiyon planlayin.'],
    };
  }

  private async getCorporatePolicyPipeline(tenantId: string): Promise<AiResponse> {
    const grouped = await this.prisma.corporatePolicy.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });

    const now = new Date();
    const upcomingTo = new Date();
    upcomingTo.setDate(now.getDate() + 30);

    const upcomingActive = await this.prisma.corporatePolicy.count({
      where: {
        tenantId,
        status: CorporatePolicyStatus.ACTIVE,
        endDate: { gte: now, lte: upcomingTo },
      },
    });

    const rows = grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
      endingSoon: item.status === CorporatePolicyStatus.ACTIVE ? upcomingActive : 0,
    }));

    const table: AiTable = {
      title: 'Kurumsal Police Pipeline',
      columns: [
        { key: 'status', label: 'Durum' },
        { key: 'count', label: 'Adet' },
        { key: 'endingSoon', label: '30 Gun Icinde Biten' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Kurumsal Police Durumlari',
      type: 'bar',
      labels: rows.map((row) => row.status),
      datasets: [
        {
          label: 'Adet',
          data: rows.map((row) => row.count),
          backgroundColor: ['#22c55e'],
        },
      ],
    };

    return {
      summary: 'Kurumsal policeler icin pipeline ozeti hazir.',
      tables: [table],
      charts: [chart],
      suggestions: ['30 gun icinde bitecek kurumsal policeler icin yenileme planlayin.'],
    };
  }

  private async getBulkOperationsStatus(tenantId: string): Promise<AiResponse> {
    const [grouped, operations] = await Promise.all([
      this.prisma.bulkOperation.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      this.prisma.bulkOperation.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { company: true },
      }),
    ]);

    const rows = operations.map((operation) => ({
      type: operation.type,
      status: operation.status,
      company: operation.company?.name || '-',
      totalRows: operation.totalRows,
      processedRows: operation.processedRows,
      errorCount: operation.errorCount,
      createdAt: this.formatDate(operation.createdAt),
    }));

    const table: AiTable = {
      title: 'Bulk Islem Durumu',
      columns: [
        { key: 'type', label: 'Tip' },
        { key: 'status', label: 'Durum' },
        { key: 'company', label: 'Sirket' },
        { key: 'totalRows', label: 'Toplam Satir' },
        { key: 'processedRows', label: 'Islenen' },
        { key: 'errorCount', label: 'Hata' },
        { key: 'createdAt', label: 'Tarih' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Bulk Operasyon Dagilimi',
      type: 'doughnut',
      labels: grouped.map((item) => item.status),
      datasets: [
        {
          label: 'Adet',
          data: grouped.map((item) => item._count._all),
          backgroundColor: ['#0ea5e9', '#f59e0b', '#ef4444', '#22c55e', '#6366f1'],
        },
      ],
    };

    return {
      summary: `Son ${rows.length} bulk operasyon listelendi.`,
      tables: [table],
      charts: [chart],
      suggestions: ['FAILED/ PARTIAL_SUCCESS operasyonlari icin yeniden deneme planlayin.'],
    };
  }

  private async getPaymentHealth(tenantId: string): Promise<AiResponse> {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    const to = new Date();

    const payments = await this.prisma.policyPayment.findMany({
      where: {
        policy: { tenantId },
        dueDate: { gte: from, lte: to },
      },
      select: { status: true, amount: true },
    });

    const overdueTotal = await this.prisma.policyPayment.count({
      where: { status: PaymentStatus.OVERDUE, policy: { tenantId } },
    });

    const buckets = payments.reduce<Record<string, { count: number; amount: number }>>((acc, payment) => {
      const key = payment.status;
      if (!acc[key]) {
        acc[key] = { count: 0, amount: 0 };
      }
      acc[key].count += 1;
      acc[key].amount += Number(payment.amount);
      return acc;
    }, {});

    const rows = Object.entries(buckets).map(([status, value]) => ({
      status,
      count: value.count,
      amount: Number(value.amount.toFixed(2)),
    }));

    rows.push({ status: 'OVERDUE_TOTAL', count: overdueTotal, amount: 0 });

    const table: AiTable = {
      title: 'Odeme Sagligi (Son 30 Gun)',
      columns: [
        { key: 'status', label: 'Durum' },
        { key: 'count', label: 'Adet' },
        { key: 'amount', label: 'Tutar' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Odeme Durum Dagilimi',
      type: 'doughnut',
      labels: rows.filter((row) => row.status !== 'OVERDUE_TOTAL').map((row) => row.status),
      datasets: [
        {
          label: 'Adet',
          data: rows.filter((row) => row.status !== 'OVERDUE_TOTAL').map((row) => row.count),
          backgroundColor: ['#22c55e', '#0ea5e9', '#ef4444', '#f59e0b'],
        },
      ],
    };

    return {
      summary: 'Son 30 gun odeme sagligi raporu hazir.',
      tables: [table],
      charts: [chart],
      suggestions: ['OVERDUE odemeler icin otomatik hatirlatma kurallari olusturun.'],
    };
  }

  private async getPremiumTrend(tenantId: string): Promise<AiResponse> {
    const months = this.getMonthSeries(12);
    const start = new Date(months[0].year, months[0].month, 1);

    const policies = await this.prisma.policy.findMany({
      where: {
        tenantId,
        startDate: { gte: start },
      },
      select: { startDate: true, premium: true },
    });

    const totals = months.reduce<Record<string, number>>((acc, month) => {
      acc[month.key] = 0;
      return acc;
    }, {});

    policies.forEach((policy) => {
      const key = this.getMonthKey(policy.startDate);
      if (key in totals) {
        totals[key] += Number(policy.premium);
      }
    });

    const rows = months.map((month) => ({
      month: month.label,
      premium: Number(totals[month.key].toFixed(2)),
    }));

    const table: AiTable = {
      title: 'Aylik Prim Trendi',
      columns: [
        { key: 'month', label: 'Ay' },
        { key: 'premium', label: 'Toplam Prim' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Prim Trendi (12 Ay)',
      type: 'line',
      labels: rows.map((row) => row.month),
      datasets: [
        {
          label: 'Prim',
          data: rows.map((row) => row.premium),
          borderColor: ['#0ea5e9'],
          backgroundColor: ['#0ea5e9'],
        },
      ],
    };

    return {
      summary: 'Prim gelir trendi listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: ['Dusus olan aylarda kampanya planlayin.'],
    };
  }

  private async getGrowthTrends(tenantId: string): Promise<AiResponse> {
    const months = this.getMonthSeries(6);
    const start = new Date(months[0].year, months[0].month, 1);

    const [companies, employees, policies] = await Promise.all([
      this.prisma.company.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.employee.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.policy.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    const companyCounts = months.reduce<Record<string, number>>((acc, month) => {
      acc[month.key] = 0;
      return acc;
    }, {});
    const employeeCounts = { ...companyCounts };
    const policyCounts = { ...companyCounts };

    companies.forEach((item) => {
      const key = this.getMonthKey(item.createdAt);
      if (key in companyCounts) companyCounts[key] += 1;
    });
    employees.forEach((item) => {
      const key = this.getMonthKey(item.createdAt);
      if (key in employeeCounts) employeeCounts[key] += 1;
    });
    policies.forEach((item) => {
      const key = this.getMonthKey(item.createdAt);
      if (key in policyCounts) policyCounts[key] += 1;
    });

    const rows = months.map((month) => ({
      month: month.label,
      companies: companyCounts[month.key],
      employees: employeeCounts[month.key],
      policies: policyCounts[month.key],
    }));

    const table: AiTable = {
      title: 'Buyume Trendleri (6 Ay)',
      columns: [
        { key: 'month', label: 'Ay' },
        { key: 'companies', label: 'Sirket' },
        { key: 'employees', label: 'Calisan' },
        { key: 'policies', label: 'Police' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Aylik Buyume',
      type: 'line',
      labels: rows.map((row) => row.month),
      datasets: [
        {
          label: 'Sirket',
          data: rows.map((row) => row.companies),
          borderColor: ['#22c55e'],
          backgroundColor: ['#22c55e'],
        },
        {
          label: 'Calisan',
          data: rows.map((row) => row.employees),
          borderColor: ['#0ea5e9'],
          backgroundColor: ['#0ea5e9'],
        },
        {
          label: 'Police',
          data: rows.map((row) => row.policies),
          borderColor: ['#f59e0b'],
          backgroundColor: ['#f59e0b'],
        },
      ],
    };

    return {
      summary: 'Son 6 ay buyume trendleri hazir.',
      tables: [table],
      charts: [chart],
      suggestions: ['Buyume ivmesi dusen segmentleri analiz edin.'],
    };
  }

  private async getTopRiskyEmployees(tenantId: string): Promise<AiResponse> {
    const now = new Date();
    const overdueFrom = new Date();
    overdueFrom.setDate(now.getDate() - 90);

    const payments = await this.prisma.policyPayment.findMany({
      where: {
        status: PaymentStatus.OVERDUE,
        dueDate: { gte: overdueFrom },
        policy: { tenantId },
      },
      select: {
        amount: true,
        policy: {
          select: {
            employeeId: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const byEmployee = payments.reduce<Record<string, { name: string; company: string; count: number; amount: number }>>(
      (acc, payment) => {
        const employeeId = payment.policy.employeeId;
        if (!employeeId || !payment.policy.employee) return acc;
        const name = `${payment.policy.employee.firstName} ${payment.policy.employee.lastName}`.trim();
        const company = payment.policy.employee.company?.name || 'Bilinmiyor';
        if (!acc[employeeId]) {
          acc[employeeId] = { name, company, count: 0, amount: 0 };
        }
        acc[employeeId].count += 1;
        acc[employeeId].amount += Number(payment.amount);
        return acc;
      },
      {},
    );

    const rows = Object.values(byEmployee)
      .map((item) => ({
        employee: item.name,
        company: item.company,
        overdueCount: item.count,
        overdueAmount: Number(item.amount.toFixed(2)),
        score: item.count * 3 + Math.round(item.amount / 1000),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const table: AiTable = {
      title: 'Riskli Calisanlar (90 Gun)',
      columns: [
        { key: 'employee', label: 'Calisan' },
        { key: 'company', label: 'Sirket' },
        { key: 'overdueCount', label: 'Gecikme' },
        { key: 'overdueAmount', label: 'Tutar' },
        { key: 'score', label: 'Skor' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Gecikme Skoru (Top 10 Calisan)',
      type: 'bar',
      labels: rows.map((row) => row.employee),
      datasets: [
        {
          label: 'Skor',
          data: rows.map((row) => row.score),
          backgroundColor: ['#ef4444'],
        },
      ],
    };

    return {
      summary: 'En riskli calisanlar listelendi.',
      tables: [table],
      charts: [chart],
      suggestions: ['Gecikme riski yuksek calisanlar icin hatirlatma planlayin.'],
    };
  }

  private async getPaymentsAging(tenantId: string): Promise<AiResponse> {
    const now = new Date();
    const payments = await this.prisma.policyPayment.findMany({
      where: {
        status: PaymentStatus.OVERDUE,
        policy: { tenantId },
      },
      select: { dueDate: true, amount: true },
    });

    const buckets = {
      '0-7': { count: 0, amount: 0 },
      '8-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61+': { count: 0, amount: 0 },
    };

    payments.forEach((payment) => {
      const days = Math.floor((now.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(payment.amount);
      if (days <= 7) {
        buckets['0-7'].count += 1;
        buckets['0-7'].amount += amount;
      } else if (days <= 30) {
        buckets['8-30'].count += 1;
        buckets['8-30'].amount += amount;
      } else if (days <= 60) {
        buckets['31-60'].count += 1;
        buckets['31-60'].amount += amount;
      } else {
        buckets['61+'].count += 1;
        buckets['61+'].amount += amount;
      }
    });

    const rows = Object.entries(buckets).map(([bucket, value]) => ({
      bucket,
      count: value.count,
      amount: Number(value.amount.toFixed(2)),
    }));

    const table: AiTable = {
      title: 'Gecikmis Odeme Yaslandirma',
      columns: [
        { key: 'bucket', label: 'Gun Araligi' },
        { key: 'count', label: 'Adet' },
        { key: 'amount', label: 'Tutar' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Gecikmis Odeme Dagilimi',
      type: 'bar',
      labels: rows.map((row) => row.bucket),
      datasets: [
        {
          label: 'Tutar',
          data: rows.map((row) => row.amount),
          backgroundColor: ['#ef4444'],
        },
      ],
    };

    return {
      summary: `Gecikmis odemeler yaslandirma raporu olusturuldu.`,
      tables: [table],
      charts: [chart],
      suggestions: ['60+ gun gecikmeleri icin ozel tahsilat akisi acin.'],
    };
  }

  private async getActivityFeed(tenantId: string): Promise<AiResponse> {
    const activities = await this.prisma.activity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const rows = activities.map((activity) => ({
      time: this.formatDate(activity.createdAt),
      type: activity.type,
      title: activity.title,
      user: activity.userName || '-',
      target: activity.targetType || '-',
    }));

    const table: AiTable = {
      title: 'Son Islem Gecmisi',
      columns: [
        { key: 'time', label: 'Tarih' },
        { key: 'type', label: 'Tur' },
        { key: 'title', label: 'Baslik' },
        { key: 'user', label: 'Kullanici' },
        { key: 'target', label: 'Hedef' },
      ],
      rows,
    };

    return {
      summary: `Son ${rows.length} islem listelendi.`,
      tables: [table],
      charts: [],
      suggestions: ['Anormal aktiviteler icin detay log incelemesi yapin.'],
    };
  }

  private async getPolicyStatusSummary(tenantId: string): Promise<AiResponse> {
    const grouped = await this.prisma.policy.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { premium: true },
    });

    const rows = grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
      premium: Number(item._sum.premium || 0),
    }));

    const table: AiTable = {
      title: 'Police Durum Ozeti',
      columns: [
        { key: 'status', label: 'Durum' },
        { key: 'count', label: 'Adet' },
        { key: 'premium', label: 'Toplam Prim' },
      ],
      rows,
    };

    const chart: AiChart = {
      title: 'Police Durum Dagilimi',
      type: 'doughnut',
      labels: rows.map((row) => row.status),
      datasets: [
        {
          label: 'Adet',
          data: rows.map((row) => row.count),
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#6366f1'],
        },
      ],
    };

    return {
      summary: 'Police durum ozeti hazir.',
      tables: [table],
      charts: [chart],
      suggestions: ['Expired policeler icin yenileme kampanyasi hazirlayin.'],
    };
  }

  private async getRecentEntities(tenantId: string): Promise<AiResponse> {
    const [companies, employees, policies] = await Promise.all([
      this.prisma.company.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.employee.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.policy.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { company: true, employee: true },
      }),
    ]);

    const table: AiTable = {
      title: 'Son Eklenen Kayitlar',
      columns: [
        { key: 'type', label: 'Tip' },
        { key: 'name', label: 'Isim' },
        { key: 'date', label: 'Tarih' },
      ],
      rows: [
        ...companies.map((company) => ({
          type: 'Sirket',
          name: company.name,
          date: this.formatDate(company.createdAt),
        })),
        ...employees.map((employee) => ({
          type: 'Calisan',
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          date: this.formatDate(employee.createdAt),
        })),
        ...policies.map((policy) => ({
          type: 'Police',
          name: `${policy.policyNo} (${policy.company?.name || 'Bilinmiyor'})`,
          date: this.formatDate(policy.createdAt),
        })),
      ],
    };

    return {
      summary: 'Son kayitlar listelendi.',
      tables: [table],
      charts: [],
      suggestions: ['Yeni eklenen kayitlari kontrol edin.'],
    };
  }

  private formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }

  private getMonthKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getMonthSeries(monthCount: number) {
    const months: { key: string; label: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = monthCount - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = this.getMonthKey(date);
      months.push({ key, label: key, year: date.getFullYear(), month: date.getMonth() });
    }
    return months;
  }

  private parseCompanyPairFromPrompt(prompt: string) {
    const cleaned = prompt
      .replace(/(sirket|şirket|firma|karsilastir|karşılaştır|analiz|rapor|ver|goster|göster)/gi, '')
      .trim();
    const match = cleaned.match(/(.+?)\s+(ve|ile|vs)\s+(.+)/i);
    if (!match) {
      return null;
    }
    return [match[1].trim(), match[3].trim()];
  }

  private extractName(prompt: string, keywords: string[]) {
    let text = prompt;
    keywords.forEach((keyword) => {
      text = text.replace(new RegExp(keyword, 'gi'), '');
    });
    return text.replace(/\s+/g, ' ').trim();
  }

  private countByCompany(companyIds: (string | null)[]) {
    return companyIds.reduce<Record<string, number>>((acc, id) => {
      if (!id) return acc;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
  }

  private async readSseText(response: Response) {
    if (!response.body) {
      return '';
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let result = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('data:')) {
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') continue;
          result += data;
          continue;
        }
        result += trimmed;
      }
    }

    if (buffer.trim()) {
      result += buffer.trim();
    }

    return result.trim();
  }

  private parseJsonFromText(text: string): any | undefined {
    try {
      return JSON.parse(text);
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) {
        return undefined;
      }
      const jsonText = text.slice(start, end + 1);
      try {
        return JSON.parse(jsonText);
      } catch {
        return undefined;
      }
    }
  }
}
