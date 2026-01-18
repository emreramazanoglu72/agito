# ADR-001: Moduler Monolit ve Domain Ayrimi

## Status
Accepted

## Date
2026-01-18

## Decision Makers
- Developer – Senior Frontend Developer

## Technical Scope
Architecture

---

## Context

Bu bölümde, kararın neden gerekli olduğu açıkça tanımlanır.

- Mevcut mimari durum: Ürün hem admin hem müşteri tarafında birden fazla domaini kapsıyor.
- Ortaya çıkan problem veya ihtiyaç: Mikroservis maliyeti erken aşamada riskli.
- İş hedefleri ve teknik kısıtlar: Hızlı geliştirme ve deployment.
- Regülasyon, güvenlik veya performans gereksinimleri: Yok.
- Varsayımlar ve bağımlılıklar: NestJS framework.

Amaç:  
Bu ADR okunurken **"neden bu karara ihtiyaç duyulduğu"** net biçimde anlaşılmalıdır.

---

## Decision

Bu bölümde **alınan karar açık, kısa ve kesin** şekilde ifade edilir.

- Ne yapılacak? Modüler monolit yaklaşımı benimsenecek.
- Hangi teknoloji / yaklaşım / mimari seçildi? NestJS üzerinde her domain ayrı controller/service seti.
- Kapsam dışı bırakılan unsurlar: Mikroservisler.

> Örnek:  
> Sistem, istemci tarafı veri senkronizasyonu için **TanStack Query** kullanacaktır.

---

## Alternatives Considered

Değerlendirilen ancak seçilmeyen alternatifler burada listelenir.

### Alternative 1: Mikroservis Mimarisi
**Description:**  
Her domain ayrı servis olarak deploy edilir.

**Pros**
- Ölçeklenebilirlik
- Bağımsızlık

**Cons**
- Yüksek karmaşıklık
- Erken aşama maliyeti

---

### Alternative 2: Monolitik Uygulama
**Description:**  
Tek bir uygulama olarak geliştirme.

**Pros**
- Basitlik

**Cons**
- Bakım zorluğu
- Ölçeklenebilirlik eksik

---

## Rationale

Kararın **neden bu şekilde alındığı** teknik ve iş perspektifinden açıklanır.

- Alternatiflerin neden elendiği: Mikroservis erken aşamada riskli, monolit bakım zor.
- Performans, bakım maliyeti, ölçeklenebilirlik etkileri: Deployment basit, yeni modüller kolay eklenir.
- Ekip yetkinlikleri ile uyum: NestJS deneyimi var.
- Uzun vadeli ürün stratejisine katkısı: Gelecekte servis ayrımı için sınırlar net.

---

## Consequences

Bu kararın **olumlu ve olumsuz etkileri** açıkça belirtilir.

### Positive Consequences
- Yeni modüller kolay eklenir.
- Deployment basit kalır.
- Daha sonra servis ayrımı için sınırlar net kalır.

### Negative Consequences
- Tek noktada failure riski.
- Ölçeklendirme sınırlı.

---

## Impacted Areas

Bu kararın doğrudan veya dolaylı olarak etkilediği alanlar:

- Codebase: Backend modüller.
- Deployment / CI-CD: Basitleşir.
- Monitoring & Observability: Tek servis.
- Security: Tenant izolasyonu.
- Team Workflow: Monolit geliştirme.
- Cost: Düşük başlangıç maliyeti.

---

## Implementation Notes

Uygulama sırasında dikkat edilmesi gereken teknik detaylar:

- Konfigürasyonlar: NestJS modüller.
- Standartlar: Domain bazlı ayrım.
- Kodlama prensipleri: SOLID.
- Migration adımları: Yok.
- Backward compatibility durumu: Yok.

---

## Validation & Metrics

Kararın doğru çalıştığının nasıl ölçüleceği tanımlanır.

- Performans metrikleri: Response time.
- Error rate: <1%.
- Kullanıcı deneyimi ölçümleri: Onboarding hızı.
- İzleme araçları: Logs.

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|----|----|----|----|
| Monolit büyümesi | High | Medium | Düzenli refactoring |
| Failure etkisi | High | Low | Monitoring |

---

## Security & Compliance Considerations

- Veri güvenliği etkileri: Tenant izolasyonu.
- KVKK / GDPR / ISO uyumluluğu: Uygulanabilir.
- Yetkilendirme ve erişim kontrolleri: Rol bazlı.

---

## Open Questions

Henüz netleşmemiş konular:

- Gelecekte mikroservis geçişi.
- Ölçeklendirme ihtiyaçları.

---

## Related Documents

- RFC-XXX
- PRD-XXX
- System Design Diagram
- Tech Spec

---

## Revision History

| Date | Author | Change |
|----|----|----|
| 2026-01-18 | Developer | Initial version |