'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider' 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ScanLine, CheckCircle, XCircle, Utensils, User, Zap } from 'lucide-react'

export default function StaffScanner() {
    const { token, user } = useAuth()
    const [qrInput, setQrInput] = useState('')
    const [scanResult, setScanResult] = useState(null)
    const [loading, setLoading] = useState(false)

    // Example QR Data payload (JSON string containing booking details)
    // Should be { "bookingId": "uuid", "userId": "uuid", "date": "YYYY-MM-DD", "mealType": "lunch" }

    const handleCheckIn = useCallback(async () => {
        if (!qrInput || loading) return

        setLoading(true)
        setScanResult(null)

        try {
            // Attempt to parse QR input to ensure it's valid JSON for initial client feedback
            let bookingData
            try {
                bookingData = JSON.parse(qrInput)
            } catch (e) {
                setScanResult({ success: false, message: 'Invalid QR Format. Input must be valid JSON payload.' })
                return
            }

            // API Call to the check-in endpoint
            const response = await fetch('/api/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qrData: qrInput }) // Send the raw QR string
            })

            const result = await response.json()

            if (response.ok) {
                // Successful check-in
                setScanResult({
                    success: true,
                    message: `Attendance confirmed for ${bookingData.mealType.toUpperCase()}!`,
                    booking: result.booking,
                    userPoints: 15 // Hardcoded for display as per API logic
                })
                toast.success(`Check-in OK! +15 points awarded.`);
                setQrInput('');
            } else {
                // Failed check-in (e.g., already checked in, cancelled booking, invalid ID)
                setScanResult({
                    success: false,
                    message: result.error || 'Check-in failed. Invalid booking or internal error.'
                })
                toast.error(result.error || 'Check-in Failed');
            }
        } catch (error) {
            console.error("Check-in Error:", error);
            setScanResult({ success: false, message: 'Network error or server unavailable.' })
        } finally {
            setLoading(false)
        }
    }, [qrInput, loading, token])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto"
            >
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="text-center">
                        <ScanLine className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <CardTitle className="text-white text-2xl">Staff Check-in Scanner</CardTitle>
                        <CardDescription className="text-slate-400">
                            Scan the student's meal QR code to confirm attendance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* 1. Simulated Scanner Input */}
                        <div className="space-y-3">
                            <Input
                                placeholder="Paste QR Code Payload here (e.g., {'bookingId':'...', 'mealType':'lunch'})"
                                value={qrInput}
                                onChange={(e) => setQrInput(e.target.value)}
                                disabled={loading}
                                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                            />
                            <Button
                                onClick={handleCheckIn}
                                disabled={!qrInput || loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {loading ? 'Processing...' : 'Confirm Check-in'}
                            </Button>
                        </div>

                        {/* 2. Result Display */}
                        {scanResult && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-lg border ${
                                    scanResult.success 
                                    ? 'border-green-500/50 bg-green-500/20' 
                                    : 'border-red-500/50 bg-red-500/20'
                                } space-y-3`}
                            >
                                <div className="flex items-center gap-3">
                                    {scanResult.success ? (
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-400" />
                                    )}
                                    <h4 className="font-semibold text-white">
                                        {scanResult.success ? 'CHECK-IN SUCCESSFUL' : 'CHECK-IN FAILED'}
                                    </h4>
                                </div>
                                <p className={scanResult.success ? 'text-green-200' : 'text-red-200'}>
                                    {scanResult.message}
                                </p>

                                {/* Successful Booking Details */}
                                {scanResult.booking && (
                                    <div className="pt-2 border-t border-white/10 text-white space-y-1">
                                        <p className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> Student ID: {scanResult.booking.userId.substring(0, 8)}...</p>
                                        <p className="text-sm flex items-center gap-2"><Utensils className="w-4 h-4 text-yellow-400" /> Meal: {scanResult.booking.mealType.toUpperCase()}</p>
                                        <p className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-green-400" /> Points Awarded: 15</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}