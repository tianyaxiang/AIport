export interface Category {
  id: string;
  name: string;
  default?: boolean;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  categories: string[];
}

export interface SitesData {
  categories: Category[];
  sites: Site[];
}
