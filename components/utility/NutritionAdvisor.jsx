'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Zap, Salad, Image as ImageIcon, Lightbulb } from 'lucide-react'

const INITIAL_PROMPT =
  'How can I maintain energy for morning classes with mess food?'

export default function NutritionAdvisor() {
  const { token, user } = useAuth()
  const [prompt, setPrompt] = useState(INITIAL_PROMPT)
  const [advice, setAdvice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const getAdvice = useCallback(async () => {
    if (!token) {
      toast.error('Please log in to use the nutrition advisor.')
      return
    }

    if (!prompt.trim()) {
      toast.error('Please enter a valid query.')
      return
    }

    setLoading(true)
    setAdvice('')
    setImageUrl('')

    try {
      // 1️⃣ Get nutrition advice (text)
      const res = await api.get(`/api/nutrition/advice?prompt=${encodeURIComponent(prompt)}`)
      if (res.data?.advice) {
        setAdvice(res.data.advice)
        toast.success('Personalized advice received! 🍽️')
      } else {
        setAdvice('Could not generate advice. Please try again later.')
        toast.error(res.data?.error || 'AI failed to generate advice.')
      }

      // 2️⃣ Generate visual suggestion (image)
      try {
        const imgRes = await api.post('/api/meals/generate-image', {
          prompt: `A healthy, balanced mess meal based on: ${prompt}`,
        })
        if (imgRes.data?.imageUrl) {
          setImageUrl(imgRes.data.imageUrl)
        } else {
          setImageUrl('https://placehold.co/400x400/94A3B8/FFFFFF?text=No+Image')
        }
      } catch (imgErr) {
        console.error('Image generation error:', imgErr)
        setImageUrl('https://placehold.co/400x400/94A3B8/FFFFFF?text=Error')
      }
    } catch (error) {
      console.error('AI Request Error:', error)
      toast.error('Network error or server unavailable.')
    } finally {
      setLoading(false)
    }
  }, [prompt, token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Salad className="w-6 h-6 text-green-400" />
              AI Nutrition Advisor
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ask questions about your diet, energy, or mess meals — powered by
              real-time AI insights.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={INITIAL_PROMPT}
                disabled={loading}
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px] resize-none"
              />
              <Button
                onClick={getAdvice}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 h-auto self-end sm:self-center transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                {loading ? 'Analyzing...' : 'Get Advice'}
              </Button>
            </div>

            {/* Output */}
            {(advice || imageUrl || loading) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* AI Text */}
                <Card className="md:col-span-2 bg-slate-700/60 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-teal-400 text-lg flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Personalized Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-slate-600" />
                        <Skeleton className="h-4 w-11/12 bg-slate-600" />
                        <Skeleton className="h-4 w-10/12 bg-slate-600" />
                        <Skeleton className="h-4 w-9/12 bg-slate-600" />
                      </div>
                    ) : (
                      <p className="text-white whitespace-pre-wrap leading-relaxed">
                        {advice}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* AI Image */}
                <Card className="md:col-span-1 bg-slate-700/60 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-teal-400 text-lg flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Visual Suggestion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center p-3">
                    {loading ? (
                      <Skeleton className="w-full h-40 bg-slate-600 rounded-lg" />
                    ) : (
                      imageUrl && (
                        <img
                          src={imageUrl}
                          alt="AI-generated meal suggestion"
                          className="w-full h-40 object-cover rounded-lg border border-slate-600"
                        />
                      )
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
