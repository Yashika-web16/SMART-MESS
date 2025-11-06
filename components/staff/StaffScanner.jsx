// 'use client'

// import { useState, useCallback } from 'react'
// import { useAuth } from '@/components/auth/AuthProvider'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { toast } from 'sonner'
// import { motion } from 'framer-motion'
// // import { api } from '@/lib/api'
// import {
//   ScanLine,
//   CheckCircle,
//   XCircle,
//   Utensils,
//   User,
//   Zap
// } from 'lucide-react'

// export default function StaffScanner() {
//   const { token, user } = useAuth()
//   const [qrInput, setQrInput] = useState('')
//   const [scanResult, setScanResult] = useState(null)
//   const [loading, setLoading] = useState(false)

//   // ✅ Staff-only access check
//   if (user?.role !== 'staff' && user?.role !== 'admin') {
//     return (
//       <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400 font-semibold text-lg">
//         ACCESS DENIED — Only staff and admin users can access the QR Scanner.
//       </div>
//     )
//   }

//   /* ===========================
//      Handle Check-in Logic
//      =========================== */
//   const handleCheckIn = useCallback(async () => {
//     if (!qrInput.trim()) {
//       toast.error('Please paste a valid QR payload first.')
//       return
//     }

//     setLoading(true)
//     setScanResult(null)

//     try {
//       // ✅ Step 1: Validate QR format
//       let bookingData
//       try {
//         bookingData = JSON.parse(qrInput)
//       } catch (err) {
//         setScanResult({
//           success: false,
//           message: 'Invalid QR format. Make sure it’s a valid JSON payload.',
//         })
//         return
//       }

//       // ✅ Step 2: Send to backend
//   //     const res = await api.post('/api/checkin', { qrData: bookingData })
//   //     if (res.data?.success) {
//   //       const { booking, pointsAwarded = 15 } = res.data
//   //       setScanResult({
//   //         success: true,
//   //         message: `Attendance confirmed for ${booking.mealType.toUpperCase()}.`,
//   //         booking,
//   //         userPoints: pointsAwarded,
//   //       })
//   //       toast.success(`Check-in successful! +${pointsAwarded} points.`)
//   //       setQrInput('')
//   //     } else {
//   //       setScanResult({
//   //         success: false,
//   //         message: res.data?.error || 'Invalid booking or already checked in.',
//   //       })
//   //       toast.error(res.data?.error || 'Check-in failed.')
//   //     }
//   //   } catch (error) {
//   //     console.error('Check-in Error:', error)
//   //     setScanResult({
//   //       success: false,
//   //       message: 'Server unreachable or internal error. Please try again.',
//   //     })
//   //     toast.error('Network error during check-in.')
//   //   } finally {
//   //     setLoading(false)
//   //   }
//   // }, [qrInput])
//   const votes = []
// const advice = "Eat balanced meals!"


//   /* ===========================
//      UI Rendering
//      =========================== */
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="max-w-xl mx-auto"
//       >
//         <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
//           <CardHeader className="text-center space-y-1">
//             <ScanLine className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
//             <CardTitle className="text-white text-2xl">Staff Check-in Scanner</CardTitle>
//             <CardDescription className="text-slate-400">
//               Paste a student's meal QR payload to confirm their attendance.
//             </CardDescription>
//           </CardHeader>

//           <CardContent className="space-y-6">
//             {/* Input Area */}
//             <div className="space-y-3">
//               <Input
//                 placeholder={`Paste QR Code JSON here (e.g. {"bookingId":"...", "mealType":"lunch"})`}
//                 value={qrInput}
//                 onChange={(e) => setQrInput(e.target.value)}
//                 disabled={loading}
//                 className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
//               />
//               <Button
//                 onClick={handleCheckIn}
//                 disabled={loading || !qrInput.trim()}
//                 className="w-full bg-green-600 hover:bg-green-700 text-white transition-all"
//               >
//                 {loading ? 'Processing...' : 'Confirm Check-in'}
//               </Button>
//             </div>

//             {/* Result Feedback */}
//             {scanResult && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ duration: 0.3 }}
//                 className={`p-4 rounded-lg border ${
//                   scanResult.success
//                     ? 'border-green-500/50 bg-green-500/10'
//                     : 'border-red-500/50 bg-red-500/10'
//                 } space-y-3`}
//               >
//                 <div className="flex items-center gap-3">
//                   {scanResult.success ? (
//                     <CheckCircle className="w-6 h-6 text-green-400" />
//                   ) : (
//                     <XCircle className="w-6 h-6 text-red-400" />
//                   )}
//                   <h4 className="font-semibold text-white">
//                     {scanResult.success ? 'CHECK-IN SUCCESSFUL' : 'CHECK-IN FAILED'}
//                   </h4>
//                 </div>
//                 <p
//                   className={
//                     scanResult.success ? 'text-green-200 text-sm' : 'text-red-200 text-sm'
//                   }
//                 >
//                   {scanResult.message}
//                 </p>

