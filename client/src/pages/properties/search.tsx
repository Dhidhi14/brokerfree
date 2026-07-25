import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PropertyCard } from '@/components/property/property-card';
import { PropertyFilters } from '@/components/property/property-filters';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { usePropertiesQuery } from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PropertyListFilters, PropertySortBy } from '@/types/property.types';

const DEFAULT_FILTERS: PropertyListFilters = {
  page: 1,
  limit: 12,
  sortBy: 'newest',
};

function parseFilters(params: URLSearchParams): PropertyListFilters {
  const amenities = params.getAll('amenities');
  return {
    city: params.get('city') || undefined,
    locality: params.get('locality') || undefined,
    minRent: params.get('minRent') ? Number(params.get('minRent')) : undefined,
    maxRent: params.get('maxRent') ? Number(params.get('maxRent')) : undefined,
    propertyType: (params.get('propertyType') as PropertyListFilters['propertyType']) || undefined,
    furnishing: (params.get('furnishing') as PropertyListFilters['furnishing']) || undefined,
    amenities: amenities.length ? amenities : undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
    limit: params.get('limit') ? Number(params.get('limit')) : 12,
    sortBy: (params.get('sortBy') as PropertySortBy) || 'newest',
  };
}

function filtersToParams(filters: PropertyListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.locality) params.set('locality', filters.locality);
  if (filters.minRent !== undefined) params.set('minRent', String(filters.minRent));
  if (filters.maxRent !== undefined) params.set('maxRent', String(filters.maxRent));
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.furnishing) params.set('furnishing', filters.furnishing);
  filters.amenities?.forEach((item) => params.append('amenities', item));
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
  return params;
}

export function PropertySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState<PropertyListFilters>(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const { data, isLoading, isError, error } = usePropertiesQuery(appliedFilters);

  const applyFilters = () => {
    setSearchParams(filtersToParams({ ...draftFilters, page: 1 }));
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  const goToPage = (page: number) => {
    setSearchParams(filtersToParams({ ...appliedFilters, page }));
    setDraftFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Browse properties</h1>
          <p className="mt-2 text-muted-foreground">
            Verified listings across India — no brokers, no hidden fees.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PropertyFilters
              filters={draftFilters}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </aside>

          <section>
            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="text-sm text-destructive">
                  {getApiErrorMessage(error, 'Failed to load properties')}
                </p>
              </div>
            ) : null}

            {!isLoading && !isError && data?.properties.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">No properties match your filters</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Try adjusting your city, budget, or amenities to see more listings.
                </p>
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            ) : null}

            {!isLoading && !isError && data && data.properties.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Showing {data.properties.length} of {data.total} properties
                </p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {data.properties.map((property) => (
                    <PropertyCard key={property._id} property={property} />
                  ))}
                </div>

                {data.totalPages > 1 ? (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => goToPage(data.page - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {data.page} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() => goToPage(data.page + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
