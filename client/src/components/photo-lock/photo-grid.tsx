import { getAreaLabel } from '@/constants/photo-lock.constants';
import type { PhotoLockPhoto } from '@/types/photo-lock.types';

interface PhotoGridProps {
  photos: PhotoLockPhoto[];
  emptyMessage?: string;
}

function groupPhotosByArea(photos: PhotoLockPhoto[]): Array<{
  area: string;
  photos: PhotoLockPhoto[];
}> {
  const order: string[] = [];
  const map = new Map<string, PhotoLockPhoto[]>();

  for (const photo of photos) {
    const existing = map.get(photo.area);
    if (existing) {
      existing.push(photo);
    } else {
      map.set(photo.area, [photo]);
      order.push(photo.area);
    }
  }

  return order.map((area) => ({
    area,
    photos: map.get(area) ?? [],
  }));
}

export function PhotoGrid({
  photos,
  emptyMessage = 'No photos submitted yet.',
}: PhotoGridProps) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const groups = groupPhotosByArea(photos);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.area}>
          <h4 className="mb-2 text-sm font-semibold text-foreground">
            {getAreaLabel(group.area)}
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.photos.map((photo) => (
              <a
                key={`${photo.area}-${photo.url}`}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-border/80 bg-muted/30"
              >
                <img
                  src={photo.url}
                  alt={`${getAreaLabel(photo.area)} documentation`}
                  className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
                />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
