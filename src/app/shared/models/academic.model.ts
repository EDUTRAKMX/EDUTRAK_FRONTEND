export type TermStatus = 'draft' | 'active' | 'closed';

/** Schema `Term` de api/openapi.yaml. Fechas `YYYY-MM-DD`. */
export interface Term {
  readonly id: string;
  readonly name: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly status: TermStatus;
}

/** Schema `Group` de api/openapi.yaml. */
export interface Group {
  readonly id: string;
  readonly academic_term_id: string;
  readonly academic_term_name: string;
  readonly career_id: string;
  readonly career_code: string;
  readonly career_name: string;
  readonly tutor_id: string | null;
  readonly code: string;
  readonly level: number;
}
