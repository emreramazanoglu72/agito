# ADR-004: Postgres Ana Kaynak, Elasticsearch Arama Aynasi

## Status
Accepted

## Date
2026-01-18

## Decision Makers
- Developer – Senior Frontend Developer

## Technical Scope
Data | Backend

---

## Context

Çalışan ve poliçe aramaları fuzzy matching gerektiriyor.

---

## Decision

Transactional veri Postgres'te kalır, arama için Elasticsearch indexleri dual-write ile güncellenir.

---

## Alternatives Considered

### Alternative 1: Sadece Postgres
**Description:**  
Full-text search in Postgres.

**Pros**
- Basit

**Cons**
- Fuzzy search zayıf

---

### Alternative 2: Sadece Elasticsearch
**Description:**  
ES as primary.

**Pros**
- Güçlü search

**Cons**
- Transactional eksik

---

## Rationale

Hızlı arama sağlanır. Dual-write için hata loglama gerekir.

---

## Consequences

### Positive Consequences
- Hızlı arama.

### Negative Consequences
- Dual-write complexity.

---

## Impacted Areas

- Data: Postgres + ES.
- Codebase: Sync logic.

---

## Implementation Notes

- Dual-write hooks.

---

## Validation & Metrics

- Search performance.

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|----|----|----|----|
| Sync failure | High | Medium | Monitoring |

---

## Security & Compliance Considerations

- Data consistency.

---

## Open Questions

- Sync reliability.

---

## Related Documents

- Data Architecture

---

## Revision History

| Date | Author | Change |
|----|----|----|
| 2026-01-18 | Developer | Initial version |