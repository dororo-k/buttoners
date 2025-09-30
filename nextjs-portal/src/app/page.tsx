import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import { Megaphone, Sparkles, Gamepad2 } from 'lucide-react';

export default function MainPage() {
  const slides = [
    {
      id: 1,
      gradient: 'from-brand-700 to-accent',
      title: '버튼어스 소개',
      description: '오늘의 공지 및 업무를 이곳에서 확인하세요.',
    },
    {
      id: 2,
      gradient: 'from-accent to-fuchsia',
      title: '새로운 소식',
      description: '최신 공지사항을 확인하고 업무에 참고하세요.',
    },
    {
      id: 3,
      gradient: 'from-fuchsia to-brand-700',
      title: '업무 매뉴얼',
      description: '매뉴얼과 청소 목록으로 체계적인 업무 수행이 가능합니다.',
    },
  ];

  return (
    <>
      {/* Hero: 인디케이터로 이미지 로테이션 (빈 목록은 플레이스홀더로 대체) */}
      <div className="mt-2 md:mt-0 overflow-x-hidden">
        <HeroCarousel intervalMs={6000}>
          {slides.map((slide) => (
            <div key={slide.id} className={`w-full h-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center p-8 text-center`}>
              <div className="relative z-10 text-white">
                <h1 className="text-3xl font-bold text-shadow-hero">{slide.title}</h1>
                <p className="mt-2 max-w-lg text-base opacity-90 text-shadow-hero">{slide.description}</p>
              </div>
            </div>
          ))}
        </HeroCarousel>
      </div>

      {/* Summary widgets (3-column) */}
      <section aria-labelledby="home-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <h2 id="home-summary" className="sr-only">요약 위젯</h2>

        {/* 공지사항 카드 */}
        <article className="card group relative p-5 elev-hover">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-md bg-brand/20 text-brand shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-ink">공지사항</h3>
            </div>
            <Link href="/notices" className="text-sm font-medium text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand">
              더보기 &rarr;
            </Link>
          </header>
          <div className="h-24 bg-elev rounded-md flex items-center justify-center text-muted text-sm p-4">
            공지사항 요약 내용이 여기에 표시됩니다.
          </div>
        </article>

        {/* 청소 요약 카드 */}
        <article className="card group relative p-5 elev-hover">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-md bg-accent/20 text-accent shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-ink">오늘의 청소</h3>
            </div>
            <Link href="/cleaning" className="text-sm font-medium text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand">
              더보기 &rarr;
            </Link>
          </header>
          <div className="h-24 bg-elev rounded-md flex items-center justify-center text-muted text-sm p-4">
            오늘 해야 할 청소 업무가 여기에 표시됩니다.
          </div>
        </article>

        {/* 게임 관리 카드 */}
        <article className="card group relative p-5 elev-hover">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-md bg-fuchsia/20 text-fuchsia shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-ink">게임 관리</h3>
            </div>
            <Link href="/game" className="text-sm font-medium text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-brand">
              더보기 &rarr;
            </Link>
          </header>
          <div className="h-24 bg-elev rounded-md flex items-center justify-center text-muted text-sm p-4">
            보수가 필요한 게임 목록이 여기에 표시됩니다.
          </div>
        </article>
      </section>
    </>
  );
}
