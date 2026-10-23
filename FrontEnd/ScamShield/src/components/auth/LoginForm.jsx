import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  LockKeyhole,
} from 'lucide-react';

export default function LoginForm({
  onLoginSuccess,
  onNeedVerify,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !credentials.username.trim() ||
      !credentials.password
    ) {
      setError(
        'Please enter your username/email and password.'
      );
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(credentials);

      setSuccess('Login successful!');

      onLoginSuccess(data.user);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      // Account exists but email is not verified yet -> send the user to the code screen
      if (err.action === 'verify') {
        onNeedVerify(err.email || credentials.username);
        navigate('/verify');
        return;
      }
      setError(
        err.message || 'Invalid username or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8fafc]">

      {/* =========================
          BACKGROUND DECORATION
      ========================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            -right-32
            -top-32
            h-64
            w-64
            rounded-full
            bg-primary/10
            blur-3xl
            sm:-right-40
            sm:-top-40
            sm:h-80
            sm:w-80
          "
        />

        <div
          className="
            absolute
            -bottom-32
            -left-32
            h-64
            w-64
            rounded-full
            bg-primary/10
            blur-3xl
            sm:-bottom-40
            sm:-left-40
            sm:h-80
            sm:w-80
          "
        />
      </div>

      {/* =========================
          MAIN CONTAINER
      ========================== */}
      <div
        className="
          relative
          flex
          min-h-[100dvh]
          w-full
          items-center
          justify-center
          px-4
          py-6
          sm:px-6
          sm:py-10
          lg:px-8
        "
      >

        {/* =========================
            CONTENT
        ========================== */}
        <div
          className="
            w-full
            max-w-[430px]
          "
        >

          {/* =========================
              BRAND
          ========================== */}
          <div className="mb-6 text-center sm:mb-8">

            <div
              className="
                mx-auto
                mb-3
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-primary
                text-primary-foreground
                shadow-lg
                shadow-primary/20
                sm:mb-4
                sm:h-14
                sm:w-14
              "
            >
              <LockKeyhole className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
                sm:text-3xl
              "
            >
              Welcome back
            </h1>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-xs
                text-xs
                leading-relaxed
                text-slate-500
                sm:mt-2
                sm:max-w-none
                sm:text-sm
              "
            >
              Sign in to continue to your account
            </p>
          </div>

          {/* =========================
              LOGIN CARD
          ========================== */}
          <Card
            className="
              w-full
              overflow-hidden
              border-0
              bg-white
              shadow-xl
              shadow-slate-200/70
              ring-1
              ring-slate-200/70
            "
          >

            {/* CARD HEADER */}
            <CardHeader
              className="
                space-y-1
                px-5
                pb-5
                pt-5
                sm:px-6
                sm:pb-6
                sm:pt-6
              "
            >
              <CardTitle
                className="
                  text-lg
                  font-semibold
                  text-slate-900
                  sm:text-xl
                "
              >
                Sign in
              </CardTitle>

              <CardDescription
                className="
                  text-xs
                  leading-relaxed
                  text-slate-500
                  sm:text-sm
                "
              >
                Enter your credentials below to access your
                account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>

              {/* CARD CONTENT */}
              <CardContent
                className="
                  space-y-4
                  px-5
                  sm:space-y-5
                  sm:px-6
                "
              >

                {/* ERROR */}
                {error && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-3.5
                      py-2.5
                      text-xs
                      font-medium
                      leading-relaxed
                      text-red-600
                      sm:px-4
                      sm:py-3
                      sm:text-sm
                    "
                  >
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-emerald-200
                      bg-emerald-50
                      px-3.5
                      py-2.5
                      text-xs
                      font-medium
                      leading-relaxed
                      text-emerald-600
                      sm:px-4
                      sm:py-3
                      sm:text-sm
                    "
                  >
                    {success}
                  </div>
                )}

                {/* USERNAME */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label
                    htmlFor="username"
                    className="
                      text-xs
                      font-medium
                      text-slate-700
                      sm:text-sm
                    "
                  >
                    Username or Email
                  </Label>

                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="username or email"
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border-slate-200
                      bg-slate-50/50
                      px-3.5
                      text-sm
                      transition-all
                      placeholder:text-slate-400
                      focus:bg-white
                      focus:ring-2
                      focus:ring-primary/20
                      sm:px-4
                    "
                  />
                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5 sm:space-y-2">

                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="password"
                      className="
                        text-xs
                        font-medium
                        text-slate-700
                        sm:text-sm
                      "
                    >
                      Password
                    </Label>
                  </div>

                  <div className="relative">

                    <Input
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border-slate-200
                        bg-slate-50/50
                        px-3.5
                        pr-11
                        text-sm
                        transition-all
                        placeholder:text-slate-400
                        focus:bg-white
                        focus:ring-2
                        focus:ring-primary/20
                        sm:px-4
                      "
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="
                        absolute
                        right-2.5
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition-colors
                        hover:bg-slate-100
                        hover:text-slate-700
                        sm:right-3
                      "
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>
                </div>

              </CardContent>

              {/* CARD FOOTER */}
              <CardFooter
                className="
                  flex
                  flex-col
                  gap-4
                  px-5
                  pb-5
                  pt-5
                  sm:gap-5
                  sm:px-6
                  sm:pb-6
                  sm:pt-6
                "
              >

                {/* LOGIN BUTTON */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    text-sm
                    font-semibold
                    shadow-md
                    shadow-primary/20
                    transition-all
                    hover:-translate-y-[1px]
                    hover:shadow-lg
                    hover:shadow-primary/25
                    active:translate-y-0
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* DIVIDER */}
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>

                  <div className="relative flex justify-center text-[11px] sm:text-xs">
                    <span className="bg-white px-3 text-slate-400">
                      New to the platform?
                    </span>
                  </div>
                </div>

                {/* REGISTER */}
                <Link
                  to="/register"
                  className="
                    min-h-9
                    text-xs
                    font-semibold
                    text-primary
                    transition-colors
                    hover:underline
                    sm:text-sm
                  "
                >
                  Create an account
                </Link>

              </CardFooter>
            </form>
          </Card>

          {/* =========================
              FOOTER
          ========================== */}
          <p
            className="
              mx-auto
              mt-4
              max-w-sm
              px-2
              text-center
              text-[10px]
              leading-relaxed
              text-slate-400
              sm:mt-6
              sm:text-xs
            "
          >
            By continuing, you agree to our Terms of Service
            and Privacy Policy.
          </p>

        </div>
      </div>
    </main>
  );
}
