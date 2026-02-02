"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

interface HeroCarouselProps {
    items: {
        image: string
        title: string
        subtitle: string
        link?: string | null
    }[]
}

export function ModernHeroCarousel({ items }: HeroCarouselProps) {
    const { t, dir } = useLanguage()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60, direction: dir }, [
        Autoplay({ delay: 5000, stopOnInteraction: false }),
    ])
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    React.useEffect(() => {
        if (!emblaApi) return

        const onSelect = () => {
            setSelectedIndex(emblaApi.selectedScrollSnap())
        }

        emblaApi.on("select", onSelect)
        emblaApi.on("reInit", onSelect)
    }, [emblaApi])

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    const scrollTo = React.useCallback(
        (index: number) => {
            if (emblaApi) emblaApi.scrollTo(index)
        },
        [emblaApi]
    )

    if (!items.length) return null

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-secondary/5 border border-white/10 shadow-2xl">
            {/* Carousel Viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {items.map((item, index) => {
                        const Content = () => (
                            <>
                                {/* Image */}
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 select-none"
                                    priority={index === 0}
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Text Content */}
                                <div className={`absolute inset-0 flex flex-col justify-end p-8 sm:p-12 pb-16 sm:pb-20 ${dir === 'rtl' ? 'items-start' : 'items-start'}`}>
                                    <div className={`max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${dir === 'rtl' ? 'text-right' : 'text-left'}`} key={selectedIndex}>
                                        {item.subtitle && (
                                            <p className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                                                {item.subtitle}
                                            </p>
                                        )}
                                        {item.title && (
                                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                                {item.title}
                                            </h2>
                                        )}
                                    </div>
                                </div>
                            </>
                        )

                        return (
                            <div
                                key={index}
                                className="flex-[0_0_100%] min-w-0 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square xl:aspect-[4/3]"
                            >
                                {item.link ? (
                                    <Link href={item.link} className="block w-full h-full relative cursor-pointer" draggable={false}>
                                        <Content />
                                    </Link>
                                ) : (
                                    <Content />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between z-10">
                {/* Dots */}
                <div className="flex gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === selectedIndex
                                ? "w-8 bg-white"
                                : "bg-white/50 hover:bg-white/80"
                                }`}
                            onClick={() => scrollTo(index)}
                            aria-label={`${t('accessibility.go_to_slide')} ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm"
                        onClick={scrollPrev}
                        aria-label="Previous slide"
                    >
                        {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm"
                        onClick={scrollNext}
                        aria-label="Next slide"
                    >
                        {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
