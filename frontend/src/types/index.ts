// ── Projects ──────────────────────────────────────────────────────

export interface ProjectMember {
  id: number
  username: string
  full_name?: string
}

export interface Project {
  id: number
  code: string
  name: string
  description?: string
  created_by_id: number
  created_at: string
  is_protected: boolean
  members: ProjectMember[]
}

export interface ProjectCreate {
  code: string
  name: string
  description?: string
  is_protected?: boolean
}

export interface ProjectUpdate {
  name?: string
  description?: string
  is_protected?: boolean
}

// ── Protocols ────────────────────────────────────────────────────

export type ProtocolCategory = 'extraction' | 'pcr' | 'sanger' | 'library_prep' | 'ngs' | 'general'

export interface ProtocolStep {
  order: number
  title: string
  description?: string
  step_type?: 'standard' | 'thermocycling'
  // Standard step fields
  duration_min?: number
  temp_c?: number
  rpm?: number
  // Thermocycling step fields
  cycles?: number
  initial_denat_temp_c?: number
  initial_denat_time_s?: number
  denat_temp_c?: number
  denat_time_s?: number
  anneal_temp_c?: number
  anneal_time_s?: number
  extend_temp_c?: number
  extend_time_s?: number
  final_extend_temp_c?: number
  final_extend_time_s?: number
}

export interface Protocol {
  id: number
  name: string
  category?: ProtocolCategory
  version?: string
  description?: string
  steps?: ProtocolStep[]
  materials?: string[]
  notes?: string
  created_by_id?: number
  created_by?: User
  created_at: string
}

export interface ProtocolCreate {
  name: string
  category?: ProtocolCategory
  version?: string
  description?: string
  steps?: ProtocolStep[]
  materials?: string[]
  notes?: string
}

export interface ProtocolUpdate extends Partial<ProtocolCreate> {}

// ── Lab Workflows ─────────────────────────────────────────────────

export type ExtractionType = 'DNA' | 'RNA' | 'Total Nucleic Acid'
export type SampleType = 'specimen' | 'positive_control' | 'extraction_blank' | 'ntc'
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
  avatar_filename?: string
  created_at: string
}

// ── Extraction Runs ──────────────────────────────────────────────

export interface Extraction {
  id: number
  run_id: number
  specimen_code: string
  position?: string
  input_quantity?: number
  input_quantity_unit?: string
  yield_ng_ul?: number
  a260_280?: number
  a260_230?: number
  rin_score?: number
  storage_location?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
  // Populated by all-extractions dropdown endpoint
  run_date?: string
  extraction_type?: string
}

export interface ExtractionCreate {
  specimen_code: string
  position?: string
  input_quantity?: number
  input_quantity_unit?: string
  yield_ng_ul?: number
  a260_280?: number
  a260_230?: number
  rin_score?: number
  storage_location?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface ExtractionUpdate extends Partial<ExtractionCreate> {}

export interface ExtractionRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  protocol_id?: number
  protocol?: Protocol
  project_id?: number
  project?: Project
  kit?: string
  extraction_type?: ExtractionType
  container_type?: string
  elution_volume_ul?: number
  protocol_notes?: string
  notes?: string
  created_at: string
  sample_count: number
  samples?: Extraction[]
}

export interface ExtractionRunCreate {
  run_date?: string
  operator_id: number
  project_id: number
  protocol_id?: number
  kit?: string
  extraction_type?: ExtractionType
  container_type?: string
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
  qc_status?: string
  sample_type?: SampleType
  // Populated by all-samples dropdown endpoint
  run_date?: string
  target_region?: string
}

