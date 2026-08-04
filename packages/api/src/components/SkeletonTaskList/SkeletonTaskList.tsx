import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from '#/components/ui/item'
import { Skeleton } from '#/components/ui/skeleton'

export default function SkeletonTaskList() {
  return (
    <ItemGroup className="gap-0" aria-label="Loading tasks">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index}>
          {index > 0 && <ItemSeparator className="my-0" />}
          <Item className="rounded-none px-0 py-4">
            <ItemContent>
              <Skeleton className="h-4 w-2/3" />
            </ItemContent>
            <ItemActions className="w-full justify-end sm:w-auto">
              <Skeleton className="h-8 w-32" />
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  )
}