//                 {/* Successful Booking Info */}
//                 {scanResult.success && scanResult.booking && (
//                   <div className="pt-3 border-t border-white/10 text-white space-y-1 text-sm">
//                     <p className="flex items-center gap-2">
//                       <User className="w-4 h-4 text-blue-400" /> Student ID:{' '}
//                       {scanResult.booking.userId.slice(0, 8)}...
//                     </p>
//                     <p className="flex items-center gap-2">
//                       <Utensils className="w-4 h-4 text-yellow-400" /> Meal:{' '}
//                       {scanResult.booking.mealType.toUpperCase()}
//                     </p>
//                     <p className="flex items-center gap-2">
//                       <Zap className="w-4 h-4 text-green-400" /> Points Awarded:{' '}
//                       {scanResult.userPoints}
//                     </p>
//                   </div>
//                 )}
//               </motion.div>
//             )}
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   )
// }
'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  ScanLine,
  CheckCircle,
  XCircle,
  Utensils,
  User,
  Zap,
} from 'lucide-react'

export default function StaffScanner() {
  const { token, user } = useAuth()
  const [qrInput, setQrInput] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // ✅ Staff-only access check
  if (user?.role !== 'staff' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400 font-semibold text-lg">
        ACCESS DENIED — Only staff and admin users can access the QR Scanner.
      </div>
    )
  }

  /* ===========================
     Handle Check-in Logic (frontend-only)
     =========================== */
  const handleCheckIn = useCallback(async () => {
    if (!qrInput.trim()) {
      toast.error('Please paste a valid QR payload first.')
      return
    }

    setLoading(true)
    setScanResult(null)

    try {
      // Step 1: Validate QR format
      let bookingData
      try {
        bookingData = JSON.parse(qrInput)
      } catch (err) {
        setScanResult({
          success: false,
          message: 'Invalid QR format. Make sure it’s valid JSON like {"bookingId":"123","mealType":"lunch"}',
        })
        setLoading(false)
        return
      }

      // Step 2: Simulate successful check-in
      const mockBooking = {
        userId: 'user12345',
        mealType: bookingData.mealType || 'lunch',
      }

      setTimeout(() => {
        setScanResult({
          success: true,
          message: `Attendance confirmed for ${mockBooking.mealType.toUpperCase()}.`,
          booking: mockBooking,
          userPoints: 15,
        })
        toast.success('Check-in successful! +15 points.')
        setQrInput('')
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Check-in Error:', error)
      setScanResult({
        success: false,
        message: 'Unexpected error. Please try again.',
      })
      toast.error('Something went wrong during check-in.')
      setLoading(false)
    }
  }, [qrInput])

  /* ===========================
     UI Rendering
     =========================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto"
      >
        <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
          <CardHeader className="text-center space-y-1">
            <ScanLine className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <CardTitle className="text-white text-2xl">Staff Check-in Scanner</CardTitle>
            <CardDescription className="text-slate-400">
              Paste a student's meal QR payload to confirm their attendance.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Input Area */}
            <div className="space-y-3">
              <Input
                placeholder={`Paste QR Code JSON here (e.g. {"bookingId":"123","mealType":"lunch"})`}
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                disabled={loading}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Button
                onClick={handleCheckIn}
                disabled={loading || !qrInput.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all"
              >
                {loading ? 'Processing...' : 'Confirm Check-in'}
              </Button>
            </div>

            {/* Result Feedback */}
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg border ${
                  scanResult.success
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-red-500/50 bg-red-500/10'
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
                <p
                  className={
                    scanResult.success ? 'text-green-200 text-sm' : 'text-red-200 text-sm'
                  }
                >
                  {scanResult.message}
                </p>

                {/* Successful Booking Info */}
                {scanResult.success && scanResult.booking && (
                  <div className="pt-3 border-t border-white/10 text-white space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" /> Student ID:{' '}
                      {scanResult.booking.userId}
                    </p>
                    <p className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-yellow-400" /> Meal:{' '}
                      {scanResult.booking.mealType.toUpperCase()}
                    </p>
                    <p className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-400" /> Points Awarded:{' '}
                      {scanResult.userPoints}
                    </p>
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
