import { cva } from 'class-variance-authority'
import type { Key } from 'react-aria-components'
import { Badge } from '#/components/ui/badge'
import {
  Select as SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'

const selectTriggerVariants = cva(undefined, {
  variants: {
    variant: {
      neutral:
        'border-zinc-300 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 [&_svg]:text-zinc-950 dark:[&_svg]:text-zinc-100',
      information:
        'border-blue-400 bg-blue-200 text-blue-950 hover:bg-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900 [&_svg]:text-blue-950 dark:[&_svg]:text-blue-100',
      success:
        'border-green-400 bg-green-200 text-green-950 hover:bg-green-300 dark:border-green-500 dark:bg-green-950 dark:text-green-100 dark:hover:bg-green-900 [&_svg]:text-green-950 dark:[&_svg]:text-green-100',
    },
  },
})

const selectOptionVariants = cva('rounded-md', {
  variants: {
    variant: {
      neutral:
        'border-zinc-300 bg-zinc-100 text-zinc-950 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
      information:
        'border-blue-400 bg-blue-100 text-blue-950 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100',
      success:
        'border-green-400 bg-green-100 text-green-950 dark:border-green-500 dark:bg-green-950 dark:text-green-100',
    },
  },
})

type TSelectVariant = 'neutral' | 'information' | 'success'

interface SelectOption<TValue extends Key> {
  value: TValue
  label: string
  variant?: TSelectVariant
}

interface SelectProps<TValue extends Key> {
  ariaLabel: string
  value: TValue | null
  options: ReadonlyArray<SelectOption<TValue>>
  onChange: (value: TValue) => void
  isDisabled?: boolean
  size?: 'sm' | 'default'
  variant?: TSelectVariant
  triggerClassName?: string
  testId?: string
}

export default function Select<TValue extends Key>({
  ariaLabel,
  value,
  options,
  onChange,
  isDisabled,
  size,
  variant,
  triggerClassName,
  testId,
}: SelectProps<TValue>) {
  const selectedOption = options.find(option => option.value === value)

  return (
    <SelectRoot
      aria-label={ariaLabel}
      value={value}
      isDisabled={isDisabled}
      onChange={value => {
        const option = options.find(option => option.value === value)

        if (option) {
          onChange(option.value)
        }
      }}>
      <SelectTrigger
        className={cn(selectTriggerVariants({ variant }), triggerClassName)}
        data-testid={testId}
        size={size}>
        <SelectValue>{() => selectedOption?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-44">
        <SelectGroup className="p-0">
          {options.map(option => (
            <SelectItem
              key={option.value}
              id={option.value}
              className="min-h-10 rounded-none px-4 py-2">
              {option.variant ? (
                <Badge
                  variant="outline"
                  className={selectOptionVariants({ variant: option.variant })}>
                  {option.label}
                </Badge>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  )
}
