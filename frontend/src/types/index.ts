export type ExtractionType = 'DNA' | 'RNA' | 'Total Nucleic Acid'
export type GelResult = 'pass' | 'fail' | 'weak' | 'multiple_bands'
export type NGSPlatform = 'Illumina' | 'ONT' | 'PacBio' | 'Other'
export type SangerDirection = 'forward' | 'reverse' | 'both'

export interface User {
  id: number
  username: string
  full_name?: string
  email?: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}

// ── Extraction Runs ──────────────────────────────────────────────

export interface Extraction {
  id: number
  run_id: number
  specimen_code: string
  input_quantity?: number
  input_quantity_unit?: string
  yield_ng_ul?: number
  a260_280?: number
  a260_230?: number
  rin_score?: number
  storage_location?: string
  notes?: string
}

export interface ExtractionCreate {
  specimen_code: string
  input_quantity?: number
  input_quantity_unit?: string
  yield_ng_ul?: number
  a260_280?: number
  a260_230?: number
  rin_score?: number
  storage_location?: string
  notes?: string
}

export interface ExtractionUpdate extends Partial<ExtractionCreate> {}

export interface ExtractionRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  kit?: string
  extraction_type?: ExtractionType
  elution_volume_ul?: number
  protocol_notes?: string
  notes?: string
  created_at: string
  sample_count: number
  samples?: Extraction[]
}

export interface ExtractionRunCreate {
  run_date?: string
  operator_id?: number
  kit?: string
  extraction_type?: ExtractionType
  elution_volume_ul?: number
  protocol_notes?: string
  notes?: string
}

export interface ExtractionRunUpdate extends Partial<ExtractionRunCreate> {}

// ── PCR Runs ─────────────────────────────────────────────────────

export interface PCRSample {
  id: number
  run_id: number
  extraction_id?: number
  extraction?: Extraction
  specimen_code?: string
  gel_result?: GelResult
  notes?: string
}

export interface PCRSampleCreate {
  extraction_id?: number
  specimen_code?: string
  gel_result?: GelResult
  notes?: string
}

export interface PCRSampleUpdate extends Partial<PCRSampleCreate> {}

export interface PCRRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  target_region?: string
  primer_f?: string
  primer_r?: string
  annealing_temp_c?: number
  cycles?: number
  polymerase?: string
  amplicon_size_bp?: number
  notes?: string
  created_at: string
  sample_count: number
  samples?: PCRSample[]
}

export interface PCRRunCreate {
  run_date?: string
  operator_id?: number
  target_region?: string
  primer_f?: string
  primer_r?: string
  annealing_temp_c?: number
  cycles?: number
  polymerase?: string
  amplicon_size_bp?: number
  notes?: string
}

export interface PCRRunUpdate extends Partial<PCRRunCreate> {}

// ── Sanger Runs ──────────────────────────────────────────────────

export interface SangerSample {
  id: number
  run_id: number
  pcr_sample_id?: number
  pcr_sample?: PCRSample
  specimen_code?: string
  sequence_length_bp?: number
  output_file_path?: string
  quality_notes?: string
  notes?: string
}

export interface SangerSampleCreate {
  pcr_sample_id?: number
  specimen_code?: string
  sequence_length_bp?: number
  output_file_path?: string
  quality_notes?: string
  notes?: string
}

export interface SangerSampleUpdate extends Partial<SangerSampleCreate> {}

export interface SangerRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  primer?: string
  direction?: SangerDirection
  service_provider?: string
  order_id?: string
  notes?: string
  created_at: string
  sample_count: number
  samples?: SangerSample[]
}

export interface SangerRunCreate {
  run_date?: string
  operator_id?: number
  primer?: string
  direction?: SangerDirection
  service_provider?: string
  order_id?: string
  notes?: string
}

export interface SangerRunUpdate extends Partial<SangerRunCreate> {}

// ── Library Prep Runs ────────────────────────────────────────────

export interface LibraryPrep {
  id: number
  run_id: number
  extraction_id?: number
  extraction?: Extraction
  specimen_code?: string
  index_i7?: string
  index_i5?: string
  input_ng?: number
  average_fragment_size_bp?: number
  library_concentration_ng_ul?: number
  sample_name?: string
  notes?: string
}

export interface LibraryPrepCreate {
  extraction_id?: number
  specimen_code?: string
  index_i7?: string
  index_i5?: string
  input_ng?: number
  average_fragment_size_bp?: number
  library_concentration_ng_ul?: number
  sample_name?: string
  notes?: string
}

export interface LibraryPrepUpdate extends Partial<LibraryPrepCreate> {}

export interface LibraryPrepRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  kit?: string
  target_region?: string
  primer_f?: string
  primer_r?: string
  notes?: string
  created_at: string
  sample_count: number
  samples?: LibraryPrep[]
}

export interface LibraryPrepRunCreate {
  run_date?: string
  operator_id?: number
  kit?: string
  target_region?: string
  primer_f?: string
  primer_r?: string
  notes?: string
}

export interface LibraryPrepRunUpdate extends Partial<LibraryPrepRunCreate> {}

// ── NGS Runs ─────────────────────────────────────────────────────

export interface NGSRunLibrary {
  id: number
  ngs_run_id: number
  library_prep_id?: number
  specimen_code?: string
  sample_name?: string
  library_prep?: LibraryPrep
}

export interface NGSRun {
  id: number
  platform: NGSPlatform
  instrument?: string
  run_id?: string
  date?: string
  operator_id?: number
  operator?: User
  flow_cell_id?: string
  reagent_kit?: string
  output_path?: string
  total_reads?: number
  q30_percent?: number
  mean_read_length_bp?: number
  notes?: string
  libraries: NGSRunLibrary[]
  created_at: string
}

export interface NGSRunCreate {
  platform: NGSPlatform
  instrument?: string
  run_id?: string
  date?: string
  operator_id?: number
  flow_cell_id?: string
  reagent_kit?: string
  output_path?: string
  total_reads?: number
  q30_percent?: number
  mean_read_length_bp?: number
  notes?: string
  libraries: { library_prep_id?: number; specimen_code?: string; sample_name?: string }[]
}

export interface NGSRunUpdate extends Partial<NGSRunCreate> {}

// ── Shared ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface Stats {
  extraction_runs: number
  extractions: number
  pcr_runs: number
  pcr_samples: number
  sanger_runs: number
  sanger_samples: number
  library_prep_runs: number
  library_preps: number
  ngs_runs: number
}
