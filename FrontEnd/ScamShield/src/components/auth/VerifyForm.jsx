import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmail, resendCode } from '../../api/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Loader2, ShieldCheck, ArrowRight, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VerifyForm({ email, onVerificationSuccess }) {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [resendAttempts, setResendAttempts] = useState(0);

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0) return;
        
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [timeLeft]);

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle OTP submission or resend
    const handleMainAction = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // If time is left, verify the code
        if (timeLeft > 0) {
            handleVerify();
        } else {
            // If time expired, resend code
            handleResend();
        }
    };

    // Verify email code
    const handleVerify = async () => {
        // Validation
        if (!code.trim()) {
            setError('Please enter the verification code.');
            return;
        }

        if (code.length !== 6) {
            setError('Verification code must be exactly 6 digits.');
            return;
        }

        if (isNaN(code)) {
            setError('Verification code must contain only numbers.');
            return;
        }

        if (timeLeft <= 0) {
            setError('Verification code has expired. Please request a new one.');
            return;
        }

        setLoading(true);

        try {
            const response = await verifyEmail(email, code);
            
            setSuccess('Email verified successfully! Taking you to the home page...');
            
            // Small delay before redirect for UX
            setTimeout(() => {
                onVerificationSuccess(response.user);
                navigate('/', { replace: true });
            }, 1200);
            
        } catch (err) {
            const errorMsg = err.message || 'Verification failed. Please try again.';
            
            // Backend messages are already user-friendly (e.g. "Invalid verification code. 3 attempts left.")
            setError(errorMsg);
            if (err.action === 'resend') {
                setTimeLeft(0); // switches the main button to "Resend Code"
            }
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    // Resend verification code
    const handleResend = async () => {
        if (resendAttempts >= 3) {
            setError('Too many resend attempts. Please try again after 5 minutes.');
            return;
        }

        setLoading(true);

        try {
            await resendCode(email);
            
            setSuccess('New verification code sent to your email!');
            setTimeLeft(60);
            setCode('');
            setResendAttempts(resendAttempts + 1);
            
        } catch (err) {
            setError(err.message || 'Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle numeric input only
    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    // Button states
    const isVerifyDisabled = loading || timeLeft <= 0 || code.length !== 6;
    const isResendDisabled = loading || timeLeft > 0 || resendAttempts >= 3;
    const isMainButtonDisabled = timeLeft > 0 ? isVerifyDisabled : isResendDisabled;

    return (
        <main className="relative min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-6">
            <div className="w-full max-w-[430px]">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Email Verification
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        We sent a verification code to <span className="font-semibold text-slate-800 break-all">{email}</span>
                    </p>
                </div>

                {/* Main Card */}
                <Card className="w-full border-0 bg-white shadow-xl">
                    <CardHeader className="space-y-1 px-6 pt-6 pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                            Enter Verification Code
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Check your inbox or spam folder. Code expires in 1 minute.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleMainAction}>
                        <CardContent className="space-y-4 px-6 pt-6 pb-2">
                            {/* Error Alert */}
                            {error && (
                                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-900">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-900">{success}</p>
                                </div>
                            )}

                            {/* Code Input */}
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                                    6-Digit Code
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="000000"
                                    value={code}
                                    onChange={handleCodeChange}
                                    disabled={loading || timeLeft <= 0}
                                    className="h-12 text-center text-2xl font-bold tracking-[10px] rounded-lg border-slate-200 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Timer Display */}
                            <div className="rounded-lg bg-slate-50 p-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">
                                    Time Remaining
                                </span>
                                {timeLeft > 0 ? (
                                    <span className="font-mono text-sm font-bold text-blue-600">
                                        {formatTime(timeLeft)}
                                    </span>
                                ) : (
                                    <span className="font-mono text-sm font-bold text-red-600">
                                        Code Expired
                                    </span>
                                )}
                            </div>

                            {/* Resend Attempts Info */}
                            {resendAttempts > 0 && (
                                <p className="text-xs text-slate-500 text-center">
                                    Resend attempts: {resendAttempts}/3
                                </p>
                            )}
                        </CardContent>

                        {/* Buttons */}
                        <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-4 border-t border-slate-100">
                            {/* Single Dynamic Button - Verify or Resend */}
                            <Button
                                type="submit"
                                disabled={isMainButtonDisabled}
                                className="h-11 w-full rounded-lg text-sm font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {timeLeft > 0 ? 'Verifying...' : 'Sending...'}
                                    </>
                                ) : timeLeft > 0 ? (
                                    <>
                                        Verify Email
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                ) : resendAttempts >= 3 ? (
                                    <>
                                        <AlertCircle className="mr-2 h-3.5 w-3.5" />
                                        Max Attempts Reached
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                        Resend Code
                                    </>
                                )}
                            </Button>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors mt-2 py-2"
                            >
                                Back to Registration
                            </button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Help Text */}
                <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">
                        <strong>Tip:</strong> Enter the 6-digit code from your email and press Verify. You get 5 attempts per code.
                    </p>
                    <p className="text-xs text-slate-500">
                        Having trouble? Check your spam folder or request a new code.
                    </p>
                </div>
            </div>
        </main>
    );
}
