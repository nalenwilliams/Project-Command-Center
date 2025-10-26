import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const ColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState('');

  const goldColors = [
    {
      name: 'Rich Gold',
      tailwind: 'amber-500',
      hex: '#F59E0B',
      rgb: 'rgb(245, 158, 11)',
    },
    {
      name: 'Deep Gold',
      tailwind: 'amber-600',
      hex: '#D97706',
      rgb: 'rgb(217, 119, 6)',
    },
    {
      name: 'Classic Gold',
      tailwind: 'yellow-600',
      hex: '#CA8A04',
      rgb: 'rgb(202, 138, 4)',
    },
    {
      name: 'Metallic Gold',
      tailwind: 'yellow-500',
      hex: '#EAB308',
      rgb: 'rgb(234, 179, 8)',
    },
    {
      name: 'Bright Gold',
      tailwind: 'amber-400',
      hex: '#FBBF24',
      rgb: 'rgb(251, 191, 36)',
    },
    {
      name: 'Antique Gold',
      tailwind: 'yellow-700',
      hex: '#A16207',
      rgb: 'rgb(161, 98, 7)',
    },
  ];

  const customGolds = [
    {
      name: 'True Gold #1',
      tailwind: 'custom-gold-1',
      hex: '#D4AF37',
      rgb: 'rgb(212, 175, 55)',
      style: { backgroundColor: '#D4AF37' },
    },
    {
      name: 'True Gold #2',
      tailwind: 'custom-gold-2',
      hex: '#FFD700',
      rgb: 'rgb(255, 215, 0)',
      style: { backgroundColor: '#FFD700' },
    },
    {
      name: 'True Gold #3',
      tailwind: 'custom-gold-3',
      hex: '#E5C100',
      rgb: 'rgb(229, 193, 0)',
      style: { backgroundColor: '#E5C100' },
    },
    {
      name: 'Elegant Gold',
      tailwind: 'custom-gold-4',
      hex: '#C9A961',
      rgb: 'rgb(201, 169, 97)',
      style: { backgroundColor: '#C9A961' },
    },
    {
      name: 'Warm Gold',
      tailwind: 'custom-gold-5',
      hex: '#DAA520',
      rgb: 'rgb(218, 165, 32)',
      style: { backgroundColor: '#DAA520' },
    },
    {
      name: 'Muted Gold',
      tailwind: 'custom-gold-6',
      hex: '#B8860B',
      rgb: 'rgb(184, 134, 11)',
      style: { backgroundColor: '#B8860B' },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <img 
            src="/williams-logo.png" 
            alt="Williams Diversified LLC" 
            className="w-64 h-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold">Choose Your Gold Color</h1>
          <p className="text-gray-600">Select the gold shade that best matches your logo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tailwind Gold Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goldColors.map((color) => (
                <div
                  key={color.tailwind}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedColor === color.tailwind
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedColor(color.tailwind)}
                >
                  {selectedColor === color.tailwind && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  <div className={`w-full h-32 rounded-lg bg-${color.tailwind} mb-4`}></div>
                  <h3 className="font-bold text-lg mb-2">{color.name}</h3>
                  <p className="text-sm text-gray-600">Tailwind: {color.tailwind}</p>
                  <p className="text-sm text-gray-600">Hex: {color.hex}</p>
                  <p className="text-sm text-gray-600">RGB: {color.rgb}</p>
                  
                  {/* Preview with black background */}
                  <div className="mt-4 bg-black p-4 rounded">
                    <Button className={`w-full bg-${color.tailwind} text-black hover:bg-${color.tailwind}/80`}>
                      Sample Button
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom True Gold Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customGolds.map((color) => (
                <div
                  key={color.hex}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedColor === color.hex
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedColor(color.hex)}
                >
                  {selectedColor === color.hex && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  <div className={`w-full h-32 rounded-lg mb-4`} style={color.style}></div>
                  <h3 className="font-bold text-lg mb-2">{color.name}</h3>
                  <p className="text-sm text-gray-600">Hex: {color.hex}</p>
                  <p className="text-sm text-gray-600">RGB: {color.rgb}</p>
                  
                  {/* Preview with black background */}
                  <div className="mt-4 bg-black p-4 rounded">
                    <button 
                      className="w-full px-4 py-2 rounded font-medium text-black transition-all hover:opacity-80"
                      style={color.style}
                    >
                      Sample Button
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedColor && (
          <div className="fixed bottom-8 right-8">
            <Card className="shadow-2xl">
              <CardContent className="p-6">
                <p className="text-lg font-bold mb-2">Selected: {selectedColor}</p>
                <p className="text-sm text-gray-600 mb-4">
                  Copy this value and let me know which one you prefer!
                </p>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedColor);
                    alert('Copied to clipboard!');
                  }}
                  className="w-full"
                >
                  Copy Color Code
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
