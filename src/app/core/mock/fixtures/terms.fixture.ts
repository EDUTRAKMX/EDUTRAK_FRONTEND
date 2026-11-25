import { Term } from '../../../shared/models/academic.model';

/** Datos ficticios. Los UUID son inventados y estables para mantener relaciones entre módulos. */
export const TERMS_FIXTURE: readonly Term[] = [
  {
    id: '7f0c1a10-0000-4000-8000-000000000001',
    name: 'Ene–Abr 2026',
    start_date: '2026-01-12',
    end_date: '2026-04-24',
    status: 'closed',
  },
  {
    id: '7f0c1a10-0000-4000-8000-000000000002',
    name: 'Sep–Dic 2026',
    start_date: '2026-09-01',
    end_date: '2026-12-18',
    status: 'active',
  },
  {
    id: '7f0c1a10-0000-4000-8000-000000000003',
    name: 'Ene–Abr 2027',
    start_date: '2027-01-11',
    end_date: '2027-04-23',
    status: 'draft',
  },
];
