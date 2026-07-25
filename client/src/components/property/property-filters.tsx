import { FURNISHING_TYPES, INDIAN_CITIES, PROPERTY_TYPES } from '@/lib/constants';
import { AMENITY_GROUPS } from '@/constants/property.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { PropertyListFilters, PropertySortBy } from '@/types/property.types';

interface PropertyFiltersProps {
  filters: PropertyListFilters;
  onChange: (filters: PropertyListFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const SORT_OPTIONS: { value: PropertySortBy; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
  { value: 'popular', label: 'Most popular' },
];

function toggleAmenity(current: string[] | undefined, value: string): string[] {
  const list = current ?? [];
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PropertyFilters({ filters, onChange, onApply, onReset }: PropertyFiltersProps) {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-4 md:p-5">
      <div>
        <h2 className="text-lg font-semibold">Filters</h2>
        <p className="text-sm text-muted-foreground">Refine your property search</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortBy">Sort by</Label>
        <Select
          value={filters.sortBy ?? 'newest'}
          onValueChange={(value) =>
            onChange({ ...filters, sortBy: value as PropertySortBy, page: 1 })
          }
        >
          <SelectTrigger id="sortBy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select
          value={filters.city ?? 'all'}
          onValueChange={(value) =>
            onChange({ ...filters, city: value === 'all' ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {INDIAN_CITIES.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locality">Locality</Label>
        <Input
          id="locality"
          placeholder="e.g. Koramangala"
          value={filters.locality ?? ''}
          onChange={(e) => onChange({ ...filters, locality: e.target.value || undefined, page: 1 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minRent">Min rent (₹)</Label>
          <Input
            id="minRent"
            type="number"
            min={0}
            placeholder="5000"
            value={filters.minRent ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                minRent: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxRent">Max rent (₹)</Label>
          <Input
            id="maxRent"
            type="number"
            min={0}
            placeholder="50000"
            value={filters.maxRent ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                maxRent: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyType">Property type</Label>
        <Select
          value={filters.propertyType ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              propertyType: value === 'all' ? undefined : (value as PropertyListFilters['propertyType']),
              page: 1,
            })
          }
        >
          <SelectTrigger id="propertyType">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="furnishing">Furnishing</Label>
        <Select
          value={filters.furnishing ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              furnishing: value === 'all' ? undefined : (value as PropertyListFilters['furnishing']),
              page: 1,
            })
          }
        >
          <SelectTrigger id="furnishing">
            <SelectValue placeholder="Any furnishing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any furnishing</SelectItem>
            {FURNISHING_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/-/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Amenities</Label>
        {Object.entries(AMENITY_GROUPS).map(([groupKey, items]) => (
          <div key={groupKey} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {groupKey}
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={filters.amenities?.includes(item.value) ?? false}
                    onChange={() =>
                      onChange({
                        ...filters,
                        amenities: toggleAmenity(filters.amenities, item.value),
                        page: 1,
                      })
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button className="flex-1 brand-gradient text-primary-foreground hover:opacity-90" onClick={onApply}>
          Apply filters
        </Button>
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
