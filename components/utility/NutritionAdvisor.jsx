'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Zap, Salad, User, Image, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Default prompt for better guidance
const INITIAL_PROMPT = "How can I maintain energy for morning classes with mess food?";

export default function NutritionAdvisor() {
    const { token } = useAuth();
    const [prompt, setPrompt] = useState(INITIAL_PROMPT);
    const [advice, setAdvice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Core AI Function ---
    const getAdvice = useCallback(async () => {
        if (!prompt || loading || !token) {
             toast.error(token ? 'Please enter a prompt.' : 'Please log in to use the advisor.');
             return;
        }

        setLoading(true);
        setAdvice('');
        setImageUrl('');

        try {
            // 1. Fetch Text Advice (Gemini API)
            const adviceRes = await fetch(`/api/nutrition/advice?prompt=${encodeURIComponent(prompt)}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const adviceResult = await adviceRes.json();

            if (adviceRes.ok) {
                setAdvice(adviceResult.advice);
                toast.success('Advice received!');
            } else {
                toast.error(adviceResult.error || 'Failed to get nutrition advice.');
                setAdvice('Could not connect to the advisor. Please try again later.');
            }

            // 2. Fetch Meal Image (Placeholder Image Generation)
            const imageRes = await fetch('/api/meals/generate-image', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ prompt: `A healthy, balanced mess hall meal based on: ${prompt}` })
            });
            const imageResult = await imageRes.json();

            if (imageRes.ok && imageResult.imageUrl) {
                setImageUrl(imageResult.imageUrl);
            } else {
                console.error('Failed to generate image:', imageResult.error);
                // Fallback for image failure
                setImageUrl(`https://placehold.co/400x400/94A3B8/FFFFFF?text=Image+Generation+Failed`);
            }

        } catch (error) {
            console.error("AI Request Error:", error);
            toast.error('Network failure during AI request.');
        } finally {
            setLoading(false);
        }
    }, [prompt, loading, token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                            <Salad className="w-6 h-6 text-green-400" />
                            AI Nutrition Advisor
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Ask a question about your diet or energy levels and get advice, grounded in real-time information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Input Area */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Textarea
                                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[100px] resize-none"
                                placeholder={INITIAL_PROMPT}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                onClick={getAdvice}
                                disabled={!prompt || loading}
                                className="shrink-0 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 h-auto"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                {loading ? 'Analyzing...' : 'Get Advice'}
                            </Button>
                        </div>

                        {/* Output Area */}
                        {(advice || imageUrl || loading) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {/* Advice Card */}
                                <Card className="md:col-span-2 bg-slate-700 border-slate-600">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-teal-400 text-lg flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" />
                                            Personalized Tips
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <div className='space-y-2'>
                                                <Skeleton className="h-4 w-full bg-slate-600" />
                                                <Skeleton className="h-4 w-[90%] bg-slate-600" />
                                                <Skeleton className="h-4 w-[85%] bg-slate-600" />
                                                <Skeleton className="h-4 w-[95%] bg-slate-600" />
                                            </div>
                                        ) : (
                                            <p className="text-white whitespace-pre-wrap">{advice}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Image Card */}
                                <Card className="md:col-span-1 bg-slate-700 border-slate-600">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-teal-400 text-lg flex items-center gap-2">
                                            <Image className="w-4 h-4" />
                                            Visual Suggestion
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center p-3">
                                        {loading ? (
                                            <Skeleton className="w-full h-40 bg-slate-600 rounded-lg" />
                                        ) : (
                                            imageUrl && (
                                                <img 
                                                    src={imageUrl} 
                                                    alt="AI generated meal suggestion" 
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
    );
}