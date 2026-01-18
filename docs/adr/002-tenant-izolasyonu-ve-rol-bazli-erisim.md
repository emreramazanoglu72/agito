# ADR-002: Tenant Izolasyonu ve Rol Bazli Erisim

## Status
Accepted

## Date
2026-01-18

## Decision Makers
- Developer – Senior Frontend Developer

## Technical Scope
Security | Architecture

---

## Context

Bu bölümde, kararın neden gerekli olduğu açıkça tanımlanır.

- Mevcut mimari durum: Kurumsal sigorta yapısı multi-tenant çalışır.
- Ortaya çıkan problem veya ihtiyaç: Veri sızıntısı kabul edilemez.
- İş hedefleri ve teknik kısıtlar: Güvenlik ve uyumluluk.
- Regülasyon, güvenlik veya performans gereksinimleri: KVKK, GDPR.
- Varsayımlar ve bağımlılıklar: TenantId bazlı sorgular.

Amaç:  
Bu ADR okunurken **"neden bu karara ihtiyaç duyulduğu"** net biçimde anlaşılmalıdır.

---

## Decision

Bu bölümde **alınan karar açık, kısa ve kesin** şekilde ifade edilir.

- Ne yapılacak? TenantId temelli sorgular zorunlu hale getirilecek.
- Hangi teknoloji / yaklaşım / mimari seçildi? Rol göre yetkilendirme.
- Kapsam dışı bırakılan unsurlar: UI izolasyonu.

---

## Alternatives Considered

### Alternative 1: Shared Database
**Description:**  
Tek veritabanı, tenantId ile ayrım.

**Pros**
- Basit

**Cons**
- Sızıntı riski

---

### Alternative 2: Separate Databases
**Description:**  
Her tenant ayrı DB.

**Pros**
- Güvenlik

**Cons**
- Maliyet

---

## Rationale

- Alternatiflerin neden elendiği: Shared DB riskli, separate DB maliyetli.
- Güvenlik artar, sorgu maliyeti artar ancak yasal uyumluluk sağlanır.

---

## Consequences

### Positive Consequences
- Güvenlik artar.
- Yasal uyumluluk.

### Negative Consequences
- Sorgu maliyeti artar.

---

## Impacted Areas

- Codebase: Backend queries.
- Security: Tenant isolation.
- Compliance: KVKK.

---

## Implementation Notes

- Konfigürasyonlar: TenantId middleware.
- Standartlar: Rol bazlı guards.

---

## Validation & Metrics

- Error rate: Sızıntı olayları.
- İzleme: Audit logs.

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|----|----|----|----|
| Sızıntı | High | Low | Encryption |

---

## Security & Compliance Considerations

- KVKK uyumluluğu: Tenant isolation.

---

## Open Questions

- UI level isolation.

---

## Related Documents

- Security Spec

---

## Revision History

| Date | Author | Change |
|----|----|----|
| 2026-01-18 | Developer | Initial version |