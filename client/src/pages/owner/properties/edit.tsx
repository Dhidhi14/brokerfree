import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Navbar } from '@/components/layout/navbar';
import { WizardNumberInput } from '@/components/property/wizard-number-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AMENITY_GROUPS } from '@/constants/property.constants';
import {
  usePropertyQuery,
  useUpdatePropertyMutation,
} from '@/hooks/use-properties';
import { getApiErrorMessage } from '@/lib/api-error';
import { FURNISHING_TYPES, INDIAN_CITIES, PROPERTY_TYPES } from '@/lib/constants';
import {
  propertyBasicsSchema,
  propertyLocationSchema,
  propertyPricingSchema,
} from '@/lib/property-schemas';
import type { Property } from '@/types/property.types';

const editPropertySchema = propertyBasicsSchema
  .merge(propertyLocationSchema)
  .merge(propertyPricingSchema);

type EditPropertyValues = z.infer<typeof editPropertySchema>;

function toFormValues(property: Property): EditPropertyValues {
  return {
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    furnishing: property.furnishing,
    bathrooms: property.bathrooms,
    area: property.area,
    floor: property.floor,
    totalFloors: property.totalFloors,
    line1: property.address.line1,
    line2: property.address.line2 ?? '',
    locality: property.address.locality,
    city: property.address.city,
    state: property.address.state,
    pincode: property.address.pincode,
    latitude: property.location.coordinates[1],
    longitude: property.location.coordinates[0],
    rent: property.rent,
    deposit: property.deposit,
    maintenance: property.maintenance,
    bachelors: property.preferences.bachelors,
    families: property.preferences.families,
    workingProfessionals: property.preferences.workingProfessionals,
    students: property.preferences.students,
    amenities: property.amenities as EditPropertyValues['amenities'],
  };
}

export function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading, isError, error } = usePropertyQuery(id);
  const updateMutation = useUpdatePropertyMutation();

  const form = useForm<EditPropertyValues>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      propertyType: '2BHK',
      furnishing: 'semi-furnished',
      bathrooms: 1,
      area: 1,
      line1: '',
      line2: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      rent: 1,
      deposit: 0,
      maintenance: 0,
      bachelors: true,
      families: true,
      workingProfessionals: true,
      students: false,
      amenities: [],
    },
  });

  useEffect(() => {
    if (property) {
      form.reset(toFormValues(property));
    }
  }, [property, form]);

  const onSubmit = (values: EditPropertyValues) => {
    if (!id) return;

    updateMutation.mutate(
      {
        id,
        data: {
          title: values.title,
          description: values.description,
          propertyType: values.propertyType,
          furnishing: values.furnishing,
          bathrooms: values.bathrooms,
          area: values.area,
          floor: values.floor,
          totalFloors: values.totalFloors,
          address: {
            line1: values.line1,
            line2: values.line2 || undefined,
            locality: values.locality,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
          },
          location: {
            type: 'Point',
            coordinates: [values.longitude, values.latitude],
          },
          rent: values.rent,
          deposit: values.deposit,
          maintenance: values.maintenance ?? 0,
          amenities: values.amenities,
          preferences: {
            bachelors: values.bachelors,
            families: values.families,
            workingProfessionals: values.workingProfessionals,
            students: values.students,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success('Property updated');
          navigate('/owner/properties');
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Failed to update property'));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Property not found</h1>
          <p className="mt-2 text-muted-foreground">
            {getApiErrorMessage(error, 'Unable to load this property for editing.')}
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/owner/properties">Back to my properties</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 animate-slide-up">
        <Link
          to="/owner/properties"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my properties
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Edit property</h1>
        <p className="mt-2 text-muted-foreground">
          Update listing details. Photos and video tour are managed separately.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Basics</h2>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="furnishing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Furnishing</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FURNISHING_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/-/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={1}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (sq ft)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={1}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor (optional)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total floors (optional)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={1}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Location</h2>
              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 2 (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="locality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locality</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const city = INDIAN_CITIES.find((c) => c.name === value);
                          if (city) {
                            form.setValue('latitude', city.lat);
                            form.setValue('longitude', city.lng);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDIAN_CITIES.map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          step="any"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          step="any"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Pricing & preferences</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly rent (₹)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={1}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit (₹)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maintenance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance (₹)</FormLabel>
                      <FormControl>
                        <WizardNumberInput
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label>Tenant preferences</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['bachelors', 'Bachelors'],
                      ['families', 'Families'],
                      ['workingProfessionals', 'Working professionals'],
                      ['students', 'Students'],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0 rounded-md border px-3 py-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="mt-2 space-y-3">
                  {Object.entries(AMENITY_GROUPS).map(([group, amenities]) => (
                    <div key={group}>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {amenities.map((amenity) => (
                          <FormField
                            key={amenity.value}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                              const checked = field.value.includes(amenity.value);
                              return (
                                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border px-3 py-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-primary"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          field.onChange([...field.value, amenity.value]);
                                        } else {
                                          field.onChange(
                                            field.value.filter((v) => v !== amenity.value)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{amenity.label}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/owner/properties">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 brand-gradient text-primary-foreground hover:opacity-90"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

export default EditPropertyPage;
