import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { PhotoUploader } from '@/components/property/photo-uploader';
import { PropertyStepIndicator } from '@/components/property/property-step-indicator';
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
import { useCreatePropertyMutation } from '@/hooks/use-properties';
import { useKycStatusQuery } from '@/hooks/use-kyc';
import { getApiErrorMessage } from '@/lib/api-error';
import { FURNISHING_TYPES, INDIAN_CITIES, PROPERTY_TYPES } from '@/lib/constants';
import {
  propertyBasicsSchema,
  propertyLocationSchema,
  propertyPricingSchema,
  type PropertyBasicsValues,
  type PropertyLocationValues,
  type PropertyPricingValues,
} from '@/lib/property-schemas';

type WizardStep = 1 | 2 | 3 | 4;

function buildFormData(
  basics: PropertyBasicsValues,
  location: PropertyLocationValues,
  pricing: PropertyPricingValues,
  photos: File[]
): FormData {
  const formData = new FormData();

  formData.append('title', basics.title);
  formData.append('description', basics.description);
  formData.append('propertyType', basics.propertyType);
  formData.append('furnishing', basics.furnishing);
  formData.append('bathrooms', String(basics.bathrooms));
  formData.append('area', String(basics.area));
  if (basics.floor !== undefined) {
    formData.append('floor', String(basics.floor));
  }
  if (basics.totalFloors !== undefined) {
    formData.append('totalFloors', String(basics.totalFloors));
  }

  formData.append(
    'address',
    JSON.stringify({
      line1: location.line1,
      line2: location.line2 || undefined,
      locality: location.locality,
      city: location.city,
      state: location.state,
      pincode: location.pincode,
    })
  );

  formData.append(
    'location',
    JSON.stringify({
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    })
  );

  formData.append('rent', String(pricing.rent));
  formData.append('deposit', String(pricing.deposit));
  formData.append('maintenance', String(pricing.maintenance ?? 0));
  formData.append(
    'preferences',
    JSON.stringify({
      bachelors: pricing.bachelors,
      families: pricing.families,
      workingProfessionals: pricing.workingProfessionals,
      students: pricing.students,
    })
  );
  formData.append('amenities', JSON.stringify(pricing.amenities ?? []));

  photos.forEach((photo) => formData.append('photos', photo));

  return formData;
}