export interface PCRSampleCreate {
  extraction_id?: number
  specimen_code?: string
  gel_result?: GelResult
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface PCRSampleUpdate extends Partial<PCRSampleCreate> {}

export interface PCRRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  protocol_id?: number
  protocol?: Protocol
  project_id?: number
  project?: Project
  target_region?: string
  primer_f?: string
  primer_r?: string
  primer_pair_id?: number
  primer_pair?: PrimerPairRecord
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
  operator_id: number
  project_id: number
  protocol_id?: number
  target_region?: string
  primer_f?: string
  primer_r?: string
  primer_pair_id?: number
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
  sequence?: string
  sequence_length_bp?: number
  output_file_path?: string
  quality_notes?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface SangerSampleCreate {
  pcr_sample_id?: number
  specimen_code?: string
  sequence?: string
  sequence_length_bp?: number
  output_file_path?: string
  quality_notes?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface SangerSampleUpdate extends Partial<SangerSampleCreate> {}

export interface SangerRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  protocol_id?: number
  protocol?: Protocol
  project_id?: number
  project?: Project
  primer?: string
  primer_id?: number
  primer_record?: Primer
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
  operator_id: number
  project_id: number
  protocol_id?: number
  primer?: string
  primer_id?: number
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
  pcr_sample_id?: number
  pcr_sample?: PCRSample
  specimen_code?: string
  index_i7?: string
  index_i5?: string
  input_ng?: number
  average_fragment_size_bp?: number
  library_concentration_ng_ul?: number
  sample_name?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface LibraryPrepCreate {
  extraction_id?: number
  pcr_sample_id?: number
  specimen_code?: string
  index_i7?: string
  index_i5?: string
  input_ng?: number
  average_fragment_size_bp?: number
  library_concentration_ng_ul?: number
  sample_name?: string
  notes?: string
  qc_status?: string
  sample_type?: SampleType
}

export interface LibraryPrepUpdate extends Partial<LibraryPrepCreate> {}

export interface LibraryPrepRun {
  id: number
  run_date?: string
  operator_id?: number
  operator?: User
  protocol_id?: number
  protocol?: Protocol
  project_id?: number
  project?: Project
  kit?: string
  target_region?: string
  primer_f?: string
  primer_r?: string
  primer_pair_id?: number
  primer_pair?: PrimerPairRecord
  notes?: string
  created_at: string
  sample_count: number
  samples?: LibraryPrep[]
}

export interface LibraryPrepRunCreate {
  run_date?: string
  operator_id: number
  project_id: number
  protocol_id?: number
  kit?: string
  target_region?: string
  primer_f?: string
  primer_r?: string
  primer_pair_id?: number
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
  qc_status?: string
  reads_millions?: number
  library_prep?: LibraryPrep
}

export interface NGSRunLibraryCreate {
  library_prep_id?: number
  specimen_code?: string
  sample_name?: string
  qc_status?: string
  reads_millions?: number
}

export interface NGSRunLibraryUpdate extends Partial<NGSRunLibraryCreate> {}

export interface NGSRun {
  id: number
  platform: NGSPlatform
  instrument?: string
  run_id?: string
  date?: string
  operator_id?: number
  operator?: User
  protocol_id?: number
  project_id?: number
  project?: Project
  protocol?: Protocol
  flow_cell_id?: string
  reagent_kit?: string
  storage_host?: string
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
  operator_id: number
  project_id: number
  instrument?: string
  run_id?: string
  date?: string
  protocol_id?: number
  flow_cell_id?: string
  reagent_kit?: string
  storage_host?: string
  output_path?: string
  total_reads?: number
  q30_percent?: number
  mean_read_length_bp?: number
  notes?: string
  libraries: { library_prep_id?: number; specimen_code?: string; sample_name?: string }[]
}

export interface NGSRunUpdate extends Partial<NGSRunCreate> {}

// ── Primers ──────────────────────────────────────────────────────

export interface Primer {
  id: number
  name: string
  sequence?: string
  direction?: string
  target_taxa?: string
  target_gene?: string
  annealing_temp_c?: number
  reference?: string
  notes?: string
  created_at: string
}

export interface PrimerCreate {
  name: string
  sequence?: string
  direction?: string
  target_taxa?: string
  target_gene?: string
  annealing_temp_c?: number
  reference?: string
  notes?: string
}

export interface PrimerUpdate extends Partial<PrimerCreate> {}

// ── Primer Pairs ──────────────────────────────────────────────────

export interface PrimerInPair {
  id: number
  name: string
  sequence?: string
  direction?: string
}

export interface PrimerPairRecord {
  id: number
  name?: string
  forward_primer_id?: number
  reverse_primer_id?: number
  forward_primer?: PrimerInPair
  reverse_primer?: PrimerInPair
  amplicon_size_bp?: number
  annealing_temp_c?: number
  target_gene?: string
  target_taxa?: string
  notes?: string
  reference?: string
  created_at: string
}

export interface PrimerPairCreate {
  name?: string
  forward_primer_id?: number
  reverse_primer_id?: number
  amplicon_size_bp?: number
  annealing_temp_c?: number
  target_gene?: string
  target_taxa?: string
  notes?: string
  reference?: string
}

export interface PrimerPairUpdate extends Partial<PrimerPairCreate> {}

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
  ngs_libraries: number
}
