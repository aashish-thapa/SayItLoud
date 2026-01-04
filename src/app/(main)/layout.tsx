import { Navbar } from '@/components/layout/Navbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className='bg-background min-h-screen'>
      <Navbar />
      <div className='container mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start py-6 lg:py-8 px-4 md:px-6'>
        <aside className='hidden md:block md:col-span-3 sticky top-24'>
          <LeftSidebar />
        </aside>
        <main className='col-span-12 md:col-span-9 lg:col-span-6'>
          {children}
        </main>
        <aside className='hidden lg:block lg:col-span-3 sticky top-24'>
          <RightSidebar />
        </aside>
      </div>
    </div>
  )
}
