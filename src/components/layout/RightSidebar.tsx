import { TrendingWidget } from './TrendingWidget'
import { FollowSuggestionsWidget } from './FollowSuggestionsWidget'
import { ServerStatusWidget } from './ServerStatusWidget'

export function RightSidebar() {
  return (
    <div className='space-y-6'>
      <TrendingWidget />
      <FollowSuggestionsWidget />
      <ServerStatusWidget />
    </div>
  )
}
