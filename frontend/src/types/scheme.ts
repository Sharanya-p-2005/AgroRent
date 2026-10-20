export type GovernmentLevel = 'CENTRAL' | 'STATE';
export type SchemeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ResourceType = 'ARTICLE' | 'GUIDE' | 'VIDEO' | 'DOCUMENT' | 'WEBSITE' | 'HELPLINE';
export type ResourceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface GovernmentScheme {
  id: string;
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  government_level: GovernmentLevel;
  state: string;
  department?: string | null;
  benefits?: string | null;
  eligibility?: string | null;
  required_documents?: string | null;
  application_process?: string | null;
  official_url?: string | null;
  helpline?: string | null;
  image_url?: string | null;
  status: SchemeStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  is_saved?: boolean;
  saved_at?: string;
}

export interface CreateSchemeInput {
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  government_level: GovernmentLevel;
  state?: string;
  department?: string;
  benefits?: string;
  eligibility?: string;
  required_documents?: string;
  application_process?: string;
  official_url?: string;
  helpline?: string;
  image_url?: string;
  status?: SchemeStatus;
  featured?: boolean;
}

export interface FarmerResource {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  resource_type: ResourceType;
  image_url?: string | null;
  official_url?: string | null;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  title: string;
  description: string;
  category: string;
  content: string;
  resource_type: ResourceType;
  image_url?: string;
  official_url?: string;
  status?: ResourceStatus;
}

export interface SchemeFilterParams {
  search?: string;
  category?: string;
  government_level?: string;
  state?: string;
  featured?: boolean | string;
  sort?: 'featured' | 'newest' | 'alphabetical' | string;
  status?: string;
}

export interface ResourceFilterParams {
  search?: string;
  category?: string;
  resource_type?: string;
  status?: string;
}