export function NewPropertyPage() {
  const navigate = useNavigate();
  const { data: kyc, isLoading: kycLoading } = useKycStatusQuery();
  const createMutation = useCreatePropertyMutation();

  const [step, setStep] = useState<WizardStep>(1);
  const [basics, setBasics] = useState<PropertyBasicsValues | null>(null);
  const [location, setLocation] = useState<PropertyLocationValues | null>(null);
  const [pricing, setPricing] = useState<PropertyPricingValues | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const basicsForm = useForm<PropertyBasicsValues>({
    resolver: zodResolver(propertyBasicsSchema),
    defaultValues: basics ?? {
      title: '',
      description: '',
      propertyType: '2BHK',
      furnishing: 'semi-furnished',
      bathrooms: undefined,
      area: undefined,
      floor: undefined,
      totalFloors: undefined,
    },
  });

  const locationForm = useForm<PropertyLocationValues>({
    resolver: zodResolver(propertyLocationSchema),
    defaultValues: location ?? {
      line1: '',
      line2: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const pricingForm = useForm<PropertyPricingValues>({
    resolver: zodResolver(propertyPricingSchema),
    defaultValues: pricing ?? {
      rent: undefined,
      deposit: undefined,
      maintenance: undefined,
      bachelors: true,
      families: true,
      workingProfessionals: true,
      students: false,
      amenities: [],
    },
  });

  const isVerified = kyc?.status === 'verified';

  const handleSubmit = () => {
    if (!basics || !location || !pricing) return;
    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    createMutation.mutate(buildFormData(basics, location, pricing, photos), {
      onSuccess: () => {
        toast.success('Property submitted for verification');
        navigate('/owner/properties');
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Failed to create property'));
      },
    });
  };

  if (kycLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold">Complete identity verification first</h1>
          <p className="mt-2 text-muted-foreground">
            Only verified owners can list properties on BrokerFree. Complete your KYC to continue.
          </p>
          <Button asChild className="mt-6 brand-gradient text-primary-foreground hover:opacity-90">
            <Link to="/owner/kyc">Go to verification</Link>
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

        <h1 className="text-2xl font-bold tracking-tight">List a property</h1>
        <p className="mt-2 text-muted-foreground">
          Add your rental listing. It will be reviewed before going live.
        </p>

        <PropertyStepIndicator currentStep={step} />

        {step === 1 ? (
          <Form {...basicsForm}>
            <form
              onSubmit={basicsForm.handleSubmit((values) => {
                setBasics(values);
                setStep(2);
              })}
              className="space-y-4"
            >
              <FormField
                control={basicsForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Spacious 2BHK in Koramangala" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={basicsForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Describe the property..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={basicsForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  control={basicsForm.control}
                  name="furnishing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Furnishing</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  control={basicsForm.control}
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
                  control={basicsForm.control}
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
                  control={basicsForm.control}
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
                  control={basicsForm.control}
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
              <Button type="submit" className="w-full brand-gradient text-primary-foreground hover:opacity-90">
                Continue
              </Button>
            </form>
          </Form>
        ) : null}

        {step === 2 ? (
          <Form {...locationForm}>
            <form
              onSubmit={locationForm.handleSubmit((values) => {
                setLocation(values);
                setStep(3);
              })}
              className="space-y-4"
            >
              <FormField
                control={locationForm.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="12 MG Road, Building A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={locationForm.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 2 (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Near metro station" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={locationForm.control}
                  name="locality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locality</FormLabel>
                      <FormControl>
                        <Input placeholder="Koramangala" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={locationForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const city = INDIAN_CITIES.find((c) => c.name === value);
                          if (city) {
                            locationForm.setValue('latitude', city.lat);
                            locationForm.setValue('longitude', city.lng);
                          }
                        }}
                        defaultValue={field.value}
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
                  control={locationForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Karnataka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={locationForm.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="560034" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium">Coordinates</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use Google Maps → right-click on the location → copy latitude and longitude.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={locationForm.control}
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
                    control={locationForm.control}
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
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 brand-gradient text-primary-foreground hover:opacity-90">
                  Continue
                </Button>
              </div>
            </form>
          </Form>
        ) : null}

        {step === 3 ? (
          <Form {...pricingForm}>
            <form
              onSubmit={pricingForm.handleSubmit((values) => {
                setPricing(values);
                setStep(4);
              })}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={pricingForm.control}
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
                  control={pricingForm.control}
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
                  control={pricingForm.control}
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
                  ).map(([key, label]) => (
                    <FormField
                      key={key}
                      control={pricingForm.control}
                      name={key}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input accent-primary"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                          {label}
                        </label>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="mt-3 space-y-4">
                  {Object.entries(AMENITY_GROUPS).map(([groupKey, items]) => (
                    <div key={groupKey}>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {groupKey}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((item) => (
                          <FormField
                            key={item.value}
                            control={pricingForm.control}
                            name="amenities"
                            render={({ field }) => (
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-input accent-primary"
                                  checked={field.value?.includes(item.value) ?? false}
                                  onChange={(e) => {
                                    const current = field.value ?? [];
                                    field.onChange(
                                      e.target.checked
                                        ? [...current, item.value]
                                        : current.filter((v) => v !== item.value)
                                    );
                                  }}
                                />
                                {item.label}
                              </label>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 brand-gradient text-primary-foreground hover:opacity-90">
                  Continue
                </Button>
              </div>
            </form>
          </Form>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <PhotoUploader photos={photos} onChange={setPhotos} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 brand-gradient text-primary-foreground hover:opacity-90"
                disabled={createMutation.isPending}
                onClick={handleSubmit}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit for verification'
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
