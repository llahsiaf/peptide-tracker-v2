# Phase 9 — Personal Analytics 2.0

Phase 9 adds a dedicated Analytics screen and strengthens historical schedule calculations.

## Highlights
- Dedicated Personal Analytics screen accessible from the header.
- Date range selector: 14 / 30 / 60 days.
- Peptide filter.
- Summary metrics for logs, recorded volume, active vials and freezer stock.
- Historical schedule completion rate.
- Daily activity bar chart.
- Peptide usage ranking.
- Vial timeline with usage percentage and remaining volume.
- Analytics disclaimer: descriptive tracker data only.

## Important correctness fix
Historical schedule analytics now use `getScheduledOccurrencesBetween()` so past dates are evaluated against the current time rather than treating the start of the selected range as "now".

## Privacy
Analytics reads local tracker state only. No network call was added.
