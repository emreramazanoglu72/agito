# ADR-003: DTO + Zod Validasyon Katmani

## Status
Accepted

## Date
2026-01-18

## Decision Makers
- Developer – Senior Frontend Developer

## Technical Scope
Backend

---

## Context

Harici payloadlar tutarsızdır ve sadece TypeScript tipleri yeterli değildir.

---

## Decision

Backend controller katmanında Zod ile runtime validasyon uygulanır. DTO'lar API dokümantasyonu için korunur.

---

## Alternatives Considered

### Alternative 1: Sadece TypeScript
**Description:**  
Type-only validation.

**Pros**
- Basit

**Cons**
- Runtime validation yok

---

### Alternative 2: Joi
**Description:**  
Joi library.

**Pros**
- Güçlü

**Cons**
- Ek dependency

---

## Rationale

Hatalar erken yakalanır. Client-API contract netleşir.

---

## Consequences

### Positive Consequences
- Erken hata yakalama.
- API contract net.

### Negative Consequences
- Ek validation overhead.

---

## Impacted Areas

- Codebase: Backend controllers.
- Security: Input validation.

---

## Implementation Notes

- Zod schemas in DTOs.

---

## Validation & Metrics

- Error rate: Validation errors.

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|----|----|----|----|
| Schema mismatch | Medium | Low | Tests |

---

## Security & Compliance Considerations

- Input sanitization.

---

## Open Questions

- Schema versioning.

---

## Related Documents

- API Spec

---

## Revision History

| Date | Author | Change |
|----|----|----|
| 2026-01-18 | Developer | Initial version |