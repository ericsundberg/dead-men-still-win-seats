import type { AnnualReport } from '../../core/types';
import { makeElement } from '../../ui/dom-helpers';

export function makeAnnualReportList(
  annualReport: AnnualReport | null,
  rulerName: string | null = null,
): HTMLUListElement {
  const reportList = makeElement('ul', {
    className: 'annual-report-list',
  });

  for (const line of annualReport?.lines ?? []) {
    reportList.append(
      makeElement('li', {
        textContent: formatAnnualReportLine(line, rulerName),
      }),
    );
  }

  return reportList;
}

function formatAnnualReportLine(line: string, rulerName: string | null): string {
  if (rulerName && line.startsWith('Player: ')) {
    return `Ruler: ${rulerName}`;
  }

  return line;
}