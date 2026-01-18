'use client'

import { useState } from 'react'

interface EnergyRatingProps {
  onSelect: (rating: number) => void
  label?: string
}

export function EnergyRating({ onSelect, label = 'How awake do you feel?' }: EnergyRatingProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovering, setHovering] = useState<number | null>(null)

  const ratings = [
    { value: 1, label: 'Very groggy', emoji: '😴' },
    { value: 2, label: 'Somewhat groggy', emoji: '😪' },
    { value: 3, label: 'Neutral', emoji: '😐' },
    { value: 4, label: 'Somewhat alert', emoji: '🙂' },
    { value: 5, label: 'Fully awake', emoji: '😊' },
  ]

  const handleSelect = (rating: number) => {
    setSelected(rating)
    onSelect(rating)
  }

  return (
    <div className="flex flex-col items-center p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        {label}
      </h2>

      <div className="flex gap-2 sm:gap-4 mb-4">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            onClick={() => handleSelect(rating.value)}
            onMouseEnter={() => setHovering(rating.value)}
            onMouseLeave={() => setHovering(null)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl transition-all
              ${selected === rating.value
                ? 'bg-orange-500 ring-4 ring-orange-200 scale-110'
                : hovering === rating.value
                ? 'bg-orange-100 scale-105'
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
          >
            {rating.emoji}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 h-6">
        {(hovering !== null || selected !== null) && (
          ratings.find(r => r.value === (hovering ?? selected))?.label
        )}
      </p>
    </div>
  )
}
