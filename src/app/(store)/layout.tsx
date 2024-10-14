import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import ChatWidget from '@/components/shared/ChatWidget'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
