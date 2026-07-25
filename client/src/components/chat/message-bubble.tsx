import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format-date';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMine: boolean;
  isOptimistic?: boolean;
}

export function MessageBubble({
  content,
  createdAt,
  isMine,
  isOptimistic = false,
}: MessageBubbleProps) {
  return (
    <div className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[70%]',
          isMine
            ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
            : 'rounded-bl-md bg-muted text-foreground',
          isOptimistic && 'opacity-70'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isMine ? 'text-right text-white/70' : 'text-left text-muted-foreground'
          )}
        >
          {formatDateTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
